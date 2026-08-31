import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'data', 'finance.db')

if not os.path.exists(db_path):
    print(f"[ERROR] Database file not found at: {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
tables = [row[0] for row in cur.fetchall()]

print("====================================================")
print("  DATABASE STATUS: CONNECTED & ACTIVE")
print("====================================================")
print(f"File Path: {os.path.abspath(db_path)}")
print(f"File Size: {os.path.getsize(db_path)} bytes")
print("----------------------------------------------------")
print(f"Total Tables: {len(tables)}")
print("----------------------------------------------------")

for t in tables:
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    count = cur.fetchone()[0]
    print(f"  • {t:<24} : {count} rows")

print("----------------------------------------------------")
# Check accounts
cur.execute("SELECT name, account_type, opening_balance FROM accounts;")
accounts = cur.fetchall()
if accounts:
    print("Accounts in DB:")
    for a in accounts:
        print(f"    - {a[0]} ({a[1]}): Opening Rs. {a[2]}")

# Check transactions
cur.execute("SELECT reference, transaction_type, amount, transaction_date FROM transactions ORDER BY id DESC LIMIT 5;")
txns = cur.fetchall()
if txns:
    print("\nRecent Transactions in DB:")
    for tx in txns:
        print(f"    - {tx[0]} | {tx[1].upper()} | Rs. {tx[2]} | {tx[3]}")

print("====================================================")
conn.close()
