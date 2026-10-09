import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Layers, MapPin, Zap, ArrowRight } from 'lucide-react';
import { PeakDemandRecord, AllRegionKey } from '../types';
import { REGIONS_METADATA, MACRO_REGIONS, SUB_REGIONS } from '../data/regions';

interface RegionalBreakdownChartProps {
  records: PeakDemandRecord[];
  currentRegion: AllRegionKey;
  onSelectRegion: (region: AllRegionKey) => void;
}

export const RegionalBreakdownChart: React.FC<RegionalBreakdownChartProps> = ({
  records,
  currentRegion,
  onSelectRegion,
}) => {
  // Aggregate annual average demand by region for a clean comparative trend
  const years = Array.from(new Set<number>(records.map((r) => r.year))).sort((a, b) => a - b);

  const annualRegionalData = years.map((year) => {
    const yearRecords = records.filter((r) => r.year === year);
    const count = yearRecords.length || 1;

    const sumCentro = yearRecords.reduce((acc, r) => acc + r.regions.centro.demandMW, 0);
    const sumSur = yearRecords.reduce((acc, r) => acc + r.regions.sur.demandMW, 0);
    const sumNorte = yearRecords.reduce((acc, r) => acc + r.regions.norte.demandMW, 0);
    const sumOriente = yearRecords.reduce((acc, r) => acc + r.regions.oriente.demandMW, 0);
    const sumTotal = yearRecords.reduce((acc, r) => acc + r.nationalDemandMW, 0);

    return {
      year: String(year),
      centro: Math.round(sumCentro / count),
      sur: Math.round(sumSur / count),
      norte: Math.round(sumNorte / count),
      oriente: Math.round(sumOriente / count),
      total: Math.round(sumTotal / count),
    };
  });

  // Current latest record for proportional cards
  const latestRecord = records[records.length - 1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Distribución y Aporte por Regiones Eléctricas
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evolución de la potencia demandada en Centro, Sur, Norte y Oriente a lo largo de los 15 años
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Valores promedio anuales en Horas de Punta (HP)
        </div>
      </div>

      {/* Stacked Area Chart of Macro-regions */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={annualRegionalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k MW`}
              width={65}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white rounded-xl shadow-xl p-3 border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
                    <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex justify-between">
                      <span>Año {label}</span>
                      <span>Total: {d.total.toLocaleString()} MW</span>
                    </div>
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-blue-300">
                        <span>• Región Centro:</span>
                        <span className="font-bold">{d.centro.toLocaleString()} MW ({((d.centro / d.total) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="flex justify-between items-center text-amber-300">
                        <span>• Región Sur:</span>
                        <span className="font-bold">{d.sur.toLocaleString()} MW ({((d.sur / d.total) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-300">
                        <span>• Región Norte:</span>
                        <span className="font-bold">{d.norte.toLocaleString()} MW ({((d.norte / d.total) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="flex justify-between items-center text-violet-300">
                        <span>• Región Oriente:</span>
                        <span className="font-bold">{d.oriente.toLocaleString()} MW ({((d.oriente / d.total) * 100).toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingTop: 0 }}
            />
            <Area
              type="monotone"
              dataKey="centro"
              name="Región Centro"
              stackId="1"
              stroke="#2563eb"
              fill="#2563eb"
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="sur"
              name="Región Sur"
              stackId="1"
              stroke="#d97706"
              fill="#d97706"
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="norte"
              name="Región Norte"
              stackId="1"
              stroke="#059669"
              fill="#059669"
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="oriente"
              name="Región Oriente"
              stackId="1"
              stroke="#7c3aed"
              fill="#7c3aed"
              fillOpacity={0.8}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Region Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {MACRO_REGIONS.filter((r) => r !== 'nacional').map((regKey) => {
          const meta = REGIONS_METADATA[regKey];
          const isSelected = currentRegion === regKey;
          const currentDemand = latestRecord ? latestRecord.regions[regKey].demandMW : 0;
          const currentShare = latestRecord ? latestRecord.regions[regKey].sharePercentage : meta.typicalSharePercent;

          return (
            <div
              key={regKey}
              onClick={() => onSelectRegion(regKey)}
              className={`rounded-xl p-3.5 border transition-all cursor-pointer ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span className="text-xs font-bold">{meta.shortName}</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                  {currentShare}% SEIN
                </span>
              </div>
              <div className="text-lg font-extrabold tracking-tight">
                {currentDemand.toLocaleString()} <span className="text-xs font-normal">MW</span>
              </div>
              <p className={`text-[11px] mt-1.5 line-clamp-2 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                {meta.description}
              </p>
              <div className={`mt-2.5 pt-2 border-t text-[11px] font-medium flex items-center justify-between ${isSelected ? 'border-slate-800 text-amber-400' : 'border-slate-200 text-slate-600'}`}>
                <span>{isSelected ? 'Región activa' : 'Filtrar por esta región'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
