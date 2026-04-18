import { type ParsedCommand } from "../utils/aiCommandParser";

/**
 * Глобальный сервис ИИ, переключенный на Groq (через локальный бэкенд).
 * Все вычисления перенесены с медленного Gemini на ультрабыстрый Groq LPU.
 */
export async function processAiCommand(input: string): Promise<ParsedCommand> {
  try {
    const response = await fetch("http://localhost:8000/process-command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command: input }),
    });

    if (!response.ok) {
      throw new Error(`Groq Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Добавляем отметку о движке для UI
    return { ...data, engine: "AQBOBEK AI (Groq LPU)" } as ParsedCommand;
  } catch (error) {
    console.error("Groq Service Error:", error);
    
    // Фолбек: если бэкенд упал, возвращаем пустую структуру
    return {
      intent: "unknown",
      route: "/",
      sectionName: "Главная",
      confidence: 0,
      summary: "Сервис Groq временно недоступен",
      detailedUnderstanding: String(error),
      entities: {},
      originalText: input,
      actions: [],
    } as ParsedCommand;
  }
}
