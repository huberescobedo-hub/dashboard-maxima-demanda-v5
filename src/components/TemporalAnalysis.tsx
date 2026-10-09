import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts';
import {
  Clock,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { PeakDemandRecord, AllRegionKey, DayOfWeek } from '../types';
import { MONTH_NAMES, DAYS_OF_WEEK } from '../data/demandData';
import { REGIONS_METADATA } from '../data/regions';

interface TemporalAnalysisProps {
  records: PeakDemandRecord[];
  currentRegion: AllRegionKey;
  onFilterByHour?: (hour: string) => void;
  onFilterByDay?: (day: DayOfWeek) => void;
}

export const TemporalAnalysis: React.FC<TemporalAnalysisProps> = ({
  records,
  currentRegion,
}) => {
  const [activeTab, setActiveTab] = useState<'hour' | 'day' | 'season' | 'weeks'>('hour');
  const [selectedDayMonth, setSelectedDayMonth] = useState<number>(0); // Default to TODOS (0) for Day of Week
  const [selectedWeekMonth, setSelectedWeekMonth] = useState<number>(8); // Default to Agosto (8)
  const regionInfo = REGIONS_METADATA[currentRegion];

  // 1. Hour Distribution
  const hourMap = new Map<string, { count: number; sumMW: number }>();
  records.forEach((r) => {
    const mw = r.regions[currentRegion]?.demandMW ?? r.nationalDemandMW;
    const cur = hourMap.get(r.time) || { count: 0, sumMW: 0 };
    cur.count += 1;
    cur.sumMW += mw;
    hourMap.set(r.time, cur);
  });

  const hourData = Array.from(hourMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, val]) => ({
      time: `${time}h`,
      rawTime: time,
      frecuencia: val.count,
      promedioMW: Math.round(val.sumMW / val.count),
    }));

  // 2. Day of Week Distribution (Filtered by selectedDayMonth, 0 = TODOS)
  const isAllDayMonths = selectedDayMonth === 0;
  const dayRecords = isAllDayMonths
    ? records
    : records.filter((r) => r.month === selectedDayMonth);
  const currentDayMonthName = isAllDayMonths
    ? 'Todos los Meses (Consolidado)'
    : MONTH_NAMES[selectedDayMonth - 1];

  const dayMap = new Map<DayOfWeek, { count: number; sumMW: number }>();
  DAYS_OF_WEEK.forEach((d) => dayMap.set(d, { count: 0, sumMW: 0 }));

  dayRecords.forEach((r) => {
    const mw = r.regions[currentRegion]?.demandMW ?? r.nationalDemandMW;
    const cur = dayMap.get(r.dayOfWeek) || { count: 0, sumMW: 0 };
    cur.count += 1;
    cur.sumMW += mw;
    dayMap.set(r.dayOfWeek, cur);
  });

  const dayData = DAYS_OF_WEEK.map((day) => {
    const val = dayMap.get(day) || { count: 0, sumMW: 0 };
    return {
      day,
      shortDay: day.slice(0, 3),
      frecuencia: val.count,
      promedioMW: val.count > 0 ? Math.round(val.sumMW / val.count) : 0,
      isWeekend: day === 'Sábado' || day === 'Domingo',
    };
  });

  // 3. Month Seasonality Distribution
  const monthMap = new Map<number, { count: number; sumMW: number }>();
  Array.from({ length: 12 }, (_, i) => i + 1).forEach((m) =>
    monthMap.set(m, { count: 0, sumMW: 0 })
  );

  records.forEach((r) => {
    const mw = r.regions[currentRegion]?.demandMW ?? r.nationalDemandMW;
    const cur = monthMap.get(r.month)!;
    cur.count += 1;
    cur.sumMW += mw;
  });

  const monthData = MONTH_NAMES.map((name, idx) => {
    const mNum = idx + 1;
    const val = monthMap.get(mNum)!;
    return {
      month: name,
      shortMonth: name.slice(0, 3),
      frecuencia: val.count,
      promedioMW: val.count > 0 ? Math.round(val.sumMW / val.count) : 0,
    };
  });

  // 4. Weekly Breakdown by Selected Month or All Months Consolidated (0 = TODOS)
  const isAllMonths = selectedWeekMonth === 0;
  const monthRecords = isAllMonths ? records : records.filter((r) => r.month === selectedWeekMonth);

  // Compute days in the selected month:
  // For 'TODOS': 5 weeks covering the consolidated calendar periods (01-07, 08-14, 15-21, 22-28, 29-31)
  let daysInSelectedMonth = 31;
  let numWeeks = 5;
  let currentMonthName = 'Todos los Meses (Consolidado)';

  if (!isAllMonths) {
    currentMonthName = MONTH_NAMES[selectedWeekMonth - 1];
    if (selectedWeekMonth === 2) {
      const hasLeapDay = monthRecords.some((r) => r.day >= 29);
      daysInSelectedMonth = hasLeapDay ? 29 : 28;
      numWeeks = daysInSelectedMonth > 28 ? 5 : 4;
    } else if ([4, 6, 9, 11].includes(selectedWeekMonth)) {
      daysInSelectedMonth = 30;
      numWeeks = 5;
    } else {
      daysInSelectedMonth = 31;
      numWeeks = 5;
    }
  }

  const weeksData = [];
  for (let w = 1; w <= numWeeks; w++) {
    const startDay = (w - 1) * 7 + 1;
    const endDay = w === numWeeks ? daysInSelectedMonth : w * 7;
    const startDayStr = String(startDay).padStart(2, '0');
    const endDayStr = String(endDay).padStart(2, '0');

    const matching = monthRecords.filter((r) => r.day >= startDay && r.day <= endDay);
    const count = matching.length;
    let sumMW = 0;
    let maxMW = 0;
    let maxRecordYear: number | null = null;
    const years: number[] = [];

    matching.forEach((r) => {
      const mw = r.regions[currentRegion]?.demandMW ?? r.nationalDemandMW;
      sumMW += mw;
      if (mw > maxMW) {
        maxMW = mw;
        maxRecordYear = r.year;
      }
      years.push(r.year);
    });

    years.sort((a, b) => a - b);
    const promedioMW = count > 0 ? Math.round(sumMW / count) : 0;

    weeksData.push({
      weekNumber: w,
      label: `Semana ${w}`,
      dateRange: `${startDayStr} - ${endDayStr}`,
      fullLabel: isAllMonths
        ? `Semana ${w} (${startDayStr} - ${endDayStr})`
        : `Semana ${w} (${startDayStr} - ${endDayStr} ${currentMonthName.slice(0, 3)})`,
      startDay,
      endDay,
      frecuencia: count,
      promedioMW,
      maxMW: Math.round(maxMW),
      maxRecordYear,
      years,
    });
  }

  // Dynamically compute peak/mode values for each dimension so colors adapt to real data and filters
  const maxHourFreq = hourData.length > 0 ? Math.max(...hourData.map((h) => h.frecuencia)) : 0;
  const maxDayFreq = dayData.length > 0 ? Math.max(...dayData.map((d) => d.frecuencia)) : 0;
  const maxMonthMW = monthData.length > 0 ? Math.max(...monthData.map((m) => m.promedioMW)) : 0;
  const maxWeekMW = weeksData.length > 0 ? Math.max(...weeksData.map((w) => w.promedioMW)) : 0;
  const maxWeekFreq = weeksData.length > 0 ? Math.max(...weeksData.map((w) => w.frecuencia)) : 0;

  const topHour = hourData.find((h) => h.frecuencia === maxHourFreq);
  const topDay = dayData.find((d) => d.frecuencia === maxDayFreq);
  const topWeek = weeksData.find((w) => w.promedioMW === maxWeekMW && maxWeekMW > 0);
  const topFreqWeek = weeksData.find((w) => w.frecuencia === maxWeekFreq && maxWeekFreq > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Análisis de Ocurrencia Temporal (Horas, Días, Meses y Semanas)
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
              Naranja = Mayor Concentración / Pico
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === 'weeks'
              ? `Distribución semanal de la máxima demanda para el mes de ${currentMonthName} (${weeksData.length} columnas)`
              : `Comportamiento y concentración temporal de los ${records.length} picos coincidentes del SEIN`}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('hour')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'hour'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hora Específica
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('day')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'day'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Día de Semana
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('season')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'season'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Estacionalidad Mensual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weeks')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'weeks'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            Semanas del Mes
          </button>
        </div>
      </div>

      {/* Month Dropdown Toolbar (Active when 'day' tab is chosen) */}
      {activeTab === 'day' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor="temporal-day-month-select"
              className="text-xs font-semibold text-slate-700 whitespace-nowrap flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Mes de Consulta:
            </label>

            {/* Dedicated "TODOS" Button */}
            <button
              type="button"
              id="btn-day-month-todos"
              onClick={() => setSelectedDayMonth(0)}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedDayMonth === 0
                  ? 'bg-amber-600 text-white shadow-2xs ring-2 ring-amber-500/30'
                  : 'bg-white border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 shadow-2xs'
              }`}
              title="Consultar consolidado global de todos los meses"
            >
              <Sparkles className="w-3 h-3 text-amber-200" />
              TODOS
            </button>

            <div className="relative inline-flex items-center">
              <select
                id="temporal-day-month-select"
                value={selectedDayMonth}
                onChange={(e) => setSelectedDayMonth(Number(e.target.value))}
                className="appearance-none bg-white border border-slate-300 hover:border-slate-400 text-slate-900 text-xs font-bold rounded-lg pl-3 pr-8 py-1.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value={0}>TODOS los Meses (Global Histórico)</option>
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Quick Prev / Next Month Buttons */}
            <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setSelectedDayMonth((prev) => (prev === 0 ? 12 : prev - 1))}
                className="px-2 py-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 text-xs transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDayMonth((prev) => (prev === 12 ? 0 : prev + 1))}
                className="px-2 py-1.5 hover:bg-slate-100 text-slate-600 text-xs transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              ({dayRecords.length} {isAllDayMonths ? 'picos totales' : `años / picos en ${currentDayMonthName}`})
            </span>
          </div>

          {/* Quick Highlight of the winning day of week */}
          {topDay && topDay.frecuencia > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100/90 border border-orange-200 text-orange-950 rounded-lg text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>
                {isAllDayMonths ? (
                  <>
                    Día con más picos global:{' '}
                    <strong className="text-orange-700 font-bold">{topDay.day}</strong>{' '}
                    con <strong className="text-orange-800 font-bold">{topDay.frecuencia} eventos ({Math.round((topDay.frecuencia / (dayRecords.length || 1)) * 100)}%)</strong>
                    {' '}y demanda promedio de <strong className="text-slate-800 font-bold">{topDay.promedioMW.toLocaleString()} MW</strong>
                  </>
                ) : (
                  <>
                    Día con más picos en {currentDayMonthName}:{' '}
                    <strong className="text-orange-700 font-bold">{topDay.day}</strong>{' '}
                    con <strong className="text-orange-800 font-bold">{topDay.frecuencia} {topDay.frecuencia === 1 ? 'evento' : 'eventos'} ({Math.round((topDay.frecuencia / (dayRecords.length || 1)) * 100)}%)</strong>
                    {' '}y demanda promedio de <strong className="text-slate-800 font-bold">{topDay.promedioMW.toLocaleString()} MW</strong>
                  </>
                )}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">
              Sin registros para este mes con los filtros actuales
            </div>
          )}
        </div>
      )}

      {/* Month Dropdown Toolbar (Active when 'weeks' tab is chosen) */}
      {activeTab === 'weeks' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor="temporal-month-select"
              className="text-xs font-semibold text-slate-700 whitespace-nowrap flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Mes de Consulta:
            </label>

            {/* Dedicated "TODOS" Button */}
            <button
              type="button"
              onClick={() => setSelectedWeekMonth(0)}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedWeekMonth === 0
                  ? 'bg-amber-600 text-white shadow-2xs ring-2 ring-amber-500/30'
                  : 'bg-white border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 shadow-2xs'
              }`}
              title="Consultar consolidado de todos los periodos y años"
            >
              <Sparkles className="w-3 h-3 text-amber-200" />
              TODOS
            </button>

            <div className="relative inline-flex items-center">
              <select
                id="temporal-month-select"
                value={selectedWeekMonth}
                onChange={(e) => setSelectedWeekMonth(Number(e.target.value))}
                className="appearance-none bg-white border border-slate-300 hover:border-slate-400 text-slate-900 text-xs font-bold rounded-lg pl-3 pr-8 py-1.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value={0}>TODOS los Meses (Consolidado 5 semanas)</option>
                {MONTH_NAMES.map((name, idx) => {
                  const mNum = idx + 1;
                  const cols = mNum === 2 ? 4 : 5;
                  return (
                    <option key={name} value={mNum}>
                      {name} ({cols} semanas)
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Quick Prev / Next Month Buttons */}
            <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setSelectedWeekMonth((prev) => (prev === 0 ? 12 : prev - 1))}
                className="px-2 py-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 text-xs transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedWeekMonth((prev) => (prev === 12 ? 0 : prev + 1))}
                className="px-2 py-1.5 hover:bg-slate-100 text-slate-600 text-xs transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              ({weeksData.length} columnas analizadas - {monthRecords.length} {isAllMonths ? 'registros totales' : 'años'})
            </span>
          </div>

          {/* Quick Highlight of the winning week by peak frequency */}
          {topFreqWeek ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100/90 border border-orange-200 text-orange-950 rounded-lg text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>
                {isAllMonths ? (
                  <>
                    Mayor concentración de picos consolidada:{' '}
                    <strong className="text-orange-700 font-bold">
                      {topFreqWeek.label} ({topFreqWeek.dateRange})
                    </strong>{' '}
                    con <strong className="text-orange-800 font-bold">{topFreqWeek.frecuencia} eventos ({Math.round((topFreqWeek.frecuencia / (monthRecords.length || 1)) * 100)}%)</strong>
                    {' '}y demanda promedio de <strong className="text-slate-800 font-bold">{topFreqWeek.promedioMW.toLocaleString()} MW</strong>
                  </>
                ) : (
                  <>
                    Semana con más picos en {currentMonthName}:{' '}
                    <strong className="text-orange-700 font-bold">
                      {topFreqWeek.label} ({topFreqWeek.dateRange})
                    </strong>{' '}
                    con <strong className="text-orange-800 font-bold">{topFreqWeek.frecuencia} {topFreqWeek.frecuencia === 1 ? 'evento' : 'eventos'} ({Math.round((topFreqWeek.frecuencia / (monthRecords.length || 1)) * 100)}%)</strong>
                    {' '}y demanda promedio de <strong className="text-slate-800 font-bold">{topFreqWeek.promedioMW.toLocaleString()} MW</strong>
                  </>
                )}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">
              Sin picos registrados en los filtros actuales para este mes
            </div>
          )}
        </div>
      )}

      {/* Chart Section */}
      <div className="h-72 sm:h-80 md:h-88 w-full">
        {activeTab === 'hour' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  const isMax = d.frecuencia === maxHourFreq && maxHourFreq > 0;
                  return (
                    <div className="bg-slate-900 text-white rounded-xl shadow-xl p-3 border border-slate-700 text-xs space-y-1">
                      <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-2">
                        <span>Hora: {d.rawTime} hrs</span>
                        {isMax && (
                          <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.2 rounded font-semibold">
                            Mayor Frecuencia
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Picos Registrados:</span>
                        <span className="font-bold text-white">{d.frecuencia} meses</span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Demanda Promedio:</span>
                        <span className="font-bold text-amber-300">
                          {d.promedioMW.toLocaleString()} MW
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1">
                        Horario de Punta regulatorio COES
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="frecuencia" name="Cantidad de Meses" radius={[6, 6, 0, 0]}>
                {hourData.map((entry, index) => (
                  <Cell
                    key={`cell-hour-${index}`}
                    fill={entry.frecuencia === maxHourFreq && maxHourFreq > 0 ? '#ea580c' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'day' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayData} margin={{ top: 15, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortDay"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  const isMax = d.frecuencia === maxDayFreq && maxDayFreq > 0;
                  return (
                    <div className="bg-slate-900 text-white rounded-xl shadow-xl p-3 border border-slate-700 text-xs space-y-1">
                      <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-2">
                        <span>
                          {d.day} {isAllDayMonths ? '(Global)' : `en ${currentDayMonthName}`}
                        </span>
                        {isMax && (
                          <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.2 rounded font-semibold">
                            Mayor Ocurrencia
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Picos Ocurridos:</span>
                        <span className="font-bold text-white">
                          {d.frecuencia} {d.frecuencia === 1 ? 'vez' : 'veces'} (
                          {Math.round((d.frecuencia / (dayRecords.length || 1)) * 100)}%)
                        </span>
                      </div>
                      {d.frecuencia > 0 && (
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span>Demanda Promedio:</span>
                          <span className="font-bold text-amber-300">
                            {d.promedioMW.toLocaleString()} MW
                          </span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 pt-1">
                        {d.isWeekend ? 'Fin de semana (menor carga industrial)' : 'Día laboral hábil'}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="frecuencia" name="Ocurrencias" radius={[6, 6, 0, 0]}>
                {dayData.map((entry, index) => (
                  <Cell
                    key={`cell-day-${index}`}
                    fill={
                      entry.frecuencia === 0
                        ? '#cbd5e1'
                        : entry.frecuencia === maxDayFreq && maxDayFreq > 0
                        ? '#ea580c'
                        : '#2563eb'
                    }
                  />
                ))}
                <LabelList
                  dataKey="frecuencia"
                  position="top"
                  content={({ x, y, width, value }: any) => {
                    if (value === undefined || value === null) return null;
                    const num = Number(value);
                    const isMax = num === maxDayFreq && maxDayFreq > 0;
                    const isZero = num === 0;
                    return (
                      <text
                        x={Number(x) + Number(width) / 2}
                        y={isZero ? Number(y) - 6 : Number(y) - 8}
                        textAnchor="middle"
                        fill={isMax ? '#ea580c' : isZero ? '#94a3b8' : '#334155'}
                        fontSize={isMax ? 12 : 11}
                        fontWeight={isMax ? 700 : 600}
                      >
                        {num}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'season' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={(data: any) => {
                const idx = data?.activeTooltipIndex;
                if (typeof idx === 'number' && idx >= 0 && idx < 12) {
                  setSelectedWeekMonth(idx + 1);
                  setActiveTab('weeks');
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortMonth"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={['dataMin - 500', 'dataMax + 200']}
                tickFormatter={(v) => `${Math.round(v)} MW`}
                width={65}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  const isMax = d.promedioMW === maxMonthMW && maxMonthMW > 0;
                  return (
                    <div className="bg-slate-900 text-white rounded-xl shadow-xl p-3 border border-slate-700 text-xs space-y-1">
                      <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-2">
                        <span>Mes de {d.month}</span>
                        {isMax && (
                          <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.2 rounded font-semibold">
                            Mayor Demanda Media
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Demanda Promedio:</span>
                        <span className="font-bold text-white">
                          {d.promedioMW.toLocaleString()} MW
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-300 font-medium pt-1">
                        💡 Haz clic para ver el desglose por semanas
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="promedioMW"
                name="Demanda Promedio (MW)"
                radius={[6, 6, 0, 0]}
                className="cursor-pointer"
              >
                {monthData.map((entry, index) => (
                  <Cell
                    key={`cell-month-${index}`}
                    fill={entry.promedioMW === maxMonthMW && maxMonthMW > 0 ? '#ea580c' : '#0284c7'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'weeks' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeksData} margin={{ top: 28, right: 15, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                interval={0}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={({ x, y, payload }: any) => {
                  const item =
                    weeksData.find((w) => w.label === payload.value) || weeksData[payload.index];
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={12}
                        textAnchor="middle"
                        fill="#334155"
                        fontSize={11}
                        fontWeight={600}
                      >
                        {payload.value}
                      </text>
                      <text
                        x={0}
                        y={25}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize={10}
                      >
                        ({item?.dateRange || ''})
                      </text>
                    </g>
                  );
                }}
                height={45}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={[0, (dataMax) => Math.ceil((dataMax * 1.18) / 500) * 500]}
                tickFormatter={(v) => `${Math.round(v).toLocaleString()} MW`}
                width={75}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  const isMax = d.promedioMW === maxWeekMW && maxWeekMW > 0;
                  return (
                    <div className="bg-slate-900 text-white rounded-xl shadow-xl p-3.5 border border-slate-700 text-xs space-y-1.5 min-w-[240px]">
                      <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-2">
                        <span>{d.fullLabel}</span>
                        {d.frecuencia === maxWeekFreq && maxWeekFreq > 0 && (
                          <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded font-semibold">
                            Mayor N° de Picos
                          </span>
                        )}
                      </div>
                      {d.frecuencia > 0 ? (
                        <>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Demanda Promedio:</span>
                            <span className="font-bold text-amber-300 text-sm">
                              {d.promedioMW.toLocaleString()} MW
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Picos Registrados:</span>
                            <span className="font-bold text-white">
                              {d.frecuencia} de {monthRecords.length} {isAllMonths ? 'meses' : 'años'} (
                              {Math.round((d.frecuencia / (monthRecords.length || 1)) * 100)}%)
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Pico Máximo Histórico:</span>
                            <span className="font-semibold text-slate-200">
                              {d.maxMW.toLocaleString()} MW ({d.maxRecordYear})
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                            {isAllMonths
                              ? `Picos totales en esta semana: ${d.frecuencia} de ${monthRecords.length} eventos históricos`
                              : `Años con pico en esta semana: ${d.years.join(', ')}`}
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-400 text-[11px] py-1">
                          En el histórico registrado ({records[records.length - 1]?.year ?? 2010} - {records[0]?.year ?? 2026}), ningún pico coincidió con estos días ({d.dateRange}) en {currentMonthName}.
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="promedioMW"
                name="Demanda Promedio (MW)"
                radius={[6, 6, 0, 0]}
                minPointSize={16}
              >
                {weeksData.map((entry) => (
                  <Cell
                    key={`cell-week-${entry.weekNumber}`}
                    fill={
                      entry.frecuencia === 0
                        ? '#e2e8f0'
                        : entry.frecuencia === maxWeekFreq && maxWeekFreq > 0
                        ? '#ea580c'
                        : '#2563eb'
                    }
                  />
                ))}
                <LabelList
                  dataKey="promedioMW"
                  position="top"
                  content={(props: any) => {
                    const { x, y, width, value } = props;
                    let entry = props.payload;
                    if (!entry && typeof props.originalDataIndex === 'number') {
                      entry = weeksData[props.originalDataIndex];
                    }
                    if (!entry && typeof value === 'number') {
                      entry = weeksData.find((w) => w.promedioMW === value);
                    }
                    if (!entry) {
                      entry = weeksData[props.index];
                    }
                    if (!entry) return null;
                    const isZero = entry.frecuencia === 0 || entry.promedioMW === 0;
                    const isMax = entry.frecuencia === maxWeekFreq && maxWeekFreq > 0;
                    const textY = isZero ? Number(y) - 16 : Number(y) - 8;
                    return (
                      <g transform={`translate(${Number(x) + Number(width) / 2}, ${textY})`}>
                        <text
                          textAnchor="middle"
                          fill={isMax ? '#ea580c' : isZero ? '#94a3b8' : '#334155'}
                          fontSize={isMax ? 12 : 11}
                          fontWeight={isMax ? 700 : 600}
                        >
                          {isZero ? '0 MW' : `${entry.promedioMW.toLocaleString()} MW`}
                        </text>
                        <text
                          y={13}
                          textAnchor="middle"
                          fill={isMax ? '#c2410c' : isZero ? '#94a3b8' : '#64748b'}
                          fontSize={10}
                          fontWeight={isMax ? 600 : 400}
                        >
                          {isZero ? 'Sin picos' : `${entry.frecuencia} ${entry.frecuencia === 1 ? 'pico' : 'picos'}`}
                        </text>
                      </g>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Week Cards (When 'weeks' tab is active: 4 or 5 columns according to month) */}
      {activeTab === 'weeks' && (
        <div
          className={`grid grid-cols-2 ${
            weeksData.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-5'
          } gap-2.5 pt-1`}
        >
          {weeksData.map((w) => {
            const isMax = w.frecuencia === maxWeekFreq && maxWeekFreq > 0;
            const isZero = w.frecuencia === 0;
            return (
              <div
                key={w.weekNumber}
                className={`p-3 rounded-xl border transition-all ${
                  isMax
                    ? 'bg-orange-50/80 border-orange-300 ring-2 ring-orange-400/30 shadow-xs'
                    : isZero
                    ? 'bg-slate-50/60 border-slate-200/70 opacity-70'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-800">{w.label}</span>
                  {isMax ? (
                    <span className="text-[10px] font-bold bg-orange-600 text-white px-1.5 py-0.5 rounded shadow-2xs">
                      ★ Más Picos
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">{w.dateRange}</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mb-1">
                  Días {w.dateRange} {isAllMonths ? 'de cada mes' : `de ${currentMonthName}`}
                </div>
                <div className="text-base font-extrabold tracking-tight">
                  {isZero ? (
                    <span className="text-slate-400 text-xs font-medium">Sin picos</span>
                  ) : (
                    <span className={isMax ? 'text-orange-600 font-extrabold' : 'text-slate-900'}>
                      {w.promedioMW.toLocaleString()}{' '}
                      <span className="text-xs font-semibold text-slate-500">MW</span>
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Picos registrados:</span>
                  <strong className={isMax ? 'text-orange-700 font-bold' : 'text-slate-700'}>
                    {w.frecuencia} ({Math.round((w.frecuencia / (monthRecords.length || 1)) * 100)}%)
                  </strong>
                </div>
                {w.frecuencia > 0 && (
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Récord: {w.maxMW.toLocaleString()} MW ({w.maxRecordYear})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Analytical Callout */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          {activeTab === 'weeks' ? (
            <>
              <p className="font-semibold text-amber-950">
                {isAllMonths ? (
                  topFreqWeek
                    ? `Consolidado Histórico del SEIN: Mayor concentración de picos en ${topFreqWeek.label} (${topFreqWeek.dateRange}) con ${topFreqWeek.frecuencia} eventos (${Math.round((topFreqWeek.frecuencia / (monthRecords.length || 1)) * 100)}%)`
                    : 'Consolidado Histórico por Semanas'
                ) : topFreqWeek ? (
                  `Semana con mayor cantidad de picos en ${currentMonthName}: ${topFreqWeek.label} (${topFreqWeek.dateRange} de ${currentMonthName})`
                ) : (
                  `Análisis semanal de ${currentMonthName}`
                )}
              </p>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                {isAllMonths ? (
                  <>
                    En el consolidado de los <strong>{records.length} meses analizados</strong> (2010 a 2026), la{' '}
                    <strong>{topFreqWeek?.label} (días {topFreqWeek?.dateRange})</strong> es la semana que concentra la mayor cantidad histórica de picos mensuales del SEIN con{' '}
                    <strong>{topFreqWeek?.frecuencia} de los {monthRecords.length} eventos ({Math.round(((topFreqWeek?.frecuencia || 0) / (monthRecords.length || 1)) * 100)}%)</strong> y una demanda promedio de{' '}
                    <strong>{topFreqWeek?.promedioMW.toLocaleString()} MW</strong>.
                    {topWeek && topWeek.weekNumber !== topFreqWeek?.weekNumber && (
                      <> Por su parte, la <strong>{topWeek.label}</strong> tuvo la demanda puntual promedio más elevada con <strong>{topWeek.promedioMW.toLocaleString()} MW</strong>.</>
                    )}
                  </>
                ) : topFreqWeek ? (
                  <>
                    En el histórico analizado del SEIN para el mes de{' '}
                    <strong>{currentMonthName}</strong>, la{' '}
                    <strong>
                      {topFreqWeek.label} ({topFreqWeek.dateRange})
                    </strong>{' '}
                    es la semana que concentra la mayor cantidad de picos del mes ({topFreqWeek.frecuencia} de los {monthRecords.length} años analizados, equivalente al{' '}
                    {Math.round((topFreqWeek.frecuencia / (monthRecords.length || 1)) * 100)}%) con una demanda promedio coincidente de{' '}
                    <strong>{topFreqWeek.promedioMW.toLocaleString()} MW</strong>.
                    {topFreqWeek.frecuencia > 0 &&
                      ` El registro máximo histórico en esta semana fue de ${topFreqWeek.maxMW.toLocaleString()} MW en el año ${topFreqWeek.maxRecordYear}.`}
                  </>
                ) : (
                  <>No se registran eventos coincidentes para este mes con los filtros actuales.</>
                )}
              </p>
            </>
          ) : activeTab === 'day' && !isAllDayMonths ? (
            <>
              <p className="font-semibold text-amber-950">
                {topDay && topDay.frecuencia > 0
                  ? `Día con mayor cantidad de picos en ${currentDayMonthName}: ${topDay.day} (${topDay.frecuencia} de ${dayRecords.length} años, ${Math.round((topDay.frecuencia / (dayRecords.length || 1)) * 100)}%)`
                  : `Análisis de días en ${currentDayMonthName}`}
              </p>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                {topDay && topDay.frecuencia > 0 ? (
                  <>
                    En el mes de <strong>{currentDayMonthName}</strong> a lo largo del histórico registrado ({dayRecords[dayRecords.length - 1]?.year ?? 2010} a {dayRecords[0]?.year ?? 2026}), la máxima demanda se presentó con mayor frecuencia los días{' '}
                    <strong>{topDay.day}</strong> con <strong>{topDay.frecuencia} {topDay.frecuencia === 1 ? 'evento' : 'eventos'}</strong> ({Math.round((topDay.frecuencia / (dayRecords.length || 1)) * 100)}% de los {dayRecords.length} años analizados) y una demanda promedio coincidente de{' '}
                    <strong>{topDay.promedioMW.toLocaleString()} MW</strong>.
                  </>
                ) : (
                  <>No se registran eventos coincidentes para este mes con los filtros actuales.</>
                )}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-950">
                ¿Por qué la máxima demanda en el SEIN se concentra a las {topHour?.rawTime ?? '19:00'} hrs los días {topDay?.day ?? 'Martes'}?
              </p>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                En el SEIN, el pico horario (donde la hora <strong>{topHour?.rawTime ?? '19:00'} hrs</strong> lidera con {topHour?.frecuencia ?? 60} meses y el día <strong>{topDay?.day ?? 'Martes'}</strong> con {topDay?.frecuencia ?? 64} ocurrencias) es producto de la <strong>superposición coincidente</strong>: finalización de jornada laboral e industrial diurna, encendido simultáneo de iluminación pública y residencial, uso de artefactos y aire acondicionado en los hogares, aforos en centros comerciales y la continuidad ininterrumpida de las plantas mineras en el país.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
