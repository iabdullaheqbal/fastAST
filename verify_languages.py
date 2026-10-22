#!/usr/bin/env python3
"""Quick verification script for multi-language AST indexing support."""
import sys
sys.path.insert(0, 'python')

from fastast import index_code

tests = [
    ('Python', 'python', 'def foo(): pass'),
    ('Java', 'java', 'class X { void foo() {} }'),
    ('JavaScript', 'javascript', 'function foo() {}'),
    ('TypeScript', 'typescript', 'export function foo(): number { return 1; }'),
    ('HTML', 'html', '<header class="main-hdr"><h1>Title</h1></header>'),
    ('CSS', 'css', '.main-hdr { color: red; }'),
    ('Rust', 'rust', 'pub fn foo() {}'),
    ('JSON', 'json', '{"service": "fastast"}'),
    ('TOML', 'toml', '[package]\nname = "fastast"'),
]

print('=' * 50)
print('FastAST Multi-Language AST Indexing Verification')
print('=' * 50)

if index_code is None:
    print("Notice: Native FastAST extension (_core) is not yet compiled.")
    print("Build with: maturin develop")
    print('=' * 50)
    sys.exit(0)

success_count = 0
for name, lang, code in tests:
    try:
        result = index_code(code, language=lang)
        if result and not result.has_syntax_error:
            status = '✓'
            success_count += 1
            print(f'{status} {name:15} - Working ({len(result.symbols)} symbols extracted)')
        else:
            status = '✗'
            print(f'{status} {name:15} - Syntax error flag set')
    except Exception as e:
        status = '✗'
        print(f'{status} {name:15} - Error: {str(e)[:40]}')

print('=' * 50)
print(f'Result: {success_count}/{len(tests)} languages working')
print('=' * 50)

sys.exit(0 if success_count == len(tests) else 1)
