class PruneResult:
    pruned_code: str
    original_tokens: int
    pruned_tokens: int
    savings_pct: float
    total_lines: int
    kept_lines: int
    latency_ms: float

def prune_file(code_text: str, focus_query: str, threshold: float = 0.5) -> PruneResult: ...

