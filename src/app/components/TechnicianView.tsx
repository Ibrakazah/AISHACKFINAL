import React, { useState, useEffect } from "react";
import { Wrench, Clock, MapPin, Search, User, Hammer, Lightbulb, Trash2, ShieldCheck, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { TECH_STAFF, TECH_SCHEDULE, TECH_TIME_SLOTS, TECH_DAYS } from "../data/techStaffData";

interface Incident {
  id: string;
  timestamp: string;
  location: string;
  description: string;
  reporter: string;
  assignedTo: string;
  status: string;
}

export function TechnicianView() {
  const [selectedStaffId, setSelectedStaffId] = useState<number>(TECH_STAFF[0].id);
  const [selectedDay, setSelectedDay] = useState<string>("Понедельник");
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/incidents/active");
        if (response.ok) {
          const data = await response.json();
          setIncidents(data.incidents || []);
        }
      } catch (error) {
        console.error("Failed to fetch incidents:", error);
      }
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000); // Polling
    return () => clearInterval(interval);
  }, []);

  const activeStaff = TECH_STAFF.find(s => s.id === selectedStaffId) || TECH_STAFF[0];

  const getRoleIcon = (role: string) => {
    if (role.includes("Слесарь")) return <Hammer className="w-5 h-5" />;
    if (role.includes("Электрик")) return <Lightbulb className="w-5 h-5" />;
    if (role.includes("Убор")) return <Trash2 className="w-5 h-5" />;
    return <Wrench className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 text-white">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Кабинет техников</h1>
              <p className="text-gray-500 dark:text-slate-400 font-medium">Управление персоналом и активные заявки от ИИ</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {TECH_DAYS.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedDay === day ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200'}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {incidents.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-900/30 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
              <AlertCircle className="w-6 h-6 text-rose-500 animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-rose-950 dark:text-rose-100 uppercase tracking-tighter">СРОЧНЫЕ ВЫЗОВЫ (АКТИВНО: {incidents.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incidents.map((inc) => (
              <div key={inc.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-rose-200 dark:border-rose-900/20 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <AlertCircle className="w-12 h-12 text-rose-500" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-rose-500 text-white rounded-lg text-[8px] font-black tracking-widest">{inc.status.toUpperCase()}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">{inc.id}</span>
                </div>
                <h4 className="text-base font-black text-gray-900 dark:text-white mb-2 leading-tight">{inc.description}</h4>
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    {inc.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-slate-500">
                    <User className="w-4 h-4" />
                    Сообщил: {inc.reporter}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Staff Sidebar */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Технический состав</h3>
            <div className="space-y-3">
              {TECH_STAFF.map(staff => (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaffId(staff.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedStaffId === staff.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/30' : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: staff.color }}>
                    {getRoleIcon(staff.role)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-gray-900 dark:text-white truncate">{staff.name}</div>
                    <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{staff.role}</div>
                  </div>
                  {selectedStaffId === staff.id && <ChevronRight className="w-4 h-4 text-indigo-500" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-all duration-700">
               <ShieldCheck className="w-40 h-40" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-4">Связь с сотрудником</h4>
            <div className="text-2xl font-black mb-2">{activeStaff.name}</div>
            <div className="text-indigo-400 font-mono text-lg mb-6">{activeStaff.phone}</div>
            <button className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
              Вызвать через WhatsApp
            </button>
          </div>
        </div>

        {/* Schedule View */}
        <div className="xl:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden min-h-[600px]">
            <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-950/20">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">План работ на {selectedDay}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">График на основе регламента AQBOBEK AI</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-black text-gray-700 dark:text-slate-300">07:00 – 18:00</span>
              </div>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
              {TECH_TIME_SLOTS.map(time => {
                const dayTasks = TECH_SCHEDULE[selectedDay]?.[time] || [];
                const staffTask = dayTasks.find(t => t.staffId === selectedStaffId);

                return (
                  <div key={time} className="p-8 hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all flex flex-col md:flex-row gap-6">
                    <div className="w-32 flex-shrink-0">
                      <div className="text-xs font-black text-gray-400 dark:text-slate-600 uppercase tracking-widest">{time}</div>
                    </div>
                    
                    <div className="flex-1">
                      {staffTask ? (
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{staffTask.task}</h4>
                            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest">В работе</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-xs font-bold">
                              <MapPin className="w-4 h-4 text-rose-500" />
                              {staffTask.location}
                            </div>
                            {staffTask.note && (
                              <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 text-xs italic">
                                — {staffTask.note}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-20 border-2 border-dashed border-gray-100 dark:border-slate-800/40 rounded-2xl flex items-center justify-center opacity-30">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 dark:text-slate-700">Окно / Свободное дежурство</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TechnicianView;
