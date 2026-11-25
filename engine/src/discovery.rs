use serde::Serialize;
use serde_json::Value;
use std::{
    env, fs,
    path::{Path, PathBuf},
    process::Command,
};

#[derive(Debug, Serialize)]
pub struct Comparison {
    pub source: String,
    pub base: Option<String>,
    pub target: Option<String>,
}

impl Comparison {
    pub fn filesystem() -> Self {
        Self {
            source: "filesystem".into(),
            base: None,
            target: None,
        }
    }
}

fn git(root: &Path, args: &[&str]) -> Result<Vec<u8>, String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(args)
        .output()
        .map_err(|error| format!("cannot run Git: {error}"))?;
    if !output.status.success() {
        return Err(format!(
            "git {}: {}",
            args[0],
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }
    Ok(output.stdout)
}

fn text(bytes: Vec<u8>) -> Result<String, String> {
    String::from_utf8(bytes)
        .map(|value| value.trim().to_string())
        .map_err(|_| "Git returned a non-UTF-8 revision or repository path".into())
}

fn resolve(root: &Path, revision: &str) -> Result<String, String> {
    text(git(
        root,
        &[
            "rev-parse",
            "--verify",
            "--end-of-options",
            &format!("{revision}^{{commit}}"),
        ],
    )?)
}

fn ci_enabled() -> bool {
    [
        "CI",
        "GITHUB_ACTIONS",
        "GITLAB_CI",
        "TF_BUILD",
        "BUILDKITE",
        "CIRCLECI",
    ]
    .iter()
    .any(|name| {
        env::var(name).is_ok_and(|value| {
            !value.is_empty() && value != "0" && !value.eq_ignore_ascii_case("false")
        })
    })
}

fn sha<'a>(event: &'a Value, pointer: &str) -> Result<&'a str, String> {
    let value = event
        .pointer(pointer)
        .and_then(Value::as_str)
        .ok_or_else(|| format!("GitHub event is missing {pointer}"))?;
    if !matches!(value.len(), 40 | 64)
        || !value.bytes().all(|byte| byte.is_ascii_hexdigit())
        || value.bytes().all(|byte| byte == b'0')
    {
        return Err(format!("GitHub event has no usable commit at {pointer}"));
    }
    Ok(value)
}

fn github_comparison(root: &Path, head: &str) -> Result<Comparison, String> {
    let event_path = env::var_os("GITHUB_EVENT_PATH").ok_or("GITHUB_EVENT_PATH is missing")?;
    let event: Value = serde_json::from_slice(
        &fs::read(event_path).map_err(|error| format!("cannot read GitHub event: {error}"))?,
    )
    .map_err(|error| format!("invalid GitHub event JSON: {error}"))?;
    let (source, base) = match env::var("GITHUB_EVENT_NAME").as_deref() {
        Ok("pull_request") => {
            let base = resolve(root, sha(&event, "/pull_request/base/sha")?)?;
            let pr_head = sha(&event, "/pull_request/head/sha")?;
            if head == pr_head {
                let ancestors = text(git(root, &["merge-base", "--all", &base, head])?)?;
                let mut commits = ancestors.lines();
                let common = commits.next().ok_or("PR history has no merge base")?;
                if commits.next().is_some() {
                    return Err("PR history has multiple merge bases".into());
                }
                ("github-pull-request-head", common.to_string())
            } else {
                let event_head = env::var("GITHUB_SHA").map_err(|_| "GITHUB_SHA is missing")?;
                if event_head != head {
                    return Err("checkout does not match the GitHub PR event".into());
                }
                let parents = text(git(root, &["rev-list", "--parents", "-n", "1", head])?)?;
                let parents = parents.split_whitespace().collect::<Vec<_>>();
                if parents.len() != 3 || parents[1] != base || parents[2] != pr_head {
                    return Err("checkout is not the merge of the GitHub PR base and head; full history may be missing".into());
                }
                ("github-pull-request-merge", base)
            }
        }
        Ok("push") => {
            if !event
                .get("ref")
                .and_then(Value::as_str)
                .is_some_and(|name| name.starts_with("refs/heads/"))
                || event.get("deleted").and_then(Value::as_bool) == Some(true)
            {
                return Err("automatic comparison requires a non-deleted branch push".into());
            }
            if head != sha(&event, "/after")? {
                return Err("checkout does not match the GitHub push event".into());
            }
            ("github-push", resolve(root, sha(&event, "/before")?)?)
        }
        _ => {
            return Err(
                "automatic comparison supports GitHub pull_request and branch push events".into(),
            );
        }
    };
    Ok(Comparison {
        source: source.into(),
        base: Some(base),
        target: Some(head.into()),
    })
}

