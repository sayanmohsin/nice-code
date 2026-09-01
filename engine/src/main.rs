use clap::{Parser, ValueEnum};
use nice_code_engine::SyntaxParser;
use rayon::prelude::*;
use serde::Serialize;
use std::io::IsTerminal;
use std::{
    collections::{HashMap, HashSet},
    fs,
    hash::{Hash, Hasher},
    path::{Path, PathBuf},
    process::Command,
    time::Instant,
};
use walkdir::WalkDir;

const EXTENSIONS: &[&str] = &["js", "jsx", "ts", "tsx", "mjs", "cjs", "rs", "go", "dart"];
const IGNORED: &[&str] = &[
    ".git",
    "node_modules",
    "target",
    "build",
    "dist",
    ".dart_tool",
    ".next",
];
const SENSITIVE_WORDS: &[&str] = &[
    "token",
    "password",
    "secret",
    "authorization",
    "api_key",
    "api-key",
];
const SENSITIVE_LOGGING: &[&str] = &[
    "console.",
    "logger.",
    "tracing::",
    "log::",
    "println!",
    "eprintln!",
    "fmt.println",
];
const UNSTRUCTURED_LOGGING: &[&str] = &[
    "console.log(",
    "console.info(",
    "console.warn(",
    "console.error(",
    "println!(",
    "eprintln!(",
    "fmt.println(",
];

#[derive(Clone, Debug, ValueEnum)]
enum Format {
    Text,
    Json,
    Sarif,
    Agent,
}

#[derive(Parser, Debug)]
#[command(
    name = "nice-code",
    version,
    about = "Fast, source-backed engineering guardrails",
    long_about = "Review JavaScript, TypeScript, Rust, Go, and Dart projects with a fast Rust engine.\n\nUse --changed for a focused local review, --all for a deliberate full scan, and --format agent or --format json for automation.",
    after_help = "Examples:\n  nice-code --changed --project .\n  nice-code --all --project .\n  nice-code --changed --format agent --project .\n  nice-code --changed --ci --format sarif --project . > nice-code.sarif\n  nice-code --explain AP-LOG-001\n\nExit status is non-zero only when the report's exit decision is blocked."
)]
struct Args {
    #[arg(
        long,
        default_value = ".",
        value_name = "PATH",
        help = "Project directory to inspect"
    )]
    project: PathBuf,
    #[arg(
        long,
        conflicts_with = "all",
        help = "Inspect changed and untracked supported files"
    )]
    changed: bool,
    #[arg(long, help = "Inspect all supported files in the project")]
    all: bool,
    #[arg(
        long,
        help = "Run available native project tools and include their status"
    )]
    ci: bool,
    #[arg(long, value_enum, default_value_t = Format::Text, help = "Output format: text, json, sarif, or agent")]
    format: Format,
    #[arg(long, conflicts_with = "format", help = "Shortcut for --format json")]
    json: bool,
    #[arg(long, help = "Shortcut for --format agent")]
    agent: bool,
    #[arg(long, help = "Include findings marked REVIEW in agent output")]
    include_review: bool,
    #[arg(long, help = "Show all human-readable findings")]
    verbose: bool,
    #[arg(
        long,
        value_delimiter = ',',
        value_name = "STATUS,...",
        help = "Filter findings by status"
    )]
    status: Option<Vec<String>>,
    #[arg(long, value_name = "N", help = "Limit displayed findings")]
    max_findings: Option<usize>,
    #[arg(
        long,
        help = "Print discovery, analysis, native-tool, and total timings"
    )]
    timings: bool,
    #[arg(
        long,
        conflicts_with = "no_cache",
        help = "Reuse safe local results for unchanged files"
    )]
    cache: bool,
    #[arg(long, help = "Disable local result caching")]
    no_cache: bool,
    #[arg(long, conflicts_with = "no_color", help = "Force terminal colors")]
    color: bool,
    #[arg(long, conflicts_with = "color", help = "Disable terminal colors")]
    no_color: bool,
    #[arg(
        long,
        value_name = "CHECK_ID",
        help = "Explain a check and show its source"
    )]
    explain: Option<String>,
    #[arg(
        long,
        value_name = "PATH",
        requires = "new_only",
        help = "Baseline file used with --new-only"
    )]
    baseline: Option<PathBuf>,
    #[arg(long, help = "Show only findings absent from the baseline")]
    new_only: bool,
    #[arg(
        long,
        value_name = "PATH",
        help = "Write the current findings as a baseline"
    )]
    write_baseline: Option<PathBuf>,
}

#[derive(Clone, Debug, Serialize, serde::Deserialize)]
struct Finding {
    id: String,
    title: String,
    category: String,
    severity: String,
    status: String,
    file: String,
    line: usize,
    message: String,
    #[serde(rename = "fileClass")]
    file_class: String,
    source: String,
}

