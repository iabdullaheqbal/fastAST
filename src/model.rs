//! Core domain data model for FastAST Codebase-Memory Engine (AST → Graph → Retrieval).

use pyo3::prelude::*;
use serde::{Deserialize, Serialize};

/// Status of a file in the incremental indexing pipeline.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum FileStatus {
    Unchanged,
    Added,
    Modified,
    Deleted,
    Error,
}

impl FileStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            FileStatus::Unchanged => "unchanged",
            FileStatus::Added => "added",
            FileStatus::Modified => "modified",
            FileStatus::Deleted => "deleted",
            FileStatus::Error => "error",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "unchanged" => FileStatus::Unchanged,
            "added" => FileStatus::Added,
            "modified" => FileStatus::Modified,
            "deleted" => FileStatus::Deleted,
            _ => FileStatus::Error,
        }
    }
}

/// Category of a file in the repository (e.g. source, test, config, docs, infra, generated, other).
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum FileCategory {
    Source,
    Test,
    Config,
    Docs,
    Infra,
    Generated,
    Other,
}

impl FileCategory {
    pub fn as_str(&self) -> &'static str {
        match self {
            FileCategory::Source => "source",
            FileCategory::Test => "test",
            FileCategory::Config => "config",
            FileCategory::Docs => "docs",
            FileCategory::Infra => "infra",
            FileCategory::Generated => "generated",
            FileCategory::Other => "other",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "source" => FileCategory::Source,
            "test" => FileCategory::Test,
            "config" => FileCategory::Config,
            "docs" => FileCategory::Docs,
            "infra" => FileCategory::Infra,
            "generated" => FileCategory::Generated,
            _ => FileCategory::Other,
        }
    }
}

/// Represents an indexed file record in the repository store.
#[pyclass]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FileRecord {
    #[pyo3(get, set)]
    pub path: String,
    #[pyo3(get, set)]
    pub language: String,
    #[pyo3(get, set)]
    pub hash: String,
    #[pyo3(get, set)]
    pub mtime: f64,
    #[pyo3(get, set)]
    pub status: String,
    #[pyo3(get, set)]
    pub category: String,
    #[pyo3(get, set)]
    pub total_lines: usize,
    #[pyo3(get, set)]
    pub total_tokens: usize,
    #[pyo3(get, set)]
    pub has_syntax_error: bool,
}

#[pymethods]
impl FileRecord {
    #[new]
    #[pyo3(signature = (path, language, hash, mtime, status="unchanged".to_string(), category="source".to_string(), total_lines=0, total_tokens=0, has_syntax_error=false))]
    pub fn new(
        path: String,
        language: String,
        hash: String,
        mtime: f64,
        status: String,
        category: String,
        total_lines: usize,
        total_tokens: usize,
        has_syntax_error: bool,
    ) -> Self {
        Self {
            path,
            language,
            hash,
            mtime,
            status,
            category,
            total_lines,
            total_tokens,
            has_syntax_error,
        }
    }

    pub fn __repr__(&self) -> String {
        format!(
            "FileRecord(path='{}', lang='{}', cat='{}', status='{}', lines={})",
            self.path, self.language, self.category, self.status, self.total_lines
        )
    }
}

/// Represents an extracted symbol node in the code graph.
#[pyclass]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SymbolRecord {
    #[pyo3(get, set)]
    pub id: Option<i64>,
    #[pyo3(get, set)]
    pub name: String,
    #[pyo3(get, set)]
    pub kind: String,
    #[pyo3(get, set)]
    pub file: String,
    #[pyo3(get, set)]
    pub start_line: usize,
    #[pyo3(get, set)]
    pub end_line: usize,
    #[pyo3(get, set)]
    pub confidence: f32,
    #[pyo3(get, set)]
    pub signature: Option<String>,
    #[pyo3(get, set)]
    pub parent_name: Option<String>,
    #[pyo3(get, set)]
    pub docstring: Option<String>,
}

#[pymethods]
impl SymbolRecord {
    #[new]
    #[pyo3(signature = (name, kind, file, start_line, end_line, confidence=1.0, id=None, signature=None, parent_name=None, docstring=None))]
    pub fn new(
        name: String,
        kind: String,
        file: String,
        start_line: usize,
        end_line: usize,
        confidence: f32,
        id: Option<i64>,
        signature: Option<String>,
        parent_name: Option<String>,
        docstring: Option<String>,
    ) -> Self {
        Self {
            id,
            name,
            kind,
            file,
            start_line,
            end_line,
            confidence,
            signature,
            parent_name,
            docstring,
        }
    }

    pub fn __repr__(&self) -> String {
        format!(
            "SymbolRecord(id={:?}, name='{}', kind='{}', file='{}', lines={}-{}, conf={:.2})",
            self.id, self.name, self.kind, self.file, self.start_line, self.end_line, self.confidence
        )
    }
}

/// Relation type for directed edges between code entities.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum EdgeRelation {
    Calls,
    Imports,
    Defines,
    Implements,
    Inherits,
    References,
}

