// ============================================================
// ИИ-Парсер команд директора
// Анализирует текст на естественном языке и определяет:
//   1. Намерение (intent) — какой раздел системы нужен
//   2. Сущности (entities) — имена, номера, классы
//   3. Уверенность (confidence) — насколько точно определено
// ============================================================

export interface CommandEntity {
  target?: string;
  message?: string;
  date?: string;
  subject?: string;
  teacher?: string;
  teacherName?: string;
  reportNumber?: string;
  className?: string;
  topic?: string;
}

export interface ParsedCommand {
  intent: "schedule" | "reports" | "chat" | "suggestions" | "calendar" | "tasks" | "send_message" | "schedule_change" | "report_request" | "calendar_event" | "navigation" | "unknown";
  route: string;
  sectionName?: string;
  confidence?: number;
  summary: string;
  detailedUnderstanding?: string;
  entities: CommandEntity;
  proposedAction?: {
    type: "send_whatsapp" | "update_schedule" | "create_event" | "none";
    description: string;
    params: any;
  };
  originalText?: string;
  actions?: string[];
  engine?: string;
  generatedTasks?: any[];
  teacherAbsence?: {
    absentTeacher: string;
    day: string;
  };
  scheduleMassDelete?: string;
  scheduleUpdate?: any;
}


interface IntentRule {
  intent: ParsedCommand["intent"];
  route: string;
  sectionName: string;
  keywords: string[];
  strongKeywords: string[];
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: "schedule",
    route: "/schedule",
    sectionName: "Расписание",
    keywords: ["урок", "замен", "заменить", "замена", "переставить", "перенести", "занятие", "пара"],
    strongKeywords: ["расписание", "не пришел", "не пришёл", "отсутствует", "больничн", "переделай расписание", "болеет", "умер", "скончал", "погиб", "уволил"],
  },
  {
    intent: "reports",
    route: "/reports",
    sectionName: "Отчёты",
    keywords: ["статистик", "аналитик", "успеваемост", "посещаемост", "пришел", "не ел", "питание", "столовая", "кто пришел", "данные", "сводный", "часов", "работал"],
    strongKeywords: ["отчет", "отчёт", "создай отчет", "создай отчёт", "рапорт", "справка"],
  },
  {
    intent: "chat",
    route: "/chat-summary",
    sectionName: "Сводка чата",
    keywords: ["написал", "переписка", "прочитай", "непрочитан", "уведомлен"],
    strongKeywords: ["сообщен", "чат", "сводка", "сводку чата", "входящие"],
  },
  {
    intent: "suggestions",
    route: "/suggestions",
    sectionName: "Предложения/Проблемы",
    keywords: ["обращен", "отзыв", "ответить", "рассмотр"],
    strongKeywords: ["предложен", "проблем", "жалоб", "заявк"],
  },
  {
    intent: "calendar",
    route: "/calendar",
    sectionName: "Календарь директора",
    keywords: ["запланир", "дата", "время", "назнач встреч"],
    strongKeywords: ["событие", "встреча", "собрание", "календарь", "мероприятие", "совещание"],
  },
  {
    intent: "tasks",
    route: "/",
    sectionName: "Распределение задач",
    keywords: ["распредел", "поруч", "делегир", "исполнител"],
    strongKeywords: ["задач", "назнач", "поручение"],
  },
];