#[derive(Debug, Serialize)]
struct Summary {
    files: usize,
    findings: usize,
    pass: usize,
    warn: usize,
    review: usize,
    fail: usize,
}

#[derive(Debug, Serialize)]
struct ToolResult {
    command: String,
    status: String,
    output: String,
}

#[derive(Debug, Serialize)]
struct Report {
    #[serde(rename = "schemaVersion")]
    schema_version: u8,
    #[serde(rename = "checkerVersion")]
    checker_version: String,
    project: String,
    mode: String,
    config: Option<String>,
    #[serde(rename = "activeProfiles")]
    active_profiles: Vec<String>,
    detected: Detected,
    #[serde(rename = "filesScanned")]
    files_scanned: Vec<String>,
    findings: Vec<Finding>,
    #[serde(rename = "customFindings")]
    custom_findings: Vec<Finding>,
    #[serde(rename = "nativeTools")]
    native_tools: Vec<ToolResult>,
    summary: Summary,
    exit: Exit,
}

#[derive(Debug, Serialize)]
struct Detected {
    rust: bool,
    go: bool,
    dart: bool,
    typescript: bool,
    react: bool,
    astro: bool,
    svelte: bool,
    nestjs: bool,
    next: bool,
    vite: bool,
    #[serde(rename = "workspacePackages")]
    workspace_packages: Vec<String>,
    profiles: Vec<String>,
}

#[derive(Debug, Serialize)]
struct Exit {
    blocked: bool,
    reasons: Vec<String>,
}

#[derive(Clone, Debug, Serialize, serde::Deserialize)]
struct CacheEntry {
    key: u64,
    findings: Vec<Finding>,
}

fn main() {
    let started = Instant::now();
    let mut args = Args::parse();
    if args.json {
        args.format = Format::Json;
    }
    if args.agent {
        args.format = Format::Agent;
    }
    if let Some(check_id) = &args.explain {
        print_explanation(check_id, &args.format);
        return;
    }
    let project = fs::canonicalize(&args.project).unwrap_or(args.project.clone());
    let mode = if args.all { "all" } else { "changed" };
    let discovery_started = Instant::now();
    let files = discover(&project, mode);
    let discovery_ms = discovery_started.elapsed().as_secs_f64() * 1000.0;
    let analysis_started = Instant::now();
    let caching = args.cache && !args.no_cache;
    let mut cache = if caching {
        load_cache(&project)
    } else {
        HashMap::new()
    };
    let config_hash = config_hash(&project);
    let mut findings = Vec::new();
    let mut uncached = Vec::new();
    for (path, content) in &files {
        let key = file_cache_key(path, content, config_hash);
        if let Some(entry) = cache.get(path).filter(|entry| entry.key == key) {
            findings.extend(entry.findings.clone());
        } else {
            uncached.push((path, content, key));
        }
    }
    let computed = uncached
        .par_iter()
        .map_init(SyntaxParser::new, |parser, (path, content, key)| {
            (
                (*path).clone(),
                *key,
                analyze_with_parser(path, content, parser),
            )
        })
        .collect::<Vec<_>>();
    for (path, key, file_findings) in computed {
        findings.extend(file_findings.clone());
        if caching {
            cache.insert(
                path,
                CacheEntry {
                    key,
                    findings: file_findings,
                },
            );
        }
    }
    if caching {
        save_cache(&project, &cache);
    }
    findings.sort_by(|a, b| {
        a.file
            .cmp(&b.file)
            .then(a.line.cmp(&b.line))
            .then(a.id.cmp(&b.id))
    });
    if let Some(path) = &args.write_baseline {
        save_baseline(path, &findings);
    }
    let analysis_ms = analysis_started.elapsed().as_secs_f64() * 1000.0;
    let native_started = Instant::now();
    let tools = if args.ci {
        native_tools(&project)
    } else {
        Vec::new()
    };
    let native_ms = native_started.elapsed().as_secs_f64() * 1000.0;
    let blocked = mode == "changed"
        && (findings
            .iter()
            .any(|f| f.status == "FAIL" && f.severity == "critical")
            || tools.iter().any(|t| t.status == "FAIL"));
    let mut reasons = Vec::new();
    if findings
        .iter()
        .any(|f| f.status == "FAIL" && f.severity == "critical")
        && mode == "changed"
    {
        reasons.push("new critical custom finding".to_string());
    }
    if tools.iter().any(|t| t.status == "FAIL") && mode == "changed" {
        reasons.push("native tool failure".to_string());
    }
    let mut displayed_findings = findings;
    if args.new_only {
        if let Some(path) = &args.baseline {
            let baseline = load_baseline(path);
            displayed_findings.retain(|finding| !baseline.contains(&finding_key(finding)));
        }
    }
    if let Some(statuses) = &args.status {
        displayed_findings.retain(|finding| {
            statuses
                .iter()
                .any(|status| status.eq_ignore_ascii_case(&finding.status))
        });
    } else if matches!(args.format, Format::Agent) && !args.include_review {
        displayed_findings.retain(|finding| finding.status != "REVIEW");
    }
    if let Some(limit) = args.max_findings {
        displayed_findings.truncate(limit);
    }
    let summary = summary(files.len(), &displayed_findings);
    let report = Report {
        schema_version: 1,
        checker_version: env!("CARGO_PKG_VERSION").to_string(),
        project: project.display().to_string(),
        mode: mode.to_string(),
        config: if project.join(".nice-code.json").exists() {
            Some(".nice-code.json".to_string())
        } else {
            None
        },
        active_profiles: vec!["default".to_string()],
        detected: detect(&project),
        files_scanned: files.iter().map(|(p, _)| p.clone()).collect(),
        custom_findings: displayed_findings.clone(),
        findings: displayed_findings,
        native_tools: tools,
        summary,
        exit: Exit { blocked, reasons },
    };
    let styled = args.color || (!args.no_color && std::io::stdout().is_terminal());
    print_report(
        &report,
        &args.format,
        args.include_review,
        args.verbose,
        styled,
    );
    if args.timings {
        eprintln!(
            "timings discovery_ms={:.2} analysis_ms={:.2} native_tools_ms={:.2} total_ms={:.2}",
            discovery_ms,
            analysis_ms,
            native_ms,
            started.elapsed().as_secs_f64() * 1000.0
        );
    }
    if report.exit.blocked {
        std::process::exit(1);
    }
}

