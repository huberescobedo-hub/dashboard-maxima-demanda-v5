import React, { useState } from 'react';
import { Calendar, Clock, Flame, Info } from 'lucide-react';
import { PeakDemandRecord, AllRegionKey } from '../types';
import { MONTH_NAMES } from '../data/demandData';
import { REGIONS_METADATA } from '../data/regions';

interface SeasonalHeatmapProps {
  records: PeakDemandRecord[];
  currentRegion: AllRegionKey;
  onSelectRecord: (record: PeakDemandRecord) => void;
}

type HeatmapMetric = 'mw' | 'time' | 'dayOfWeek';

export const SeasonalHeatmap: React.FC<SeasonalHeatmapProps> = ({
  records,
  currentRegion,
  onSelectRecord,
}) => {
  const [metric, setMetric] = useState<HeatmapMetric>('mw');
  const regionInfo = REGIONS_METADATA[currentRegion];

  // Group records by year and month
  const matrix = new Map<string, PeakDemandRecord>();
  let minMW = Infinity;
  let maxMW = -Infinity;

  records.forEach((r) => {
    const mw = r.regions[currentRegion]?.demandMW ?? r.nationalDemandMW;
    if (mw < minMW) minMW = mw;
    if (mw > maxMW) maxMW = mw;
    matrix.set(`${r.year}-${r.month}`, r);
  });

  // Extract unique years present in the records, sorted descending (newest on top)
  const years = Array.from(new Set<number>(records.map((r) => r.year))).sort((a, b) => b - a);

  // Compute color based on normalized MW
  const getCellColor = (record?: PeakDemandRecord) => {
    if (!record) return 'bg-slate-100/60 text-slate-300 border-dashed border-slate-200';
    const mw = record.regions[currentRegion]?.demandMW ?? record.nationalDemandMW;
    if (maxMW === minMW) return 'bg-sky-100 text-sky-900 border-sky-200';

    const normalized = (mw - minMW) / (maxMW - minMW); // 0 to 1

    if (normalized > 0.85) {
      return 'bg-amber-600 text-white font-bold border-amber-700 shadow-2xs';
    }
    if (normalized > 0.70) {
      return 'bg-amber-500 text-white font-semibold border-amber-600';
    }
    if (normalized > 0.55) {
      return 'bg-amber-400 text-slate-900 font-semibold border-amber-500';
    }
    if (normalized > 0.40) {
      return 'bg-amber-200 text-slate-900 border-amber-300';
    }
    if (normalized > 0.20) {
      return 'bg-amber-100 text-slate-800 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              Matriz Histórica de Picos Mensuales (2010 - 2026)
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {years.length} Años (2026 a la fecha)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comportamiento estacional del consumo de energía: cada celda contiene fecha, día y hora exacta
          </p>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setMetric('mw')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              metric === 'mw'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Potencia (MW)
          </button>
          <button
            type="button"
            onClick={() => setMetric('time')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              metric === 'time'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hora del Pico
          </button>
          <button
            type="button"
            onClick={() => setMetric('dayOfWeek')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              metric === 'dayOfWeek'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Día de Semana
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px]">
          {/* Month Header */}
          <div className="grid grid-cols-13 gap-1.5 text-center mb-1.5">
            <div className="text-xs font-bold text-slate-400 text-left pl-1">Año</div>
            {MONTH_NAMES.map((name) => (
              <div
                key={name}
                className="text-xs font-bold text-slate-600 py-1 bg-slate-50 rounded-md truncate"
                title={name}
              >
                {name.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Rows by Year */}
          <div className="space-y-1.5">
            {years.map((year) => (
              <div key={year} className="grid grid-cols-13 gap-1.5 items-center">
                <div className="text-xs font-bold text-slate-700 pl-1">{year}</div>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                  const record = matrix.get(`${year}-${month}`);
                  if (!record) {
                    return (
                      <div
                        key={`${year}-${month}`}
                        className="h-9 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300"
                      >
                        -
                      </div>
                    );
                  }

                  const mw = record.regions[currentRegion]?.demandMW ?? record.nationalDemandMW;
                  const isHistoricalPeak = record.rankHistoric === 1;

                  return (
                    <div
                      key={record.id}
                      onClick={() => onSelectRecord(record)}
                      className={`h-9 rounded-lg border flex flex-col items-center justify-center text-center p-0.5 cursor-pointer transition-transform hover:scale-105 relative group ${getCellColor(
                        record
                      )}`}
                      title={`${record.monthName} ${record.year}: ${mw.toLocaleString()} MW el ${record.dayOfWeek} ${record.day} a las ${record.time} hrs`}
                    >
                      {metric === 'mw' && (
                        <>
                          <span className="text-[11px] font-bold tracking-tighter leading-none">
                            {Math.round(mw).toLocaleString()}
                          </span>
                          <span className="text-[8px] opacity-75 leading-none mt-0.5">
                            {record.time}
                          </span>
                        </>
                      )}

                      {metric === 'time' && (
                        <>
                          <span className="text-[11px] font-bold tracking-tighter leading-none">
                            {record.time}
                          </span>
                          <span className="text-[8px] opacity-75 leading-none mt-0.5">
                            {record.dayOfWeek.slice(0, 3)}
                          </span>
                        </>
                      )}

                      {metric === 'dayOfWeek' && (
                        <>
                          <span className="text-[11px] font-bold tracking-tighter leading-none">
                            {record.dayOfWeek.slice(0, 3)}
                          </span>
                          <span className="text-[8px] opacity-75 leading-none mt-0.5">
                            d.{record.day}
                          </span>
                        </>
                      )}

                      {/* Highlight absolute historical peak */}
                      {isHistoricalPeak && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend & Details */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Intensidad de Demanda:</span>
          <div className="flex items-center gap-1 text-[10px]">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" />
            <span>Mínima</span>
            <span className="w-3 h-3 rounded bg-amber-200 border border-amber-300 inline-block ml-1" />
            <span className="w-3 h-3 rounded bg-amber-400 border border-amber-500 inline-block" />
            <span className="w-3 h-3 rounded bg-amber-600 border border-amber-700 inline-block" />
            <span className="font-semibold text-slate-700">Récord</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          <span>Punto rojo: Récord Histórico Absoluto registrado</span>
          <span className="text-slate-300 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">2026: Datos oficiales COES consolidados de Enero a Agosto (Setiembre en curso sin cierre mensual)</span>
        </div>
      </div>
    </div>
  );
};
