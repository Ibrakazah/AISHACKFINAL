
import os

filepath = r'c:\Users\User\Downloads\Учительский веб-сайт\server\main.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '    prompt = f"""'
end_marker = '    """\n    \n    is_important = False'

# We need to find the block between start_marker (around line 365) and end_marker (around line 417)
# But since there might be multiple prompts, let's find the one containing 'ИИ-Директор'

start_idx = content.find('    prompt = f"""\n    Ты - умный ИИ-Директор школы')
if start_idx == -1:
    print("Start marker not found")
    exit(1)

end_idx = content.find('    """', start_idx + 10)
if end_idx == -1:
    print("End marker not found")
    exit(1)

# Include the closing quotes
end_idx += 7  # include the newline after """

new_prompt = r'''    prompt = f"""
    Ты - умный ИИ-Директор школы. Проанализируй сообщение из чата.
    Раздели смыслы:
    1. КРИТЕРИЙ ВАЖНОСТИ: Если сообщение < 3 букв, опечатка (н-р "л", "дд") или мусор -> is_important: false, proposed_action: "".
    2. РАСПРЕДЕЛЕНИЕ РАБОТ:
       - Сантехника/Вода -> Бекмуратов Серик (Слесарь).
       - Мебель/Двери/Стулья/Парты -> Конырбаев Асет (Разнорабочий).
       - Электрика -> Жумабаев Ерлан.
       - Уборка -> Касымова Гульнар.
    3. КОНТЕКСТ: Не предлагай действия из истории, если текущее сообщение не имеет смысла.
    
    JSON:
    {{ 
      "role": "string", "is_important": boolean, "summary": "суть",
      "needs_clarification": boolean, "clarification_text": "",
      "proposed_action": "действие (только для реальных проблем)",
      "assignee": "ФИО или отдел", "is_continuation": boolean,
      "nutrition": {{ "is_nutrition": boolean, "sick_count": 0, "competition_count": 0 }},
      "incident": {{
         "is_incident": boolean, "location": "где",
         "assigned_to": "ФИО из техперсонала (напр. Конырбаев Асет)"
      }}
    }}
    Отправитель: '{source_name}', Текст: '{text_body}', История: '{history_text}'
'''
new_prompt += '    """'

new_content = content[:start_idx] + new_prompt + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Successfully replaced prompt")
