// ── Задача 4 ── Алгоритм генерации расписания + отображение результата
import React, { useState } from "react";
import {
  Wand2, Loader2, CheckCircle2, AlertTriangle, RefreshCw,
  Download, ChevronDown, ChevronUp, ZoomIn, ZoomOut, Layout, Brain, Save, UserX, DoorClosed, Plus, Trash2
} from "lucide-react";
import { loadMatrixStore } from "./MatrixPanel";
import { generateAiSchedule } from "../../services/gemini";

// ── Types ──
export interface GeneratedCell {
  subject: string;
  teacher: string;
  room: string;
  isLent?: boolean;
  lentGroup?: string;
  lentType?: "level" | "profile";
  isConflict?: boolean;
}
export type GeneratedSchedule = Record<string, Record<string, Record<string, GeneratedCell>>>;

interface LentConfig {
  id: string;
  parallelClasses: string[];
  subject: string;
  groups: number;
  groupNames: string[];
  fixedDay: string;
  fixedTime: string;
  teachers: string[];
  rooms: string[];
}

const DAYS = ["Понедельник","Вторник","Среда","Четверг","Пятница"];
const TIME_SLOTS = [
  "08:00-08:45","09:05-09:50","10:10-10:55","11:00-11:45","11:50-12:35",
  "13:05-13:50","14:20-15:00","15:05-15:45","16:00-16:45","16:45-17:30",
];

function loadLents(): LentConfig[] {
  try {
    const raw = localStorage.getItem("sg_lents_v2");
    if (raw) return JSON.parse(raw);
    const legacy = localStorage.getItem("sg_lents");
    if (legacy) return JSON.parse(legacy);
  } catch {}
  return [];
}

async function generateScheduleFast(matrix: any, lents: any) {
  const res = await fetch("http://localhost:8000/api/generate-fast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matrix, lents })
  });
  if (!res.ok) throw new Error("Failed to generate fast schedule on backend");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
interface Props {
  generatedSchedule: GeneratedSchedule | null;
  setGeneratedSchedule: (s: GeneratedSchedule) => void;
  generationStats: { totalLessons: number; conflicts: number; conflictReasons?: string[]; lentsPlaced: number; timeMs: number } | null;
  setGenerationStats: (s: any) => void;
}

