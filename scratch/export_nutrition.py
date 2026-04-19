import sqlite3
import json
import os

DB_PATH = os.path.join(os.getcwd(), 'server', 'schedule.db')

def export_nutrition():
    if not os.path.exists(DB_PATH):
        print(json.dumps({"error": "Database not found at " + DB_PATH}))
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    try:
        rows = [dict(r) for r in cur.execute('SELECT * FROM nutrition_reports ORDER BY date DESC').fetchall()]
        print(json.dumps(rows, indent=2, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
    finally:
        conn.close()

if __name__ == "__main__":
    export_nutrition()
