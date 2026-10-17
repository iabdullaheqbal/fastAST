"""Tests for TypeScript and TSX parsing, pruning, and indexing in FastAST."""

import json
import subprocess
import sys
from pathlib import Path

from fastast import index_code, prune_file

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_ts_interface_and_type_alias_pruning():
    """Test pruning TypeScript interfaces, type aliases, and enums."""
    code = """
import type { BaseEntity } from './base';

export interface User<T> {
    id: string;
    data: T;
}

export type UserRole = 'admin' | 'moderator' | 'user';

export enum AccountStatus {
    Active = 1,
    Suspended = 2,
    Deleted = 3
}

export function processUser<T>(user: User<T>, role: UserRole): boolean {
    if (role === 'admin') {
        return true;
    }
    return false;
}

export function unusedCalculation(x: number): number {
    return x * 100;
}
"""
    res = prune_file(code, "processUser", 0.5, language="typescript")
    assert not res.has_syntax_error
    # Matched function kept in full
    assert "export function processUser<T>(user: User<T>, role: UserRole): boolean {" in res.pruned_code
    assert "if (role === 'admin') {" in res.pruned_code

    # Type dependency closure: User and UserRole were referenced, so kept
    assert "export interface User<T>" in res.pruned_code
    assert "export type UserRole = 'admin' | 'moderator' | 'user';" in res.pruned_code

    # Unused function stubbed
    assert "export function unusedCalculation(x: number): number {}" in res.pruned_code
    assert res.savings_pct > 0.0


def test_ts_class_and_method_pruning():
    """Test TypeScript class with heritage, access modifiers, and method stubbing."""
    fixture_path = FIXTURES_DIR / "sample_simple.ts"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "add", 0.5, language="typescript")
    assert not res.has_syntax_error

    # Class container kept
    assert "class Calculator implements ICalculator {" in res.pruned_code
    # Matched method kept full
    assert "add(a: number, b: number): number {" in res.pruned_code
    assert "this.result = a + b;" in res.pruned_code

    # Unmatched methods stubbed
    assert "subtract(a: number, b: number): number {}" in res.pruned_code
    assert "getResult(): number {}" in res.pruned_code

    # Interface kept
    assert "interface ICalculator" in res.pruned_code
    assert res.savings_pct > 0.0


def test_ts_generic_functions():
    """Test functions with complex generics and return type annotations."""
    code = """
export async function fetchEntity<T extends { id: string }>(
    endpoint: string,
    id: string
): Promise<T | null> {
    const res = await fetch(`${endpoint}/${id}`);
    if (!res.ok) return null;
    return await res.json() as T;
}

export function unusedHelper<K, V>(map: Map<K, V>): number {
    return map.size;
}
"""
    res = prune_file(code, "fetchEntity", 0.5, language="typescript")
    assert not res.has_syntax_error
    assert "export async function fetchEntity<T extends { id: string }>(" in res.pruned_code
    assert "const res = await fetch" in res.pruned_code
    assert "export function unusedHelper<K, V>(map: Map<K, V>): number {}" in res.pruned_code


def test_tsx_component_pruning():
    """Test React TSX component and hook preservation."""
    fixture_path = FIXTURES_DIR / "sample_simple.tsx"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "isHovered", 0.5, language="tsx")
    assert not res.has_syntax_error

    # UserCard component kept full with JSX
    assert "export const UserCard = <T extends UserProfile>({" in res.pruned_code
    assert "className={`user-card" in res.pruned_code
    assert "<button onClick={() => onEdit(user)}>Edit Profile</button>" in res.pruned_code

    # Unmatched AdminDashboard stubbed
    assert "export const AdminDashboard = (): JSX.Element => {};" in res.pruned_code
    assert "export default function App(): JSX.Element {}" in res.pruned_code
    assert res.savings_pct > 0.0


def test_ts_dependency_closure():
    """Test transitive type closure: referenced types are preserved."""
    fixture_path = FIXTURES_DIR / "sample_simple.tsx"
    code = fixture_path.read_text(encoding="utf-8")

    # Focus on UserCard which uses UserProfile and UserCardProps
    res = prune_file(code, "UserCard", 0.5, language="typescript")
    assert not res.has_syntax_error

    assert "export interface UserProfile {" in res.pruned_code
    assert "export interface UserCardProps<T extends UserProfile> {" in res.pruned_code


