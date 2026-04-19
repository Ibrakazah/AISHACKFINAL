
import os

filepath = r'c:\Users\User\Downloads\Учительский веб-сайт\server\main.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '    prompt = f"""'
end_marker = '    """\n    \n    is_important = False'

start_idx = content.find('    prompt = f"""\n    Ты - умный ИИ-Директор школы')
if start_idx == -1:
    print("Start marker not found")
    exit(1)

end_idx = content.find('    """', start_idx + 10)
if end_idx == -1:
    print("End marker not found")
    exit(1)

end_idx += 7 

new_prompt = r'''    prompt = f"""
    Ты - опытный ИИ-Директор школы. Проанализируй сообщение из чата и выдели задачи.
    
    1. КРИТЕРИИ ВАЖНОСТИ (is_important):
       - ВАЖНО (true): Травмы ("сломал ногу", "кровь"), Болезни ("температура", "плохо"), Замены учителей ("не пришел", "болеет"), Поломки ("стул", "свет", "дверь"), Отчеты.
       - НЕ ВАЖНО (false): Опечатки ("л", "фф"), приветствия, мусор, длинные рекламные рассылки.
    
    2. РАСПРЕДЕЛЕНИЕ ТЕХПЕРСОНАЛА (assignee):
       - Бекмуратов Серик (Слесарь-сантехник): Только вода, краны, туалеты, трубы.
       - Конырбаев Асет (Разнорабочий): Мебель, стулья, парты, двери, мелкий ремонт.
       - Жумабаев Ерлан (Электрик): Свет, розетки, электроника.
       - Касымова Гульнар (Старшая уборщица): Грязь, разлитая вода, уборка.
       - Завуч: Если нужно найти замену учителю или скорректировать расписание.

    3. ПРАВИЛО МУСОРА: Если сообщение меньше 4 букв или это бессмысленный набор символов -> всегда is_important: false, summary: "", proposed_action: "".

    JSON:
    {{ 
      "role": "Учитель/Завуч/Родитель", 
      "is_important": boolean, 
      "summary": "Краткая суть одной фразой",
      "needs_clarification": boolean,
      "proposed_action": "Конкретная команда в директивном стиле (н-р: 'Асет должен починить стул')",
      "assignee": "ФИО или 'Завуч'",
      "is_continuation": boolean,
      "nutrition": {{ "is_nutrition": boolean, "sick_count": 0 }},
      "incident": {{
         "is_incident": boolean,
         "location": "кабинет или место",
         "assigned_to": "ФИО из техперсонала (н-р: Конырбаев Асет)"
      }}
    }}
    Отправитель: '{source_name}', Текст: '{text_body}', История последних сообщений: '{history_text}'
'''
new_prompt += '    """'

new_content = content[:start_idx] + new_prompt + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Successfully updated prompt with high-intelligence logic")
