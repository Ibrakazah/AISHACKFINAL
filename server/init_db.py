import sqlite3
import os

DB_PATH = "schedule.db"

def init_db():
    os.makedirs("server", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Таблица предметов
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    )
    ''')

    # 2. Таблица учителей
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    )
    ''')

    # 3. Таблица кабинетов
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    )
    ''')
    
    # 4. Таблица классов (Параллели)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grade TEXT NOT NULL,
        parallel TEXT NOT NULL,
        UNIQUE(grade, parallel)
    )
    ''')

    # 5. Основная таблица Расписания
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER,
        day_of_week TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        subject_id INTEGER,
        teacher_id INTEGER,
        room_id INTEGER,
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id),
        FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
    ''')
    
    # 6. Таблица сообщений чата (TG / WhatsApp)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        sender TEXT NOT NULL,
        role TEXT,
        message TEXT NOT NULL,
        is_important BOOLEAN DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # --- БАЗОВОЕ ЗАПОЛНЕНИЕ ДАННЫМИ ИЗ ВАШЕГО PDF ---
    
    subjects = [
        "Орыс тілі", "Химия", "Алгебра", "Қазақ тілі", "Физика", 
        "Дене шынықтыру", "География", "Қазақстан тарихы", "Биология", 
        "Ағылшын тілі", "Көркем еңбек", "Информатика", "Тәрбие сағаты", "Үй жұмысы"
    ]
    for sub in subjects:
        cursor.execute("INSERT OR IGNORE INTO subjects (name) VALUES (?)", (sub,))
        
    teachers = [
        "Гореева А.М.", "Матигулова Г.Б.", "Аманғазы С.", "Назаров Д.С.", 
        "Арыстанғалиқызы А", "Байдирахманова Б.С.", "Жоламан М.", "Даулетбаева С.С.", 
        "Утенова К.К.", "Жомартова А.Қ.", "Бактыгулов А.И.", "Сунгариева А.Б.", 
        "Сулейманов Б.", "Қарабай А.Н.", "Аділов Т.Б.", "Жадырасын Е.", "Касимов Е.К.", 
        "Иван О.А.", "Қангерей Қ.", "Қайырқұлов Н.А.", "Караева А.Б.", "Таңатар М.М.", 
        "Қайыржанова А.", "Ақырап А.", "Қойшан Ы.А.", "Курмангалиев Е.К", "Сапар Е.", 
        "Ахметова И.Е.", "Саламатұлы А.", "Шарафадинова А.М.", "Куратор"
    ]
    for tea in teachers:
        cursor.execute("INSERT OR IGNORE INTO teachers (name) VALUES (?)", (tea,))
        
    rooms = [
        "303", "302", "211", "201", "110", "311", "109", "204", "305", "301", 
        "209", "Спортзал", "үлкен спортзал", "309", "304", "310", "203", "210", 
        "307", "104", "107", "206", "Свой каб."
    ]
    for r in rooms:
        cursor.execute("INSERT OR IGNORE INTO rooms (name) VALUES (?)", (r,))
        
    grades = ["7", "8", "9", "10", "11"]
    parallels = ["А", "Б", "В", "Г", "Д"]
    for g in grades:
        for p in parallels:
            cursor.execute("INSERT OR IGNORE INTO classes (grade, parallel) VALUES (?, ?)", (g, p))

    conn.commit()
    conn.close()
    print(f"Success! SQLite database created at: {DB_PATH}")
    print("Populated subjects, teachers, rooms, and classes!")

if __name__ == "__main__":
    init_db()
