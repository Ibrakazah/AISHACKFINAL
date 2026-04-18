import { useState } from "react";
import { MessageSquare, TrendingUp, Users, Clock } from "lucide-react";

interface ChatMessage {
  id: number;
  sender: string;
  role: string;
  message: string;
  timestamp: string;
  important: boolean;
}

export function ChatSummary() {
  const [messages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "Петрова М.И.",
      role: "Учитель математики",
      message: "Необходимо обсудить результаты контрольной работы в 9А классе. Средний балл ниже ожидаемого.",
      timestamp: "2026-04-17 09:15",
      important: true,
    },
    {
      id: 2,
      sender: "Сидоров П.К.",
      role: "Учитель истории",
      message: "Предлагаю организовать экскурсию в музей для старших классов в следующем месяце.",
      timestamp: "2026-04-17 10:30",
      important: false,
    },
    {
      id: 3,
      sender: "Иванова С.А.",
      role: "Завуч",
      message: "Срочно: нужно утвердить график проведения итоговых экзаменов до конца недели.",
      timestamp: "2026-04-17 11:45",
      important: true,
    },
    {
      id: 4,
      sender: "Морозова Е.Д.",
      role: "Учитель химии",
      message: "Получены новые реактивы для лаборатории. Нужна помощь с размещением и инвентаризацией.",
      timestamp: "2026-04-17 13:20",
      important: false,
    },
    {
      id: 5,
      sender: "Козлов В.Н.",
      role: "Учитель физики",
      message: "Три ученика из 11А класса показали отличные результаты на олимпиаде. Рекомендую поощрение.",
      timestamp: "2026-04-17 14:00",
      important: false,
    },
    {
      id: 6,
      sender: "Волкова Л.Р.",
      role: "Учитель английского",
      message: "Родители 7Б класса просят провести дополнительные консультации перед экзаменом.",
      timestamp: "2026-04-17 15:15",
      important: true,
    },
  ]);

  const stats = {
    total: messages.length,
    important: messages.filter((m) => m.important).length,
    teachers: new Set(messages.map((m) => m.sender)).size,
    today: messages.filter((m) => m.timestamp.startsWith("2026-04-17")).length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Сводка чата</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">Важные сообщения и уведомления от педагогического состава</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Всего сообщений</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Важные</p>
              <p className="text-3xl font-black text-red-600 dark:text-red-500 mt-1">{stats.important}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Участников</p>
              <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">{stats.teachers}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Сегодня</p>
              <p className="text-3xl font-black text-green-600 dark:text-green-400 mt-1">{stats.today}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-3">
        <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm uppercase tracking-widest text-xs transition-all hover:bg-blue-700 active:scale-95">
          Все сообщения
        </button>
        <button className="px-5 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 font-bold uppercase tracking-widest text-xs transition-all active:scale-95">
          Только важные
        </button>
        <button className="px-5 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 font-bold uppercase tracking-widest text-xs transition-all active:scale-95">
          Непрочитанные
        </button>
      </div>

      {/* Список сообщений */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all ${
              msg.important ? "border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10" : "border-gray-200 dark:border-slate-800"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white dark:border-slate-800 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
                  {msg.sender.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-lg tracking-tight">{msg.sender}</h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest">{msg.role}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest">{msg.timestamp}</span>
                {msg.important && (
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-red-200 dark:border-red-800">
                    Важное
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed font-medium text-[15px]">{msg.message}</p>
          </div>
        ))}
      </div>

      {/* Кнопка загрузки еще */}
      <div className="text-center pt-4">
        <button className="px-8 py-3 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 rounded-2xl flex items-center max-w-xs mx-auto justify-center hover:bg-gray-50 dark:hover:bg-slate-800 font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-sm">
          Загрузить еще сообщения
        </button>
      </div>
    </div>
  );
}