export function GeneratePanel({ generatedSchedule, setGeneratedSchedule, generationStats, setGenerationStats }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.75);
  const [showClass, setShowClass] = useState<string | null>(null);
  const [isFullView, setIsFullView] = useState(false);
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  
  // Unavailability state
  const [unavailableTeachers, setUnavailableTeachers] = useState<Record<string, string[]>>({});
  const [unavailableRooms, setUnavailableRooms] = useState<Record<string, string[]>>({});
  const [showUnavailModal, setShowUnavailModal] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const matrix = loadMatrixStore();
      const lents  = loadLents();
      const { schedule, stats } = await generateScheduleFast(matrix, lents, { unavailableTeachers, unavailableRooms });
      setGeneratedSchedule(schedule);
      setGenerationStats(stats);
      const clsList = Object.keys(schedule).sort();
      if (clsList.length > 0) setShowClass(clsList[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiGenerate = async () => {
    setIsAiGenerating(true);
    try {
      const matrix = loadMatrixStore();
      const lents  = loadLents();
      const result = await generateAiSchedule(matrix, lents);
      
      if (result && result.schedule) {
        setGeneratedSchedule(result.schedule);
        setGenerationStats({
          ...result.stats,
          timeMs: result.stats.timeMs || 0
        });
        const clsList = Object.keys(result.schedule).sort();
        if (clsList.length > 0) setShowClass(clsList[0]);
      }
    } catch (error) {
       console.error(error);
    } finally {
      setIsAiGenerating(false);
    }
  };

  async function generateScheduleFast(matrix: any, lents: any, constraints: any) {
    const res = await fetch("http://localhost:8000/api/generate-fast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        matrix, 
        lents, 
        unavailableTeachers: constraints.unavailableTeachers,
        unavailableRooms: constraints.unavailableRooms
      })
    });
    if (!res.ok) throw new Error("Failed to generate fast schedule on backend");
    return res.json();
  }


  const handleSaveToDb = async () => {
    if (!generatedSchedule) return;
    try {
      const res = await fetch("http://localhost:8000/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedSchedule)
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Расписание успешно сохранено в базу данных!");
      } else {
        alert("❌ Ошибка при сохранении: " + data.error);
      }
    } catch (e) {
      alert("❌ Ошибка сервера: " + String(e));
    }
  };


  const classes = generatedSchedule ? Object.keys(generatedSchedule).sort((a, b) => {
    const parse = (s: string) => ({
      num: parseInt(s.match(/\d+/)?.[0] || "0", 10),
      char: s.match(/[A-Za-zА-Яа-я]+/)?.[0] || ""
    });
    const pa = parse(a), pb = parse(b);
    if (pa.num !== pb.num) return pa.num - pb.num;
    return pa.char.localeCompare(pb.char);
  }) : [];

  const downloadCSV = () => {
    if (!generatedSchedule) return;
    const rows: string[] = ["Класс,День,Время,Предмет,Учитель,Кабинет,Тип"];
    for (const cls of classes) {
      for (const day of DAYS) {
        for (const time of TIME_SLOTS) {
          const cell = generatedSchedule[cls]?.[day]?.[time];
          if (cell) {
            rows.push(`${cls},${day},${time},${cell.subject},${cell.teacher},${cell.room},${cell.isLent ? "Лента" : "Обычный"}`);
          }
        }
      }
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "schedule_generated.csv"; a.click();
  };

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-gray-900 dark:text-white text-lg">Генерация расписания</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Алгоритм прочитает матрицу нагрузки и ленты, расставит уроки по сетке
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0 flex-wrap">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || isAiGenerating}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Быстрая генерация
            </button>

            <button
              onClick={() => setShowUnavailModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-all"
            >
              <UserX className="w-4 h-4" /> Больничные / Кабинеты
            </button>


            <button
              onClick={handleAiGenerate}
              disabled={isGenerating || isAiGenerating}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/30 hover:opacity-90 transition-all active:scale-95 disabled:opacity-70"
            >
              {isAiGenerating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> AI Думает...</>
                : <><Brain className="w-4 h-4 text-purple-200" /> AI Генерация (Groq)</>
              }
            </button>

            {generatedSchedule && (
              <button
                onClick={handleSaveToDb}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" /> Сохранить в БД
              </button>
            )}


            <button
              onClick={() => setIsFullView(!isFullView)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                isFullView ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30" : "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800"
              }`}
            >
              <Layout className="w-4 h-4" /> {isFullView ? "Расписание дня" : "Классический вид"}
            </button>
            
            {generatedSchedule && (
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                <Download className="w-4 h-4" /> CSV
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {generationStats && (
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Уроков размещено", value: generationStats.totalLessons, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
              { label: "Конфликтов",       value: generationStats.conflicts,     color: generationStats.conflicts > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400", bg: generationStats.conflicts > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-emerald-50 dark:bg-emerald-950/30" },
              { label: "Лент размещено",   value: generationStats.lentsPlaced,   color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
              { label: "Время (мс)",       value: generationStats.timeMs,         color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/30" },
            ].map(st => (
              <div key={st.label} className={`${st.bg} rounded-2xl p-4 border border-gray-100 dark:border-slate-800`}>
                <p className={`text-2xl font-black ${st.color}`}>{st.value}</p>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mt-1">{st.label}</p>
              </div>
            ))}
          </div>
        )}
        {generationStats?.conflictReasons && generationStats.conflictReasons.length > 0 && (
          <div className="mt-4 p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/50 rounded-xl">
            <h4 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> 
              Ошибки расписания (не удалось разместить)
            </h4>
            <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-300 space-y-1">
              {generationStats.conflictReasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Schedule table */}
      {generatedSchedule && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
          {/* Controls */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 gap-3 flex-wrap">
            {isFullView ? (
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all border ${
                      selectedDay === d
                        ? "bg-violet-600 text-white border-violet-500 shadow"
                        : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-violet-400"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {classes.map(cls => (
                  <button
                    key={cls}
                    onClick={() => setShowClass(showClass === cls ? null : cls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                      showClass === cls
                        ? "bg-violet-600 text-white border-violet-500 shadow"
                        : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-violet-400"
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-gray-200 dark:border-slate-700">
              <button onClick={() => setZoomLevel(z => Math.max(0.4, z - 0.1))} className="p-1 text-gray-400 hover:text-violet-600"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-[10px] font-black w-10 text-center dark:text-slate-400">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel(z => Math.min(1.2, z + 0.1))} className="p-1 text-gray-400 hover:text-violet-600"><ZoomIn className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Grid */}
          <div className="overflow-auto p-4 custom-scrollbar">
            <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left", width: `${100 / zoomLevel}%`, transition: "transform 0.2s" }}>
              {isFullView ? (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-800 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest sticky top-0 z-10 text-left">
                      <th className="p-3 w-24 border border-white/5 bg-gray-900 dark:bg-slate-950">Время</th>
                      {classes.map(c => <th key={c} className="p-3 border border-white/5 min-w-[120px]">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map(time => (
                      <tr key={time} className="hover:bg-blue-50/50 dark:hover:bg-indigo-900/10 transition-all group">
                        <td className="p-3 border border-gray-100 dark:border-slate-800 font-bold text-gray-400 dark:text-slate-500 text-[10px] bg-gray-50/50 dark:bg-slate-950/30">{time}</td>
                        {classes.map(c => {
                          const cell = generatedSchedule[c]?.[selectedDay]?.[time];
                          if (!cell) return <td key={c} className="p-2 border border-gray-100 dark:border-slate-800 text-center text-gray-200 dark:text-slate-800">—</td>;
                          const isProfile = cell.lentType === "profile";
                          return (
                            <td key={c} className="p-2 border border-gray-100 dark:border-slate-800 text-center min-w-[120px]">
                              <div className={`flex flex-col gap-1 items-center p-2 rounded-2xl border transition-all ${
                                cell.isLent ? (isProfile ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50 shadow-sm" : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50") :
                                "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 shadow-sm"
                              }`}>
                                {cell.isLent && (
                                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-white mb-1 shadow-sm ${isProfile ? "bg-orange-600" : "bg-purple-600"}`}>
                                    {isProfile ? "ЕНТ" : `Лента`}
                                  </span>
                                )}
                                <span className={`font-black text-[11px] leading-tight text-center px-1 ${isProfile ? "text-amber-900 dark:text-amber-100" : "text-gray-900 dark:text-white"}`}>
                                  {cell.subject}
                                </span>
                                <span className={`text-[9px] font-bold text-center leading-tight mt-0.5 ${isProfile ? "text-amber-700/70 dark:text-slate-400" : "text-gray-400 dark:text-slate-500"}`}>
                                  {cell.teacher}
                                </span>
                                <div className={`mt-2 px-3 py-0.5 font-black rounded-lg text-[10px] border shadow-sm ${
                                  isProfile ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200/50" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200/50"
                                }`}>
                                  {cell.room}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                showClass ? (
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-800 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest text-left">
                        <th className="p-3 w-24 border border-white/5 bg-gray-900 dark:bg-slate-950">Время</th>
                        {DAYS.map(d => <th key={d} className="p-3 border border-white/5">{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {TIME_SLOTS.map(time => (
                        <tr key={time} className="hover:bg-blue-50/50 dark:hover:bg-indigo-900/10 transition-all group">
                          <td className="p-3 border border-gray-100 dark:border-slate-800 font-bold text-gray-400 dark:text-slate-500 text-[10px] bg-gray-50/50 dark:bg-slate-950/30">{time}</td>
                          {DAYS.map(day => {
                            const cell = generatedSchedule[showClass]?.[day]?.[time];
                            if (!cell) return <td key={day} className="p-2 border border-gray-100 dark:border-slate-800 text-center text-gray-200 dark:text-slate-800">—</td>;
                            const isProfile = cell.lentType === "profile";
                            return (
                              <td key={day} className="p-2 border border-gray-100 dark:border-slate-800 text-center min-w-[120px]">
                                <div className={`flex flex-col gap-1 items-center p-4 rounded-[2.5rem] border transition-all ${
                                  cell.isLent ? (isProfile ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50" : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50") :
                                  "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 shadow-sm hover:bg-white"
                                }`}>
                                  {cell.isLent && (
                                    <span className={`text-[10px] text-white px-3 py-0.5 rounded-lg font-black uppercase tracking-widest mb-2 shadow-sm ${isProfile ? 'bg-orange-600' : 'bg-purple-600'}`}>
                                      {isProfile ? 'ЕНТ' : `Лента`}
                                    </span>
                                  )}
                                  <span className={`font-black text-[13px] leading-tight text-center px-2 ${isProfile ? 'text-amber-900 dark:text-amber-100' : 'text-gray-900 dark:text-slate-100'}`}>
                                    {cell.subject}
                                  </span>
                                  <span className={`text-[11px] font-bold text-center leading-tight mt-1 ${isProfile ? 'text-amber-700/70 dark:text-slate-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                    {cell.teacher}
                                  </span>
                                  <div className={`mt-3 px-5 py-1.5 font-black rounded-xl text-[11px] border shadow-sm ${
                                    isProfile ? 'bg-amber-100 dark:bg-orange-900/40 border-amber-200 text-amber-800 dark:text-amber-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200/50'
                                  }`}>
                                    {cell.room}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-16 text-center text-gray-400 dark:text-slate-600 font-bold text-sm">
                    Выберите класс выше или включите «Расписание дня» для просмотра
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!generatedSchedule && !isGenerating && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-800 py-24 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center">
            <Wand2 className="w-8 h-8 text-violet-500" />
          </div>
          <p className="font-black text-gray-900 dark:text-white text-lg">Расписание не сгенерировано</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 max-w-sm text-center">
            Настройте матрицу нагрузки и ленты, затем нажмите «Генерировать»
          </p>
        </div>
      )}

      {/* ═══ UNAVAILABILITY MODAL ═══ */}
      {showUnavailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-slate-800 animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-950/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 shadow-lg">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Отсутствия и Ограничения</h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">ИИ не будет ставить уроки на эти дни</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUnavailModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              {/* Teachers section */}
              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UserX className="w-4 h-4" /> Учителя (Больничные/Отгулы)
                </h3>
                <div className="space-y-3">
                  {Object.entries(unavailableTeachers).map(([name, days]) => (
                    <div key={name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 group">
                      <div className="flex-1">
                        <p className="font-black text-sm text-gray-900 dark:text-white">{name}</p>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {days.map(d => (
                            <span key={d} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-black rounded-lg border border-red-200 dark:border-red-800/50">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const next = { ...unavailableTeachers };
                          delete next[name];
                          setUnavailableTeachers(next);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input id="new-t-name" placeholder="Имя учителя (напр. Гореева А.М.)" className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20" />
                    <button 
                      onClick={() => {
                        const name = (document.getElementById('new-t-name') as HTMLInputElement).value;
                        if (!name) return;
                        setUnavailableTeachers({ ...unavailableTeachers, [name]: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"] });
                        (document.getElementById('new-t-name') as HTMLInputElement).value = "";
                      }}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Rooms section */}
              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <DoorClosed className="w-4 h-4" /> Кабинеты (Ремонт/Заняты)
                </h3>
                <div className="space-y-3">
                   {Object.entries(unavailableRooms).map(([name, days]) => (
                    <div key={name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 group">
                      <div className="flex-1">
                        <p className="font-black text-sm text-gray-900 dark:text-white">{name}</p>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {days.map(d => (
                            <span key={d} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-lg border border-amber-200 dark:border-amber-800/50">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const next = { ...unavailableRooms };
                          delete next[name];
                          setUnavailableRooms(next);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input id="new-r-name" placeholder="Кабинет (напр. 303)" className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20" />
                    <button 
                      onClick={() => {
                        const name = (document.getElementById('new-r-name') as HTMLInputElement).value;
                        if (!name) return;
                        setUnavailableRooms({ ...unavailableRooms, [name]: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"] });
                        (document.getElementById('new-r-name') as HTMLInputElement).value = "";
                      }}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-8 border-t border-gray-100 dark:border-slate-800 flex justify-end bg-gray-50/50 dark:bg-slate-950/30">
              <button 
                onClick={() => setShowUnavailModal(false)}
                className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:opacity-90 transition-all active:scale-95"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