fn discover(project: &Path, mode: &str) -> Vec<(String, String)> {
    let paths = if mode == "changed" {
        changed_files(project)
    } else {
        WalkDir::new(project)
            .into_iter()
            .filter_entry(|entry| {
                entry.file_type().is_file()
                    || !entry
                        .file_name()
                        .to_str()
                        .is_some_and(|name| IGNORED.contains(&name))
            })
            .filter_map(Result::ok)
            .filter(|e| e.file_type().is_file())
            .filter_map(|e| relative_source(project, e.path()))
            .collect()
    };
    let mut output = paths
        .par_iter()
        .filter_map(|path| {
            fs::read_to_string(project.join(path))
                .ok()
                .map(|content| (path.clone(), content))
        })
        .collect::<Vec<_>>();
    output.sort_by(|a, b| a.0.cmp(&b.0));
    output
}

fn cache_path(project: &Path) -> Option<PathBuf> {
    let root = std::env::var_os("XDG_CACHE_HOME")
        .map(PathBuf::from)
        .or_else(|| std::env::var_os("LOCALAPPDATA").map(PathBuf::from))
        .or_else(|| std::env::var_os("HOME").map(|home| PathBuf::from(home).join(".cache")))?;
    Some(root.join("nice-code").join(format!(
        "{:016x}.json",
        hash_value(&project.display().to_string())
    )))
}

fn load_cache(project: &Path) -> HashMap<String, CacheEntry> {
    cache_path(project)
        .and_then(|path| fs::read_to_string(path).ok())
        .and_then(|contents| serde_json::from_str(&contents).ok())
        .unwrap_or_default()
}

fn save_cache(project: &Path, cache: &HashMap<String, CacheEntry>) {
    let Some(path) = cache_path(project) else {
        return;
    };
    let Some(parent) = path.parent() else {
        return;
    };
    if fs::create_dir_all(parent).is_err() {
        return;
    }
    let temporary = path.with_extension("tmp");
    let Ok(contents) = serde_json::to_vec(cache) else {
        return;
    };
    if fs::write(&temporary, contents).is_ok() {
        let _ = fs::rename(temporary, path);
    }
}

fn config_hash(project: &Path) -> u64 {
    project
        .join(".nice-code.json")
        .to_str()
        .and_then(|path| fs::read(path).ok())
        .map(|bytes| hash_value(&bytes))
        .unwrap_or(0)
}

fn file_cache_key(path: &str, content: &str, config: u64) -> u64 {
    hash_value(&(path, content, config, env!("CARGO_PKG_VERSION"), "rules-1"))
}

fn finding_key(finding: &Finding) -> String {
    format!(
        "{}\0{}\0{}\0{}",
        finding.id, finding.file, finding.line, finding.message
    )
}

fn load_baseline(path: &Path) -> HashSet<String> {
    fs::read_to_string(path)
        .ok()
        .and_then(|contents| serde_json::from_str::<Vec<Finding>>(&contents).ok())
        .map(|findings| findings.iter().map(finding_key).collect())
        .unwrap_or_default()
}

