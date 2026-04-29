"""
Fix residual encoding artifacts left by previous fix_encoding.py run.
Undefined cp1252 bytes (0x81,0x8d,0x8f,0x90,0x9d) could not round-trip,
producing U+FFFD + U+00xx sequences in the output.
"""
import os, re

base = r'D:\qly thu chi'

def load(rel):
    return open(os.path.join(base, rel), encoding='utf-8').read()

def save(rel, text):
    open(os.path.join(base, rel), 'w', encoding='utf-8').write(text)
    print(f'Saved {rel}')

def sub(text, old, new):
    n = text.count(old)
    if n:
        print(f'  {n}x {ascii(old[:40])} -> {ascii(new[:40])}')
    return text.replace(old, new)

# ---------- Budgets.tsx ----------
t = load('src/pages/Budgets.tsx')
t = sub(t, '�\x90ặt ngân sách', 'Đặt ngân sách')
t = sub(t, '�\x90ã chi',         'Đã chi')
t = sub(t, '⚠�\x8f Vượt',       '⚠️ Vượt')
t = sub(t, '⚠�\x8f Sắp hết',    '⚠️ Sắp hết')
t = sub(t, '�\x90ã vượt!',       'Đã vượt!')
save('src/pages/Budgets.tsx', t)

# ---------- Recurring.tsx ----------
t = load('src/pages/Recurring.tsx')
t = sub(t, 'Số ti�\x81n phải > 0', 'Số tiền phải > 0')
t = sub(t, 'Ch�\x8dn danh mục',    'Chọn danh mục')
t = sub(t, 'Ch�\x8dn ví',          'Chọn ví')
t = sub(t, '�\x90ã tạo giao dịch thành công!', 'Đã tạo giao dịch thành công!')
t = sub(t, 'ti�\x81n nhà, internet',  'tiền nhà, internet')
t = sub(t, 'Ti�\x81n nhà, Netflix',   'Tiền nhà, Netflix')
t = sub(t, 'Số ti�\x81n"',            'Số tiền"')
t = sub(t, 'Tùy ch�\x8dn',            'Tùy chọn')
t = sub(t, '✓ �\x90ã tạo tháng này', '✓ Đã tạo tháng này')
t = sub(t, '�\x8f� Sắp đến hạn!', '⏰ Sắp đến hạn!')
save('src/pages/Recurring.tsx', t)

# ---------- Loans.tsx  (also re-check after earlier partial fix) ----------
t = load('src/pages/Loans.tsx')
# text chars
t = sub(t, 'ngư�\x9di',   'người')
t = sub(t, 'Ngư�\x9di',   'Người')
t = sub(t, 'ti�\x81n',     'tiền')
t = sub(t, 'Ti�\x81n',     'Tiền')
t = sub(t, 'Ch�\x8dn',     'Chọn')
t = sub(t, 'ch�\x8dn',     'chọn')
t = sub(t, '�\x90ã',        'Đã')
t = sub(t, '�\x90i',        'Đi')
t = sub(t, '�\x90ặt',       'Đặt')
# broken emoji 🤝 = F0 9F A4 9D -> shows as �\x9d after bad fix
t = sub(t, '�\x9d',          '🤝')
# variation selector �\x8f after ⚠
t = sub(t, '⚠�\x8f',        '⚠️')
save('src/pages/Loans.tsx', t)

# ---------- Categories.tsx ----------
t = load('src/pages/Categories.tsx')
t = sub(t, '�\x90i lại',   'Đi lại')
# Fix broken emoji in CATEGORY_ICONS - replace whole line with clean version
ICONS_OLD = re.search(r'const CATEGORY_ICONS = \[.*?\];', t, re.DOTALL)
if ICONS_OLD:
    clean_icons = ("const CATEGORY_ICONS = [\n"
                   "  '🍔','🚗','🏠','🎮','💡','📱','🛒','💄','☕','✈️',\n"
                   "  '👨‍👩‍👧','💼','📚','🎯','📦','💰','💊','🎬','💸','💳',\n"
                   "  '⚽','🎵','🚌','⛽','📷','🌿','🎓','🏋️','🐾','🎁',\n"
                   "  '🏖️','🍕','🎪','🎭',\n"
                   "];")
    t = t[:ICONS_OLD.start()] + clean_icons + t[ICONS_OLD.end():]
    print('  Replaced CATEGORY_ICONS array')
save('src/pages/Categories.tsx', t)
