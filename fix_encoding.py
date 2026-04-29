import os, sys

files = [
    r'D:\qly thu chi\src\pages\Reports.tsx',
    r'D:\qly thu chi\src\pages\Budgets.tsx',
    r'D:\qly thu chi\src\pages\Loans.tsx',
    r'D:\qly thu chi\src\pages\Recurring.tsx',
    r'D:\qly thu chi\src\pages\Categories.tsx',
]

for path in files:
    with open(path, 'rb') as f:
        raw = f.read()
    text = raw.decode('utf-8')
    # Fix: the file contains UTF-8 encoding of mojibake (Latin-1/cp1252 interpreted UTF-8 bytes)
    # Reverse: encode as cp1252 (gets back original UTF-8 bytes), then decode as UTF-8
    fixed_chars = []
    i = 0
    while i < len(text):
        ch = text[i]
        try:
            b = ch.encode('cp1252')
            fixed_chars.append(b)
        except (UnicodeEncodeError, LookupError):
            fixed_chars.append(ch.encode('utf-8'))
        i += 1
    raw_fixed = b''.join(fixed_chars)
    # Now decode as UTF-8 to get the real text
    try:
        real_text = raw_fixed.decode('utf-8')
    except UnicodeDecodeError:
        # Some chars were not mojibake; decode with replace and continue
        real_text = raw_fixed.decode('utf-8', errors='replace')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(real_text)
    print(f'Fixed: {os.path.basename(path)}')
