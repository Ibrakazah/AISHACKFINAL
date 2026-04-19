import { type ParsedCommand } from "../utils/aiCommandParser";

/**
 * Глобальный сервис ИИ, переключенный на Groq (через локальный бэкенд).
 * Все вычисления перенесены с медленного Gemini на ультрабыстрый Groq LPU.
 */
export async function processAiCommand(input: string): Promise<ParsedCommand> {
  try {
    const response = await fetch("http://localhost:8000/api/ai/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: input }),
    });

    if (!response.ok) {
      throw new Error(`Groq Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Добавляем отметку о движке для UI
    return { ...data, engine: "AQBOBEK AI (Llama 3.3)" } as ParsedCommand;

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
export async function generateAiSchedule(matrix: any, lents: any): Promise<any> {
  try {
    const response = await fetch("http://localhost:8000/api/generate-fast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matrix, lents }),
    });

    if (!response.ok) throw new Error("Backend error");
    const data = await response.json();
    return data; 

    
    // Если бэкенд возвращает результат в summary или другом поле, пытаемся распарсить JSON
    if (typeof data.summary === 'string' && data.summary.includes('{')) {
      const jsonStr = data.summary.match(/\{[\s\S]*\}/)?.[0];
      if (jsonStr) return JSON.parse(jsonStr);
    }
    
    return data; // В надежде что бэкенд отдал готовый объект
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}
