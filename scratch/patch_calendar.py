import re

fp = r'c:\Users\User\Downloads\Учительский веб-сайт\server\main.py'
with open(fp, 'r', encoding='utf-8') as f:
    src = f.read()

# ── Step 1: Add calendar table to startup ───────────────────────────────────
TABLE_DDL = '''    cur.execute("""
        CREATE TABLE IF NOT EXISTS calendar_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            type TEXT DEFAULT 'other',
            date TEXT NOT NULL,
            time TEXT DEFAULT '09:00',
            duration TEXT DEFAULT '1 ch.',
            location TEXT DEFAULT '',
            participants TEXT DEFAULT '',
            description TEXT DEFAULT '',
            source TEXT DEFAULT 'manual',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)'''

if "calendar_events" in src:
    print("Step 1 SKIP: table already exists")
else:
    # insert before conn.commit() in startup_event
    target = "    conn.commit()\n    conn.close()\n\n# ==="
    replacement = TABLE_DDL + "\n    conn.commit()\n    conn.close()\n\n# ==="
    if target in src:
        src = src.replace(target, replacement, 1)
        print("Step 1 OK")
    else:
        # try windows line endings
        target2 = "    conn.commit()\r\n    conn.close()\r\n\r\n# ==="
        if target2 in src:
            src = src.replace(target2, TABLE_DDL + "\r\n    conn.commit()\r\n    conn.close()\r\n\r\n# ===", 1)
            print("Step 1 OK (CRLF)")
        else:
            print("Step 1 FAIL - could not find anchor")

# ── Step 2: Add API endpoints ────────────────────────────────────────────────
CALENDAR_ENDPOINTS = '''
# === CALENDAR API ===

@app.get("/api/calendar")
async def get_calendar():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id,title,type,date,time,duration,location,participants,description,source,created_at FROM calendar_events ORDER BY date,time")
    rows = cur.fetchall()
    conn.close()
    keys = ["id","title","type","date","time","duration","location","participants","description","source","created_at"]
    return [dict(zip(keys,r)) for r in rows]

@app.post("/api/calendar")
async def create_calendar_event(request: Request):
    data = await request.json()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO calendar_events (title,type,date,time,duration,location,participants,description,source) VALUES (?,?,?,?,?,?,?,?,?)",
        (data.get("title","Без названия"), data.get("type","other"), data.get("date",""),
         data.get("time","09:00"), data.get("duration","1 ч."), data.get("location",""),
         data.get("participants",""), data.get("description",""), data.get("source","manual"))
    )
    eid = cur.lastrowid
    conn.commit(); conn.close()
    await manager.broadcast({"type":"CALENDAR_UPDATE"})
    return {"success": True, "id": eid}

@app.delete("/api/calendar/{event_id}")
async def delete_calendar_event(event_id: int):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM calendar_events WHERE id=?", (event_id,))
    conn.commit(); conn.close()
    await manager.broadcast({"type":"CALENDAR_UPDATE"})
    return {"success": True}

'''

if '"/api/calendar"' in src:
    print("Step 2 SKIP: endpoints already present")
else:
    anchor = '@app.post("/api/ai/command")'
    if anchor in src:
        src = src.replace(anchor, CALENDAR_ENDPOINTS + anchor, 1)
        print("Step 2 OK")
    else:
        print("Step 2 FAIL - anchor not found")

with open(fp, 'w', encoding='utf-8') as f:
    f.write(src)
print("Done!")
