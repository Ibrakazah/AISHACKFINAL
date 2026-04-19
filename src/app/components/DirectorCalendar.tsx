import { useState, useEffect, useRef } from "react";
import {
  Calendar, Clock, MapPin, Users, Plus, Trash2,
  Video, Sparkles, X, ChevronLeft, ChevronRight,
  BrainCircuit, CalendarDays, CheckCircle2
} from "lucide-react";

interface CalendarEvent {
  id: number;
  title: string;
  type: "meeting" | "event" | "inspection" | "task" | "other";
  date: string;
  time: string;
  duration: string;
  location: string;
  participants: string;
  description: string;
  source: "manual" | "whatsapp_ai" | "chatbot";
  created_at: string;
}

const API = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws";

const TYPE_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  meeting:    { label: "Встреча",      color: "text-blue-700 dark:text-blue-300",   bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",     dot: "bg-blue-500" },
  event:      { label: "Мероприятие",  color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
  inspection: { label: "Проверка",     color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800", dot: "bg-orange-500" },
  task:       { label: "Задача",       color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  other:      { label: "Другое",       color: "text-gray-700 dark:text-gray-300",   bg: "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700",     dot: "bg-gray-400" },
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Mon-first offset
  const offset = (firstDay + 6) % 7;
  return { offset, daysInMonth };
}

export function DirectorCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const wsRef = useRef<WebSocket | null>(null);

  // Form state
  const emptyForm = {
    title: "", type: "meeting" as CalendarEvent["type"],
    date: todayISO(), time: "09:00", duration: "1 ч.",
    location: "", participants: "", description: ""
  };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    try {
      const r = await fetch(`${API}/api/calendar`);
      if (r.ok) setEvents(await r.json());
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    // WebSocket for real-time calendar updates (when AI adds an event)
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "CALENDAR_UPDATE") fetchEvents();
      } catch { }
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "manual" })
      });
      setShowForm(false);
      setForm(emptyForm);
      fetchEvents();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить событие?")) return;
    await fetch(`${API}/api/calendar/${id}`, { method: "DELETE" });
    fetchEvents();
  };

  // Derived
  const today = todayISO();
  const todayEvents = events.filter(e => e.date === today);
  const selectedEvents = events.filter(e => e.date === selectedDate);
  const eventDates = new Set(events.map(e => e.date));
  const aiEvents = events.filter(e => e.source === "whatsapp_ai" || e.source === "chatbot");

  // Month navigation
  const { offset, daysInMonth } = getMonthDays(viewMonth.year, viewMonth.month);
  const monthName = new Date(viewMonth.year, viewMonth.month, 1)
    .toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  const prevMonth = () => setViewMonth(v =>
    v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }
  );
  const nextMonth = () => setViewMonth(v =>
    v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Календарь директора
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">
            Встречи, задачи и события — в том числе от ИИ-чатбота
          </p>
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm, date: selectedDate }); setShowForm(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-blue-500/25 font-black uppercase tracking-widest text-xs"
        >
          <Plus className="w-4 h-4" /> Новое событие
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Сегодня",   value: todayEvents.length, icon: CalendarDays, color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Всего",     value: events.length,      icon: Calendar,     color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
          { label: "От ИИ",     value: aiEvents.length,    icon: BrainCircuit, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Встреч",    value: events.filter(e => e.type === "meeting").length, icon: Users, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-white/50 dark:border-slate-800`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`w-8 h-8 ${s.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mini Calendar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <h2 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wide capitalize">
              {monthName}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d => (
              <div key={d} className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase pb-2">{d}</div>
            ))}
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const iso = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasEv = eventDates.has(iso);
              const isToday = iso === today;
              const isSel = iso === selectedDate;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(iso)}
                  className={`relative py-2 rounded-xl text-sm font-bold transition-all ${
                    isToday && isSel ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110"
                    : isSel ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 ring-2 ring-indigo-400"
                    : isToday ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300"
                  }`}
                >
                  {day}
                  {hasEv && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events for selected date */}
        <div className="lg:col-span-2 space-y-4">
          {/* Selected day header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-between">
              <div>
                <h2 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest">
                  {selectedDate === today ? "Сегодня" : new Date(selectedDate + "T12:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" })}
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{selectedEvents.length} событий</p>
              </div>
              <button
                onClick={() => { setForm({ ...emptyForm, date: selectedDate }); setShowForm(true); }}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> Добавить
              </button>
            </div>

            <div className="p-4 space-y-3 min-h-[120px]">
              {loading ? (
                <div className="py-8 text-center text-gray-400 text-sm">Загрузка...</div>
              ) : selectedEvents.length === 0 ? (
                <div className="py-8 text-center text-gray-400 dark:text-slate-500 font-medium text-sm">
                  Нет событий на этот день
                </div>
              ) : selectedEvents.map(ev => {
                const meta = TYPE_META[ev.type] || TYPE_META.other;
                return (
                  <div key={ev.id} className={`relative flex gap-4 p-4 rounded-2xl border transition-all hover:shadow-md group ${meta.bg}`}>
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h3 className="font-black text-gray-900 dark:text-white text-sm">{ev.title}</h3>
                        <div className="flex items-center gap-2">
                          {(ev.source === "whatsapp_ai" || ev.source === "chatbot") && (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                              <Sparkles className="w-2.5 h-2.5" /> AI
                            </span>
                          )}
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${meta.color} ${meta.bg}`}>
                            {meta.label}
                          </span>
                          <button
                            onClick={() => handleDelete(ev.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {ev.description && (
                        <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 font-medium">{ev.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ev.time} ({ev.duration})</span>
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            {ev.location.toLowerCase() === "онлайн" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {ev.location}
                          </span>
                        )}
                        {ev.participants && (
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {ev.participants}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming (next 5 events after today) */}
          {events.filter(e => e.date > today).length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40">
                <h2 className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-widest">Предстоящие</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {events.filter(e => e.date > today).slice(0, 5).map(ev => {
                  const meta = TYPE_META[ev.type] || TYPE_META.other;
                  return (
                    <div key={ev.id} className="px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-4 cursor-pointer"
                      onClick={() => setSelectedDate(ev.date)}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-slate-200 text-sm truncate">{ev.title}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                          {new Date(ev.date + "T12:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} · {ev.time}
                        </p>
                      </div>
                      {(ev.source === "whatsapp_ai" || ev.source === "chatbot") && (
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wide text-sm">Новое событие</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <input
                placeholder="Название события *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 dark:text-white placeholder-gray-400"
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                  className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 dark:text-white"
                >
                  <option value="meeting">Встреча</option>
                  <option value="event">Мероприятие</option>
                  <option value="inspection">Проверка</option>
                  <option value="task">Задача</option>
                  <option value="other">Другое</option>
                </select>

                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 dark:text-white"
                />
                <input
                  placeholder="Длительность (напр. 1 ч.)"
                  value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 dark:text-white placeholder-gray-400"
                />
              </div>

              <input
                placeholder="Место (кабинет, зал, онлайн...)"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 dark:text-white placeholder-gray-400"
              />
              <input
                placeholder="Участники (необязательно)"
                value={form.participants}
                onChange={e => setForm(f => ({ ...f, participants: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 dark:text-white placeholder-gray-400"
              />
              <textarea
                placeholder="Описание (необязательно)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 dark:text-white placeholder-gray-400 resize-none"
              />
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex gap-3 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.title || !form.date}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? <span className="animate-spin">⏳</span> : <CheckCircle2 className="w-4 h-4" />}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
