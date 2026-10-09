import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  PEAK_DEMAND_RECORDS, 
  calculateSystemStats,
  MONTH_NAMES,
  createPeakRecordFromInput,
  combineAndRecalculateRecords,
  CustomPeakInput
} from './data/demandData';
import { REGIONS_METADATA } from './data/regions';
import { FilterState, PeakDemandRecord, AllRegionKey } from './types';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { KpiMetrics } from './components/KpiMetrics';
import { DemandTrendChart } from './components/DemandTrendChart';
import { SeasonalHeatmap } from './components/SeasonalHeatmap';
import { RegionalBreakdownChart } from './components/RegionalBreakdownChart';
import { TemporalAnalysis } from './components/TemporalAnalysis';
import { DataTable } from './components/DataTable';
import { RecordModal } from './components/RecordModal';
import { TechnicalGuideModal } from './components/TechnicalGuideModal';
import { AddPeakRecordModal } from './components/AddPeakRecordModal';

const INITIAL_FILTERS: FilterState = {
  region: 'nacional',
  startYear: 2010,
  endYear: 2026,
  months: [],
  daysOfWeek: [],
  timeSlot: 'all',
  minMW: 0,
  maxMW: 10000,
  searchQuery: '',
};

const REQUIRED_PASSWORD = 'BMSRP2026';

function broadcastUpdate(records: PeakDemandRecord[]) {
  try {
    const channel = new BroadcastChannel('coes_records_sync_channel');
    channel.postMessage({ type: 'RECORDS_UPDATED', records });
    channel.close();
  } catch (e) {}
}

