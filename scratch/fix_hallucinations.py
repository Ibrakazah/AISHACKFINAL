
import os

filepath = r'c:\Users\User\Downloads\Учительский веб-сайт\server\main.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the history limit from 15 to 5 (around line 343)
content = content.replace('ORDER BY timestamp DESC LIMIT 15', 'ORDER BY timestamp DESC LIMIT 5')

start_marker = '    prompt = f"""'
end_marker = '    """\n    \n    is_important = False'

start_idx = content.find('    prompt = f"""\n    Ты - опытный ИИ-Директор школы')
if start_idx == -1:
    # Try the other version if I renamed it
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
    Ты - опытный ИИ-Директор школы. Проанализируй сообщение из чата.
    
    ГЛАВНОЕ ПРАВИЛО: НЕ ГАЛЛЮЦИНИРУЙ. История сообщений дана ТОЛЬКО для понимания контекста. 
    Если текущее сообщение - это новая жалоба или мусор, ЗАБУДЬ все, что было в истории. 
    НИКОГДА не предлагай старое действие (н-р ремонт стула), если оно не упоминается прямо сейчас.

    1. ВАЖНОСТЬ (is_important):
       - true: "Сломал ногу", "Болею", "Прорыв трубы", "Замена учителя", "Сломался стул".
       - false (мусор): "л", "о", ".", "ок", "тут типы говорят", реклама.

    2. ПЕРСОНАЛ (assignee/assigned_to):
       - Конырбаев Асет: ТОЛЬКО ОН чинит мебель, стулья, парты, двери.
       - Бекмуратов Серик: ТОЛЬКО ОН чинит сантехнику, воду, туалеты.
       - Завуч: Замена учителей.

    3. ТРЕБОВАНИЕ К ВЫХОДУ: 
       Если сообщение мусорное (короткое, опечатка) -> is_important ДОЛЖЕН быть false, а proposed_action ПУСТЫМ "".

    JSON:
    {{ 
      "role": "string", "is_important": boolean, "summary": "суть",
      "needs_clarification": boolean,
      "proposed_action": "действие ИЛИ пустая строка если сообщение не важное",
      "assignee": "ФИО или Завуч", "is_continuation": boolean,
      "nutrition": {{ "is_nutrition": boolean, "sick_count": 0 }},
      "incident": {{
         "is_incident": boolean, "location": "где",
         "assigned_to": "ФИО из техперсонала (например: Конырбаев Асет)"
      }}
    }}
    Отправитель: '{source_name}', Текст: '{text_body}', История: '{history_text}'
'''
new_prompt += '    """'

new_content = content[:start_idx] + new_prompt + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Successfully fixed hallucinations and refined history")
