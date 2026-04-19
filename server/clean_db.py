import sqlite3
import re

conn = sqlite3.connect('schedule.db')
cur = conn.cursor()
cur.execute("SELECT id, date FROM calendar_events")
for row in cur.fetchall():
    date_val = row[1]
    # Check if date is in YYYY-MM-DD
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_val):
        print(f"Deleting bad event {row[0]} with date {date_val}")
        cur.execute("DELETE FROM calendar_events WHERE id = ?", (row[0],))
conn.commit()
conn.close()
print("Clean done")
