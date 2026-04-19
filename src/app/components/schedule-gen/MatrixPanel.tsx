// ── Задача 2 ── Матрица нагрузки (учителя / предметы / часы)
import React, { useState } from "react";
import { Plus, Trash2, BookOpen, Users, DoorOpen, Save, CheckCircle2, Edit2 } from "lucide-react";

// ═══ Default data (seeded from real schedule) ═══
const DEFAULT_CLASSES = ["7A","7B","7C","8A","8B","8C","8Д","9A","9B","10A","10B","11A","11B"];

const h = (val: number) => ({ "7": val, "8": val, "9": val, "10": val, "11": val });

import { TEACHER_ASSIGNMENTS } from "../../data/teacherAssignments";

const rawDefaultSubjects: Array<{ subject: string; hoursPerWeek: Record<string, number> }> = [
  { subject: "Алгебра",             hoursPerWeek: h(3) },
  { subject: "Геометрия",           hoursPerWeek: h(2) },
  { subject: "Қазақ тілі",         hoursPerWeek: h(3) },
  { subject: "Қазақ әдебиеті",     hoursPerWeek: h(2) },
  { subject: "Орыс тілі",          hoursPerWeek: h(2) },
  { subject: "Ағылшын тілі",       hoursPerWeek: h(3) },
  { subject: "Физика",             hoursPerWeek: h(3) },
  { subject: "Химия",              hoursPerWeek: h(2) },
  { subject: "Биология",           hoursPerWeek: h(2) },
  { subject: "География",          hoursPerWeek: h(2) },
  { subject: "Информатика",        hoursPerWeek: h(1) },
  { subject: "Дене шынықтыру",     hoursPerWeek: h(3) },
  { subject: "Қазақстан тарихы",   hoursPerWeek: h(2) },
  { subject: "Дүние жүзі тарихы",  hoursPerWeek: h(1) },
  { subject: "Тәрбие сағаты",      hoursPerWeek: h(1) },
];

const uniqueSubjects = new Map<string, { subject: string; hoursPerWeek: Record<string, number> }>();
rawDefaultSubjects.forEach(s => uniqueSubjects.set(s.subject.toLowerCase(), s));

TEACHER_ASSIGNMENTS.forEach(t => {
   Object.keys(t.subjects).forEach(subj => {
      const key = subj.toLowerCase();
      if (!uniqueSubjects.has(key)) {
         uniqueSubjects.set(key, { subject: subj, hoursPerWeek: h(0) });
      }
   });
});

const DEFAULT_SUBJECTS = Array.from(uniqueSubjects.values());


const DEFAULT_TEACHERS = TEACHER_ASSIGNMENTS.map(ta => ({
  name: ta.name,
  subjects: Object.keys(ta.subjects),
  maxHoursPerDay: 6,
  maxHoursPerWeek: ta.weekly_hours > 0 ? ta.weekly_hours : 24,
  assignments: ta.subjects as Record<string, Record<string, number>>
}));

const DEFAULT_ROOMS = [
  { name: "110",       type: "classroom" as const, capacity: 30 },
  { name: "201",       type: "lab"       as const, capacity: 25 },
  { name: "203",       type: "lab"       as const, capacity: 25 },
  { name: "204",       type: "classroom" as const, capacity: 30 },
  { name: "205",       type: "classroom" as const, capacity: 30 },
  { name: "206",       type: "classroom" as const, capacity: 30 },
  { name: "209",       type: "lab"       as const, capacity: 25 },
  { name: "210",       type: "classroom" as const, capacity: 30 },
  { name: "211",       type: "lab"       as const, capacity: 25 },
  { name: "301",       type: "classroom" as const, capacity: 30 },
  { name: "302",       type: "classroom" as const, capacity: 30 },
  { name: "303",       type: "classroom" as const, capacity: 30 },
  { name: "304",       type: "classroom" as const, capacity: 30 },
  { name: "305",       type: "classroom" as const, capacity: 30 },
  { name: "309",       type: "classroom" as const, capacity: 30 },
  { name: "310",       type: "classroom" as const, capacity: 30 },
  { name: "311",       type: "classroom" as const, capacity: 30 },
  { name: "104",       type: "lab"       as const, capacity: 25 },
  { name: "107",       type: "techpark"  as const, capacity: 20 },
  { name: "Спортзал",  type: "gym"       as const, capacity: 100 },
];