fn save_baseline(path: &Path, findings: &[Finding]) {
    if let Ok(contents) = serde_json::to_vec_pretty(findings) {
        let _ = fs::write(path, contents);
    }
}

fn hash_value<T: Hash>(value: &T) -> u64 {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    value.hash(&mut hasher);
    hasher.finish()
}

fn relative_source(project: &Path, path: &Path) -> Option<String> {
    if path
        .components()
        .any(|c| IGNORED.iter().any(|name| c.as_os_str() == *name))
    {
        return None;
    }
    let extension = path.extension()?.to_str()?;
    if !EXTENSIONS.contains(&extension) {
        return None;
    }
    Some(
        path.strip_prefix(project)
            .ok()?
            .to_string_lossy()
            .replace('\\', "/"),
    )
}

fn changed_files(project: &Path) -> Vec<String> {
    let output = Command::new("git")
        .args([
            "-C",
            &project.to_string_lossy(),
            "status",
            "--porcelain=v1",
            "-z",
        ])
        .output();
    let Ok(output) = output else {
        return all_files(project);
    };
    if !output.status.success() {
        return all_files(project);
    }
    let mut seen = HashSet::new();
    let mut paths = Vec::new();
    let records = output.stdout.split(|byte| *byte == 0).collect::<Vec<_>>();
    let mut index = 0;
    while index < records.len() {
        let record = records[index];
        index += 1;
        if record.len() < 4 {
            continue;
        }
        let status = &record[..2];
        let mut path = &record[3..];
        if status.contains(&b'R') || status.contains(&b'C') {
            if let Some(new_path) = records.get(index).filter(|path| !path.is_empty()) {
                path = new_path;
                index += 1;
            }
        }
        let path = String::from_utf8_lossy(path).replace('\\', "/");
        if seen.insert(path.clone()) && relative_source(project, &project.join(&path)).is_some() {
            paths.push(path);
        }
    }
    paths.sort();
    paths
}

fn all_files(project: &Path) -> Vec<String> {
    WalkDir::new(project)
        .into_iter()
        .filter_entry(|entry| {
            entry.file_type().is_file()
                || !entry
                    .file_name()
                    .to_str()
                    .is_some_and(|name| IGNORED.contains(&name))
        })
        .filter_map(Result::ok)
        .filter(|entry| entry.file_type().is_file())
        .filter_map(|entry| relative_source(project, entry.path()))
        .collect()
}

struct FileContext<'a> {
    path: &'a str,
    content: &'a str,
    lowercase: String,
    is_test: bool,
    has_parse_errors: bool,
}

fn analyze_with_parser(path: &str, content: &str, parser: &mut SyntaxParser) -> Vec<Finding> {
    let context = FileContext {
        path,
        content,
        lowercase: content.to_ascii_lowercase(),
        is_test: is_test_file(path, content),
        has_parse_errors: parser.parse_has_errors(path, content),
    };
    analyze_context(&context)
}

fn analyze_context(context: &FileContext<'_>) -> Vec<Finding> {
    let path = context.path;
    let content = context.content;
    let mut findings = Vec::new();
    if context.has_parse_errors && has_confident_syntax_error(path, content) {
        findings.push(finding(
            "AP-SYNTAX-001",
            "Syntax errors detected",
            "correctness",
            "warning",
            "REVIEW",
            path,
            1,
            "The source could not be parsed cleanly; review syntax before trusting other findings.",
            "https://tree-sitter.github.io/tree-sitter/",
        ));
    }
    for (index, (line, lower)) in content.lines().zip(context.lowercase.lines()).enumerate() {
        if SENSITIVE_LOGGING
            .iter()
            .any(|needle| lower.contains(needle))
            && SENSITIVE_WORDS.iter().any(|needle| lower.contains(needle))
            && contains_secret_value_expression(line, lower)
            && !context.is_test
        {
            findings.push(finding(
                "AP-LOG-001",
                "Secret-bearing log expression",
                "logging",
                "critical",
                "FAIL",
                path,
                index + 1,
                "Log expression may expose a credential or sensitive value.",
                "https://microsoft.github.io/rust-guidelines/guidelines/universal/",
            ));
        }
        if UNSTRUCTURED_LOGGING
            .iter()
            .any(|needle| lower.contains(needle))
            && !SENSITIVE_WORDS.iter().any(|needle| lower.contains(needle))
            && !is_non_production_review_context(path)
        {
            findings.push(finding("AP-LOG-002", "Unstructured production output", "logging", "warning", "REVIEW", path, index + 1, "Review whether this output is structured, contextual, and appropriate for production.", "https://microsoft.github.io/rust-guidelines/guidelines/universal/"));
        }
        if is_hardcoded_secret_assignment(line, lower) && !context.is_test {
            findings.push(finding("AP-SEC-001", "Possible hardcoded secret", "security", "critical", "FAIL", path, index + 1, "Possible hardcoded credential; use an approved secret boundary or an unmistakable fixture value.", "https://docs.aws.amazon.com/wellarchitected/latest/framework/security.html"));
        }
    }
    if is_js(path) && !is_non_production_review_context(path) {
        if let Some(line) = nearby_sequential_await_line(content) {
            findings.push(finding("AP-ASYNC-001", "Likely sequential independent awaits", "async", "warning", "REVIEW", path, line, "Multiple awaits may be independent; verify dependency order and consider bounded parallelism.", "https://vercel.com/blog/introducing-react-best-practices"));
        }
    }
    findings
}

