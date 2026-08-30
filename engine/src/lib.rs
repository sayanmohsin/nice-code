use tree_sitter::{Language, Parser};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum LanguageKind {
    JavaScript,
    TypeScript,
    Rust,
    Go,
    Dart,
}

pub fn language_for_path(path: &str) -> Option<LanguageKind> {
    let extension = path.rsplit_once('.')?.1;
    Some(match extension {
        "js" | "jsx" | "mjs" | "cjs" => LanguageKind::JavaScript,
        "ts" | "tsx" => LanguageKind::TypeScript,
        "rs" => LanguageKind::Rust,
        "go" => LanguageKind::Go,
        "dart" => LanguageKind::Dart,
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
        let Some(kind) = language_for_path(path) else {
            return false;
        };
        let language = match kind {
            LanguageKind::JavaScript => tree_sitter_javascript::LANGUAGE.into(),
            LanguageKind::TypeScript => tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into(),
            LanguageKind::Rust => tree_sitter_rust::LANGUAGE.into(),
            LanguageKind::Go => tree_sitter_go::LANGUAGE.into(),
            LanguageKind::Dart => tree_sitter_dart::LANGUAGE.into(),
        };
        set_language(&mut self.parser, language);
        self.parser
            .parse(source, None)
            .is_some_and(|tree| tree.root_node().has_error())
    }
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
    fn maps_supported_languages() {
        assert_eq!(language_for_path("src/lib.rs"), Some(LanguageKind::Rust));
        assert_eq!(language_for_path("src/main.dart"), Some(LanguageKind::Dart));
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
        assert!(!parser.parse_has_errors("main.go", "package main\nfunc main() {}"));
    }
}