// ── shared store via localStorage ──
const MATRIX_VERSION = 4; // bump this to force reset of stale data

export function loadMatrixStore() {
  try {
    const raw = localStorage.getItem("sg_matrix");
    if (raw) {
       const parsed = JSON.parse(raw);
       // If data version is outdated, reset to defaults
       if (!parsed._version || parsed._version < MATRIX_VERSION) {
         localStorage.removeItem("sg_matrix");
         return {
           _version: MATRIX_VERSION,
           classes:  DEFAULT_CLASSES,
           subjects: DEFAULT_SUBJECTS,
           teachers: DEFAULT_TEACHERS,
           rooms:    DEFAULT_ROOMS,
         };
       }
       // Migrate class names (fix Cyrillic/Latin mismatches)
       const classNameMap: Record<string, string> = {
         "10\u0410": "10A", "10\u0412": "10B", "11\u0410": "11A", "11\u0412": "11B", "8D": "8\u0414"
       };
       if (parsed.classes) {
         parsed.classes = parsed.classes.map((c: string) => classNameMap[c] || c);
         // deduplicate
         parsed.classes = [...new Set(parsed.classes)];
       }
       // Migrate subjects AND ENSURE DEFAULT SUBJECTS EXIST
       if (!parsed.subjects) parsed.subjects = [];
       
       // Add any missing default subjects
       for (const ds of DEFAULT_SUBJECTS) {
          if (!parsed.subjects.find((s:any) => s.subject.toLowerCase() === ds.subject.toLowerCase())) {
             parsed.subjects.push(ds);
          }
       }
       
       if (parsed.subjects.length > 0 && typeof parsed.subjects[0].hoursPerWeek === "number") {
          parsed.subjects = parsed.subjects.map((s: any) => ({
             ...s,
             hoursPerWeek: { "7": s.hoursPerWeek, "8": s.hoursPerWeek, "9": s.hoursPerWeek, "10": s.hoursPerWeek, "11": s.hoursPerWeek }
          }));
       }
       
       // Migrate teachers
       if (parsed.teachers) {
          parsed.teachers = parsed.teachers.map((t: any) => {
             const defaultMatch = DEFAULT_TEACHERS.find(dt => dt.name === t.name);
             // Also fix class names inside teacher assignments
             if (t.assignments) {
               for (const subj of Object.keys(t.assignments)) {
                 const classMap = t.assignments[subj];
                 for (const oldName of Object.keys(classNameMap)) {
                   if (classMap[oldName] !== undefined) {
                     classMap[classNameMap[oldName]] = classMap[oldName];
                     delete classMap[oldName];
                   }
                 }
               }
             }
             return {
               ...t,
               maxHoursPerWeek: t.maxHoursPerWeek || (t.maxHoursPerDay * 5),
               assignments: t.assignments || (defaultMatch ? defaultMatch.assignments : undefined)
             };
          });
          // If DEFAULT_TEACHERS has entirely new teachers, add them
          for (const dt of DEFAULT_TEACHERS) {
             if (!parsed.teachers.find((t:any) => t.name === dt.name)) {
                parsed.teachers.push(dt);
             }
          }
       }
       return parsed;
    }
  } catch {}
  
  return {
    _version: MATRIX_VERSION,
    classes:  DEFAULT_CLASSES,
    subjects: DEFAULT_SUBJECTS,
    teachers: DEFAULT_TEACHERS,
    rooms:    DEFAULT_ROOMS,
  };
}

export function saveMatrixStore(data: ReturnType<typeof loadMatrixStore>) {
  localStorage.setItem("sg_matrix", JSON.stringify({ ...data, _version: MATRIX_VERSION }));
}

export async function fetchMatrixStoreAsync() {
  try {
    const res = await fetch("http://localhost:8000/api/matrix");
    if (res.ok) {
      const data = await res.json();
      if (data && data.classes) {
        // Upgrade version and cache to localStorage
        const upgraded = { ...data, _version: MATRIX_VERSION };
        saveMatrixStore(upgraded);
        return upgraded;
      }
    }
  } catch (e) {
    console.error("Failed to fetch matrix from SQL DB", e);
  }
  return loadMatrixStore();
}

