import React, { useState, useEffect } from "react";
import { Users, Search, Filter, Phone, Mail, Clock, Briefcase, Activity, CheckCircle2, AlertTriangle, XCircle, MoreVertical } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "free" | "busy" | "absent";
  statusReason?: string;
  phone: string;
  email: string;
  avatar: string;
}

const INITIAL_STAFF: StaffMember[] = [
  { id: "1", name: "Айгерим", role: "Секретарь", department: "Администрация", status: "busy", statusReason: "Готовит отчет для РОНО", phone: "+7 (701) 123-45-67", email: "aigerim@aqbobek.kz", avatar: "A" },
  { id: "2", name: "Назкен", role: "Завхоз", department: "АХЧ", status: "free", phone: "+7 (705) 987-65-43", email: "nazken@aqbobek.kz", avatar: "N" },
  { id: "3", name: "Ерлан", role: "Техперсонал", department: "АХЧ", status: "free", phone: "+7 (777) 111-22-33", email: "erlan@aqbobek.kz", avatar: "E" },
  { id: "4", name: "Мухтар", role: "Рабочий", department: "АХЧ", status: "busy", statusReason: "Ремонт труб на 2 этаже", phone: "+7 (702) 222-33-44", email: "mukhtar@aqbobek.kz", avatar: "M" },
  { id: "5", name: "Аскар", role: "Учитель математики", department: "МО Точных наук", status: "absent", statusReason: "Больничный", phone: "+7 (707) 555-66-77", email: "askar.m@aqbobek.kz", avatar: "AS" },
  { id: "6", name: "Динара", role: "Завуч по ВР", department: "Администрация", status: "free", phone: "+7 (701) 888-99-00", email: "dinara.z@aqbobek.kz", avatar: "D" },
];

export function StaffDatabase() {
  const [staffData, setStaffData] = useState<StaffMember[]>(INITIAL_STAFF);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "free" | "busy" | "absent">("all");

  // ═══ СИНХРОНИЗАЦИЯ: Слушаем события от ИИ-ассистента ═══
  useEffect(() => {
    const handler = (e: Event) => {
      const { name, subject, status, reason } = (e as CustomEvent).detail;
      setStaffData(prev => prev.map(staff => {
        // Обновление по имени учителя
        if (name && staff.name.toLowerCase().includes(name.toLowerCase())) {
          return { ...staff, status: status as StaffMember["status"], statusReason: reason };
        }
        // Обновление по предмету (например, "Физика" → учитель физики)
        if (subject && staff.role.toLowerCase().includes(subject.toLowerCase())) {
          return { ...staff, status: status as StaffMember["status"], statusReason: reason };
        }
        return staff;
      }));
    };

    window.addEventListener("staff-status-update", handler);
    return () => window.removeEventListener("staff-status-update", handler);
  }, []);

  const filteredStaff = staffData.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || staff.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || staff.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusDisplay = (status: string, reason?: string) => {
    switch (status) {
      case "free":
        return (
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Доступен
          </div>
        );
      case "busy":
        return (
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full uppercase tracking-widest border border-amber-100 dark:border-amber-800" title={reason}>
            <Activity className="w-3.5 h-3.5" /> В работе {reason && <span className="opacity-70 lowercase font-medium">({reason})</span>}
          </div>
        );
      case "absent":
        return (
          <div className="flex items-center gap-1.5 text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-full uppercase tracking-widest border border-rose-100 dark:border-rose-800" title={reason}>
            <XCircle className="w-3.5 h-3.5" /> Отсутствует {reason && <span className="opacity-70 lowercase font-medium">({reason})</span>}
          </div>
        );
      default:
        return null;
    }
  };

  const getDepartmentColor = (dept: string) => {
    if (dept === "Администрация") return "from-purple-500 to-indigo-600";
    if (dept === "АХЧ") return "from-emerald-500 to-teal-600";
    return "from-blue-500 to-cyan-600";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">База Персонала</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Мониторинг статусов в реальном времени</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Поиск по имени или должности..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Всего сотрудников", val: staffData.length, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", icon: Users },
          { label: "Доступны сейчас", val: staffData.filter(s => s.status === 'free').length, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: CheckCircle2 },
          { label: "В работе", val: staffData.filter(s => s.status === 'busy').length, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", icon: Activity },
          { label: "Отсутствуют", val: staffData.filter(s => s.status === 'absent').length, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20", icon: AlertTriangle },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 transition-colors flex items-center justify-between group">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-1">{stat.label}</p>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.val}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Grid of Staff */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStaff.map(staff => (
          <div key={staff.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-md border border-gray-100 dark:border-slate-800 hover:shadow-xl transition-all group overflow-hidden relative">
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${getDepartmentColor(staff.department)}`} />
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-[1.5rem] bg-gradient-to-br ${getDepartmentColor(staff.department)} flex items-center justify-center text-white text-xl font-black shadow-lg`}>
                  {staff.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{staff.name}</h3>
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> {staff.role}
                  </p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                 <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50/50 dark:bg-slate-950/50 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-slate-800/60">
              {getStatusDisplay(staff.status, staff.statusReason)}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300 font-medium">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                </div>
                {staff.phone}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300 font-medium">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                </div>
                {staff.email}
              </div>
            </div>
          </div>
        ))}
        {filteredStaff.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-gray-300 dark:border-slate-700">
            <Users className="w-16 h-16 text-gray-300 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Сотрудники не найдены</h3>
            <p className="text-gray-500 mt-2">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
}