#[allow(clippy::too_many_arguments)]
fn finding(
    id: &str,
    title: &str,
    category: &str,
    severity: &str,
    status: &str,
    file: &str,
    line: usize,
    message: &str,
    source: &str,
) -> Finding {
    Finding {
        id: id.into(),
        title: title.into(),
        category: category.into(),
        severity: severity.into(),
        status: status.into(),
        file: file.into(),
        line,
        message: message.into(),
        file_class: if is_test_file(file, "") {
            "test".into()
        } else {
            "production".into()
        },
        source: source.into(),
    }
}
fn is_js(path: &str) -> bool {
    [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]
        .iter()
        .any(|e| path.ends_with(e))
}
fn is_test_file(path: &str, content: &str) -> bool {
    let lower = path.to_ascii_lowercase();
    [
        "test",
        "tests",
        "spec",
        "specs",
        "fixture",
        "fixtures",
        "example",
        "examples",
        "__tests__",
        "mock",
    ]
    .iter()
    .any(|part| lower.contains(part))
        || content
            .lines()
            .any(|l| l.contains("#[cfg(test)]") || l.contains("#[test]"))
}
fn is_tooling(path: &str) -> bool {
    path.split('/')
        .any(|part| ["script", "scripts", "tools", "bin", "cli"].contains(&part))
}

fn is_non_production_review_context(path: &str) -> bool {
    let lower = path.to_ascii_lowercase();
    is_test_file(path, "")
        || is_tooling(path)
        || lower.split('/').any(|part| {
            matches!(part, "bench" | "benchmarks" | "example" | "examples")
                || part.ends_with("-cli")
                || part.ends_with("-examples")
        })
}

fn has_confident_syntax_error(path: &str, content: &str) -> bool {
    let Some(kind) = nice_code_engine::language_for_path(path) else {
        return false;
    };
    if content.trim().is_empty() {
        return false;
    }

    matches!(
        kind,
        nice_code_engine::LanguageKind::JavaScript
            | nice_code_engine::LanguageKind::TypeScript
            | nice_code_engine::LanguageKind::Tsx
    ) && content.lines().any(|line| {
        let trimmed = line.trim();
        trimmed.ends_with('{') || trimmed.ends_with("=;") || trimmed.ends_with("= ;")
    })
}

fn contains_secret_value_expression(line: &str, lowercase: &str) -> bool {
    line.contains("${")
        || line.contains(',')
        || line.contains('+')
        || SENSITIVE_WORDS
            .iter()
            .filter(|word| lowercase.contains(**word))
            .count()
            > 1
}
fn is_placeholder(line: &str) -> bool {
    [
        "example",
        "placeholder",
        "dummy",
        "fake",
        "fixture",
        "changeme",
        "...",
        "your-",
        "your_",
    ]
    .iter()
    .any(|x| line.contains(x))
}

fn is_hardcoded_secret_assignment(line: &str, lower: &str) -> bool {
    let Some((left, right)) = line.split_once('=').or_else(|| line.split_once(':')) else {
        return false;
    };
    let left = left.trim().trim_start_matches(['{', '[', ',']);
    let normalized_left = left.to_ascii_lowercase().replace(['_', '-'], "");
    let credential_key = ["password", "secret", "token", "apikey", "accesstoken"]
        .iter()
        .any(|needle| {
            normalized_left
                .split(|character: char| !character.is_ascii_alphanumeric())
                .any(|part| part == *needle)
        });
    if !credential_key {
        return false;
    }
    let value = right.trim();
    if !is_non_empty_literal(value) || is_placeholder(lower) {
        return false;
    }
    true
}

