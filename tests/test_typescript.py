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


def test_ts_abstract_class_and_methods():
    """Test abstract classes and abstract methods are preserved without invalid {} stubs."""
    code = """
export interface TaskPayload {
    taskId: string;
    priority: number;
}

export abstract class BaseService<T> {
    protected serviceName: string;

    constructor(name: string) {
        this.serviceName = name;
    }

    public abstract execute(payload: T): Promise<void>;

    public logStatus(): void {
        console.log(`Service ${this.serviceName} active`);
    }
}

export class OrderService extends BaseService<TaskPayload> {
    public async execute(payload: TaskPayload): Promise<void> {
        console.log(`Processing order task ${payload.taskId}`);
    }

    public unusedHelper(): void {
        console.log("unused");
    }
}
"""
    # Query for execute
    res = prune_file(code, "execute", 0.5, language="typescript")
    assert not res.has_syntax_error
    # Abstract method must NOT have {} attached
    assert "public abstract execute(payload: T): Promise<void>;" in res.pruned_code
    assert "public abstract execute(payload: T): Promise<void> {}" not in res.pruned_code

    # OrderService execute kept full
    assert "public async execute(payload: TaskPayload): Promise<void> {" in res.pruned_code
    assert "Processing order task" in res.pruned_code

    # Unmatched helper stubbed
    assert "public unusedHelper(): void {}" in res.pruned_code

    # Dependency closure kept TaskPayload interface
    assert "export interface TaskPayload {" in res.pruned_code

    # Re-index to ensure valid AST
    idx = index_code(res.pruned_code, language="typescript")
    assert not idx.has_syntax_error


def test_ts_enums_and_const_enums():
    """Test standard enums and const enums with dependency closure."""
    code = """
export const enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
}

export enum HttpStatus {
    OK = 200,
    Created = 201,
    BadRequest = 400,
    NotFound = 404
}

export function handleRequest(method: HttpMethod, url: string): HttpStatus {
    if (method === HttpMethod.GET) {
        return HttpStatus.OK;
    }
    return HttpStatus.Created;
}

export function unusedRouter(): void {
    console.log("unused router");
}
"""
    res = prune_file(code, "handleRequest", 0.5, language="typescript")
    assert not res.has_syntax_error
    assert "export function handleRequest(method: HttpMethod, url: string): HttpStatus {" in res.pruned_code
    assert "export const enum HttpMethod {" in res.pruned_code
    assert "export enum HttpStatus {" in res.pruned_code
    assert "export function unusedRouter(): void {}" in res.pruned_code
    assert res.savings_pct > 0.0


def test_ts_transitive_multi_hop_closure():
    """Test deep transitive closure: App -> Dashboard -> UserCard -> Props -> Profile -> Role."""
    code = """
export type UserRole = "superadmin" | "admin" | "viewer";

export interface UserProfile {
    id: string;
    role: UserRole;
}

export interface UserCardProps {
    user: UserProfile;
}

export const UserCard = ({ user }: UserCardProps) => {
    return <div>{user.id}: {user.role}</div>;
};

export const Dashboard = () => {
    return <section><UserCard user={{ id: "1", role: "admin" }} /></section>;
};

export default function App() {
    return <main><Dashboard /></main>;
}

export function unrelatedUtility() {
    return 42;
}
"""
    res = prune_file(code, "App", 0.5, language="tsx")
    assert not res.has_syntax_error
    assert "export default function App() {" in res.pruned_code
    assert "<Dashboard />" in res.pruned_code

    # Dashboard kept
    assert "export const Dashboard = () => {" in res.pruned_code
    # UserCard kept
    assert "export const UserCard = ({ user }: UserCardProps) => {" in res.pruned_code
    # Props and Profile and UserRole kept
    assert "export interface UserCardProps {" in res.pruned_code
    assert "export interface UserProfile {" in res.pruned_code
    assert 'export type UserRole = "superadmin" | "admin" | "viewer";' in res.pruned_code

    # Unrelated utility stubbed
    assert "export function unrelatedUtility() {}" in res.pruned_code


def test_ts_custom_hooks_and_generics():
    """Test React custom hooks and generic state closure."""
    code = """
import React, { useState, useEffect } from 'react';

export interface UseDataResult<T> {
    data: T | null;
    isLoading: boolean;
}

export function useFetchData<T>(url: string): UseDataResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        fetch(url).then(r => r.json()).then((d: T) => {
            setData(d);
            setIsLoading(false);
        });
    }, [url]);

    return { data, isLoading };
}

export interface Product {
    sku: string;
    price: number;
}

export const ProductList = () => {
    const { data: products } = useFetchData<Product[]>('/api/products');
    return <div>{products?.length} products</div>;
};

export const StaticHeader = () => {
    return <header>Welcome to store</header>;
};
"""
    res = prune_file(code, "ProductList", 0.5, language="tsx")
    assert not res.has_syntax_error
    assert "export const ProductList = () => {" in res.pruned_code
    assert "useFetchData<Product[]>('/api/products')" in res.pruned_code

    # Hook and referenced interfaces kept
    assert "export function useFetchData<T>(url: string): UseDataResult<T> {" in res.pruned_code
    assert "export interface UseDataResult<T> {" in res.pruned_code
    assert "export interface Product {" in res.pruned_code

    # Unmatched header stubbed
    assert "export const StaticHeader = () => {};" in res.pruned_code