export default function App() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedRecord, setSelectedRecord] = useState<PeakDemandRecord | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Custom User Records persisted both in LocalStorage (instant cache) & Backend Server (disk persistence)
  const [customRecords, setCustomRecords] = useState<PeakDemandRecord[]>(() => {
    try {
      const saved = localStorage.getItem('coes_user_custom_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // On mount: fetch persistent records from backend server and setup cross-tab synchronization
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch from server API
    fetch('/api/custom-records')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Error al consultar registros del servidor');
      })
      .then((data) => {
        if (!isMounted) return;
        const serverRecords: PeakDemandRecord[] = Array.isArray(data?.records) ? data.records : [];

        setCustomRecords((localPrev) => {
          // Merge server records with any local records
          const map = new Map<string, PeakDemandRecord>();
          localPrev.forEach((r) => map.set(r.id, r));
          serverRecords.forEach((r) => map.set(r.id, r));

          const unified = Array.from(map.values());
          try {
            localStorage.setItem('coes_user_custom_records', JSON.stringify(unified));
          } catch (e) {}

          // If there were local records not yet stored on server, sync them
          localPrev.forEach((lr) => {
            if (!serverRecords.some((sr) => sr.id === lr.id)) {
              fetch('/api/custom-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: REQUIRED_PASSWORD, record: lr }),
              }).catch(() => {});
            }
          });

          return unified;
        });
      })
      .catch((err) => {
        console.warn('Usando almacenamiento local offline para registros:', err);
      });

    // 2. Cross-tab live synchronization via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('coes_records_sync_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'RECORDS_UPDATED' && Array.isArray(event.data.records)) {
          setCustomRecords(event.data.records);
        }
      };
    } catch (e) {}

    // 3. Storage event fallback for older browser tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'coes_user_custom_records' && e.newValue) {
        try {
          setCustomRecords(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Combine static official records with user-added entries and recalculate YoY & ranks
  const allRecords = useMemo(() => {
    return combineAndRecalculateRecords(PEAK_DEMAND_RECORDS, customRecords);
  }, [customRecords]);

  // Maximum year present in the dataset (e.g. 2026, 2027)
  const maxAvailableYear = useMemo(() => {
    return Math.max(2026, ...allRecords.map((r) => r.year));
  }, [allRecords]);

  // Dynamically expand endYear filter whenever new year records are present
  useEffect(() => {
    if (maxAvailableYear > filters.endYear) {
      setFilters((prev) => ({ ...prev, endYear: maxAvailableYear }));
    }
  }, [maxAvailableYear, filters.endYear]);

  // Filter application across the unified records
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      // 1. Year range
      if (rec.year < filters.startYear || rec.year > filters.endYear) {
        return false;
      }

      // 2. Months
      if (filters.months.length > 0 && !filters.months.includes(rec.month)) {
        return false;
      }

      // 3. Day of week
      if (filters.daysOfWeek.length > 0 && !filters.daysOfWeek.includes(rec.dayOfWeek)) {
        return false;
      }

      // 4. Time slot
      if (filters.timeSlot === 'hp' && !rec.isPeakHour) {
        return false;
      }
      if (filters.timeSlot === '19_20' && rec.hour !== 19) {
        return false;
      }
      if (filters.timeSlot === '20_21' && rec.hour !== 20) {
        return false;
      }

      // 5. Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesDate = rec.date.includes(q);
        const matchesMonth = rec.monthName.toLowerCase().includes(q);
        const matchesDay = rec.dayOfWeek.toLowerCase().includes(q);
        const matchesTime = rec.time.includes(q);
        const matchesNotes = rec.notes.toLowerCase().includes(q);
        const matchesYear = String(rec.year).includes(q);
        if (!matchesDate && !matchesMonth && !matchesDay && !matchesTime && !matchesNotes && !matchesYear) {
          return false;
        }
      }

      return true;
    });
  }, [allRecords, filters]);

  // Compute stats for current filtered selection and active region
  const stats = useMemo(() => {
    return calculateSystemStats(filteredRecords, filters.region);
  }, [filteredRecords, filters.region]);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const handleSelectRegion = useCallback((region: AllRegionKey) => {
    setFilters((prev) => ({ ...prev, region }));
  }, []);

  // Save new peak record entered by user
  const handleSaveCustomRecord = useCallback((input: CustomPeakInput) => {
    const newRecord = createPeakRecordFromInput(input);
    setCustomRecords((prev) => {
      // If same month id exists, replace it, otherwise append
      const filtered = prev.filter((r) => r.id !== newRecord.id);
      const updated = [...filtered, newRecord];
      try {
        localStorage.setItem('coes_user_custom_records', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving custom records', e);
      }
      broadcastUpdate(updated);
      return updated;
    });

    // Persist to backend server API
    fetch('/api/custom-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: REQUIRED_PASSWORD,
        record: newRecord,
      }),
    }).catch((err) => {
      console.error('Error saving record to server:', err);
    });

    // Automatically expand the year filter if the new date is beyond the current range
    if (newRecord.year > filters.endYear) {
      setFilters((f) => ({ ...f, endYear: newRecord.year }));
    }
    if (newRecord.year < filters.startYear) {
      setFilters((f) => ({ ...f, startYear: newRecord.year }));
    }
  }, [filters.endYear, filters.startYear]);

  // Delete a user-added record
  const handleDeleteCustomRecord = useCallback((id: string) => {
    setCustomRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem('coes_user_custom_records', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving custom records', e);
      }
      broadcastUpdate(updated);
      return updated;
    });

    // Persist deletion to backend server API
    fetch(`/api/custom-records/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: REQUIRED_PASSWORD }),
    }).catch((err) => {
      console.error('Error deleting record on server:', err);
    });
  }, []);

  // Clear all custom records
  const handleClearAllCustom = useCallback(() => {
    if (window.confirm('¿Deseas eliminar todos los registros digitados y volver a la serie histórica original del COES?')) {
      setCustomRecords([]);
      try {
        localStorage.removeItem('coes_user_custom_records');
      } catch (e) {}
      broadcastUpdate([]);

      // Persist clear to backend server API
      fetch('/api/custom-records/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: REQUIRED_PASSWORD }),
      }).catch((err) => {
        console.error('Error clearing records on server:', err);
      });
    }
  }, []);

  // Latest record for reference in modal
  const latestRecord = useMemo(() => {
    if (allRecords.length === 0) return undefined;
    return allRecords[allRecords.length - 1];
  }, [allRecords]);

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const regionKey = filters.region;
    const regionName = REGIONS_METADATA[regionKey].shortName;
    
    const headers = [
      'Año',
      'Mes_Numero',
      'Mes_Nombre',
      'Dia_Del_Mes',
      'Fecha_Completa',
      'Dia_De_Semana',
      'Tipo_Dia',
      'Hora_Especifica',
      'Bloque_Horario',
      `Demanda_${regionName}_MW`,
      'Demanda_Nacional_SEIN_MW',
      'Exportacion_PER_ECU_MW',
      'Importacion_ECU_PER_MW',
      'Participacion_Porcentaje',
      'Crecimiento_YoY_Porcentaje',
      'Ranking_Historico_SEIN',
      'Tipo_Fuente',
      'Observaciones_COES'
    ];

    const rows = filteredRecords.map((r) => {
      const regPoint = r.regions[regionKey];
      return [
        r.year,
        r.month,
        `"${r.monthName}"`,
        r.day,
        r.date,
        `"${r.dayOfWeek}"`,
        `"${r.dayType}"`,
        r.time,
        `"${r.periodName}"`,
        regPoint ? regPoint.demandMW : r.nationalDemandMW,
        r.nationalDemandMW,
        r.exportEcuMW ?? 0,
        r.importEcuMW ?? 0,
        regPoint ? regPoint.sharePercentage : 100,
        r.growthYoY !== null ? r.growthYoY : '',
        r.rankHistoric,
        r.isUserAdded ? '"Digitado Manualmente"' : '"Validado COES"',
        `"${r.notes.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `maxima_demanda_peru_${regionKey}_${filters.startYear}_${filters.endYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredRecords, filters.region, filters.startYear, filters.endYear]);

  // Export to JSON
  const handleExportJSON = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `maxima_demanda_peru_${filters.region}_2010_${maxAvailableYear}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [filteredRecords, filters.region, maxAvailableYear]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation & App Header */}
      <Header
        currentRegion={filters.region}
        totalFilteredRecords={filteredRecords.length}
        totalRecordsCount={allRecords.length}
        customRecordsCount={customRecords.length}
        onResetFilters={handleResetFilters}
        onOpenHelp={() => setIsHelpOpen(true)}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onOpenAddRecord={() => setIsAddModalOpen(true)}
      />

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Interactive Filtering Module (Region, Years, Months, Days, Time, Search) */}
        <FiltersBar
          filters={filters}
          onChangeFilters={setFilters}
          onReset={handleResetFilters}
          totalResults={filteredRecords.length}
          maxYear={maxAvailableYear}
        />

        {/* 5 Core Metric Cards */}
        <KpiMetrics
          stats={stats}
          currentRegion={filters.region}
          onInspectRecord={setSelectedRecord}
        />

        {/* Main 15-Year Historical Evolution Chart */}
        <DemandTrendChart
          records={filteredRecords}
          currentRegion={filters.region}
          onSelectRecord={setSelectedRecord}
        />

        {/* 15 Years x 12 Months Heatmap Matrix */}
        <SeasonalHeatmap
          records={filteredRecords}
          currentRegion={filters.region}
          onSelectRecord={setSelectedRecord}
        />

        {/* Análisis de Ocurrencia Temporal (Horas, Días, Meses y Semanas) - ANCHO COMPLETO IGUAL A LA MATRIZ */}
        <TemporalAnalysis
          records={filteredRecords}
          currentRegion={filters.region}
        />

        {/* Distribución y Aporte por Regiones Eléctricas - ANCHO COMPLETO */}
        <RegionalBreakdownChart
          records={filteredRecords}
          currentRegion={filters.region}
          onSelectRegion={handleSelectRegion}
        />

        {/* Comprehensive Data Table with Search, Sort, and CSV Export */}
        <DataTable
          records={filteredRecords}
          currentRegion={filters.region}
          onSelectRecord={setSelectedRecord}
          onExportCSV={handleExportCSV}
          onOpenAddRecord={() => setIsAddModalOpen(true)}
          onDeleteRecord={handleDeleteCustomRecord}
        />
      </main>

      {/* Footer with Operational Data References */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">COES - SEIN</span>
            <span>•</span>
            <span>Comité de Operación Económica del Sistema Interconectado Nacional del Perú</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Período: 2010 - {maxAvailableYear}</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="text-amber-700 hover:underline cursor-pointer font-medium"
            >
              Marco Metodológico
            </button>
          </div>
        </div>
      </footer>

      {/* Detailed Record Inspector Modal */}
      <RecordModal
        record={selectedRecord}
        currentRegion={filters.region}
        onClose={() => setSelectedRecord(null)}
        onSelectRegion={handleSelectRegion}
        onDeleteRecord={handleDeleteCustomRecord}
      />

      {/* Regulatory & COES Guide Modal */}
      <TechnicalGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Modal para digitar las siguientes fechas de Máxima Demanda */}
      <AddPeakRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveRecord={handleSaveCustomRecord}
        customRecords={customRecords}
        onDeleteCustomRecord={handleDeleteCustomRecord}
        onClearAllCustom={handleClearAllCustom}
        latestRecord={latestRecord}
      />
    </div>
  );
}