fn nearby_sequential_await_line(content: &str) -> Option<usize> {
    if content.contains("Promise.all(") {
        return None;
    }
    let candidates = content
        .lines()
        .enumerate()
        .filter_map(|(index, line)| {
            let (declaration, expression) = line.split_once("await ")?;
            let variable = declaration.split_whitespace().nth(1).map(|name| {
                name.trim_matches(|character: char| {
                    !character.is_ascii_alphanumeric() && character != '_'
                })
            })?;
            Some((
                index,
                variable.to_ascii_lowercase(),
                expression.trim().to_string(),
            ))
        })
        .collect::<Vec<_>>();
    candidates.windows(2).find_map(|window| {
        let first = &window[0];
        let second = &window[1];
        if second.0 - first.0 > 8 || await_is_dependent(first, second) {
            return None;
        }
        Some(second.0 + 1)
    })
}

fn await_is_dependent(first: &(usize, String, String), second: &(usize, String, String)) -> bool {
    let second_source = second.2.to_ascii_lowercase();
    let references_first = second_source
        .split(|character: char| !character.is_ascii_alphanumeric() && character != '_')
        .any(|token| token == first.1);
    references_first
        || (first.2.contains("fetch(")
            && [".json(", ".text(", ".arraybuffer("]
                .iter()
                .any(|method| second_source.contains(method)))
}

fn is_non_empty_literal(value: &str) -> bool {
    let value = value.trim_end_matches([';', ',']).trim();
    let Some(delimiter) = value.chars().next() else {
        return false;
    };
    if !matches!(delimiter, '\'' | '"' | '`') || !value.ends_with(delimiter) {
        return false;
    }
    let delimiter_width = delimiter.len_utf8();
    if value.len() < delimiter_width * 2 {
        return false;
    }
    let content = &value[delimiter_width..value.len() - delimiter_width];
    !content.trim().is_empty() && !content.contains("${")
}
fn summary(files: usize, findings: &[Finding]) -> Summary {
    Summary {
        files,
        findings: findings.len(),
        pass: 0,
        warn: findings.iter().filter(|f| f.status == "WARN").count(),
        review: findings.iter().filter(|f| f.status == "REVIEW").count(),
        fail: findings.iter().filter(|f| f.status == "FAIL").count(),
    }
}

fn detect(project: &Path) -> Detected {
    let has = |name: &str| project.join(name).exists();
    let typescript = has("tsconfig.json");
    let mut profiles = vec!["default".to_string()];
    if typescript {
        profiles.push("typescript".into());
    }
    if has("vite.config.ts") || has("vite.config.js") {
        profiles.push("web".into());
    }
    Detected {
        rust: has("Cargo.toml"),
        go: has("go.mod"),
        dart: has("pubspec.yaml"),
        typescript,
        react: false,
        astro: false,
        svelte: false,
        nestjs: false,
        next: false,
        vite: has("vite.config.ts") || has("vite.config.js"),
        workspace_packages: Vec::new(),
        profiles,
    }
}
fn native_tools(project: &Path) -> Vec<ToolResult> {
    let mut commands = Vec::new();
    if project.join("Cargo.toml").exists() {
        commands.push((
            "cargo fmt --all --check",
            "cargo",
            vec!["fmt", "--all", "--check"],
        ));
    }
    if project.join("go.mod").exists() {
        commands.push(("go vet ./...", "go", vec!["vet", "./..."]));
    }
    if project.join("pubspec.yaml").exists() {
        commands.push(("dart analyze", "dart", vec!["analyze"]));
    }
    commands
        .par_iter()
        .map(|(label, command, args)| run_tool(project, label, command, args))
        .collect()
}
fn run_tool(project: &Path, label: &str, command: &str, args: &[&str]) -> ToolResult {
    match Command::new(command)
        .args(args)
        .current_dir(project)
        .output()
    {
        Ok(output) => ToolResult {
            command: label.into(),
            status: if output.status.success() {
                "PASS"
            } else {
                "FAIL"
            }
            .into(),
            output: String::from_utf8_lossy(&output.stdout).to_string()
                + &String::from_utf8_lossy(&output.stderr),
        },
        Err(error) => ToolResult {
            command: label.into(),
            status: "SKIPPED".into(),
            output: error.to_string(),
        },
    }
}