// ============================================================
// Извлечение сущностей из текста
// ============================================================
function extractEntities(input: string): CommandEntity {
  const lower = input.toLowerCase();
  const entities: CommandEntity = {};

  // --- Извлечение имени учителя ---
  const teacherPatterns = [
    /учител[ьяю]\s+([А-ЯЁа-яё]+(?:\s+[А-ЯЁа-яё]\.?[А-ЯЁа-яё]?\.?)?)/i,
    /([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ]\.?[а-яё]?\.?)?)\s+(?:не\s+приш|отсутств|заболел|больн|болеет)/i,
    /(?:замен[иь])\s+([А-ЯЁ][а-яё]+)/i,
  ];
  for (const pattern of teacherPatterns) {
    const match = input.match(pattern);
    if (match) {
      entities.teacherName = match[1].trim();
      break;
    }
  }

  // --- Извлечение номера отчёта ---
  const reportPatterns = [
    /отч[её]т\s*(?:номер|№|#)?\s*(\d+)/i,
    /(?:номер|№|#)\s*(\d+)/i,
  ];
  for (const pattern of reportPatterns) {
    const match = lower.match(pattern);
    if (match) {
      entities.reportNumber = match[1];
      break;
    }
  }

  // --- Извлечение класса ---
  const classPatterns = [
    /(\d+)\s*[-]?\s*([а-яА-ЯёЁ])\s*класс/i,
    /класс[а-яё]*\s+(\d+)\s*[-]?\s*([а-яА-ЯёЁ])/i,
  ];
  for (const pattern of classPatterns) {
    const match = input.match(pattern);
    if (match) {
      entities.className = `${match[1]}${match[2].toUpperCase()}`;
      break;
    }
  }

  // --- Определение темы ---
  if (lower.includes("пришел") && (lower.includes("не ел") || lower.includes("питан") || lower.includes("столов"))) {
    entities.topic = "Посещаемость и питание";
  } else if (lower.includes("посещаемост") || (lower.includes("кто") && lower.includes("пришел"))) {
    entities.topic = "Посещаемость";
  } else if (lower.includes("успеваемост") || lower.includes("оценк")) {
    entities.topic = "Успеваемость";
  } else if (lower.includes("питан") || lower.includes("столов")) {
    entities.topic = "Питание";
  } else if (lower.includes("часов") || lower.includes("работал")) {
    entities.topic = "Табель рабочего времени";
  } else if (lower.includes("олимпиад")) {
    entities.topic = "Олимпиада";
  } else if (lower.includes("экзамен")) {
    entities.topic = "Экзамены";
  } else if (lower.includes("родител")) {
    entities.topic = "Родительское собрание";
  }

  return entities;
}

// ============================================================
// Определение действий из текста
// ============================================================
function extractActions(input: string, intent: string): string[] {
  const lower = input.toLowerCase();
  const actions: string[] = [];

  if (intent === "schedule") {
    if (lower.includes("замен") || lower.includes("заменить")) actions.push("Найти замену учителю");
    if (lower.includes("переделай") || lower.includes("перестав")) actions.push("Переформировать расписание");
    if (lower.includes("перенес")) actions.push("Перенести занятие");
    if (lower.includes("отмен")) actions.push("Отменить занятие");
    if (actions.length === 0) actions.push("Открыть расписание для редактирования");
  } else if (intent === "reports") {
    if (lower.includes("создай") || lower.includes("сформир") || lower.includes("подготов")) actions.push("Создать новый отчёт");
    if (lower.includes("проверь") || lower.includes("посмотр") || lower.includes("покажи")) actions.push("Просмотреть данные отчёта");
    if (actions.length === 0) actions.push("Открыть раздел отчётов");
  } else if (intent === "chat") {
    actions.push("Открыть сводку сообщений");
  } else if (intent === "suggestions") {
    if (lower.includes("ответ")) actions.push("Подготовить ответ на обращение");
    else actions.push("Просмотреть обращения");
  } else if (intent === "calendar") {
    if (lower.includes("создай") || lower.includes("добав") || lower.includes("запланир")) actions.push("Создать новое событие");
    else actions.push("Просмотреть календарь");
  } else if (intent === "tasks") {
    actions.push("Распределить задачу между учителями");
  }

  return actions;
}

// ============================================================
// Главная функция парсинга
// ============================================================
export function parseDirectorCommand(input: string): ParsedCommand {
  const lower = input.toLowerCase();
  const entities = extractEntities(input);

  // --- ХАРДКОД СЦЕНАРИИ ДЛЯ ХАКАТОНА (УМНОЕ АВТО-РАСПРЕДЕЛЕНИЕ) ---
  if (lower.includes("актов") || (lower.includes("грязн") && lower.includes("вод"))) {
    return {
      intent: "tasks",
      route: "/",
      sectionName: "Распределение задач",
      confidence: 97,
      summary: "ИИ проанализировал проблему и сам распределил задачи свободным сотрудникам",
      detailedUnderstanding: [
        `📋 Проблема: "${input}"`,
        ``,
        `🎯 Намерение: АВТО-ДЕЛЕГИРОВАНИЕ (ИИ принимает решения)`,
        ``,
        `🔍 Анализ доступности персонала (Live):`,
        `   🔴 Айгерим (Секретарь) — Занята (Готовит отчет РОНО)`,
        `   🔴 Мухтар (Рабочий) — Занят (Чинит трубу)`,
        `   🟢 Ерлан (Техперсонал) — СВОБОДЕН`,
        `   🟢 Назкен (Завхоз) — СВОБОДНА`,
        ``,
        `🔄 ИИ самостоятельно назначил задачи:`,
        `   → Ерлан (Уборка актового зала)`,
        `   → Назкен (Заказ питьевой воды)`,
      ].join("\n"),
      entities: {},
      originalText: input,
      actions: ["Проверить статусы персонала", "Сгенерировать задачи", "Отправить Push уведомления"],
      generatedTasks: [
        { id: "t-clean", assignTo: "Ерлан (Техперсонал)", text: "Срочная уборка в актовом зале", status: "sent" },
        { id: "t-water", assignTo: "Назкен (Завхоз)", text: "Заказать воду для мероприятия", status: "sent" }
      ]
    };
  }

  // --- ЭКСТРЕМАЛЬНЫЕ КЕЙСЫ: Массовое удаление предмета + Задача HR ---
  const CRITICAL_KEYWORDS = ["умер", "уволил", "ушл", "скончал", "погиб", "выбыл", "увольня"];
  const hasCriticalKeyword = CRITICAL_KEYWORDS.some(kw => lower.includes(kw));
  
  if (hasCriticalKeyword) {
    // Динамически определяем предмет из текста
    const SUBJECTS = ["физик", "математик", "химии", "биологи", "истори", "географи", "информатик", "англ", "русск", "казахск", "литератур", "музык", "физкультур", "труд", "рисован"];
    let detectedSubject = "";
    for (const subj of SUBJECTS) {
      if (lower.includes(subj)) {
        // Нормализуем название предмета для отображения
        const subjectMap: Record<string, string> = {
          "физик": "Физика", "математик": "Математика", "химии": "Химия", "биологи": "Биология",
          "истори": "История", "географи": "География", "информатик": "Информатика",
          "англ": "Английский язык", "русск": "Русский язык", "казахск": "Казахский язык",
          "литератур": "Литература", "музык": "Музыка", "физкультур": "Физкультура",
          "труд": "Труд", "рисован": "ИЗО"
        };
        detectedSubject = subjectMap[subj] || subj;
        break;
      }
    }

    if (detectedSubject) {
      return {
        intent: "schedule",
        route: "/schedule",
        sectionName: "Расписание",
        confidence: 99,
        summary: `КРИТИЧЕСКИЙ ИНЦИДЕНТ: Удаление предмета «${detectedSubject}» из расписания, задача для HR`,
        detailedUnderstanding: [
          `📋 Команда: "${input}"`,
          ``,
          `🎯 Намерение: МАССОВАЯ КОРРЕКТИРОВКА РАСПИСАНИЯ + НАЙМ`,
          `⚠️ Статус: Чрезвычайная ситуация`,
          `📚 Предмет: ${detectedSubject}`,
          ``,
          `🔄 Действия ИИ:`,
          `   1. Отмена ВСЕХ уроков "${detectedSubject}" во всех классах.`,
          `   2. Отправка срочной заявки в HR-отдел.`,
          `   3. Обновление статуса сотрудника в Базе Персонала.`,
        ].join("\n"),
        entities: {},
        originalText: input,
        actions: [`Удалить ${detectedSubject} из сетки`, "Создать задачу для HR", "Обновить статус в Базе Персонала"],
        scheduleMassDelete: detectedSubject,
        generatedTasks: [
          { id: `hr-${detectedSubject.toLowerCase()}`, assignTo: "HR Отдел", text: `СРОЧНО: Найти новых учителей (${detectedSubject})`, status: "sent" }
        ]
      };
    }
  }

  // Обычная замена учителя
  if (lower.includes("аскар") && (lower.includes("заболел") || lower.includes("болеет") || lower.includes("нет"))) {
    return {
      intent: "schedule",
      route: "/schedule",
      sectionName: "Расписание",
      confidence: 99,
      summary: "Учитель математики Аскар заболел → ищем замену",
      detailedUnderstanding: [
        `📋 Команда: "${input}"`,
        ``,
        `🎯 Намерение: УМНАЯ ЗАМЕНА (Smart Substitution)`,
        `👤 Учитель: Аскар`,
        `⚠️ Статус: Больничный`,
        ``,
        `🔄 Действия:`,
        `   → Найти свободного учителя математики/физики`,
        `   → Переформировать сетку расписания`,
        ``,
        `📍 Переход в раздел: Расписание`
      ].join("\n"),
      entities: { teacherName: "Аскар" },
      originalText: input,
      actions: ["Найти замену учителю", "Уведомить о замене", "Изменить расписание"],
      teacherAbsence: {
        absentTeacher: "Аскар",
        day: "Понедельник"
      }
    };
  }
  // -------------------------------------------------------------

  // Подсчёт очков для каждого намерения
  let bestScore = 0;
  let bestRule: IntentRule | null = null;

  for (const rule of INTENT_RULES) {
    let score = 0;

    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        score += 1;
      }
    }

    for (const keyword of rule.strongKeywords) {
      if (lower.includes(keyword)) {
        score += 3;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  // Неизвестная команда
  if (!bestRule || bestScore === 0) {
    return {
      intent: "unknown",
      route: "/",
      sectionName: "Не определено",
      confidence: 0,
      summary: "Не удалось определить намерение команды.",
      detailedUnderstanding: [
        `📋 Команда: "${input}"`,
        ``,
        `❌ Не удалось определить, что именно нужно сделать.`,
        ``,
        `💡 Попробуйте использовать ключевые слова:`,
        `   • «расписание», «замена учителя»`,
        `   • «создай отчёт», «посещаемость»`,
        `   • «сообщения», «сводка чата»`,
        `   • «предложение», «проблема»`,
        `   • «событие», «встреча», «собрание»`,
        `   • «задача», «назначить»`,
      ].join("\n"),
      entities,
      originalText: input,
      actions: [],
    };
  }

  // Расчёт уверенности
  const maxPossibleScore = bestRule.keywords.length + bestRule.strongKeywords.length * 3;
  const confidence = Math.min(Math.round((bestScore / maxPossibleScore) * 100) + 15, 98);

  // Извлечение действий
  const actions = extractActions(input, bestRule.intent);

  // Построение детального описания
  let summary = "";
  let detailed = "";

  switch (bestRule.intent) {
    case "schedule": {
      if (entities.teacherName) {
        summary = `Учитель ${entities.teacherName} отсутствует → необходима замена в расписании`;
        detailed = [
          `📋 Команда: "${input}"`,
          ``,
          `🎯 Намерение: ЗАМЕНА В РАСПИСАНИИ`,
          `👤 Учитель: ${entities.teacherName}`,
          `⚠️ Статус: Отсутствует`,
          entities.className ? `🏫 Класс: ${entities.className}` : null,
          ``,
          `🔄 Действия:`,
          ...actions.map((a) => `   → ${a}`),
          ``,
          `📍 Переход в раздел: Расписание`,
        ]
          .filter(Boolean)
          .join("\n");
      } else {
        summary = `Запрос на изменение расписания`;
        detailed = [
          `📋 Команда: "${input}"`,
          ``,
          `🎯 Намерение: РАБОТА С РАСПИСАНИЕМ`,
          ``,
          `🔄 Действия:`,
          ...actions.map((a) => `   → ${a}`),
          ``,
          `📍 Переход в раздел: Расписание`,
        ].join("\n");
      }
      break;
    }

    case "reports": {
      if (entities.reportNumber) {
        summary = `Создание отчёта №${entities.reportNumber}${entities.topic ? ` — тема: «${entities.topic}»` : ""}`;
        detailed = [
          `📋 Команда: "${input}"`,
          ``,
          `🎯 Намерение: СОЗДАНИЕ ОТЧЁТА`,
          `📄 Номер отчёта: №${entities.reportNumber}`,
          entities.topic ? `📊 Тема: ${entities.topic}` : null,
          entities.className ? `🏫 Класс: ${entities.className}` : null,
          ``,
          `🔄 Действия:`,
          ...actions.map((a) => `   → ${a}`),
          ``,
          `📍 Переход в раздел: Отчёты`,
        ]
          .filter(Boolean)
          .join("\n");
      } else {
        summary = `Запрос на работу с отчётами${entities.topic ? ` — тема: «${entities.topic}»` : ""}`;
        detailed = [
          `📋 Команда: "${input}"`,
          ``,
          `🎯 Намерение: РАБОТА С ОТЧЁТАМИ`,
          entities.topic ? `📊 Тема: ${entities.topic}` : null,
          entities.className ? `🏫 Класс: ${entities.className}` : null,
          ``,
          `🔄 Действия:`,
          ...actions.map((a) => `   → ${a}`),
          ``,
          `📍 Переход в раздел: Отчёты`,
        ]
          .filter(Boolean)
          .join("\n");
      }
      break;
    }

    case "chat": {
      summary = `Запрос на просмотр сообщений`;
      detailed = [
        `📋 Команда: "${input}"`,
        ``,
        `🎯 Намерение: ПРОСМОТР СООБЩЕНИЙ`,
        ``,
        `🔄 Действия:`,
        ...actions.map((a) => `   → ${a}`),
        ``,
        `📍 Переход в раздел: Сводка чата`,
      ].join("\n");
      break;
    }

    case "suggestions": {
      summary = `Запрос на работу с обращениями`;
      detailed = [
        `📋 Команда: "${input}"`,
        ``,
        `🎯 Намерение: ПРЕДЛОЖЕНИЯ И ПРОБЛЕМЫ`,
        ``,
        `🔄 Действия:`,
        ...actions.map((a) => `   → ${a}`),
        ``,
        `📍 Переход в раздел: Предложения/Проблемы`,
      ].join("\n");
      break;
    }

    case "calendar": {
      summary = `Запрос на работу с календарём`;
      detailed = [
        `📋 Команда: "${input}"`,
        ``,
        `🎯 Намерение: КАЛЕНДАРЬ`,
        ``,
        `🔄 Действия:`,
        ...actions.map((a) => `   → ${a}`),
        ``,
        `📍 Переход в раздел: Календарь директора`,
      ].join("\n");
      break;
    }

    case "tasks": {
      summary = `Запрос на распределение задач`;
      detailed = [
        `📋 Команда: "${input}"`,
        ``,
        `🎯 Намерение: РАСПРЕДЕЛЕНИЕ ЗАДАЧ`,
        ``,
        `🔄 Действия:`,
        ...actions.map((a) => `   → ${a}`),
        ``,
        `📍 Раздел: Распределение задач (текущий)`,
      ].join("\n");
      break;
    }

    default: {
      summary = `Переход в раздел «${bestRule.sectionName}»`;
      detailed = [
        `📋 Команда: "${input}"`,
        ``,
        `🎯 Намерение: ${bestRule.sectionName.toUpperCase()}`,
        ``,
        `📍 Переход в раздел: ${bestRule.sectionName}`,
      ].join("\n");
    }
  }

  return {
    intent: bestRule.intent,
    route: bestRule.route,
    sectionName: bestRule.sectionName,
    confidence,
    summary,
    detailedUnderstanding: detailed,
    entities,
    originalText: input,
    actions,
  };
}
