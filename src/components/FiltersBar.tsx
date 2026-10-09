import React, { useState } from 'react';
import { 
  Filter, 
  MapPin, 
  Calendar, 
  Clock, 
  Search, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  Sun,
  Layers
} from 'lucide-react';
import { AllRegionKey, DayOfWeek, FilterState } from '../types';
import { REGIONS_METADATA, MACRO_REGIONS, SUB_REGIONS } from '../data/regions';
import { MONTH_NAMES, DAYS_OF_WEEK } from '../data/demandData';

interface FiltersBarProps {
  filters: FilterState;
  onChangeFilters: (updater: (prev: FilterState) => FilterState) => void;
  onReset: () => void;
  totalResults: number;
  maxYear?: number;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onChangeFilters,
  onReset,
  totalResults,
  maxYear = 2026,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeRegionInfo = REGIONS_METADATA[filters.region];

  const handleRegionChange = (region: AllRegionKey) => {
    onChangeFilters((prev) => ({ ...prev, region }));
  };

  const handleYearPreset = (start: number, end: number) => {
    onChangeFilters((prev) => ({ ...prev, startYear: start, endYear: end }));
  };

  const toggleMonth = (monthNum: number) => {
    onChangeFilters((prev) => {
      const exists = prev.months.includes(monthNum);
      const newMonths = exists
        ? prev.months.filter((m) => m !== monthNum)
        : [...prev.months, monthNum].sort((a, b) => a - b);
      return { ...prev, months: newMonths };
    });
  };

  const selectAllMonths = () => {
    onChangeFilters((prev) => ({ ...prev, months: [] }));
  };

  const selectSeasonMonths = (season: 'verano' | 'invierno' | 'primavera' | 'otono') => {
    let months: number[] = [];
    if (season === 'verano') months = [1, 2, 3]; // Ene, Feb, Mar
    if (season === 'otono') months = [4, 5, 6]; // Abr, May, Jun
    if (season === 'invierno') months = [7, 8, 9]; // Jul, Ago, Set
    if (season === 'primavera') months = [10, 11, 12]; // Oct, Nov, Dic
    onChangeFilters((prev) => ({ ...prev, months }));
  };

