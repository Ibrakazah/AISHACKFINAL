// ── Задача 3 ── Конфигуратор «лент» (Уровневые + Профильные)
import React, { useState } from "react";
import { Plus, Trash2, Zap, Info, CheckCircle2, Save, GraduationCap, ChevronDown } from "lucide-react";
import { loadMatrixStore } from "./MatrixPanel";

const DAYS = ["Понедельник","Вторник","Среда","Четверг","Пятница"];
const TIME_SLOTS = [
  "08:00-08:45","09:05-09:50","10:10-10:55","11:00-11:45","11:50-12:35",
  "13:05-13:50","14:20-15:00","15:05-15:45","16:00-16:45","16:45-17:30",
];

const ALL_CLASSES = ["7A","7B","7C","8A","8B","8C","8Д","9A","9B","10A","10B","11A","11B"];
const LEVEL_PRESETS = ["Beginner","Pre-Intermediate","Intermediate","Upper-Intermediate"];

// Type: "level" = same subject, different levels (English)
// Type: "profile" = different subjects per group (ҰБТ profile selection)
export type LentType = "level" | "profile";

export interface LentGroup {
  name: string;     // group name (e.g. "Beginner" or "Физика-Математика")
  subject: string;  // for profile lents: each group has its own subject
  teacher: string;
  room: string;
}

export interface LentConfig {
  id: string;
  type: LentType;
  parallelClasses: string[];
  subject: string;        // for level lents: the one shared subject
  hoursPerWeek: number;   // number of times this lent occurs in the week
  groups: number;
  groupNames: string[];   // kept for backward compat with generator
  groupData: LentGroup[]; // new: full per-group detail
  teachers: string[];     // kept for backward compat
  rooms: string[];        // kept for backward compat
}

const DEFAULT_LENTS: LentConfig[] = [
  {
    id: "lent-1",
    type: "level",
    parallelClasses: ["7A","7B","7C"],
    subject: "Ағылшын тілі",
    groups: 4,
    groupNames: ["Beginner","Pre-Intermediate","Intermediate","Upper-Intermediate"],
    groupData: [
      { name: "Beginner",           subject: "Ағылшын тілі", teacher: "Қайыржанова А.",   room: "304" },
      { name: "Pre-Intermediate",   subject: "Ағылшын тілі", teacher: "Таңатар М.М.",     room: "305" },
      { name: "Intermediate",       subject: "Ағылшын тілі", teacher: "Ақырап А.",        room: "302" },
      { name: "Upper-Intermediate", subject: "Ағылшын тілі", teacher: "",                 room: "301" },
    ],
    hoursPerWeek: 1,
    teachers: ["Қайыржанова А.","Таңатар М.М.","Ақырап А.",""],
    rooms: ["304","305","302","301"],
  },
  {
    id: "lent-2",
    type: "profile",
    parallelClasses: ["10A","10B"],
    subject: "Профильная лента",
    groups: 4,
    groupNames: ["Физ-Мат","Биол-Хим","История","Информатика"],
    groupData: [
      { name: "Физ-Мат",     subject: "Физика",      teacher: "Сулейманов Б.",        room: "209" },
      { name: "Биол-Хим",   subject: "Биология",    teacher: "Назаров Д.",           room: "201" },
      { name: "История",    subject: "Дүниежүзі тарихы", teacher: "Балтабай Ж.",     room: "301" },
      { name: "Информатика",subject: "Информатика",  teacher: "Ахметова И.",         room: "107" },
    ],
    hoursPerWeek: 1,
    teachers: ["Сулейманов Б.","Назаров Д.","Балтабай Ж.","Ахметова И."],
    rooms: ["209","201","301","107"],
  },
];