impl EdgeRelation {
    pub fn as_str(&self) -> &'static str {
        match self {
            EdgeRelation::Calls => "calls",
            EdgeRelation::Imports => "imports",
            EdgeRelation::Defines => "defines",
            EdgeRelation::Implements => "implements",
            EdgeRelation::Inherits => "inherits",
            EdgeRelation::References => "references",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "calls" => EdgeRelation::Calls,
            "imports" => EdgeRelation::Imports,
            "defines" => EdgeRelation::Defines,
            "implements" => EdgeRelation::Implements,
            "inherits" => EdgeRelation::Inherits,
            _ => EdgeRelation::References,
        }
    }
}

/// Represents a directed edge connecting two symbols/entities in the code graph.
#[pyclass]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EdgeRecord {
    #[pyo3(get, set)]
    pub src: String,
    #[pyo3(get, set)]
    pub dst: String,
    #[pyo3(get, set)]
    pub relation: String,
    #[pyo3(get, set)]
    pub confidence: f32,
    #[pyo3(get, set)]
    pub line_number: Option<usize>,
}

#[pymethods]
impl EdgeRecord {
    #[new]
    #[pyo3(signature = (src, dst, relation="calls".to_string(), confidence=1.0, line_number=None))]
    pub fn new(
        src: String,
        dst: String,
        relation: String,
        confidence: f32,
        line_number: Option<usize>,
    ) -> Self {
        Self {
            src,
            dst,
            relation,
            confidence,
            line_number,
        }
    }

    pub fn __repr__(&self) -> String {
        format!(
            "EdgeRecord(src='{}', dst='{}', relation='{}', conf={:.2})",
            self.src, self.dst, self.relation, self.confidence
        )
    }
}

/// Bounded evidence window providing exact line numbers and code snippet for a candidate.
#[pyclass]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EvidenceWindow {
    #[pyo3(get, set)]
    pub start_line: usize,
    #[pyo3(get, set)]
    pub end_line: usize,
    #[pyo3(get, set)]
    pub snippet: Option<String>,
}

#[pymethods]
impl EvidenceWindow {
    #[new]
    #[pyo3(signature = (start_line, end_line, snippet=None))]
    pub fn new(start_line: usize, end_line: usize, snippet: Option<String>) -> Self {
        Self {
            start_line,
            end_line,
            snippet,
        }
    }

    pub fn __repr__(&self) -> String {
        format!("EvidenceWindow(lines={}-{})", self.start_line, self.end_line)
    }
}

/// Represents a candidate symbol retrieved for agent query evidence.
#[pyclass]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Candidate {
    #[pyo3(get, set)]
    pub symbol_id: String,
    #[pyo3(get, set)]
    pub score: f32,
    #[pyo3(get, set)]
    pub reasons: Vec<String>,
    #[pyo3(get, set)]
    pub neighbors: Vec<String>,
    #[pyo3(get, set)]
    pub evidence_window: EvidenceWindow,
}

#[pymethods]
impl Candidate {
    #[new]
    #[pyo3(signature = (symbol_id, score, reasons=Vec::new(), neighbors=Vec::new(), evidence_window=EvidenceWindow::new(0, 0, None)))]
    pub fn new(
        symbol_id: String,
        score: f32,
        reasons: Vec<String>,
        neighbors: Vec<String>,
        evidence_window: EvidenceWindow,
    ) -> Self {
        Self {
            symbol_id,
            score,
            reasons,
            neighbors,
            evidence_window,
        }
    }

    pub fn __repr__(&self) -> String {
        format!(
            "Candidate(symbol='{}', score={:.3}, reasons={:?}, neighbors={})",
            self.symbol_id, self.score, self.reasons, self.neighbors.len()
        )
    }
}

/// Represents extracted syntactic facts (symbols + graph edges) for a single file.
#[pyclass]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ExtractedFileFacts {
    #[pyo3(get, set)]
    pub file_path: String,
    #[pyo3(get, set)]
    pub language: String,
    #[pyo3(get, set)]
    pub symbols: Vec<SymbolRecord>,
    #[pyo3(get, set)]
    pub edges: Vec<EdgeRecord>,
    #[pyo3(get, set)]
    pub total_lines: usize,
    #[pyo3(get, set)]
    pub total_tokens: usize,
    #[pyo3(get, set)]
    pub has_syntax_error: bool,
    #[pyo3(get, set)]
    pub error_message: Option<String>,
}

#[pymethods]
impl ExtractedFileFacts {
    #[new]
    #[pyo3(signature = (file_path, language="python".to_string(), symbols=Vec::new(), edges=Vec::new(), total_lines=0, total_tokens=0, has_syntax_error=false, error_message=None))]
    pub fn new(
        file_path: String,
        language: String,
        symbols: Vec<SymbolRecord>,
        edges: Vec<EdgeRecord>,
        total_lines: usize,
        total_tokens: usize,
        has_syntax_error: bool,
        error_message: Option<String>,
    ) -> Self {
        Self {
            file_path,
            language,
            symbols,
            edges,
            total_lines,
            total_tokens,
            has_syntax_error,
            error_message,
        }
    }

    pub fn __repr__(&self) -> String {
        format!(
            "ExtractedFileFacts(file='{}', lang='{}', symbols={}, edges={}, err={})",
            self.file_path, self.language, self.symbols.len(), self.edges.len(), self.has_syntax_error
        )
    }
}

