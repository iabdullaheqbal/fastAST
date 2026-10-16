#!/usr/bin/env python3
"""Quick verification script for multi-language support."""
import sys
sys.path.insert(0, 'python')

from fastast import prune_file

tests = [
    ('Python', 'python', 'x = 1'),
    ('Java', 'java', 'class X {}'),
    ('JavaScript', 'javascript', 'function x() {}'),
    ('TypeScript', 'typescript', 'const x: number = 1;'),
    ('HTML', 'html', '<html></html>'),
    ('CSS', 'css', 'body {}'),
]

print('=' * 50)
print('FastAST Multi-Language Support Verification')
print('=' * 50)

success_count = 0
for name, lang, code in tests:
    try:
        result = prune_file(code, 'test', language=lang)
        status = '✓'
        success_count += 1
        print(f'{status} {name:15} - Working')
    except Exception as e:
        status = '✗'
        print(f'{status} {name:15} - Error: {str(e)[:30]}')

print('=' * 50)
print(f'Result: {success_count}/{len(tests)} languages working')
print('=' * 50)

sys.exit(0 if success_count == len(tests) else 1)
