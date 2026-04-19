import sqlite3
import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')
conn = sqlite3.connect('server/schedule.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()
rows = [dict(r) for r in cur.execute("SELECT * FROM chat_messages ORDER BY timestamp DESC LIMIT 10").fetchall()]
print(json.dumps(rows, indent=2, ensure_ascii=False))
conn.close()
