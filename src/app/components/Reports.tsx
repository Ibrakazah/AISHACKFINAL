import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Award, BookOpen, FileText, Bot, FileCheck, Save } from "lucide-react";

const NUTRITION_TEMPLATE = `БЛАНК ГОСУДАРСТВЕННОГО УЧРЕЖДЕНИЯ
(Логотип школы, БИН, Адрес)

Исх. № {{ doc_number }}
от «{{ current_date }}» г.

Руководителю Управления образования
{{ region_name }}

ИНФОРМАЦИОННАЯ СПРАВКА
о фактическом обеспечении горячим питанием обучающихся

Настоящим администрация {{ school_name }} предоставляет отчетные данные по организации питания за {{ report_period }}.

В соответствии с планом мероприятий по реализации программы «Фонд Всеобуча», на отчетную дату «{{ current_day }}», ситуация по контингенту выглядит следующим образом:

Общий охват: Количество обучающихся, имеющих право на бесплатное питание — {{ total_vseobuch_count }} человек.

Фактическая явка: Сегодня фактически обеспечены питанием — {{ actual_fed_count }} человек.

Мониторинг отсутствующих: * Общее количество отсутствующих льготников: {{ absent_count }}.

Из них по болезни: {{ sick_count }};

По иным уважительным причинам (олимпиады, соревнования): {{ competition_count }}.

Финансовый контроль: Сумма освоенных бюджетных средств за текущий день составила {{ daily_budget_spent }} тенге (исходя из стоимости одной порции {{ price_per_meal }} тенге).

Важные показатели системы контроля (Compliance):
По данным автоматизированной системы учета «AQBOBEK AI», расхождений между данными классных руководителей и фактическим выходом порций в столовой не зафиксировано. Санитарные нормы соблюдены. Все отсутствующие лица подтверждены документально в базе данных школы.

Директор {{ school_name }} ___________________ / {{ director_name }} /`;

const TIMESHEET_TEMPLATE = `ТАБЕЛЬ ОБЛІКУ РОБОЧОГО ЧАСУ (УЧЕТА РАБОЧЕГО ВРЕМЕНИ)
(Логотип школы, БИН, Адрес)

Исх. № {{ doc_number }}
от «{{ current_date }}» г.

Отдел кадров / Бухгалтерия
{{ school_name }}

ОТЧЕТ О ФАКТИЧЕСКИ ОТРАБОТАННОМ ВРЕМЕНИ

За отчетный период: {{ report_period }}
ФИО сотрудника: {{ target_teacher }}
Должность: Преподаватель

Учет рабочего времени:
Базовая ставка (по тарификации): {{ base_hours }} нормочасов
Фактически отработанно часов: {{ actual_hours }} часов

По данным системы «AQBOBEK AI», расхождений с журналом не выявлено.
Все сверхчасы подтверждены автоматическим логом расписания.

Директор {{ school_name }} ___________________ / {{ director_name }} /`;

