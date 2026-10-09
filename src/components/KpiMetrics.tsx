import React from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Clock, 
  CalendarDays, 
  Zap, 
  Layers,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { SystemStats, PeakDemandRecord, AllRegionKey } from '../types';
import { REGIONS_METADATA } from '../data/regions';

interface KpiMetricsProps {
  stats: SystemStats | null;
  currentRegion: AllRegionKey;
  onInspectRecord: (record: PeakDemandRecord) => void;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  stats,
  currentRegion,
  onInspectRecord,
}) => {
  if (!stats) return null;

  const regionInfo = REGIONS_METADATA[currentRegion];
  const peakRec = stats.recordPeakRecord;
  const minRec = stats.minDemandRecord;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Récord Histórico de Máxima Demanda */}
      <div 
        onClick={() => onInspectRecord(peakRec)}
        className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Récord Máximo
          </span>
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {stats.recordPeakMW.toLocaleString('es-PE')}
          </span>
          <span className="text-xs font-bold text-amber-600">MW</span>
        </div>
        <div className="mt-2 text-xs text-slate-600 space-y-0.5">
          <div className="flex items-center gap-1 font-medium text-slate-900">
            <span>{peakRec.dayOfWeek} {peakRec.day} {peakRec.monthName} {peakRec.year}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Hora exacta: <strong className="text-slate-800">{peakRec.time} hrs</strong></span>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-700 font-medium">
          <span>Ver desglose completo</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>

      {/* 2. Demanda Máxima Promedio */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Promedio de Picos
          </span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {stats.averageDemandMW.toLocaleString('es-PE')}
          </span>
          <span className="text-xs font-bold text-blue-600">MW</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Calculado sobre los <strong className="text-slate-800 font-semibold">{stats.recordsCount}</strong> meses analizados para {regionInfo.shortName}.
        </p>
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Pico mínimo del rango:</span>
          <strong className="text-slate-700">{stats.minDemandMW.toLocaleString('es-PE')} MW</strong>
        </div>
      </div>

      {/* 3. Crecimiento Total y CAGR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Crecimiento del Período
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            +{stats.totalGrowthPercentage}%
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-600 space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tasa Anual (CAGR):</span>
            <span className="font-bold text-slate-800">+{stats.cagrPercentage}% / año</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            De {minRec.year} ({stats.minDemandMW.toLocaleString()} MW) a {peakRec.year}
          </p>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-emerald-700 font-medium">
          Expansión de red e industria
        </div>
      </div>

      {/* 4. Hora Más Frecuente del Pico */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Hora Clave de Pico
          </span>
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-indigo-900 tracking-tight">
            {stats.mostFrequentHour}
          </span>
          <span className="text-xs font-semibold text-indigo-600">hrs</span>
        </div>
        <p className="mt-2 text-xs text-slate-500 leading-snug">
          Bloque coincidente donde ocurre el mayor número de máximas demandas mensuales.
        </p>
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-indigo-700 font-medium">
          <span>Horario Punta COES</span>
          <span className="text-slate-500">18:00 - 23:00</span>
        </div>
      </div>

      {/* 5. Día de Semana Predominante */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Día de Mayor Incidencia
          </span>
          <div className="p-1.5 rounded-lg bg-violet-50 text-violet-700">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">
            {stats.mostFrequentDay}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500 leading-snug">
          Mayor concentración en mitad de semana laboral por actividad fabril y comercial.
        </p>
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-violet-700 font-medium">
          <span>Días Laborables</span>
          <span className="font-semibold text-slate-700">&gt;98% de picos</span>
        </div>
      </div>
    </div>
  );
};
