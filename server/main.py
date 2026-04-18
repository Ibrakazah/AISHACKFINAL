from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import requests
import uvicorn
import sqlite3
import json
import os

app = FastAPI(title="School AI Backend (Groq Powered)")

# 🔐 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔑 API Config
API_KEY = os.environ.get("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE")  # Set GROQ_API_KEY env variable
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
DB_PATH = "server/schedule.db"

def query_db(query, args=(), one=False):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.commit()
    conn.close()
    return (rv[0] if rv else None) if one else rv

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        content = await file.read()
        headers = {"Authorization": f"Bearer {API_KEY}"}
        files = {"file": (file.filename or "audio.webm", content, file.content_type or "audio/webm")}
        data = {"model": "whisper-large-v3"}

        response = requests.post(WHISPER_URL, headers=headers, files=files, data=data)
        if response.status_code != 200:
            raise Exception(f"Groq Whisper Error: {response.text}")
        return {"success": True, "text": response.json().get("text", "").strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-command")
async def process_command(command: str = Body(..., embed=True)):
    """
    Глобальный обработчик команд директора через Groq.
    Полностью заменяет старую логику Gemini.
    """
    try:
        # Получаем данные из БД для осознанного ответа
        teachers = [r['name'] for r in query_db("SELECT name FROM teachers")]
        
        prompt = f"""
        Ты — интеллектуальный помощник системы управления школой. Твоя роль: парсить команды директора в JSON.
        
        КОНТЕКСТ ШКОЛЫ:
        Список учителей: {', '.join(teachers)}
        
        ПРАВИЛА НАВИГАЦИИ (route):
        - "/schedule" -> замена учителей, расписание, уроки, отсутствие.
        - "/reports" -> любые отчеты, статистика, посещаемость, питание.
        - "/chat-summary" -> сообщения, чаты, переписка.
        - "/suggestions" -> жалобы, идеи, предложения.
        - "/calendar" -> мероприятия, встречи в календаре.
        - "/" -> общие задачи.

        ОТВЕЧАЙ ТОЛЬКО ЧИСТЫМ JSON.
        
        JSON Format:
        {{
          "intent": "schedule" | "reports" | "chat" | "suggestions" | "calendar" | "tasks" | "unknown",
          "route": "string",
          "sectionName": "string (на русском)",
          "confidence": number,
          "summary": "краткое описание 1 предложение",
          "detailedUnderstanding": "подробный разбор задачи",
          "entities": {{
            "teacherName": "string",
            "reportNumber": "string",
            "className": "string",
            "topic": "string"
          }},
          "scheduleUpdate": {{
             "day": "string (Понедельник, Вторник, Среда, Четверг, Пятница)",
             "time_slot": "string (08:00-08:45, 09:00-09:45, 10:00-10:45, 11:00-11:45...)",
             "className": "string (например '8Б')",
             "newTeacher": "string (из списка выше)",
             "newSubject": "string"
          }},
          "teacherAbsence": {{
             "absentTeacher": "string (ФИО)",
             "replacementTeacher": "string (ФИО, опционально)",
             "day": "string (Напр. Вторник)"
          }},
          "originalText": "{command}",
          "actions": ["список действий"]
        }}
        """

        headers = {"Authorization": f"Bearer {API_KEY}"}
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0
        }
        
        response = requests.post(GROQ_URL, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"Groq API Error {response.status_code}: {response.text}")
            
        ai_text = response.json()['choices'][0]['message']['content']
        
        # Очистка и возврат
        json_str = ai_text.replace('```json', '').replace('```', '').strip()
        data = json.loads(json_str)
        
        return data
        
    except Exception as e:
        print(f"Error processing command in Groq: {e}")
        return {
            "intent": "unknown", 
            "route": "/", 
            "sectionName": "Главная", 
            "confidence": 0, 
            "summary": "Ошибка обработки через Groq",
            "detailedUnderstanding": str(e),
            "entities": {},
            "originalText": command,
            "actions": []
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