fn comparison(root: &Path, ci: bool, base: Option<&str>) -> Result<Comparison, String> {
    let head = resolve(root, "HEAD");
    if let Some(base) = base {
        return Ok(Comparison {
            source: "explicit".into(),
            base: Some(resolve(root, base)?),
            target: Some(head?),
        });
    }
    if ci && ci_enabled() {
        if env::var("GITHUB_ACTIONS").as_deref() != Ok("true") {
            return Err("automatic comparison is not supported for this CI provider".into());
        }
        return github_comparison(root, &head?);
    }
    Ok(Comparison {
        source: "working-tree".into(),
        base: None,
        target: head.ok(),
    })
}

pub fn changed_paths(
    project: &Path,
    ci: bool,
    base: Option<&str>,
) -> Result<Option<(Vec<PathBuf>, Comparison)>, String> {
    let root = match git(project, &["rev-parse", "--show-toplevel"]).and_then(text) {
        Ok(root) => PathBuf::from(root),
        Err(_) if base.is_none() && !(ci && ci_enabled()) => return Ok(None),
        Err(error) => return Err(setup_error(error)),
    };
    let comparison = comparison(&root, ci, base).map_err(setup_error)?;
    let mut records = Vec::new();
    if let Some(base) = comparison.base.as_deref() {
        records.extend(
            git(
                &root,
                &[
                    "diff",
                    "--name-only",
                    "-z",
                    "--diff-filter=ACMR",
                    base,
                    "HEAD",
                    "--",
                ],
            )
            .map_err(setup_error)?,
        );
    }
    if comparison.target.is_some() {
        records.extend(
            git(
                &root,
                &[
                    "diff",
                    "--name-only",
                    "-z",
                    "--diff-filter=ACMR",
                    "HEAD",
                    "--",
                ],
            )
            .map_err(setup_error)?,
        );
    } else {
        records.extend(
            git(
                &root,
                &[
                    "diff",
                    "--cached",
                    "--name-only",
                    "-z",
                    "--diff-filter=ACMR",
                    "--",
                ],
            )
            .map_err(setup_error)?,
        );
    }
    records.extend(
        git(&root, &["ls-files", "--others", "--exclude-standard", "-z"]).map_err(setup_error)?,
    );
    let mut paths = records
        .split(|byte| *byte == 0)
        .filter(|path| !path.is_empty())
        .map(|path| {
            String::from_utf8(path.to_vec())
                .map(|path| root.join(path))
                .map_err(|_| "changed filename is not UTF-8".to_string())
        })
        .collect::<Result<Vec<_>, _>>()?;
    paths.sort();
    paths.dedup();
    paths.retain(|path| {
        path.starts_with(project)
            && fs::symlink_metadata(path).is_ok_and(|metadata| metadata.is_file())
    });
    Ok(Some((paths, comparison)))
}

fn setup_error(error: String) -> String {
    format!(
        "cannot determine changed files: {error}. Fetch the required Git history (for GitHub checkout, use fetch-depth: 0) or supply --base <available-commit>. Use --all for an intentional full scan."
    )
}
