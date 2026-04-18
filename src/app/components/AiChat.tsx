import { useState, useEffect, useRef } from "react";
import { Brain, CheckCircle, XCircle, Send, Loader2, MessageSquare, AlertTriangle } from "lucide-react";
import { processAiCommand } from "../services/gemini";
import { VoiceInput } from "./VoiceInput"; // Fixed import: it is a named export

interface AiTask {
  id: number;
  source: string;
  original_message: string;
  proposed_action: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export function AiChat() {
  const [tasks, setTasks] = useState<AiTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "ai", text: string}>>([
    { role: "ai", text: "Здравствуйте! Я школьный ИИ-ассистент Oqý. Готов помочь с расписанием, задачами и поручениями." }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/ai-tasks");
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      console.error("Failed to fetch ai tasks", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    const token = setInterval(fetchTasks, 10000); // Polling for new tasks

    // Listen to WebSocket broadcasts mapped in Layout
    const msgListener = (e: any) => {
      if (e.detail?.type === "NEW_AI_TASK") {
        fetchTasks();
      }
    };
    window.addEventListener("ai-notification", msgListener);
    
    return () => {
      clearInterval(token);
      window.removeEventListener("ai-notification", msgListener);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isProcessing]);

  const resolveTask = async (taskId: number, action: "approve" | "reject") => {
    try {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: action } : t));
      await fetch(`http://localhost:8000/api/ai-tasks/${taskId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      fetchTasks(); // Refresh
    } catch (e) {
      console.error(e);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: "pending" } : t)); // Revert on fail
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userText = inputText.trim();
    setInputText("");
    setChatMessages(prev => [...prev, { role: "user", text: userText }]);
    setIsProcessing(true);

    try {
      const result = await processAiCommand(userText);
      
      let aiResponse = "";
      if (result.intent === "send_message") {
         aiResponse = `✅ Направляю сообщение: "${result.summary}".\n\nИсполнители (сработало правило авто-маршрутизации).`;
      } else if (result.intent === "unknown") {
         aiResponse = `Не удалось понять вашу команду детально. Результат ИИ: ${result.summary}`;
      } else {
         aiResponse = `Я понял это как намерение: ${result.intent}. Открываю нужный модуль: ${result.sectionName}.\n[Быстрый ответ: ${result.summary}]`;
      }

      setChatMessages(prev => [...prev, { role: "ai", text: aiResponse }]);

    } catch (e) {
      setChatMessages(prev => [...prev, { role: "ai", text: "❌ Ошибка при обращении к серверу." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex gap-6 anim-fade-in p-2">
      {/* ЛЕВАЯ КОЛОНКА - ЗАДАЧИ */}
      <div className="flex-1 w-1/3 flex flex-col bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Очередь Задач ИИ</h2>
              <p className="text-sm text-blue-100 opacity-90">Предложенные решения по инцидентам</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-950/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-600" />
              <p>Синхронизация задач...</p>
            </div>
          ) : tasks.filter(t => t.status === 'pending').length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Все чисто!</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm">Искусственный интеллект обработал все входящие сообщения, пока задач нет.</p>
            </div>
          ) : (
            tasks.filter(t => t.status === 'pending').map((task) => (
              <div key={task.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-orange-200 dark:border-orange-900/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-400 to-red-500"></div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="w-4 h-4" /> ИИ Обнаружил проблему
                  </div>
                  <span className="text-xs text-gray-400 font-mono">#{task.id}</span>
                </div>
                
                <div className="mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Источник: {task.source}</p>
                  <p className="text-gray-900 dark:text-slate-200 italic border-l-2 border-gray-200 dark:border-slate-700 pl-3 mb-3">
                    "{task.original_message}"
                  </p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    Действие: {task.proposed_action}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => resolveTask(task.id, 'approve')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl flex justify-center items-center gap-2 text-sm font-bold transition-transform active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" /> Выполнить
                  </button>
                  <button 
                    onClick={() => resolveTask(task.id, 'reject')}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 py-2 px-4 rounded-xl flex justify-center items-center text-sm font-bold transition-transform active:scale-95"
                  >
                    <XCircle className="w-4 h-4" /> 
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ПРАВАЯ КОЛОНКА - ЧАТ С ГОЛОСОВЫМ УПРАВЛЕНИЕМ */}
      <div className="flex-1 w-2/3 flex flex-col bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Aqbobek ИИ Ассистент</h2>
              <p className="text-sm text-gray-500 font-medium">Llama 3.3 (70B) на базе Groq LPU</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-slate-950/20">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/20' 
                  : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-slate-200 rounded-tl-none shadow-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-tl-none p-4 flex gap-2 items-center shadow-sm">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                <span className="text-sm font-medium text-gray-500">Обработка...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
             <VoiceInput onTranscription={(voiceText) => {
                setInputText(voiceText);
                setTimeout(() => document.getElementById("ai-chat-send")?.click(), 100);
             }} />
          </div>
          <div className="flex gap-3 mt-4">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Напишите поручение или запрос..."
              className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white"
            />
            <button 
              id="ai-chat-send"
              onClick={handleSendMessage}
              disabled={isProcessing || !inputText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md text-white px-6 rounded-xl flex items-center justify-center font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
