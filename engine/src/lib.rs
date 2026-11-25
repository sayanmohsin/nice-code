use std::ops::Range;
use tree_sitter::{Language, Node, Parser};

#[derive(Default)]
pub struct SyntaxInfo {
    pub has_errors: bool,
    pub test_ranges: Vec<Range<usize>>,
}

impl SyntaxInfo {
    pub fn production_source(&self, source: &str) -> String {
        let mut bytes = source.as_bytes().to_vec();
        for range in &self.test_ranges {
            for byte in &mut bytes[range.clone()] {
                if !matches!(*byte, b'\n' | b'\r') {
                    *byte = b' ';
                }
            }
        }
        String::from_utf8(bytes).expect("masking complete syntax ranges preserves UTF-8")
    }

    pub fn is_test_line(&self, source: &str, line: usize) -> bool {
        let start = source
            .split_inclusive('\n')
            .take(line.saturating_sub(1))
            .map(str::len)
            .sum::<usize>();
        let end = source[start..]
            .find('\n')
            .map_or(source.len(), |offset| start + offset);
        let Some(first) = source[start..end].find(|character: char| !character.is_whitespace())
        else {
            return false;
        };
        let last = source[start..end].trim_end().len();
        self.test_ranges
            .iter()
            .any(|range| range.start <= start + first && start + last <= range.end)
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum LanguageKind {
    JavaScript,
    TypeScript,
    Tsx,
    Rust,
    Go,
    Dart,
    Java,
}

pub fn language_for_path(path: &str) -> Option<LanguageKind> {
    let extension = path.rsplit_once('.')?.1;
    Some(match extension {
        "js" | "jsx" | "mjs" | "cjs" => LanguageKind::JavaScript,
        "ts" => LanguageKind::TypeScript,
        "tsx" => LanguageKind::Tsx,
        "rs" => LanguageKind::Rust,
        "go" => LanguageKind::Go,
        "dart" => LanguageKind::Dart,
        "java" => LanguageKind::Java,
        _ => return None,
    })
}

pub fn parse_has_errors(path: &str, source: &str) -> bool {
    let mut parser = SyntaxParser::new();
    parser.parse_has_errors(path, source)
}

pub struct SyntaxParser {
    parser: Parser,
}

impl SyntaxParser {
    pub fn new() -> Self {
        Self {
            parser: Parser::new(),
        }
    }

    pub fn parse_has_errors(&mut self, path: &str, source: &str) -> bool {
        self.inspect(path, source).has_errors
    }

    pub fn inspect(&mut self, path: &str, source: &str) -> SyntaxInfo {
        let Some(kind) = language_for_path(path) else {
            return SyntaxInfo::default();
        };
        let language = match kind {
            LanguageKind::JavaScript => tree_sitter_javascript::LANGUAGE.into(),
            LanguageKind::TypeScript => tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into(),
            LanguageKind::Tsx => tree_sitter_typescript::LANGUAGE_TSX.into(),
            LanguageKind::Rust => tree_sitter_rust::LANGUAGE.into(),
            LanguageKind::Go => tree_sitter_go::LANGUAGE.into(),
            LanguageKind::Dart => tree_sitter_dart::LANGUAGE.into(),
            LanguageKind::Java => tree_sitter_java::LANGUAGE.into(),
        };
        set_language(&mut self.parser, language);
        let Some(tree) = self.parser.parse(source, None) else {
            return SyntaxInfo {
                has_errors: true,
                test_ranges: Vec::new(),
            };
        };
        let mut info = SyntaxInfo {
            has_errors: tree.root_node().has_error(),
            test_ranges: Vec::new(),
        };
        if kind == LanguageKind::Rust {
            rust_test_ranges(tree.root_node(), source, &mut info.test_ranges);
        }
        info
    }
}

fn rust_test_ranges(node: Node<'_>, source: &str, ranges: &mut Vec<Range<usize>>) {
    let mut cursor = node.walk();
    if matches!(node.kind(), "source_file" | "declaration_list")
        && !node.has_error()
        && node.named_children(&mut cursor).any(|child| {
            child.kind() == "inner_attribute_item"
                && source[child.byte_range()]
                    .chars()
                    .filter(|character| !character.is_whitespace())
                    .collect::<String>()
                    == "#![cfg(test)]"
        })
    {
        ranges.push(node.byte_range());
        return;
    }
    cursor.reset(node);
    let mut attributes_start = None;
    let mut test_attribute = false;
    for child in node.named_children(&mut cursor) {
        if child.kind() == "attribute_item" {
            attributes_start.get_or_insert(child.start_byte());
            let attribute = source[child.byte_range()]
                .chars()
                .filter(|character| !character.is_whitespace())
                .collect::<String>();
            test_attribute |= attribute == "#[cfg(test)]"
                || attribute == "#[test]"
                || attribute.starts_with("#[tokio::test(")
                || attribute == "#[tokio::test]"
                || attribute.starts_with("#[async_std::test(")
                || attribute == "#[async_std::test]";
            continue;
        }
        if matches!(child.kind(), "line_comment" | "block_comment") {
            continue;
        }
        if test_attribute && !child.has_error() && child.kind().ends_with("_item") {
            ranges.push(attributes_start.unwrap_or(child.start_byte())..child.end_byte());
        } else {
            rust_test_ranges(child, source, ranges);
        }
        attributes_start = None;
        test_attribute = false;
    }
}

pub fn is_test_path(path: &str) -> bool {
    let normalized = path.replace('\\', "/");
    let parts = normalized.split('/').collect::<Vec<_>>();
    if parts[..parts.len().saturating_sub(1)].iter().any(|part| {
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
            "mocks",
            "__mocks__",
        ]
        .contains(&part.to_ascii_lowercase().as_str())
    }) {
        return true;
    }
    let file = parts.last().copied().unwrap_or("");
    let lower = file.to_ascii_lowercase();
    let stem = lower
        .rsplit_once('.')
        .map_or(lower.as_str(), |(stem, _)| stem);
    [
        "tests",
        "specs",
        "fixtures",
        "examples",
        "mocks",
        "__tests__",
        "__mocks__",
    ]
    .contains(&stem)
        || ["test", "spec", "fixture", "example", "mock"]
            .iter()
            .any(|kind| {
                stem == *kind
                    || stem.ends_with(&format!(".{kind}"))
                    || stem.ends_with(&format!("_{kind}"))
                    || stem.starts_with(&format!("{kind}_"))
            })
        || (file.ends_with(".java")
            && ["Test.java", "Tests.java", "TestCase.java"]
                .iter()
                .any(|suffix| file.ends_with(suffix)))
}

impl Default for SyntaxParser {
    fn default() -> Self {
        Self::new()
    }
}

fn set_language(parser: &mut Parser, language: Language) {
    parser
        .set_language(&language)
        .expect("bundled Tree-sitter grammar must be valid");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_paths_use_boundaries() {
        for path in [
            "tests/auth.rs",
            "src/__tests__/auth.ts",
            "src/auth.test.ts",
            "src/auth.spec.tsx",
            "auth_test.go",
            "auth_test.dart",
            "src/AuthTest.java",
            "src/tests.rs",
        ] {
            assert!(is_test_path(path), "{path}");
        }
        for path in [
            "src/latest.ts",
            "src/inspection.ts",
            "src/contest.rs",
            "src/mockery.ts",
            "src/auth.rs",
        ] {
            assert!(!is_test_path(path), "{path}");
        }
    }

    #[test]
    fn rust_test_ranges_preserve_production_and_line_numbers() {
        let source = "fn production() {}\n#[cfg(test)]\nmod tests { const PASSWORD: &str = \"秘密\"; }\nfn other() {}\n";
        let info = SyntaxParser::new().inspect("src/auth.rs", source);
        let masked = info.production_source(source);
        assert!(!info.has_errors);
        assert_eq!(info.test_ranges.len(), 1);
        assert!(masked.contains("fn production() {}"));
        assert!(masked.contains("fn other() {}"));
        assert!(!masked.contains("PASSWORD"));
        assert_eq!(masked.len(), source.len());
        assert_eq!(masked.lines().count(), source.lines().count());
        assert!(info.is_test_line(source, 3));
        assert!(!info.is_test_line(source, 4));
    }

    #[test]
    fn rust_test_attributes_do_not_match_strings_or_ambiguous_cfg() {
        let source = "const MESSAGE: &str = \"#[cfg(test)]\";\n#[cfg(any(test, feature = \"runtime\"))]\nfn production() {}\n#[cfg(test)]\nmod broken {";
        let info = SyntaxParser::new().inspect("src/auth.rs", source);
        assert!(info.has_errors);
        assert!(info.test_ranges.is_empty());
        assert_eq!(info.production_source(source), source);
    }

    #[test]
    fn rust_test_functions_and_nested_modules_are_scoped() {
        let source = "mod auth { #[test] fn checks() {} fn real() {} }\n#[tokio::test]\nasync fn async_test() {}\n#[cfg(test)]\nconst TOKEN: &str = \"abc\";";
        let info = SyntaxParser::new().inspect("src/auth.rs", source);
        assert!(!info.has_errors);
        assert_eq!(info.test_ranges.len(), 3);
        let masked = info.production_source(source);
        assert!(masked.contains("fn real() {}"));
        assert!(!masked.contains("checks"));
        assert!(!masked.contains("TOKEN"));
    }

    #[test]
    fn rust_inner_test_attribute_only_masks_its_own_scope() {
        let source =
            "mod helper { #![cfg(test)] const TOKEN: &str = \"abc\"; }\nfn production() {}";
        let info = SyntaxParser::new().inspect("src/auth.rs", source);
        let masked = info.production_source(source);
        assert!(!masked.contains("TOKEN"));
        assert!(masked.contains("fn production() {}"));
        let source = "#![cfg(test)]\nconst TOKEN: &str = \"abc\";";
        let masked = SyntaxParser::new()
            .inspect("src/auth.rs", source)
            .production_source(source);
        assert!(masked.trim().is_empty());
    }

    #[test]
    fn maps_supported_languages() {
        assert_eq!(language_for_path("src/lib.rs"), Some(LanguageKind::Rust));
        assert_eq!(language_for_path("src/main.dart"), Some(LanguageKind::Dart));
        assert_eq!(
            language_for_path("src/main/java/App.java"),
            Some(LanguageKind::Java)
        );
        assert_eq!(
            language_for_path("src/App.ts"),
            Some(LanguageKind::TypeScript)
        );
        assert_eq!(language_for_path("src/App.tsx"), Some(LanguageKind::Tsx));
        assert_eq!(language_for_path("README.md"), None);
    }

    #[test]
    fn detects_syntax_errors() {
        assert!(!parse_has_errors("src/lib.rs", "fn main() {}"));
        assert!(parse_has_errors("src/lib.rs", "fn main( {"));
    }

    #[test]
    fn reuses_parser_across_languages() {
        let mut parser = SyntaxParser::new();
        assert!(!parser.parse_has_errors("src/lib.rs", "fn main() {}"));
        assert!(!parser.parse_has_errors("src/main.ts", "const value: number = 1;"));
        assert!(!parser.parse_has_errors(
            "src/App.tsx",
            "export function App() { return <main>Hello</main>; }"
        ));
        assert!(!parser.parse_has_errors("main.go", "package main\nfunc main() {}"));
        assert!(!parser.parse_has_errors("src/main.dart", "void main() { print('ready'); }"));
        assert!(!parser.parse_has_errors("src/main.js", "export const value = 1;"));
        assert!(!parser.parse_has_errors("src/App.java", "class App { void run() {} }"));
    }
}
