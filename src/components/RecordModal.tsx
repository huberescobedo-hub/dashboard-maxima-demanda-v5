import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Zap, 
  TrendingUp, 
  Trophy, 
  AlertCircle,
  FileText,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { PeakDemandRecord, AllRegionKey } from '../types';
import { REGIONS_METADATA, MACRO_REGIONS, SUB_REGIONS } from '../data/regions';

interface RecordModalProps {
  record: PeakDemandRecord | null;
  currentRegion: AllRegionKey;
  onClose: () => void;
  onSelectRegion: (region: AllRegionKey) => void;
  onDeleteRecord?: (id: string) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  record,
  currentRegion,
  onClose,
  onSelectRegion,
  onDeleteRecord,
}) => {
  if (!record) return null;

  const activeRegionInfo = REGIONS_METADATA[currentRegion];
  const activeRegionMW = record.regions[currentRegion]?.demandMW ?? record.nationalDemandMW;
  const isHistoricRecord = record.rankHistoric === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-start justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Zap className="w-5 h-5 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                  {record.monthName} {record.year}
                </span>
                {isHistoricRecord ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                    <Trophy className="w-3 h-3" /> RÉCORD HISTÓRICO SEIN
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    Ranking #{record.rankHistoric} de 200 meses
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Evento de Máxima Demanda Mensual
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Main Time & Date Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Fecha y Día</span>
                <p className="text-sm font-bold text-slate-900">
                  {record.dayOfWeek}, {record.day} de {record.monthName} de {record.year}
                </p>
                <span className="text-[11px] text-slate-500">
                  Tipo: <strong className="text-slate-700">{record.dayType}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Hora Específica</span>
                <p className="text-sm font-bold text-slate-900">
                  {record.time} hrs ({record.periodName})
                </p>
                <span className="text-[11px] text-slate-500">
                  Registro coincidente COES (15-min)
                </span>
              </div>
            </div>
          </div>

          {/* Primary Demands */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="text-xs text-slate-500 font-medium">Demanda SEIN Nacional</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {record.nationalDemandMW.toLocaleString('es-PE')} <span className="text-sm font-bold text-sky-600">MW</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>Variación interanual (YoY):</span>
                {record.growthYoY !== null ? (
                  <span className={`font-semibold ${record.growthYoY > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {record.growthYoY > 0 ? `+${record.growthYoY}%` : `${record.growthYoY}%`}
                  </span>
                ) : (
                  <span className="text-slate-400">Año base</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1" style={{ borderColor: `${activeRegionInfo.color}40` }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Demanda: {activeRegionInfo.shortName}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeRegionInfo.color }} />
              </div>
              <div className="text-2xl font-extrabold" style={{ color: activeRegionInfo.color }}>
                {activeRegionMW.toLocaleString('es-PE')} <span className="text-sm font-bold">MW</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>Aporte a la red nacional:</span>
                <strong className="text-slate-800 font-semibold">
                  {record.regions[currentRegion]?.sharePercentage}%
                </strong>
              </div>
            </div>
          </div>

          {/* Breakdown by All Regions */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Desglose Coincidente por Zonas / Regiones Eléctricas
              </h3>
              <span className="text-[11px] text-slate-500">
                Suma coincidente: {record.nationalDemandMW.toLocaleString()} MW
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MACRO_REGIONS.filter((r) => r !== 'nacional').map((regKey) => {
                const meta = REGIONS_METADATA[regKey];
                const pt = record.regions[regKey];
                const isSelected = currentRegion === regKey;

                return (
                  <div
                    key={regKey}
                    onClick={() => onSelectRegion(regKey)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-slate-800 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                        <span className="text-xs font-bold">{meta.shortName}</span>
                      </div>
                      <p className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {meta.name.split('(')[1]?.replace(')', '') || ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold">
                        {pt.demandMW.toLocaleString()} <span className="text-[10px]">MW</span>
                      </div>
                      <div className={`text-[10px] ${isSelected ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                        {pt.sharePercentage}% del SEIN
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Context and Notes */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Contexto Operativo del COES para este mes:</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed italic">
              "{record.notes}"
            </p>
          </div>

          {/* International Interconnection Exchange (PER - ECU) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Interconexión Internacional (Línea 220 kV PER-ECU)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                En hora del pico coincidente
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">PER ➔ ECU Exportación:</span>
                <span className="text-base font-extrabold text-slate-900">
                  {record.exportEcuMW !== undefined ? record.exportEcuMW.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 3 }) : '0'} <span className="text-xs font-normal text-slate-500">MW</span>
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">ECU ➔ PER Importación:</span>
                <span className="text-base font-extrabold text-slate-900">
                  {record.importEcuMW !== undefined ? record.importEcuMW.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 3 }) : '0'} <span className="text-xs font-normal text-slate-500">MW</span>
                </span>
              </div>
            </div>
          </div>

          {/* Validation Status Card */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            record.isOfficialCoesVerified 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
              record.isOfficialCoesVerified 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-slate-200 text-slate-600'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <span>{record.isOfficialCoesVerified ? 'Registro Contrastado y Validado Oficialmente' : 'Registro Calibrado con Serie Histórica'}</span>
                {record.isOfficialCoesVerified && (
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                    Oficial COES
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                {record.sourceDocument 
                  ? `Documento fuente: ${record.sourceDocument}` 
                  : 'Documento fuente: Estadística Histórica Integrada COES - SEIN'}
              </p>
              <p className="text-[10px] text-slate-500 pt-0.5">
                Ventana horaria integrada en intervalos de 15 minutos en barras de transferencia según Procedimiento Técnico COES PR-21.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              {record.isUserAdded ? 'Registro ingresado manualmente por el usuario' : 'Fuente oficial: Informes Mensuales de Operación COES - SEIN'}
            </span>
            {record.isUserAdded && onDeleteRecord && (
              <button
                type="button"
                onClick={() => {
                  onDeleteRecord(record.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Registro</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