  const toggleDayOfWeek = (day: DayOfWeek) => {
    onChangeFilters((prev) => {
      const exists = prev.daysOfWeek.includes(day);
      const newDays = exists
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day];
      return { ...prev, daysOfWeek: newDays };
    });
  };

  const selectDayGroup = (group: 'all' | 'workdays' | 'weekend') => {
    if (group === 'all') {
      onChangeFilters((prev) => ({ ...prev, daysOfWeek: [] }));
    } else if (group === 'workdays') {
      onChangeFilters((prev) => ({
        ...prev,
        daysOfWeek: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
      }));
    } else {
      onChangeFilters((prev) => ({
        ...prev,
        daysOfWeek: ['Sábado', 'Domingo'],
      }));
    }
  };

  const activeFiltersCount = [
    filters.region !== 'nacional',
    filters.startYear !== 2010 || filters.endYear !== 2026,
    filters.months.length > 0,
    filters.daysOfWeek.length > 0,
    filters.timeSlot !== 'all',
    filters.searchQuery.trim() !== '',
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Top Row: Region Selector (Primary focus of prompt) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filtrar por Región Eléctrica / Zona
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {activeRegionInfo.typicalSharePercent < 100 ? (
              <span>
                Aporta aprox. <strong className="text-slate-800 font-semibold">{activeRegionInfo.typicalSharePercent}%</strong> de la demanda nacional
              </span>
            ) : (
              <span>100% de la demanda del sistema interconectado</span>
            )}
          </div>
        </div>

        {/* Macro-regions Pills */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-medium text-slate-400 mr-1 hidden sm:inline">Macro:</span>
            {MACRO_REGIONS.map((regKey) => {
              const meta = REGIONS_METADATA[regKey];
              const isSelected = filters.region === regKey;
              return (
                <button
                  key={regKey}
                  type="button"
                  onClick={() => handleRegionChange(regKey)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span>{meta.name.split('(')[0].trim()}</span>
                  {meta.typicalSharePercent < 100 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      ~{meta.typicalSharePercent}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sub-regions (Departamentales / Industriales) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 mr-1 hidden sm:inline">Departamental:</span>
            {SUB_REGIONS.map((regKey) => {
              const meta = REGIONS_METADATA[regKey];
              const isSelected = filters.region === regKey;
              return (
                <button
                  key={regKey}
                  type="button"
                  onClick={() => handleRegionChange(regKey)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span>{meta.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Second Row: Year Range Presets and Slider */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Período de Análisis (2010 - 2026 a la fecha)
            </span>
            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {filters.startYear} - {filters.endYear} ({filters.endYear - filters.startYear + 1} {filters.endYear - filters.startYear + 1 === 1 ? 'año' : 'años'})
            </span>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleYearPreset(2010, maxYear)}
              className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                filters.startYear === 2010 && filters.endYear === maxYear
                  ? 'bg-slate-800 text-white font-medium'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              2010 - {maxYear} (Todo)
            </button>
            <button
              type="button"
              onClick={() => handleYearPreset(maxYear, maxYear)}
              className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                filters.startYear === maxYear && filters.endYear === maxYear
                  ? 'bg-amber-600 text-white font-medium shadow-2xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 font-medium'
              }`}
            >
              {maxYear} (A la fecha)
            </button>
            <button
              type="button"
              onClick={() => handleYearPreset(Math.max(2010, maxYear - 4), maxYear)}
              className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                filters.startYear === Math.max(2010, maxYear - 4) && filters.endYear === maxYear
                  ? 'bg-slate-800 text-white font-medium'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Últimos 5 Años
            </button>
            <button
              type="button"
              onClick={() => handleYearPreset(2010, 2019)}
              className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                filters.startYear === 2010 && filters.endYear === 2019
                  ? 'bg-slate-800 text-white font-medium'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Pre-Pandemia
            </button>
            <button
              type="button"
              onClick={() => handleYearPreset(2020, maxYear)}
              className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                filters.startYear === 2020 && filters.endYear === maxYear
                  ? 'bg-slate-800 text-white font-medium'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Post-Pandemia
            </button>
          </div>
        </div>

        {/* Dual Year Slider / Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-500 whitespace-nowrap">Año Inicio:</label>
            <input
              type="range"
              min={2010}
              max={filters.endYear}
              value={filters.startYear}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onChangeFilters((prev) => ({ ...prev, startYear: val }));
              }}
              className="w-full accent-slate-800 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-800 w-10 text-right">{filters.startYear}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-500 whitespace-nowrap">Año Fin:</label>
            <input
              type="range"
              min={filters.startYear}
              max={maxYear}
              value={filters.endYear}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onChangeFilters((prev) => ({ ...prev, endYear: val }));
              }}
              className="w-full accent-slate-800 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-800 w-10 text-right">{filters.endYear}</span>
          </div>
        </div>
      </div>

      {/* Collapsible Section for Month, Day of Week, Time & Search */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filtros Específicos: Mes, Día de Semana y Hora</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* Quick Search */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar fecha, suceso, MW..."
              value={filters.searchQuery}
              onChange={(e) => onChangeFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800 bg-slate-50/50"
            />
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3.5 pt-3.5 border-t border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter by Month */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Mes del Año</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={selectAllMonths}
                    className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer ${
                      filters.months.length === 0 ? 'bg-slate-200 font-semibold text-slate-800' : 'text-slate-500 hover:underline'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => selectSeasonMonths('verano')}
                    className="text-[10px] px-1.5 py-0.5 text-amber-700 hover:underline cursor-pointer"
                  >
                    Verano
                  </button>
                  <button
                    type="button"
                    onClick={() => selectSeasonMonths('invierno')}
                    className="text-[10px] px-1.5 py-0.5 text-sky-700 hover:underline cursor-pointer"
                  >
                    Invierno
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                {MONTH_NAMES.map((name, idx) => {
                  const mNum = idx + 1;
                  const isSelected = filters.months.length === 0 || filters.months.includes(mNum);
                  const isExplicit = filters.months.includes(mNum);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleMonth(mNum)}
                      className={`text-[11px] py-1 px-1 rounded text-center transition-colors cursor-pointer truncate ${
                        isExplicit
                          ? 'bg-slate-800 text-white font-semibold'
                          : filters.months.length === 0
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                      title={name}
                    >
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter by Day of Week */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Día de Semana</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => selectDayGroup('all')}
                    className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer ${
                      filters.daysOfWeek.length === 0 ? 'bg-slate-200 font-semibold text-slate-800' : 'text-slate-500 hover:underline'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => selectDayGroup('workdays')}
                    className="text-[10px] px-1.5 py-0.5 text-blue-700 hover:underline cursor-pointer"
                  >
                    Laborables
                  </button>
                  <button
                    type="button"
                    onClick={() => selectDayGroup('weekend')}
                    className="text-[10px] px-1.5 py-0.5 text-indigo-700 hover:underline cursor-pointer"
                  >
                    Fines de Sem.
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map((day) => {
                  const isExplicit = filters.daysOfWeek.includes(day);
                  const isWeekend = day === 'Sábado' || day === 'Domingo';
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayOfWeek(day)}
                      className={`text-[11px] py-1 px-1 rounded text-center transition-colors cursor-pointer truncate ${
                        isExplicit
                          ? 'bg-slate-800 text-white font-semibold'
                          : filters.daysOfWeek.length === 0
                          ? isWeekend ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                      title={day}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter by Specific Time / Horario */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">Hora Específica</span>
                </div>
                <span className="text-[10px] text-amber-700 font-medium">Horas Punta SEIN</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: 'Todas las Horas' },
                  { id: 'hp', label: 'Hora Punta (18-23h)' },
                  { id: '19_20', label: '19:00 - 20:00 hrs' },
                  { id: '20_21', label: '20:00 - 21:00 hrs' },
                ].map((slot) => {
                  const isSelected = filters.timeSlot === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => onChangeFilters((prev) => ({ ...prev, timeSlot: slot.id as any }))}
                      className={`text-xs py-1.5 px-2 rounded-lg text-left transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 font-medium'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500">
        <div>
          Mostrando <strong className="text-slate-900">{totalResults}</strong> de 200 registros mensuales de máxima demanda (2010 - 2026)
        </div>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-amber-700 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Limpiar todos los filtros ({activeFiltersCount})
          </button>
        )}
      </div>
    </div>
  );
};
