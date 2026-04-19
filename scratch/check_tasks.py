
import sqlite3

def check_tasks():
    conn = sqlite3.connect(r'c:\Users\User\Downloads\Учительский веб-сайт\server\schedule.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, original_message, proposed_action, status FROM ai_tasks ORDER BY id DESC LIMIT 10")
    rows = cursor.fetchall()
    print("--- LAST 10 TASKS ---")
    for row in rows:
        print(f"ID: {row[0]}")
        print(f"Msg: {row[1]}")
        print(f"Action: {row[2]}")
        print(f"Status: {row[3]}")
        print("-" * 20)
    conn.close()

if __name__ == "__main__":
    check_tasks()