export async function saveMatrixStoreAsync(data: ReturnType<typeof loadMatrixStore>) {
  saveMatrixStore(data);
  try {
     await fetch("http://localhost:8000/api/matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, _version: MATRIX_VERSION })
     });
  } catch (e) {
     console.error("Failed to save matrix to SQL DB", e);
  }
}

// ═══════════════════════════════════════════════════════════════
export function MatrixPanel() {
  const [store, setStore] = useState(loadMatrixStore());
  const [isInitializing, setIsInitializing] = useState(true);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<"subjects"|"teachers"|"rooms">("subjects");
  const [editingTeacherIdx, setEditingTeacherIdx] = useState<number | null>(null);

  React.useEffect(() => {
    fetchMatrixStoreAsync().then((data) => {
      setStore(data);
      setIsInitializing(false);
    });
  }, []);

  // ── subject helpers ──
  const addSubject = () => {
    const updated = { ...store, subjects: [...store.subjects, { subject: "Новый предмет", hoursPerWeek: { "7": 2, "8": 2, "9": 2, "10": 2, "11": 2 } }] };
    setStore(updated);
  };
  const removeSubject = (i: number) => {
    const updated = { ...store, subjects: store.subjects.filter((_: any, idx: number) => idx !== i) };
    setStore(updated);
  };
  const updateSubject = (i: number, field: string, val: any) => {
    const subjects = store.subjects.map((s: any, idx: number) => idx === i ? { ...s, [field]: val } : s);
    setStore({ ...store, subjects });
  };

  // ── teacher helpers ──
  const toggleTeacherSubject = (tIdx: number, subj: string) => {
    const teachers = store.teachers.map((t: any, idx: number) => {
      if (idx !== tIdx) return t;
      const has = t.subjects.includes(subj);
      return { ...t, subjects: has ? t.subjects.filter((s: string) => s !== subj) : [...t.subjects, subj] };
    });
    setStore({ ...store, teachers });
  };

  const saveConfig = async () => {
    setSaved(true);
    await saveMatrixStoreAsync(store);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isInitializing) {
     return <div className="p-10 flex justify-center text-gray-500 font-bold animate-pulse">Загрузка матрицы из базы данных...</div>;
  }

  const ROOM_TYPE_BADGE: Record<string, string> = {
    classroom: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    lab:       "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    gym:       "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    techpark:  "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60">
        {[
          { id: "subjects", label: "Предметы и часы", icon: BookOpen },
          { id: "teachers", label: "Учителя",         icon: Users    },
          { id: "rooms",    label: "Кабинеты",         icon: DoorOpen },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSection(id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              section === id
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}

        <div className="ml-auto">
          <button
            onClick={saveConfig}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md ${
              saved
                ? "bg-emerald-500 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Сохранено!" : "Сохранить"}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* ── SUBJECTS ── */}
        {section === "subjects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest">
                Предметы и часы в неделю (по параллелям)
              </h3>
              <button onClick={addSubject} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all">
                <Plus className="w-3.5 h-3.5" /> Добавить
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
              Укажите количество уроков в неделю для каждого предмета по параллелям (7-11 классы). Алгоритм учтет их при генерации.
            </p>
            <div className="flex flex-col gap-3">
              <div className="hidden md:flex items-center px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-xl font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                 <div className="flex-1">Предмет</div>
                 <div className="flex gap-1 w-[260px] justify-between pr-8">
                    <span className="w-9 text-center text-blue-600 dark:text-blue-400">7 кл</span>
                    <span className="w-9 text-center text-blue-600 dark:text-blue-400">8 кл</span>
                    <span className="w-9 text-center text-blue-600 dark:text-blue-400">9 кл</span>
                    <span className="w-9 text-center text-blue-600 dark:text-blue-400">10 кл</span>
                    <span className="w-9 text-center text-blue-600 dark:text-blue-400">11 кл</span>
                 </div>
              </div>

              {store.subjects.map((s: any, i: number) => (
                <div key={i} className="flex flex-col md:flex-row items-center gap-3 bg-gray-50 dark:bg-slate-800 p-3 rounded-2xl border border-gray-100 dark:border-slate-700 group">
                  <div className="flex items-center gap-3 flex-1 w-full">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <input
                      value={s.subject}
                      onChange={e => updateSubject(i, "subject", e.target.value)}
                      className="flex-1 bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none min-w-0"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                    {["7", "8", "9", "10", "11"].map(grade => (
                      <div key={grade} className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-gray-400 md:hidden mb-1">{grade} кл</span>
                        <input 
                           type="number" min={0} max={15}
                           value={s.hoursPerWeek?.[grade] ?? 0}
                           onChange={e => {
                              const hrs = { ...s.hoursPerWeek, [grade]: Number(e.target.value) };
                              updateSubject(i, "hoursPerWeek", hrs);
                           }}
                           className="w-8 md:w-10 text-center font-black text-blue-600 dark:text-blue-400 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded outline-none py-1 focus:border-blue-500"
                        />
                      </div>
                    ))}
                    <button onClick={() => removeSubject(i)} className="ml-2 text-red-400 hover:text-red-600 transition-all opacity-100 md:opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TEACHERS ── */}
        {section === "teachers" && (
          <div className="space-y-3">
            <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-4">
              Матрица компетенций учителей
            </h3>
            <div className="space-y-3">
              {store.teachers.map((t: any, tIdx: number) => (
                <div key={tIdx} className="bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="font-black text-gray-900 dark:text-white text-sm">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold">Неделя:</span>
                        <input
                          type="number" min={1} max={40}
                          value={t.maxHoursPerWeek ?? (t.maxHoursPerDay * 5)}
                          onChange={e => {
                            const teachers = store.teachers.map((tt: any, i: number) =>
                              i === tIdx ? { ...tt, maxHoursPerWeek: Number(e.target.value) } : tt
                            );
                            setStore({ ...store, teachers });
                          }}
                          className="w-12 text-center text-xs font-black bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg py-1 outline-none focus:border-blue-500 dark:text-white"
                        />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold">День:</span>
                        <input
                          type="number" min={1} max={10}
                          value={t.maxHoursPerDay}
                          onChange={e => {
                            const teachers = store.teachers.map((tt: any, i: number) =>
                              i === tIdx ? { ...tt, maxHoursPerDay: Number(e.target.value) } : tt
                            );
                            setStore({ ...store, teachers });
                          }}
                          className="w-12 text-center text-xs font-black bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg py-1 outline-none focus:border-blue-500 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {t.subjects.map((subj: string) => (
                      <span key={subj} className={`relative group px-2.5 py-1 rounded-lg text-[11px] font-bold shadow ${editingTeacherIdx === tIdx ? "bg-indigo-600 text-white pr-6" : "bg-indigo-600 text-white"}`}>
                        {subj}
                        {editingTeacherIdx === tIdx && (
                           <button onClick={() => toggleTeacherSubject(tIdx, subj)} className="absolute top-1 right-1 w-4 h-4 bg-red-400/80 rounded-full text-white flex items-center justify-center hover:bg-red-500 transition-colors">
                             <Trash2 className="w-2.5 h-2.5" />
                           </button>
                        )}
                      </span>
                    ))}
                    
                    {editingTeacherIdx === tIdx ? (
                      <div className="flex items-center gap-2 ml-1">
                        <select 
                          onChange={e => { 
                            if (e.target.value) toggleTeacherSubject(tIdx, e.target.value); 
                            e.target.value = ""; 
                          }} 
                          className="text-[11px] font-bold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg py-1 px-2 outline-none text-indigo-600 dark:text-indigo-400 shadow-sm"
                          defaultValue=""
                        >
                          <option value="" disabled>+ Предмет</option>
                          {store.subjects.filter((s:any) => !t.subjects.includes(s.subject)).map((s:any) => (
                            <option key={s.subject} value={s.subject}>{s.subject}</option>
                          ))}
                        </select>
                        <button onClick={() => setEditingTeacherIdx(null)} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-200 transition-colors">
                           Готово
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingTeacherIdx(tIdx)} className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center text-gray-500 dark:text-slate-400 transition-colors">
                         <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ROOMS ── */}
        {section === "rooms" && (
          <div className="space-y-3">
            <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-4">
              Матрица помещений
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {store.rooms.map((r: any, i: number) => (
                <div key={i} className="bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-gray-900 dark:text-white text-sm">{r.name}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${ROOM_TYPE_BADGE[r.type]}`}>
                      {r.type === "classroom" ? "Класс" : r.type === "lab" ? "Лаборатория" : r.type === "gym" ? "Спортзал" : "Технопарк"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400">
                    <Users className="w-3 h-3" />
                    <span>до {r.capacity} чел.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