function loadLents(): LentConfig[] {
  try {
    const raw = localStorage.getItem("sg_lents_v2");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_LENTS;
}

function saveLents(lents: LentConfig[]) {
  localStorage.setItem("sg_lents_v2", JSON.stringify(lents));
  // Also write legacy format for generator compatibility
  const legacy = lents.map(l => ({
    ...l,
    teachers: l.groupData.map(g => g.teacher),
    rooms: l.groupData.map(g => g.room),
    groupNames: l.groupData.map(g => g.name),
    // For profile lents, subject per group is embedded in groupData
  }));
  localStorage.setItem("sg_lents", JSON.stringify(legacy));
}

export function loadLentsForGenerator(): LentConfig[] {
  return loadLents();
}

// ═══════════════════════════════════════════════════════════════
export function LentPanel() {
  const [lents, setLents] = useState<LentConfig[]>(loadLents());
  const [saved, setSaved] = useState(false);

  // Pull subject & teacher lists from the matrix store
  const matrix = loadMatrixStore();
  const subjectPool: string[] = matrix.subjects.map((s: any) => s.subject).sort();
  const teacherPool: string[] = matrix.teachers.map((t: any) => t.name).sort();
  const roomPool: string[] = matrix.rooms.map((r: any) => r.name).sort();

  const addLent = (type: LentType) => {
    if (type === "level") {
      const newLent: LentConfig = {
        id: `lent-${Date.now()}`,
        type: "level",
        parallelClasses: [],
        subject: "Ағылшын тілі",
        groups: 3,
        groupNames: ["Beginner","Intermediate","Upper"],
        groupData: [
          { name: "Beginner",     subject: "Ағылшын тілі", teacher: "", room: "" },
          { name: "Intermediate", subject: "Ағылшын тілі", teacher: "", room: "" },
          { name: "Upper",        subject: "Ағылшын тілі", teacher: "", room: "" },
        ],
        hoursPerWeek: 1,
        teachers: ["","",""],
        rooms: ["","",""],
      };
      setLents(prev => [...prev, newLent]);
    } else {
      const newLent: LentConfig = {
        id: `lent-${Date.now()}`,
        type: "profile",
        parallelClasses: [],
        subject: "Профильная лента",
        groups: 3,
        groupNames: ["Профиль 1","Профиль 2","Профиль 3"],
        groupData: [
          { name: "Профиль 1", subject: "", teacher: "", room: "" },
          { name: "Профиль 2", subject: "", teacher: "", room: "" },
          { name: "Профиль 3", subject: "", teacher: "", room: "" },
        ],
        hoursPerWeek: 1,
        teachers: ["","",""],
        rooms: ["","",""],
      };
      setLents(prev => [...prev, newLent]);
    }
  };

  const removeLent = (id: string) => setLents(prev => prev.filter(l => l.id !== id));

  const updateLent = (id: string, field: keyof LentConfig, value: any) => {
    setLents(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const updateGroupData = (lentId: string, gi: number, field: keyof LentGroup, value: string) => {
    setLents(prev => prev.map(l => {
      if (l.id !== lentId) return l;
      const groupData = l.groupData.map((g, i) => i === gi ? { ...g, [field]: value } : g);
      // keep backward-compat arrays in sync
      const teachers = groupData.map(g => g.teacher);
      const rooms = groupData.map(g => g.room);
      const groupNames = groupData.map(g => g.name);
      return { ...l, groupData, teachers, rooms, groupNames };
    }));
  };

  const toggleClass = (lentId: string, cls: string) => {
    setLents(prev => prev.map(l => {
      if (l.id !== lentId) return l;
      const has = l.parallelClasses.includes(cls);
      return { ...l, parallelClasses: has ? l.parallelClasses.filter(c => c !== cls) : [...l.parallelClasses, cls] };
    }));
  };

  const handleGroupsChange = (lentId: string, count: number) => {
    setLents(prev => prev.map(l => {
      if (l.id !== lentId) return l;
      const groupData = Array.from({ length: count }, (_, i) => {
        if (l.groupData[i]) return l.groupData[i];
        if (l.type === "level") {
          return { name: LEVEL_PRESETS[i] ?? `Группа ${i+1}`, subject: l.subject, teacher: "", room: "" };
        }
        return { name: `Профиль ${i+1}`, subject: "", teacher: "", room: "" };
      });
      return {
        ...l,
        groups: count,
        groupData,
        groupNames: groupData.map(g => g.name),
        teachers: groupData.map(g => g.teacher),
        rooms: groupData.map(g => g.room),
      };
    }));
  };

  const handleSave = () => {
    saveLents(lents);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Info card */}
      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/50 p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-black text-purple-900 dark:text-purple-300 text-sm uppercase tracking-widest mb-1">Лента — два типа</h3>
          <div className="space-y-1">
            <p className="text-xs text-purple-700 dark:text-purple-400 leading-relaxed">
              <strong>🎯 Уровневая</strong> — классы делятся по уровню знания (Beginner/Intermediate). Один предмет — разная сложность.
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-400 leading-relaxed">
              <strong>📚 Профильная</strong> — ученики 10А/10Б/11А выбрали разные профили ҰБТ. Одновременно расходятся по разным предметам и кабинетам.
            </p>
          </div>
        </div>
      </div>

      {/* Lent cards */}
      {lents.map((lent, lentIdx) => (
        <div key={lent.id} className={`bg-white dark:bg-slate-900 rounded-3xl shadow-xl border overflow-hidden ${
          lent.type === "profile"
            ? "border-amber-200 dark:border-amber-900/50"
            : "border-purple-200 dark:border-slate-800"
        }`}>
          {/* Card header */}
          <div className={`flex items-center justify-between p-5 border-b ${
            lent.type === "profile"
              ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-100 dark:border-amber-900/40"
              : "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-100 dark:border-purple-900/40"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow ${
                lent.type === "profile"
                  ? "bg-gradient-to-br from-amber-500 to-orange-600"
                  : "bg-gradient-to-br from-purple-600 to-indigo-600"
              }`}>
                {lent.type === "profile"
                  ? <GraduationCap className="w-4 h-4 text-white" />
                  : <Zap className="w-4 h-4 text-white" />
                }
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${
                  lent.type === "profile" ? "text-amber-600 dark:text-amber-400" : "text-purple-600 dark:text-purple-400"
                }`}>
                  {lent.type === "profile" ? "📚 Профильная" : "🎯 Уровневая"} / Лента #{lentIdx + 1}
                </p>
                <input
                  value={lent.subject}
                  onChange={e => updateLent(lent.id, "subject", e.target.value)}
                  className="font-black text-gray-900 dark:text-white text-sm bg-transparent outline-none border-b border-transparent focus:border-purple-400 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle type */}
              <button
                onClick={() => updateLent(lent.id, "type", lent.type === "level" ? "profile" : "level")}
                className="text-xs px-3 py-1.5 rounded-xl font-bold border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-purple-400 transition-all"
                title="Сменить тип ленты"
              >
                Сменить тип
              </button>
              <button onClick={() => removeLent(lent.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Step 1: select classes */}
            <div>
              <label className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
                1. Параллельные классы
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_CLASSES.map(cls => (
                  <button
                    key={cls}
                    onClick={() => toggleClass(lent.id, cls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                      lent.parallelClasses.includes(cls)
                        ? lent.type === "profile"
                          ? "bg-amber-500 text-white border-amber-400 shadow"
                          : "bg-purple-600 text-white border-purple-500 shadow"
                        : "bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-purple-400 hover:text-purple-600"
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
              {lent.parallelClasses.length > 0 && (
                <p className={`text-xs font-bold mt-2 ${lent.type === "profile" ? "text-amber-600 dark:text-amber-400" : "text-purple-600 dark:text-purple-400"}`}>
                  ✓ {lent.parallelClasses.join(", ")} — {lent.parallelClasses.length} кл. / ~{lent.parallelClasses.length * 25} учеников
                </p>
              )}
            </div>

            {/* Step 2: groups count */}
            <div>
              <label className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
                2. Количество {lent.type === "profile" ? "профилей (групп)" : "уровневых групп"}
              </label>
              <div className="flex gap-2">
                {[2,3,4,5,6].map(n => (
                  <button
                    key={n}
                    onClick={() => handleGroupsChange(lent.id, n)}
                    className={`w-10 h-10 rounded-xl font-black text-sm transition-all border ${
                      lent.groups === n
                        ? lent.type === "profile"
                          ? "bg-amber-500 text-white border-amber-400 shadow"
                          : "bg-purple-600 text-white border-purple-500 shadow"
                        : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-purple-400"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Hours Per Week */}
            <div>
              <label className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
                3. Количество уроков этой ленты в неделю
              </label>
              <div className="flex gap-2">
                {[1,2,3,4,5,6].map(n => (
                  <button
                    key={n}
                    onClick={() => updateLent(lent.id, "hoursPerWeek", n)}
                    className={`w-10 h-10 rounded-xl font-black text-sm transition-all border ${
                      (lent.hoursPerWeek || 1) === n
                        ? lent.type === "profile"
                          ? "bg-amber-500 text-white border-amber-400 shadow"
                          : "bg-purple-600 text-white border-purple-500 shadow"
                        : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-purple-400"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: groups detail */}
            <div>
              <label className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3 block">
                4. {lent.type === "profile" ? "Профили → Предмет / Учитель / Кабинет" : "Группы → Учитель / Кабинет"}
              </label>
              <div className="space-y-2">
                {lent.groupData.map((group, gi) => (
                  <div key={gi} className={`rounded-2xl border p-3 ${
                    lent.type === "profile"
                      ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30"
                      : "bg-purple-50/50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/30"
                  }`}>
                    <div className={`grid gap-2 ${lent.type === "profile" ? "grid-cols-[1fr_1.5fr_1.5fr_1fr]" : "grid-cols-[1fr_1.5fr_1fr]"}`}>
                      {/* Group name */}
                      <input
                        value={group.name}
                        onChange={e => updateGroupData(lent.id, gi, "name", e.target.value)}
                        placeholder={lent.type === "profile" ? "Профиль" : "Уровень"}
                        className={`rounded-xl px-3 py-2 text-xs font-black text-white outline-none transition-all ${
                          lent.type === "profile"
                            ? "bg-amber-500 placeholder-amber-200"
                            : "bg-purple-600 placeholder-purple-300"
                        }`}
                      />
                      {/* Subject — only for profile lents: select from limited pool for ENT */}
                      {lent.type === "profile" && (
                        <div className="relative">
                          <select
                            value={group.subject}
                            onChange={e => updateGroupData(lent.id, gi, "subject", e.target.value)}
                            className="w-full appearance-none bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 pr-7 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all"
                          >
                            <option value="">— Предмет ЕНТ —</option>
                            {subjectPool
                              .filter(s => {
                                const allowed = ["география", "орыс тілі мен әдебиеті", "физика", "информатика", "химия", "дүниежүзі тарихы", "дүние жүзі тарихы"];
                                return allowed.includes(s.toLowerCase());
                              })
                              .map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))
                            }
                          </select>
                          <ChevronDown className="w-3 h-3 text-amber-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}
                      {/* Teacher — select from pool, filtered by subject */}
                      <div className="relative">
                        <select
                          value={group.teacher}
                          onChange={e => updateGroupData(lent.id, gi, "teacher", e.target.value)}
                          className="w-full appearance-none bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-7 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-purple-500 transition-all"
                        >
                          <option value="">— Учитель —</option>
                          {matrix.teachers
                            .filter((t: any) => {
                              const s = (lent.type === "profile" ? group.subject : lent.subject)?.toLowerCase();
                              if (!s) return true;

                              return t.subjects.some((sub: string) => {
                                const subL = sub.toLowerCase();
                                if (subL.includes(s)) return true;
                                if (s.includes(subL)) return true;
                                
                                // Advanced matching for UBT/ENT specializations (e.g. "ҰБТ ДЖ.тарих" for "Дүниежүзі тарихы")
                                if (subL.includes("ұбт") || subL.includes("ент") || subL.includes("убт")) {
                                  // Common abbreviations
                                  if (s.includes("тарих") && (subL.includes("тарих") || subL.includes("т-х"))) return true;
                                  if (s.includes("физика") && subL.includes("физ")) return true;
                                  if (s.includes("информатика") && subL.includes("инф")) return true;
                                  if (s.includes("химия") && subL.includes("хим")) return true;
                                  if (s.includes("география") && subL.includes("гео")) return true;
                                  if (s.includes("орыс") && subL.includes("ор")) return true;
                                }
                                return false;
                              });
                            })
                            .sort((a: any, b: any) => a.name.localeCompare(b.name))
                            .map((t: any) => (
                              <option key={t.name} value={t.name}>{t.name}</option>
                            ))
                          }
                        </select>
                        <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {/* Room — select from pool */}
                      <div className="relative">
                        <select
                          value={group.room}
                          onChange={e => updateGroupData(lent.id, gi, "room", e.target.value)}
                          className="w-full appearance-none bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-7 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-purple-500 transition-all"
                        >
                          <option value="">— Каб. —</option>
                          {roomPool.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    {lent.type === "profile" && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                        Ученики этой группы одновременно идут на <strong>{group.subject || "..."}</strong> в каб. <strong>{group.room || "..."}</strong>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className={`rounded-2xl p-3 flex items-center gap-3 border ${
              lent.type === "profile"
                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40"
                : "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40"
            }`}>
              <Info className={`w-4 h-4 flex-shrink-0 ${lent.type === "profile" ? "text-amber-500" : "text-indigo-500"}`} />
              <p className={`text-xs font-medium ${lent.type === "profile" ? "text-amber-700 dark:text-amber-300" : "text-indigo-700 dark:text-indigo-300"}`}>
                {lent.type === "profile"
                  ? <>При генерации: <strong>{lent.hoursPerWeek || 1} раз(а) в неделю</strong> — ученики классов{" "}
                    <strong>{lent.parallelClasses.join(", ")}</strong> расходятся по {lent.groups} профильным предметам одновременно.</>
                  : <>При генерации: <strong>{lent.hoursPerWeek || 1} раз(а) в неделю</strong> будет заблокирован для{" "}
                    {lent.parallelClasses.slice(0,3).join(", ")}{lent.parallelClasses.length > 3 ? "..." : ""} — {lent.groups} групп параллельно.</>
                }
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => addLent("level")}
          className="flex items-center gap-2 px-5 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-100 transition-all"
        >
          <Plus className="w-4 h-4" /> Уровневая лента
        </button>
        <button
          onClick={() => addLent("profile")}
          className="flex items-center gap-2 px-5 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-100 transition-all"
        >
          <GraduationCap className="w-4 h-4" /> Профильная лента (ҰБТ)
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ml-auto ${
            saved ? "bg-emerald-500 text-white" : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
          }`}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Сохранено!" : "Сохранить ленты"}
        </button>
      </div>
    </div>
  );
}
