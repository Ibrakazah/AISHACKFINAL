import { useState, useEffect, useRef } from "react";
import { MessageSquare, TrendingUp, Users, Clock, Trash2, QrCode as QrIcon, Loader2, Smartphone, RefreshCw } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is installed for toast notifications

interface ChatMessage {
  id: number;
  platform: string;
  sender: string;
  role: string | null;
  message: string;
  timestamp: string;
  is_important: boolean;
}

export function ChatSummary() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "important">("all");
  const [waStatus, setWaStatus] = useState<string>("checking");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const fetchData = async () => {
    try {
      const resMsg = await fetch("http://localhost:8000/api/messages");
      const msgData = await resMsg.json();
      setMessages(msgData);

      const resTasks = await fetch("http://localhost:8000/api/ai-tasks");
      const textData = await resTasks.json();
      setTasks(textData);
    } catch (e) { console.error(e); }
  };

  const fetchWaStatus = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/wa/status");
      const data = await res.json();
      setWaStatus(data.status);
    } catch {}
  };

  const fetchQr = async () => {
    if (loadingQr) return;
    setLoadingQr(true);
    try {
      const res = await fetch("http://localhost:8000/api/wa/qr");
      const data = await res.json();
      if (data.qr) setQrCode(data.qr);
    } catch { toast.error("Ошибка загрузки QR"); }
    finally { setLoadingQr(false); }
  };

  useEffect(() => {
    fetchData();
    fetchWaStatus();

    const interval = setInterval(() => {
      if (waStatus !== "connected") fetchWaStatus();
    }, 5000);
    
    const msgHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (e.type === "new-message") {
        setMessages(prev => [customEvent.detail, ...prev]);
        if (customEvent.detail.is_important) {
          toast.error(`Важное сообщение`, { description: customEvent.detail.message });
        }
      } else if (e.type === "ai-notification") {
        fetchData();
      }
    };

    window.addEventListener("new-message", msgHandler);
    window.addEventListener("ai-notification", msgHandler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("new-message", msgHandler);
      window.removeEventListener("ai-notification", msgHandler);
    };
  }, [waStatus]);

  useEffect(() => {
    if (waStatus === "qr_ready" || waStatus === "disconnected") {
      fetchQr();
    }
  }, [waStatus]);

  const stats = {
    total: messages.length,
    important: messages.filter((m) => m.is_important).length,
    teachers: new Set(messages.map((m) => m.sender)).size,
    today: messages.filter((m) => m.timestamp.includes(new Date().toISOString().split("T")[0])).length,
  };

  const handleClear = async () => {
    if (!confirm("Вы уверены, что хотите удалить все сообщения из сводки?")) return;
    try {
      await fetch("http://localhost:8000/api/messages", { method: "DELETE" });
      fetchData();
      toast.success("Все сообщения удалены");
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при удалении");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Сводка чата</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">Важные сообщения и уведомления из Telegram и WhatsApp</p>
        </div>
        <button 
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-rose-100 dark:border-rose-800/50 shadow-sm"
        >
          <Trash2 className="w-4 h-4" /> Очистить всё
        </button>
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
        <button 
          onClick={() => setFilter("all")}
          className={`px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95 ${
            filter === "all" 
              ? "bg-blue-600 text-white shadow-sm" 
              : "bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
        >
          Все сообщения
        </button>
        <button 
          onClick={() => setFilter("important")}
          className={`px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95 ${
            filter === "important" 
              ? "bg-blue-600 text-white shadow-sm" 
              : "bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
        >
          Только важные
        </button>
      </div>

      {/* WhatsApp Connection Card if disconnected */}
      {waStatus !== "connected" && waStatus !== "checking" && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
             <QrIcon className="w-64 h-64" />
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                Требуется подключение
              </div>
              <h2 className="text-3xl font-black leading-tight uppercase tracking-tighter">Подключите WhatsApp <br/> для работы ИИ</h2>
              <p className="text-blue-100 font-medium max-w-md">
                Отсканируйте QR-код своим смартфоном, чтобы бот мог анализировать сообщения и предлагать замены учителей.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-lg">1</div>
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Откройте WA</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-lg">2</div>
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Сканируйте</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-2xl flex flex-col items-center gap-4 min-w-[280px]">
              {loadingQr ? (
                <div className="w-48 h-48 flex items-center justify-center">
                   <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                </div>
              ) : qrCode ? (
                <>
                  <img src={qrCode} alt="WA QR" className="w-48 h-48 rounded-2xl" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Обновлено только что
                  </p>
                </>
              ) : (
                <div className="w-48 h-48 flex flex-col items-center justify-center text-center gap-3 text-gray-400">
                  <Smartphone className="w-10 h-10 opacity-20" />
                  <p className="text-[10px] font-bold px-4">Ожидание кода от сервера...</p>
                  <button onClick={fetchQr} className="text-xs text-blue-600 font-black uppercase">Повторить</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Список сообщений */}
      <div className="space-y-4">
        {messages.filter(m => filter === "all" || m.is_important).length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
            Сообщений пока нет. Подключите Telegram/WhatsApp бот.
          </div>
        ) : (
          messages
            .filter(msg => filter === "all" || msg.is_important)
            .map((msg) => (
            <div
              key={msg.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all ${
                msg.is_important ? "border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10" : "border-gray-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 border-2 border-white dark:border-slate-800 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm ${msg.platform === 'telegram' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-green-400 to-green-600'}`}>
                    {msg.sender.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white text-lg tracking-tight">{msg.sender}</h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest">
                       Источник: {msg.platform}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest">
                    {new Date(msg.timestamp).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                  </span>
                  {Boolean(msg.is_important) && (
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-red-200 dark:border-red-800">
                      Важное
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed font-medium text-[15px]">{msg.message}</p>
              
              {/* Показываем карточку задачи ИИ прямо в сообщении, если она есть и не решена */}
              {tasks.filter(t => t.status === "pending" && (t.original_message.includes(msg.message) || msg.message.includes(t.original_message))).map(task => (
                <div key={`inline-task-${task.id}`} className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                   <div>
                     <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        🤖 ИИ Предлагает действие
                     </p>
                     <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{task.proposed_action}</p>
                   </div>
                   <button 
                      onClick={async () => {
                        await fetch(`http://localhost:8000/api/ai-tasks/${task.id}/resolve`, {
                          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve" })
                        });
                        fetchData();
                      }}
                      className="whitespace-nowrap px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
                   >
                     Отправить: {task.assignee || 'Султану'}
                   </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
