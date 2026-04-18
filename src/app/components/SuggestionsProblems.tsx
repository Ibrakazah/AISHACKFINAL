import { useState, useRef, useEffect } from "react";
import { Send, FileText, Brain, Search, Database, FileCheck, CheckCircle2, Bot, User, Loader2, Link2 } from "lucide-react";

export function SuggestionsProblems() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: "Добро пожаловать в Базу нормативных актов AQBOBEK LYCEUM. Я загрузил в векторную RAG-базу Приказы №76, №110 и Приказ МОН РК №130. \n\nГотов проверять ваши документы на соответствие нормам или «переводить» сложные абзацы на понятный язык." }
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    setIsGenerating(true);

    // Симуляция RAG ответа
    setTimeout(() => {
      let response = "";
      const lower = userMsg.toLowerCase();

      if (lower.includes("130") && lower.includes("выжимк")) {
        response = `Анализ **Приказа МОН РК №130** (Правила аттестации педагогов).\nВот краткая выжимка (чек-лист) для рассылки учителям:\n\n1. ✅ **Сроки подачи:** Очередная аттестация проводится не реже 1 раза в 5 лет. Заявления подаются до 25 мая или до 25 ноября.\n2. ✅ **Портфолио:** Теперь загружается исключительно через электронную систему (НБДО).\n3. ✅ **Этапы:** Сначала Национальное квалификационное тестирование (НКТ), затем оценка портфолио.\n4. ✅ **Скидки:** Победители республиканских олимпиад (учителя или их ученики) освобождаются от НКТ.\n\n_Назначить задачу секретарю разослать это учителям в Telegram?_`;
      } else if (lower.includes("76") || lower.includes("санпин") || lower.includes("столов")) {
        response = `Согласно **Приказу МЗ РК №76** (Санитарно-эпидемиологические требования к школам):\n\n⚠️ Охват горячим питанием начальных классов должен быть не менее 100%. \n⚠️ Запрещено продавать в буфете газированные напитки, чипсы и кондитерские изделия с кремом.\n⚠️ Интервал между приемами пищи не должен превышать 3.5 - 4 часа.\n\nНаша текущая статистика по столовой находится в пределах нормы.`;
      } else if (lower.includes("задач") && lower.includes("учител")) {
         response = `Я сформировал задачу и отправил её Айгерим: "Разослать аттестационный чек-лист учителям до конца дня". \n\nСтатус задачи: **В ПРОЦЕССЕ**.`;
      } else {
        response = `Анализирую по базе...\n\nВ загруженных документах (Приказы №76, 110, 130) прямой регламентации по вашему запросу не найдено. Однако, согласно общешкольному уставу, вы можете издать внутреннее распоряжение. \n\nСформулировать для вас проект такого распоряжения?`;
      }

      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
      setIsGenerating(false);
    }, 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const documents = [
    { title: "Приказ МЗ РК №76", desc: "Санитарно-эпидемиологические требования", pages: 42, status: "indexed" },
    { title: "Приказ МЗ РК №110", desc: "Правила оказания мед. помощи", pages: 18, status: "indexed" },
    { title: "Приказ МОН РК №130", desc: "Об утверждении Правил аттестации", pages: 56, status: "indexed" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] animate-in fade-in duration-500">
      
      {/* Левая панель - Векторная база данных */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2rem] shadow-xl flex flex-col overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50">
          <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-lg flex items-center gap-3">
            <Database className="w-5 h-5 text-indigo-500" />
            Индексы RAG
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 font-medium">Контент документов загружен в векторное пространство для семантического поиска.</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {documents.map((doc, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl group transition-all hover:border-indigo-500/50 hover:shadow-md cursor-default">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" /> В базе
                </div>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{doc.title}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-tight mb-4">{doc.desc}</p>
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-800 pt-3">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{doc.pages} страниц / chunks</span>
                 <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>
          ))}

          <button className="w-full mt-4 py-4 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2">
             <Link2 className="w-4 h-4" /> Загрузить новый приказ (PDF)
          </button>
        </div>
      </div>

      {/* Правая панель - RAG Чат */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2rem] shadow-xl flex flex-col overflow-hidden relative transition-colors delay-100">
        
        {/* Хедер чата */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-lg">Бюрократический Переводчик</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">AQBOBEK AI • RAG Engine Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Область сообщений */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30 dark:bg-slate-950/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl shadow-sm border ${
                msg.role === 'assistant' 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent' 
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 mx-1">
                  {msg.role === 'assistant' ? 'AQBOBEK AI' : 'Директор'}
                </span>
                <div className={`px-6 py-4 rounded-[1.5rem] shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-tl-sm'
                }`}>
                  {/* Простой парсинг жирного текста для имитации markdown */}
                  {msg.text.split(/(\*\*.*?\*\*)/).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i} className={msg.role === 'user' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}>{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('_') && part.endsWith('_')) {
                       return <em key={i} className="opacity-80 block mt-2">{part}</em>;
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex items-start gap-4 animate-in fade-in zoom-in duration-300">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="px-6 py-4 rounded-[1.5rem] rounded-tl-sm bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                  <span className="text-xs font-bold text-gray-500 ml-2 uppercase tracking-widest">Анализ векторов...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода */}
        <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 z-10 relative">
          <div className="flex items-end gap-4 bg-gray-50 dark:bg-slate-950 p-2 rounded-3xl border border-gray-200 dark:border-slate-800 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-400 transition-all shadow-inner">
            <textarea
              className="flex-1 bg-transparent px-4 py-3 max-h-32 min-h-[50px] resize-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 custom-scrollbar"
              placeholder='Например: Сделай выжимку 130 приказа...'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="m-1 w-12 h-12 flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-300 dark:disabled:bg-slate-800 text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 ml-2">
             {["Сделай выжимку 130 приказа", "Что 76 приказ говорит о столовой?"].map((suggestion, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 text-[11px] font-bold uppercase tracking-wide rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-900"
                >
                  {suggestion}
                </button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