def test_ts_zero_semantic_match_skeleton():
    """Test zero semantic match produces structural skeleton."""
    code = """
import { Config } from './config';

export interface ISession {
    token: string;
}

export enum Level {
    Low,
    High
}

export type ID = string | number;

export function initSession(cfg: Config): ISession {
    return { token: cfg.secret };
}

export class SessionManager {
    private active: boolean = false;

    start(): void {
        this.active = true;
    }

    stop(): void {
        this.active = false;
    }
}
"""
    res = prune_file(code, "nonExistentSearchToken999", 0.5, language="typescript")
    assert not res.has_syntax_error

    # Imports kept
    assert "import { Config } from './config';" in res.pruned_code
    # Skeletons for interfaces, enums, types, functions, classes
    assert "export interface ISession {}" in res.pruned_code
    assert "export enum Level {}" in res.pruned_code
    assert "export type ID = string | number;" in res.pruned_code
    assert "export function initSession(cfg: Config): ISession {}" in res.pruned_code
    assert "export class SessionManager {}" in res.pruned_code
    assert "this.active = true" not in res.pruned_code


def test_ts_symbol_indexing():
    """Test AST symbol extraction for TypeScript and TSX."""
    fixture_path = FIXTURES_DIR / "sample_simple.tsx"
    code = fixture_path.read_text(encoding="utf-8")

    res = index_code(code, language="tsx")
    assert not res.has_syntax_error
    assert res.total_lines > 30

    symbol_names = [s.name for s in res.symbols]
    assert "UserProfile" in symbol_names
    assert "UserCardProps" in symbol_names
    assert "UserCard" in symbol_names
    assert "AdminDashboard" in symbol_names
    assert "App" in symbol_names

    # Check symbol kinds
    interface_syms = [s for s in res.symbols if s.kind == "interface"]
    assert any(s.name == "UserProfile" for s in interface_syms)
    assert any(s.name == "UserCardProps" for s in interface_syms)

    arrow_syms = [s for s in res.symbols if "arrow" in s.kind]
    assert any(s.name == "UserCard" for s in arrow_syms)
    assert any(s.name == "AdminDashboard" for s in arrow_syms)

    func_syms = [s for s in res.symbols if s.kind == "function"]
    assert any(s.name == "App" for s in func_syms)


def test_cli_prune_typescript():
    """Test CLI runner on TypeScript fixture with auto-detected language."""
    fixture_path = FIXTURES_DIR / "sample_simple.ts"
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "fastast.cli",
            "prune",
            str(fixture_path),
            "-q",
            "Calculator",
            "--json",
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"CLI failed: {result.stderr}"
    data = json.loads(result.stdout)
    assert data["syntax_valid"] is True
    assert "Calculator" in data["pruned_code"]
    assert data["savings_pct"] > 0
    assert data["latency_ms"] < 25.0


def test_cli_prune_tsx():
    """Test CLI runner on TSX fixture with auto-detected language."""
    fixture_path = FIXTURES_DIR / "sample_simple.tsx"
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "fastast.cli",
            "prune",
            str(fixture_path),
            "-q",
            "UserCard",
            "--json",
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"CLI failed: {result.stderr}"
    data = json.loads(result.stdout)
    assert data["syntax_valid"] is True
    assert "UserCard" in data["pruned_code"]
    assert data["savings_pct"] > 0
    assert data["latency_ms"] < 25.0


def test_ts_syntax_reparse_validation():
    """Verify that pruned TypeScript and TSX outputs are valid ASTs."""
    ts_fixture = FIXTURES_DIR / "sample_simple.ts"
    tsx_fixture = FIXTURES_DIR / "sample_simple.tsx"

    # Prune TS
    res_ts = prune_file(ts_fixture.read_text(), "add", 0.5, language="typescript")
    assert not res_ts.has_syntax_error
    recheck_ts = prune_file(res_ts.pruned_code, "add", 0.5, language="typescript")
    assert not recheck_ts.has_syntax_error

    # Prune TSX
    res_tsx = prune_file(tsx_fixture.read_text(), "isHovered", 0.5, language="tsx")
    assert not res_tsx.has_syntax_error
    recheck_tsx = prune_file(res_tsx.pruned_code, "isHovered", 0.5, language="tsx")
    assert not recheck_tsx.has_syntax_error


if __name__ == "__main__":
    test_ts_interface_and_type_alias_pruning()
    test_ts_class_and_method_pruning()
    test_ts_generic_functions()
    test_tsx_component_pruning()
    test_ts_dependency_closure()
    test_ts_zero_semantic_match_skeleton()
    test_ts_symbol_indexing()
    test_cli_prune_typescript()
    test_cli_prune_tsx()
    test_ts_syntax_reparse_validation()
    print("All 10 TypeScript & TSX tests passed successfully!")
