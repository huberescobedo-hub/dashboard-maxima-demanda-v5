import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Download,
  Calendar,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  CalendarPlus,
  Trash2,
} from 'lucide-react';
import { PeakDemandRecord, AllRegionKey } from '../types';
import { REGIONS_METADATA } from '../data/regions';

interface DataTableProps {
  records: PeakDemandRecord[];
  currentRegion: AllRegionKey;
  onSelectRecord: (record: PeakDemandRecord) => void;
  onExportCSV: () => void;
  onOpenAddRecord?: () => void;
  onDeleteRecord?: (id: string) => void;
}

type SortField = 'date' | 'demandMW' | 'nationalDemandMW' | 'growthYoY' | 'time' | 'rankHistoric';
type SortOrder = 'asc' | 'desc';

export const DataTable: React.FC<DataTableProps> = ({
  records,
  currentRegion,
  onSelectRecord,
  onExportCSV,
  onOpenAddRecord,
  onDeleteRecord,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // default 1 year of months
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [tableSearch, setTableSearch] = useState('');

  const regionInfo = REGIONS_METADATA[currentRegion];

  // Filtering
  const filtered = useMemo(() => {
    if (!tableSearch.trim()) return records;
    const q = tableSearch.toLowerCase();
    return records.filter(
      (r) =>
        r.date.includes(q) ||
        r.monthName.toLowerCase().includes(q) ||
        String(r.year).includes(q) ||
        r.dayOfWeek.toLowerCase().includes(q) ||
        r.time.includes(q) ||
        r.notes.toLowerCase().includes(q)
    );
  }, [records, tableSearch]);

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'date') {
        valA = a.date;
        valB = b.date;
      } else if (sortField === 'demandMW') {
        valA = a.regions[currentRegion]?.demandMW ?? a.nationalDemandMW;
        valB = b.regions[currentRegion]?.demandMW ?? b.nationalDemandMW;
      } else if (sortField === 'nationalDemandMW') {
        valA = a.nationalDemandMW;
        valB = b.nationalDemandMW;
      } else if (sortField === 'growthYoY') {
        valA = a.growthYoY ?? -999;
        valB = b.growthYoY ?? -999;
      } else if (sortField === 'time') {
        valA = a.time;
        valB = b.time;
      } else if (sortField === 'rankHistoric') {
        valA = a.rankHistoric ?? 999;
        valB = b.rankHistoric ?? 999;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortOrder, currentRegion]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tabla Detallada de Máximas Demandas Mensuales</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {filtered.length} registros
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro mensual con fecha, día de semana, hora específica y contexto operativo COES
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search inside table */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar en tabla..."
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white w-40 sm:w-48"
            />
          </div>

          {onOpenAddRecord && (
            <button
              type="button"
              onClick={onOpenAddRecord}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Digitar nueva fecha y valor de máxima demanda"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Digitar Fecha</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider">
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/80 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Mes / Año</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3 px-3.5 whitespace-nowrap">
                <span>Día de Semana</span>
              </th>

              <th
                onClick={() => handleSort('time')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/80 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Hora Exacta</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('demandMW')}
                className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-200/80 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>{regionInfo.shortName} (MW)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {currentRegion !== 'nacional' && (
                <th
                  onClick={() => handleSort('nationalDemandMW')}
                  className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-200/80 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>SEIN Nacional (MW)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}

              <th
                onClick={() => handleSort('growthYoY')}
                className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-200/80 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Var. YoY</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3 px-3.5 min-w-[200px]">
                <span>Observaciones / Contexto COES</span>
              </th>

              <th className="py-3 px-3.5 text-center whitespace-nowrap">
                <span>Acción</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No se encontraron registros para los filtros actuales.
                </td>
              </tr>
            ) : (
              paginated.map((r) => {
                const mw = r.regions[currentRegion]?.demandMW ?? r.nationalDemandMW;
                const isTopRecord = r.rankHistoric === 1;

                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelectRecord(r)}
                    className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                  >
                    {/* Month / Year */}
                    <td className="py-2.5 px-3.5 font-medium text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold">{r.monthName} {r.year}</span>
                        {isTopRecord && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white shadow-2xs">
                            RÉCORD
                          </span>
                        )}
                        {r.isOfficialCoesVerified && (
                          <span 
                            title={r.sourceDocument || 'Registro oficial validado por COES / OSINERGMIN'} 
                            className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-help"
                          >
                            ✓ COES
                          </span>
                        )}
                        {r.isUserAdded && (
                          <span 
                            title="Registro ingresado manualmente por el usuario" 
                            className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300"
                          >
                            ✍ Digitado
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{r.date}</span>
                      </div>
                    </td>

                    {/* Day of week */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          r.dayOfWeek === 'Sábado' || r.dayOfWeek === 'Domingo'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.dayOfWeek} (d.{r.day})
                      </span>
                    </td>

                    {/* Exact Time */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-mono font-semibold text-slate-800">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{r.time} hrs</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.periodName}
                      </div>
                    </td>

                    {/* Selected Region MW */}
                    <td className="py-2.5 px-3.5 text-right font-extrabold text-slate-900 whitespace-nowrap">
                      <div className="text-sm font-extrabold" style={{ color: regionInfo.color }}>
                        {mw.toLocaleString('es-PE')}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">MW</span>
                      </div>
                      {currentRegion !== 'nacional' && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {r.regions[currentRegion]?.sharePercentage}% del SEIN
                        </div>
                      )}
                    </td>

                    {/* National MW (if region is not national) */}
                    {currentRegion !== 'nacional' && (
                      <td className="py-2.5 px-3.5 text-right font-semibold text-slate-700 whitespace-nowrap">
                        <span>{r.nationalDemandMW.toLocaleString('es-PE')}</span>
                        <span className="text-[10px] text-slate-400 ml-1">MW</span>
                      </td>
                    )}

                    {/* YoY Growth */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      {r.growthYoY !== null ? (
                        <span
                          className={`inline-block font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                            r.growthYoY > 0
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-rose-700 bg-rose-50'
                          }`}
                        >
                          {r.growthYoY > 0 ? `+${r.growthYoY}%` : `${r.growthYoY}%`}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Context / Notes */}
                    <td className="py-2.5 px-3.5 text-slate-600 max-w-xs truncate text-[11px]">
                      {r.notes}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRecord(r);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                        >
                          <span>Detalle</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                        {r.isUserAdded && onDeleteRecord && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRecord(r.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Eliminar este registro digitado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Filas por página:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded px-2 py-1 bg-white text-xs font-medium text-slate-800"
          >
            <option value={6}>6 meses</option>
            <option value={12}>12 meses (1 año)</option>
            <option value={24}>24 meses (2 años)</option>
            <option value={48}>48 meses</option>
            <option value={sorted.length}>Todos ({sorted.length})</option>
          </select>
          <span className="text-slate-400">|</span>
          <span>
            Mostrando {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, sorted.length)} de {sorted.length}
          </span>
        </div>

        <div className="flex items-center gap-1 self-center">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium text-slate-700">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