fn print_report(
    report: &Report,
    format: &Format,
    include_review: bool,
    verbose: bool,
    styled: bool,
) {
    match format {
        Format::Json => println!("{}", serde_json::to_string_pretty(report).unwrap()),
        Format::Sarif => println!(
            "{}",
            serde_json::json!({"version":"2.1.0","runs":[{"tool":{"driver":{"name":"Nice Code","informationUri":"https://github.com/sayanmohsin/nice-code"}},"results": report.findings.iter().filter(|f| include_review || f.status != "REVIEW").map(|f| serde_json::json!({"ruleId":f.id,"level":if f.status == "FAIL" {"error"} else {"warning"},"message":{"text":f.message},"locations":[{"physicalLocation":{"artifactLocation":{"uri":f.file},"region":{"startLine":f.line}}}]})).collect::<Vec<_>>() }]})
        ),
        Format::Agent => {
            println!(
                "NICE_CODE status={} mode={} files={} findings={} blocked={}",
                if report.exit.blocked {
                    "BLOCKED"
                } else if report.findings.is_empty() {
                    "PASS"
                } else {
                    "ADVISORY"
                },
                report.mode,
                report.summary.files,
                report.summary.findings,
                report.exit.blocked
            );
            for f in &report.findings {
                if include_review || f.status != "REVIEW" {
                    println!(
                        "{} {} {}:{} severity={} category={} :: {}",
                        f.status, f.id, f.file, f.line, f.severity, f.category, f.message
                    );
                }
            }
        }
        Format::Text => {
            let mark = if styled { "◆ nice-code" } else { "nice-code" };
            let success = !report.exit.blocked && report.findings.is_empty();
            let status = if report.exit.blocked {
                if styled { "✕ blocked" } else { "BLOCKED" }
            } else if success {
                if styled { "✓ clean" } else { "CLEAN" }
            } else if styled {
                "! review"
            } else {
                "REVIEW"
            };
            let status = style_status(status, report.exit.blocked, success, styled);
            println!("{mark} v{}", report.checker_version);
            println!(
                "  {} · {} files · {} findings",
                status, report.summary.files, report.summary.findings
            );
            println!("  {}", report.project);
            for f in report
                .findings
                .iter()
                .filter(|f| verbose || include_review || f.status != "REVIEW")
            {
                let marker = match f.status.as_str() {
                    "FAIL" => "✕",
                    "WARN" => "!",
                    _ => "·",
                };
                let marker = if styled { marker } else { f.status.as_str() };
                println!("{} {} {}:{} {}", marker, f.id, f.file, f.line, f.message);
            }
        }
    }
}

fn style_status(status: &str, blocked: bool, success: bool, styled: bool) -> String {
    if !styled {
        return status.to_string();
    }
    let color = if blocked {
        "31"
    } else if success {
        "32"
    } else {
        "33"
    };
    format!("\u{1b}[{}m{}\u{1b}[0m", color, status)
}

fn print_explanation(check_id: &str, format: &Format) {
    let Some((title, category, severity, guidance, source)) = check_metadata(check_id) else {
        eprintln!("Nice Code: unknown check ID '{check_id}'");
        std::process::exit(2);
    };
    if matches!(format, Format::Json) {
        println!(
            "{}",
            serde_json::json!({"id": check_id, "title": title, "category": category, "severity": severity, "guidance": guidance, "source": source})
        );
    } else {
        println!("{check_id} — {title}");
        println!("Category: {category} | Severity: {severity}");
        println!("{guidance}");
        println!("Source: {source}");
    }
}