def test_ts_getters_setters_and_constructor():
    """Test that getter and setter methods are kept as pairs and constructor is preserved."""
    code = """
export class BankAccount {
    private _balance: number = 0;
    private _owner: string;

    constructor(owner: string, initialDeposit: number) {
        this._owner = owner;
        this._balance = initialDeposit;
    }

    public get balance(): number {
        return this._balance;
    }

    public set balance(val: number) {
        if (val < 0) throw new Error("Negative balance not allowed");
        this._balance = val;
    }

    public get ownerName(): string {
        return this._owner;
    }

    public printOwner(): void {
        console.log(`Owner: ${this._owner}`);
    }
}
"""
    res = prune_file(code, "balance", 0.5, language="typescript")
    assert not res.has_syntax_error

    # Both getter and setter for balance kept
    assert "public get balance(): number {" in res.pruned_code
    assert "public set balance(val: number) {" in res.pruned_code

    # Constructor kept as skeleton
    assert "constructor(owner: string, initialDeposit: number) {}" in res.pruned_code

    # Unmatched methods stubbed
    assert "public get ownerName(): string {}" in res.pruned_code
    assert "public printOwner(): void {}" in res.pruned_code


def test_ts_nested_functions():
    """Test nested helper functions inside a TypeScript function."""
    code = """
export function processBatch(items: string[]): string[] {
    function cleanItem(raw: string): string {
        return raw.trim().toLowerCase();
    }

    function validateItem(item: string): boolean {
        return item.length > 0;
    }

    return items.map(cleanItem).filter(validateItem);
}

export function unusedCalculation(a: number): number {
    return a * 2;
}
"""
    res = prune_file(code, "cleanItem", 0.5, language="typescript")
    assert not res.has_syntax_error
    assert "export function processBatch(items: string[]): string[] {" in res.pruned_code
    assert "function cleanItem(raw: string): string {" in res.pruned_code
    assert "export function unusedCalculation(a: number): number {}" in res.pruned_code


def test_ts_call_graph_and_docstring_indexing():
    """Test docstring and call graph extraction for TypeScript."""
    code = """
/**
 * Service managing user authentication.
 */
export class AuthService {
    /**
     * Authenticates user with credentials.
     */
    public async login(user: string, pass: string): Promise<boolean> {
        const hash = this.hashPassword(pass);
        return this.verifyUser(user, hash);
    }

    private hashPassword(p: string): string {
        return `hash_${p}`;
    }

    private verifyUser(u: string, h: string): boolean {
        return u.length > 0 && h.length > 0;
    }
}
"""
    idx = index_code(code, language="typescript")
    assert not idx.has_syntax_error

    # Check docstring extraction
    auth_service = next(s for s in idx.symbols if s.name == "AuthService")
    assert auth_service.docstring is not None
    assert "Service managing user authentication" in auth_service.docstring

    login_method = next(s for s in idx.symbols if s.name == "login")
    assert login_method.docstring is not None
    assert "Authenticates user with credentials" in login_method.docstring
    assert login_method.parent_name == "AuthService"

    # Check calls
    call_callees = [c.callee_name for c in idx.calls if c.caller_name == "login"]
    assert "hashPassword" in call_callees or "this.hashPassword" in call_callees
    assert "verifyUser" in call_callees or "this.verifyUser" in call_callees


def test_ts_empty_and_whitespace_edge_cases():
    """Test empty, whitespace, and comments-only TypeScript files."""
    res_empty = prune_file("", "test", 0.5, language="typescript")
    assert res_empty.pruned_code == ""
    assert res_empty.savings_pct == 0.0

    res_ws = prune_file("   \n\t  \n  ", "test", 0.5, language="typescript")
    assert res_ws.pruned_code == ""

    res_comments = prune_file("// Just a comment\n/* Multi line\n comment */", "test", 0.5, language="typescript")
    assert not res_comments.has_syntax_error


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
    test_ts_abstract_class_and_methods()
    test_ts_enums_and_const_enums()
    test_ts_transitive_multi_hop_closure()
    test_ts_custom_hooks_and_generics()
    test_ts_getters_setters_and_constructor()
    test_ts_nested_functions()
    test_ts_call_graph_and_docstring_indexing()
    test_ts_empty_and_whitespace_edge_cases()
    print("All 18 TypeScript & TSX tests passed successfully!")
