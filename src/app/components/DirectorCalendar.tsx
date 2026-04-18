import { useState } from "react";
import { Calendar, Clock, MapPin, Users, Video, Plus } from "lucide-react";

interface CalendarEvent {
  id: number;
  title: string;
  type: "meeting" | "event" | "inspection" | "other";
  date: string;
  time: string;
  duration: string;
  location: string;
  participants?: string;
  description: string;
}

export function DirectorCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events] = useState<CalendarEvent[]>([
    {
      id: 1,
      title: "Педагогический совет",
      type: "meeting",
      date: "2026-04-17",
      time: "14:00",
      duration: "2 часа",
      location: "Актовый зал",
      participants: "Весь педагогический состав",
      description: "Обсуждение итогов 3 четверти и планирование выпускных мероприятий",
    },
    {
      id: 2,
      title: "Встреча с родительским комитетом",
      type: "meeting",
      date: "2026-04-18",
      time: "16:00",
      duration: "1.5 часа",
      location: "Кабинет директора",
      participants: "Представители родительского комитета",
      description: "Обсуждение организации школьного праздника",
    },
    {
      id: 3,
      title: "Проверка состояния кабинетов",
      type: "inspection",
      date: "2026-04-19",
      time: "10:00",
      duration: "3 часа",
      location: "Все этажи школы",
      description: "Плановая инспекция состояния учебных кабинетов и оборудования",
    },
    {
      id: 4,
      title: "Совещание завучей",
      type: "meeting",
      date: "2026-04-20",
      time: "09:00",
      duration: "1 час",
      location: "Кабинет директора",
      participants: "Завучи по учебной и воспитательной работе",
      description: "Координация работы на следующую неделю",
    },
    {
      id: 5,
      title: "Районная конференция директоров",
      type: "event",
      date: "2026-04-22",
      time: "11:00",
      duration: "4 часа",
      location: "Районный отдел образования",
      participants: "Директора школ района",
      description: "Обсуждение новых образовательных стандартов",
    },
    {
      id: 6,
      title: "Онлайн-семинар по цифровизации образования",
      type: "event",
      date: "2026-04-23",
      time: "15:00",
      duration: "2 часа",
      location: "Онлайн",
      description: "Вебинар о внедрении цифровых технологий в учебный процесс",
    },
  ]);

  const todayEvents = events.filter((event) => event.date === "2026-04-17");
  const upcomingEvents = events.filter((event) => new Date(event.date) > new Date("2026-04-17"));

  const getEventTypeStyle = (type: CalendarEvent["type"]) => {
    const styles = {
      meeting: "bg-blue-100 text-blue-800 border-blue-200",
      event: "bg-purple-100 text-purple-800 border-purple-200",
      inspection: "bg-orange-100 text-orange-800 border-orange-200",
      other: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return styles[type];
  };

  const getEventTypeLabel = (type: CalendarEvent["type"]) => {
    const labels = {
      meeting: "Встреча",
      event: "Мероприятие",
      inspection: "Проверка",
      other: "Другое",
    };
    return labels[type];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Календарь директора</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">Планирование встреч и мероприятий</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-sm font-black uppercase tracking-widest text-xs">
          <Plus className="w-4 h-4" />
          Новое событие
        </button>
      </div>

      {/* Краткая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Сегодня</p>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{todayEvents.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">На неделе</p>
              <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">{events.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Встреч</p>
              <p className="text-3xl font-black text-green-600 dark:text-green-400 mt-1">
                {events.filter((e) => e.type === "meeting").length}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Событий</p>
              <p className="text-3xl font-black text-orange-600 dark:text-orange-400 mt-1">
                {events.filter((e) => e.type === "event").length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Мини-календарь */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors">
          <h2 className="font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 text-lg uppercase tracking-tight">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Апрель 2026
          </h2>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
              <div key={day} className="text-gray-500 dark:text-slate-400 font-bold py-2 uppercase text-[10px] tracking-widest">
                {day}
              </div>
            ))}
            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
              const hasEvent = events.some((e) => new Date(e.date).getDate() === day);
              const isToday = day === 17;
              return (
                <button
                  key={day}
                  className={`py-2 rounded-xl transition-all font-bold text-sm ${
                    isToday
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-110"
                      : hasEvent
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 ring-1 ring-inset ring-blue-200 dark:ring-blue-800/50"
                      : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* События сегодня */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50">
              <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">События сегодня</h2>
            </div>
            <div className="p-6 space-y-4">
              {todayEvents.length > 0 ? (
                todayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="relative pl-6 py-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors group overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-l-xl"></div>
                    <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
                      <h3 className="font-black text-gray-900 dark:text-white text-lg">{event.title}</h3>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white dark:border-slate-800 shadow-sm ${getEventTypeStyle(event.type).replace('bg-', 'bg-').replace('text-', 'text-').replace('border-', 'border-')} dark:bg-opacity-20`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-4">{event.description}</p>
                    <div className="flex flex-wrap gap-5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {event.time} ({event.duration})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.location === "Онлайн" ? (
                          <Video className="w-4 h-4 text-gray-400" />
                        ) : (
                          <MapPin className="w-4 h-4 text-gray-400" />
                        )}
                        <span>{event.location}</span>
                      </div>
                      {event.participants && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{event.participants}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-slate-400 py-8 font-medium">Нет событий на сегодня</p>
              )}
            </div>
          </div>

          {/* Предстоящие события */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors overflow-hidden">
             <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50">
              <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Предстоящие события</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {upcomingEvents.slice(0, 4).map((event) => (
                <div key={event.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-3 gap-4">
                    <h3 className="font-bold text-gray-900 dark:text-slate-200">{event.title}</h3>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getEventTypeStyle(event.type)} dark:bg-opacity-20`}>
                      {getEventTypeLabel(event.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest flex-wrap">
                    <span>
                      {new Date(event.date).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700 rounded-full"></span>
                    <span>{event.time}</span>
                    <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700 rounded-full"></span>
                    <span>{event.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