fn check_metadata(
    id: &str,
) -> Option<(
    &'static str,
    &'static str,
    &'static str,
    &'static str,
    &'static str,
)> {
    match id {
        "AP-LOG-001" => Some((
            "Secret-bearing log expression",
            "logging",
            "critical",
            "Do not log credentials or sensitive values; redact or remove the value at the logging boundary.",
            "https://microsoft.github.io/rust-guidelines/guidelines/universal/",
        )),
        "AP-LOG-002" => Some((
            "Unstructured production output",
            "logging",
            "warning",
            "Use structured, contextual logging appropriate for production.",
            "https://microsoft.github.io/rust-guidelines/guidelines/universal/",
        )),
        "AP-SEC-001" => Some((
            "Possible hardcoded secret",
            "security",
            "critical",
            "Move credentials to an approved secret boundary and keep fixtures unmistakably non-production.",
            "https://docs.aws.amazon.com/wellarchitected/latest/framework/security.html",
        )),
        "AP-ASYNC-001" => Some((
            "Likely sequential independent awaits",
            "async",
            "warning",
            "Verify dependency order and use bounded parallelism when operations are independent.",
            "https://vercel.com/blog/introducing-react-best-practices",
        )),
        "AP-SYNTAX-001" => Some((
            "Syntax errors detected",
            "correctness",
            "warning",
            "Fix syntax before relying on other findings from the file.",
            "https://tree-sitter.github.io/tree-sitter/",
        )),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn discovers_supported_extensions() {
        assert!(relative_source(Path::new("/tmp"), Path::new("/tmp/a.rs")).is_some());
        assert!(relative_source(Path::new("/tmp"), Path::new("/tmp/a.md")).is_none());
    }

    #[test]
    fn skips_dependency_directories_and_package_manifests() {
        let project = Path::new("/tmp/project");
        assert!(relative_source(project, &project.join("node_modules/pkg/index.ts")).is_none());
        assert!(relative_source(project, &project.join("package.json")).is_none());
        assert!(relative_source(project, &project.join("pnpm-lock.yaml")).is_none());
        assert!(relative_source(project, &project.join("packages/ui/src/index.ts")).is_some());
    }
    #[test]
    fn detects_rust_secret_log() {
        let mut parser = SyntaxParser::new();
        let findings = analyze_with_parser(
            "src/lib.rs",
            "fn x() { tracing::info!(\"token {:?}\", token); }",
            &mut parser,
        );
        assert!(findings.iter().any(|f| f.id == "AP-LOG-001"));
    }

    #[test]
    fn security_rule_requires_a_literal_credential_assignment() {
        let mut parser = SyntaxParser::new();
        let findings = analyze_with_parser(
            "src/auth.ts",
            "const token = process.env.AUTH_TOKEN;\nconst password = \"real-value-123\";\nconst field = \"password\";\nconst generatedToken = randomBytes(16);\nconst dynamicToken = lastCreatedKey ?? \"\";\nconst apiKey = \"${key}\";",
            &mut parser,
        );
        let security = findings
            .iter()
            .filter(|finding| finding.id == "AP-SEC-001")
            .collect::<Vec<_>>();
        assert_eq!(security.len(), 1);
        assert_eq!(security[0].line, 2);
    }
    #[test]
    fn detects_js_async_review() {
        let mut parser = SyntaxParser::new();
        let findings = analyze_with_parser(
            "src/a.ts",
            "const a = await one();\nconst b = await two();",
            &mut parser,
        );
        assert!(findings.iter().any(|f| f.id == "AP-ASYNC-001"));
    }

    #[test]
    fn ignores_dependent_async_steps() {
        let mut parser = SyntaxParser::new();
        let findings = analyze_with_parser(
            "src/client.ts",
            "const response = await fetch(url);\nconst payload = await response.json();",
            &mut parser,
        );
        assert!(!findings.iter().any(|f| f.id == "AP-ASYNC-001"));
    }

    #[test]
    fn does_not_report_parser_limitations_as_syntax_errors() {
        let mut parser = SyntaxParser::new();
        let findings = analyze_with_parser(
            "src/current.rs",
            "fn main() {\n    let value: Option<u64> = None;\n    println!(\"{value:?}\");\n}",
            &mut parser,
        );
        assert!(!findings.iter().any(|f| f.id == "AP-SYNTAX-001"));
    }

    #[test]
    fn rejects_unbalanced_source_delimiters() {
        let mut parser = SyntaxParser::new();
        let findings = analyze_with_parser("src/bad.ts", "function broken() {", &mut parser);
        assert!(findings.iter().any(|f| f.id == "AP-SYNTAX-001"));
    }

    #[test]
    fn treats_examples_and_benchmarks_as_non_production_review_contexts() {
        assert!(is_non_production_review_context("examples/basic/index.ts"));
        assert!(is_non_production_review_context("bench/node-bench.mjs"));
        assert!(!is_non_production_review_context("src/server.ts"));
    }

    #[test]
    fn does_not_join_unrelated_async_functions() {
        let mut parser = SyntaxParser::new();
        let findings = analyze_with_parser(
            "src/a.ts",
            "async function one() {\n  const a = await oneThing();\n}\n\n\n\n\n\n\nasync function two() {\n  const b = await twoThing();\n}",
            &mut parser,
        );
        assert!(!findings.iter().any(|f| f.id == "AP-ASYNC-001"));
    }

    #[test]
    fn ignores_async_heuristic_for_tooling() {
        let mut parser = SyntaxParser::new();
        let findings = analyze_with_parser(
            "scripts/launcher.mjs",
            "const checks = await fetchChecks();\nconst binary = await fetchBinary(checks);",
            &mut parser,
        );
        assert!(!findings.iter().any(|f| f.id == "AP-ASYNC-001"));
    }

    #[test]
    fn repeated_analysis_is_deterministic() {
        let mut first_parser = SyntaxParser::new();
        let mut second_parser = SyntaxParser::new();
        let source = "const a = await one();\nconst b = await two();";
        let first = analyze_with_parser("src/a.ts", source, &mut first_parser);
        let second = analyze_with_parser("src/a.ts", source, &mut second_parser);
        assert_eq!(
            serde_json::to_string(&first).unwrap(),
            serde_json::to_string(&second).unwrap()
        );
    }

    #[test]
    fn human_status_is_plain_or_styled_as_requested() {
        assert_eq!(style_status("✓ clean", false, true, false), "✓ clean");
        assert!(style_status("✓ clean", false, true, true).contains("\u{1b}[32m"));
    }

    #[test]
    fn explanations_have_stable_metadata() {
        let metadata = check_metadata("AP-LOG-001").unwrap();
        assert_eq!(metadata.0, "Secret-bearing log expression");
        assert_eq!(metadata.2, "critical");
        assert!(check_metadata("unknown-check").is_none());
    }
}