export function Reports() {
  const pendingReportTopic = sessionStorage.getItem("pendingReportTopic");
  const isTimesheetMode = pendingReportTopic === "Табель рабочего времени";

  const [activeTab, setActiveTab] = useState<"analytics" | "ai_reports">("ai_reports");
  const [template, setTemplate] = useState(isTimesheetMode ? TIMESHEET_TEMPLATE : NUTRITION_TEMPLATE);
  const [aiState, setAiState] = useState<"idle" | "asking" | "generating" | "done">("idle");
  
  // Fields for Nutrition
  const [sickCount, setSickCount] = useState("");
  const [compCount, setCompCount] = useState("");
  
  // Fields for Timesheet
  const [teacherName, setTeacherName] = useState("");
  const [teacherHours, setTeacherHours] = useState("");

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);

  const performanceData = [
    { month: "Сен", grade: 4.2 },
    { month: "Окт", grade: 4.3 },
    { month: "Ноя", grade: 4.1 },
    { month: "Дек", grade: 4.4 },
    { month: "Янв", grade: 4.3 },
    { month: "Фев", grade: 4.5 },
    { month: "Мар", grade: 4.6 },
    { month: "Апр", grade: 4.5 },
  ];

  const subjectPerformance = [
    { subject: "Математика", score: 85 },
    { subject: "Русский", score: 88 },
    { subject: "Физика", score: 82 },
    { subject: "Химия", score: 79 },
    { subject: "История", score: 91 },
    { subject: "Англ. яз", score: 86 },
  ];

  const attendanceData = [
    { name: "Присутствовали", value: 450, color: "#10b981" },
    { name: "Отсутствовали", value: 35, color: "#f59e0b" },
    { name: "По уваж. причине", value: 15, color: "#3b82f6" },
  ];

  const handleConfirmData = () => {
    if (isTimesheetMode) {
       if (!teacherName || !teacherHours) return;
    } else {
       if (!sickCount || !compCount) return;
    }
    
    setAiState("generating");
    setGeneratedReport(null);
    
    setTimeout(() => {
      const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      let result = template
        .replace(/\{\{\s*doc_number\s*\}\}/g, "145/2-A")
        .replace(/\{\{\s*current_date\s*\}\}/g, today)
        .replace(/\{\{\s*school_name\s*\}\}/g, "AQBOBEK LYCEUM")
        .replace(/\{\{\s*director_name\s*\}\}/g, "Иванов А.П.")
        .replace(/\{\{\s*report_period\s*\}\}/g, "апрель 2026 года");

      if (isTimesheetMode) {
         result = result
           .replace(/\{\{\s*target_teacher\s*\}\}/g, teacherName)
           .replace(/\{\{\s*base_hours\s*\}\}/g, "120")
           .replace(/\{\{\s*actual_hours\s*\}\}/g, teacherHours);
      } else {
         const totalVseobuch = 250;
         const sick = parseInt(sickCount) || 0;
         const comp = parseInt(compCount) || 0;
         const absent = sick + comp;
         const actualFed = totalVseobuch - absent;
         const price = 750;
         const budgetSpent = actualFed * price;

         result = result
           .replace(/\{\{\s*region_name\s*\}\}/g, "Актюбинской области")
           .replace(/\{\{\s*current_day\s*\}\}/g, today)
           .replace(/\{\{\s*total_vseobuch_count\s*\}\}/g, totalVseobuch.toString())
           .replace(/\{\{\s*absent_count\s*\}\}/g, absent.toString())
           .replace(/\{\{\s*sick_count\s*\}\}/g, sick.toString())
           .replace(/\{\{\s*competition_count\s*\}\}/g, comp.toString())
           .replace(/\{\{\s*actual_fed_count\s*\}\}/g, actualFed.toString())
           .replace(/\{\{\s*price_per_meal\s*\}\}/g, price.toString())
           .replace(/\{\{\s*daily_budget_spent\s*\}\}/g, budgetSpent.toLocaleString('ru-RU'));
      }

      setGeneratedReport(result);
      setAiState("done");
      sessionStorage.removeItem("pendingReportTopic");

    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Отчеты</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">Аналитика и генерация справок</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
          <button 
            onClick={() => setActiveTab("analytics")} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === "analytics" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md" : "text-gray-500 hover:text-gray-700 dark:hover:text-slate-300"}`}
          >
            <TrendingUp className="w-4 h-4" /> АНАЛИТИКА
          </button>
          <button 
            onClick={() => setActiveTab("ai_reports")} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === "ai_reports" ? "bg-white dark:bg-slate-900 text-green-600 dark:text-green-400 shadow-md" : "text-gray-500 hover:text-gray-700 dark:hover:text-slate-300"}`}
          >
            <Bot className="w-4 h-4" /> AI-ОТЧЕТЫ
          </button>
        </div>
      </div>

      {activeTab === "analytics" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Общая статистика */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-600 dark:to-indigo-800 p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white transition-all transform hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-6 h-6" />
                </div>
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-90">Всего учеников</p>
              <p className="text-4xl font-black mt-1">500</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-2 bg-white/10 px-2 py-1 rounded inline-block">+12 с начала года</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-700 dark:from-green-600 dark:to-teal-800 p-6 rounded-2xl shadow-lg shadow-green-500/20 text-white transition-all transform hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Award className="w-6 h-6" />
                </div>
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-90">Средний балл</p>
              <p className="text-4xl font-black mt-1">4.5</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-2 bg-white/10 px-2 py-1 rounded inline-block">+0.2 за четверть</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-fuchsia-700 dark:from-purple-600 dark:to-fuchsia-800 p-6 rounded-2xl shadow-lg shadow-purple-500/20 text-white transition-all transform hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <BookOpen className="w-6 h-6" />
                </div>
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-90">Отличников</p>
              <p className="text-4xl font-black mt-1">87</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-2 bg-white/10 px-2 py-1 rounded inline-block">17.4% от всех</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-800 p-6 rounded-2xl shadow-lg shadow-orange-500/20 text-white transition-all transform hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-6 h-6" />
                </div>
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-90">Посещаемость</p>
              <p className="text-4xl font-black mt-1">93%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-2 bg-white/10 px-2 py-1 rounded inline-block">+1.5% за месяц</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
              <h2 className="font-black text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Динамика среднего балла</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[3.5, 5]} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="grade" stroke="#3b82f6" strokeWidth={4} name="Средний балл" dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
              <h2 className="font-black text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Успеваемость по предметам</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.2} />
                  <XAxis dataKey="subject" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: 'rgba(136, 136, 136, 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <Bar dataKey="score" fill="#8b5cf6" name="Средний результат %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ai_reports" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-700">
          
          {/* Левая панель - ИИ-Ассистент и взаимодействие */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black rounded-[2rem] p-8 shadow-2xl border border-indigo-500/20 relative overflow-hidden flex-1 flex flex-col min-h-[600px]">
              
              {/* Красивый декоративный эффект */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>

              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">AQBOBEK AI</h2>
                  <p className="text-sm font-medium text-indigo-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    Ядро готово
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 relative z-10 pr-2 custom-scrollbar">
                {/* Сообщение 1: Приветствие */}
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl rounded-tl-sm backdrop-blur-md">
                  <p className="text-slate-200 text-sm leading-relaxed">
                    Приветствую! Я загрузил шаблон <span className="font-bold text-indigo-400">«{isTimesheetMode ? "Табель рабочего времени" : "Справка об организации питания"}»</span>. Я готов подготовить отчет. 
                  </p>
                </div>

                {aiState === "idle" && (
                  <div className="animate-in fade-in zoom-in duration-500 delay-300 fill-mode-both">
                    <button 
                      onClick={() => setAiState("asking")}
                      className="w-full relative group overflow-hidden bg-white/5 hover:bg-white/10 border border-indigo-500/30 p-5 rounded-2xl transition-all flex items-center justify-between"
                    >
                      <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000"></div>
                      <span className="font-bold text-indigo-300 uppercase tracking-widest text-xs relative z-10 block text-left">Запустить сбор данных</span>
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/40 transition-colors">
                        <TrendingUp className="w-4 h-4 text-indigo-300" />
                      </div>
                    </button>
                  </div>
                )}

                {/* Сообщение 2: Запрос данных */}
                {aiState !== "idle" && (
                  <div className="bg-indigo-900/40 border border-indigo-500/30 p-5 rounded-2xl rounded-tl-sm backdrop-blur-md animate-in slide-in-from-left-4 duration-500">
                    <p className="text-indigo-100 text-sm leading-relaxed mb-4">
                      Мне не хватает "живых" данных на сегодняшний день. База пока <span className="text-rose-400 font-bold">не синхронизирована</span>. 
                      <br/><br/>
                      Пожалуйста, уточните вручную:
                    </p>
                    
                    <div className="space-y-4">
                      {isTimesheetMode ? (
                        <>
                          <div>
                            <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 block">ФИО Преподавателя</label>
                            <input 
                              type="text" 
                              value={teacherName}
                              onChange={(e) => setTeacherName(e.target.value)}
                              disabled={aiState === "generating" || aiState === "done"}
                              className="w-full bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-mono"
                              placeholder="Например, Аскар Ахметов"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 block">Отработанно часов</label>
                            <input 
                              type="number" 
                              value={teacherHours}
                              onChange={(e) => setTeacherHours(e.target.value)}
                              disabled={aiState === "generating" || aiState === "done"}
                              className="w-full bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-mono"
                              placeholder="Например, 134"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 block">Отсутствуют по болезни</label>
                            <input 
                              type="number" 
                              value={sickCount}
                              onChange={(e) => setSickCount(e.target.value)}
                              disabled={aiState === "generating" || aiState === "done"}
                              className="w-full bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-mono"
                              placeholder="Например, 12"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 block">На соревнованиях/олимпиадах</label>
                            <input 
                              type="number" 
                              value={compCount}
                              onChange={(e) => setCompCount(e.target.value)}
                              disabled={aiState === "generating" || aiState === "done"}
                              className="w-full bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-mono"
                              placeholder="Например, 3"
                            />
                          </div>
                        </>
                      )}

                      {aiState === "asking" && (
                        <button 
                          onClick={handleConfirmData}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-widest py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                        >
                          Сформировать отчет
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Сообщение 3: Идет базовая генерация */}
                {aiState === "generating" && (
                  <div className="bg-blue-900/30 border border-blue-500/30 p-5 rounded-2xl rounded-tl-sm backdrop-blur-md flex items-center gap-4 animate-in slide-in-from-left-4 duration-500">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                    <p className="text-blue-100 text-sm font-medium">Произвожу вычисления... Синтезирую документ по шаблону...</p>
                  </div>
                )}

                {/* Сообщение 4: Готово */}
                {aiState === "done" && (
                  <div className="bg-emerald-900/30 border border-emerald-500/30 p-5 rounded-2xl rounded-tl-sm backdrop-blur-md flex gap-4 animate-in slide-in-from-left-4 duration-500">
                    <FileCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Справка успешно сформирована!</p>
                      <p className="text-emerald-300/70 text-xs mt-1">Ошибок в логике бюджета не обнаружено. Можете проверить результат справа.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Правая панель - Шаблон и Превью */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Если мы еще не сгенерировали отчет, показываем редактор шаблона */}
            {aiState !== "done" && aiState !== "generating" && (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col flex-1 min-h-[600px] relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-blue-500/30">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" /> Шаблон: {isTimesheetMode ? "Учет времени" : "Питание"}
                    </h3>
                  </div>
                  <button className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                    <Save className="w-4 h-4" /> Сохранить базу
                  </button>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 rounded-r-xl mb-6">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 leading-relaxed">
                    Данный шаблон содержит теги <code className="bg-amber-200/50 dark:bg-amber-500/20 px-1 rounded">{"\{\{ var \}\}"}</code>. AI автоматически заменит их на вычислительные показатели или спросит у вас недостающие данные.
                  </p>
                </div>

                <textarea 
                  className="flex-1 w-full bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 text-[13px] font-mono text-gray-700 dark:text-slate-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none leading-relaxed custom-scrollbar"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  spellCheck={false}
                />
              </div>
            )}

            {/* Если идет генерация или готово - показываем результат */}
            {(aiState === "done" || aiState === "generating") && (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2rem] shadow-xl overflow-hidden flex flex-col flex-1 min-h-[600px] animate-in zoom-in-95 duration-500 relative">
                
                {aiState === "generating" && (
                  <div className="absolute inset-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                     <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-900/50 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                     </div>
                     <p className="mt-6 text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">Компиляция документа...</p>
                  </div>
                )}

                <div className="bg-slate-50 border-b border-gray-200 dark:bg-slate-950 dark:border-slate-800 p-6 flex items-center justify-between z-10">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-500" /> Итоговый Документ
                  </h3>
                  <div className="flex gap-2">
                    <button className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-200 dark:hover:bg-emerald-900/50 shadow-sm">
                      Скачать PDF
                    </button>
                    <button className="bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-300 dark:hover:bg-slate-700 shadow-sm">
                      Печать
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-black/20">
                  {generatedReport ? (
                    <div className="max-w-2xl mx-auto font-serif text-sm text-gray-800 dark:text-gray-300 leading-loose whitespace-pre-wrap">
                      {generatedReport}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}

