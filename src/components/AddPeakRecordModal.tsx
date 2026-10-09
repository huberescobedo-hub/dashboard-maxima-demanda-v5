import React, { useState, useMemo } from 'react';
import {
  X,
  CalendarPlus,
  Zap,
  Check,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  Globe2,
  TrendingUp,
  History,
  RotateCcw,
  Lock,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { PeakDemandRecord, AllRegionKey } from '../types';
import { getDayOfWeek, getDayType, MONTH_NAMES, CustomPeakInput } from '../data/demandData';
import { REGIONS_METADATA } from '../data/regions';

interface AddPeakRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecord: (input: CustomPeakInput) => void;
  customRecords: PeakDemandRecord[];
  onDeleteCustomRecord: (id: string) => void;
  onClearAllCustom: () => void;
  latestRecord?: PeakDemandRecord;
}

const COMMON_HOURS = ['18:45', '19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30'];
const REQUIRED_PASSWORD = 'BMSRP2026';

export const AddPeakRecordModal: React.FC<AddPeakRecordModalProps> = ({
  isOpen,
  onClose,
  onSaveRecord,
  customRecords,
  onDeleteCustomRecord,
  onClearAllCustom,
  latestRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');

  // Authorization state for BMSRP2026
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form State
  // Default to a date for 2026-09 or today
  const defaultDate = useMemo(() => {
    return '2026-09-18';
  }, []);

  const [date, setDate] = useState<string>(defaultDate);
  const [time, setTime] = useState<string>('19:15');
  const [nationalMW, setNationalMW] = useState<string>('8195.4');
  const [useAutoRegional, setUseAutoRegional] = useState<boolean>(true);
  const [centroMW, setCentroMW] = useState<string>('');
  const [surMW, setSurMW] = useState<string>('');
  const [norteMW, setNorteMW] = useState<string>('');
  const [orienteMW, setOrienteMW] = useState<string>('');
  const [exportEcu, setExportEcu] = useState<string>('0');
  const [importEcu, setImportEcu] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [isOfficial, setIsOfficial] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setIsAuthorized(false);
    setPasswordInput('');
    setAuthError(null);
    setErrorMessage(null);
    setShowPassword(false);
    onClose();
  };

  const handleAuthorize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput.trim() === REQUIRED_PASSWORD) {
      setIsAuthorized(true);
      setAuthError(null);
    } else {
      setAuthError(`Contraseña incorrecta. Debe ingresar "${REQUIRED_PASSWORD}" para acceder y editar.`);
    }
  };

  // Derived date info
  const dateInfo = useMemo(() => {
    if (!date) return null;
    const parts = date.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) return null;

    const dayOfWeek = getDayOfWeek(y, m, d);
    const dayType = getDayType(dayOfWeek);
    const monthName = MONTH_NAMES[m - 1];

    const [hStr, minStr] = time.split(':');
    const h = parseInt(hStr, 10) || 0;
    const isPeakHour = h >= 18 && h < 23;

    return {
      year: y,
      month: m,
      monthName,
      day: d,
      dayOfWeek,
      dayType,
      isPeakHour,
    };
  }, [date, time]);

  // Auto-fill suggestions
  const handleSelectPresetMW = (val: number) => {
    setNationalMW(val.toFixed(1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Strict validation with required password BMSRP2026
    if (passwordInput.trim() !== REQUIRED_PASSWORD) {
      setErrorMessage(`Contraseña no autorizada. Debe ingresar la clave "${REQUIRED_PASSWORD}" para guardar.`);
      setIsAuthorized(false);
      return;
    }

    if (!dateInfo) {
      setErrorMessage('Por favor ingrese una fecha válida en formato AAAA-MM-DD.');
      return;
    }

    const mwNum = parseFloat(nationalMW);
    if (isNaN(mwNum) || mwNum <= 0) {
      setErrorMessage('La demanda nacional del SEIN debe ser un número positivo (MW).');
      return;
    }

    let customRegions: Partial<Record<AllRegionKey, number>> | undefined = undefined;
    if (!useAutoRegional) {
      const c = parseFloat(centroMW);
      const s = parseFloat(surMW);
      const n = parseFloat(norteMW);
      const o = parseFloat(orienteMW);
      if (isNaN(c) || isNaN(s) || isNaN(n) || isNaN(o)) {
        setErrorMessage('Al desmarcar el reparto automático, debe ingresar los valores MW para las 4 regiones.');
        return;
      }
      customRegions = {
        centro: c,
        sur: s,
        norte: n,
        oriente: o,
      };
    }

    const expEcu = parseFloat(exportEcu) || 0;
    const impEcu = parseFloat(importEcu) || 0;

    const defaultNotes = notes.trim()
      ? notes.trim()
      : `Máxima demanda coincidente registrada para ${dateInfo.monthName} ${dateInfo.year}: ${mwNum.toLocaleString('es-PE')} MW el ${dateInfo.day}/${dateInfo.month}/${dateInfo.year} a las ${time} hrs.`;

    onSaveRecord({
      date,
      time,
      nationalDemandMW: mwNum,
      regions: customRegions,
      exportEcuMW: expEcu,
      importEcuMW: impEcu,
      notes: defaultNotes,
      isOfficialCoesVerified: isOfficial,
    });

    handleClose();
  };

  if (!isOpen) return null;

  // Security Gate: require BMSRP2026 before entering the form or saving data
  if (!isAuthorized) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Acceso Protegido
                </h2>
                <p className="text-xs text-slate-500">
                  Digitar Siguiente Máxima Demanda SEIN
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleAuthorize} className="p-5 space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">
                  Contraseña de Autorización Requerida
                </p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Para ingresar fechas, potencias y guardar la información del SEIN evitando que cualquiera pueda modificarla, ingrese la contraseña de acceso autorizada:
                </p>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contraseña de Seguridad
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError(null);
                  }}
                  placeholder="Ingrese la contraseña..."
                  autoFocus
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-900 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Se requiere la clave autorizada para digitar y guardar información.</span>
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                Validar y Desbloquear
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-b border-slate-200 px-5 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Digitar Siguiente Máxima Demanda
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Alimentar SEIN
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Ingresa las fechas y potencias para actualizar en tiempo real los gráficos y análisis histórico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 hidden sm:inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Autorizado ({REQUIRED_PASSWORD})
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 pt-2 bg-slate-50 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'form'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Formulario de Entrada
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Registros Ingresados
            {customRecords.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">
                {customRecords.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Date & Time Selection */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    1. Fecha y Hora Exacta de Máxima Demanda
                  </span>
                  {dateInfo && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      {dateInfo.monthName} {dateInfo.year}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Date picker */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fecha del Evento (Día/Mes/Año)
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                    />
                  </div>

                  {/* Time picker */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hora del Pico (Formato 24h)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick hours buttons */}
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Horarios frecuentes COES:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_HOURS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setTime(h)}
                        className={`px-2 py-1 text-[11px] rounded font-mono transition-colors cursor-pointer ${
                          time === h
                            ? 'bg-amber-600 text-white font-bold'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Computed Date Details */}
                {dateInfo && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                    <span className="font-medium">Día detectado:</span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {dateInfo.dayOfWeek}
                    </span>
                    <span>•</span>
                    <span className="font-medium">Tipo de día:</span>
                    <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {dateInfo.dayType}
                    </span>
                    <span>•</span>
                    <span className="font-medium">Bloque:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded border ${
                        dateInfo.isPeakHour
                          ? 'bg-orange-50 border-orange-200 text-orange-800'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {dateInfo.isPeakHour ? 'Hora Punta (HP)' : 'Fuera de Punta (HFP)'}
                    </span>
                  </div>
                )}
              </div>

              {/* 2. National Demand in MW */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    2. Máxima Potencia Demandada Nacional (SEIN MW)
                  </span>
                  <span className="text-xs text-slate-500">
                    Último mes: {latestRecord ? `${latestRecord.nationalDemandMW.toLocaleString('es-PE')} MW` : '8,084.5 MW'}
                  </span>
                </div>

                <div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={nationalMW}
                      onChange={(e) => setNationalMW(e.target.value)}
                      placeholder="Ej. 8195.4"
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-base font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      MW
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500">Sugerencias rápidas:</span>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetMW(8150.0)}
                    className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
                  >
                    8,150.0 MW (Promedio)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetMW(8210.0)}
                    className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
                  >
                    8,210.0 MW (+0.5%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetMW(8250.0)}
                    className="text-[11px] px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-semibold cursor-pointer"
                  >
                    8,250.0 MW (Nuevo Récord)
                  </button>
                </div>
              </div>

              {/* 3. Regional Distribution */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    3. Reparto de Potencia por Regiones Eléctricas
                  </span>
                </div>

                <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAutoRegional}
                    onChange={(e) => setUseAutoRegional(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>
                    <strong>Calcular automáticamente</strong> según proporciones estándar del SEIN (Centro ~52.8%, Sur ~23.4%, Norte ~18.6%, Oriente ~5.2% y sub-regiones Lima, Arequipa, etc.)
                  </span>
                </label>

                {!useAutoRegional && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-700">Centro (MW)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={centroMW}
                        onChange={(e) => setCentroMW(e.target.value)}
                        placeholder="Ej. 4320"
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-700">Sur (MW)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={surMW}
                        onChange={(e) => setSurMW(e.target.value)}
                        placeholder="Ej. 1920"
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-700">Norte (MW)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={norteMW}
                        onChange={(e) => setNorteMW(e.target.value)}
                        placeholder="Ej. 1520"
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-700">Oriente (MW)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={orienteMW}
                        onChange={(e) => setOrienteMW(e.target.value)}
                        placeholder="Ej. 435"
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. International Tie Line (PER-ECU) & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                    Interconexión Perú - Ecuador
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500">Export PER-ECU</label>
                      <input
                        type="number"
                        step="0.1"
                        value={exportEcu}
                        onChange={(e) => setExportEcu(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Import ECU-PER</label>
                      <input
                        type="number"
                        step="0.1"
                        value={importEcu}
                        onChange={(e) => setImportEcu(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Validación y Estado
                  </span>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={isOfficial}
                        onChange={() => setIsOfficial(true)}
                        className="text-amber-600"
                      />
                      <span>Validado COES</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={!isOfficial}
                        onChange={() => setIsOfficial(false)}
                        className="text-amber-600"
                      />
                      <span>Estimación / Preliminar</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas u Observaciones Operativas (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Máxima demanda del mes registrada en horas de la noche con alta carga industrial..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Security & Authorization Status */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      Autorización de Guardado Habilitada
                    </span>
                    <p className="text-[11px] text-amber-800/80">
                      Clave validada: <strong className="font-mono text-amber-900 font-bold">{REQUIRED_PASSWORD}</strong> (edición y guardado habilitados)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Autorizado
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuthorized(false);
                      setPasswordInput('');
                    }}
                    className="text-[11px] text-slate-500 hover:text-rose-700 px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                    title="Bloquear edición"
                  >
                    Bloquear
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  Guardar y Actualizar Dashboard
                </button>
              </div>
            </form>
          ) : (
            /* Records History Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Picos Ingresados por el Usuario ({customRecords.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Estos registros se combinan con la serie histórica oficial del COES
                  </p>
                </div>
                {customRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAllCustom}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpiar Todos
                  </button>
                )}
              </div>

              {customRecords.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <CalendarPlus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    Aún no has ingresado fechas adicionales
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                    Usa la pestaña "Formulario de Entrada" para digitar el próximo pico del SEIN (ej. Setiembre 2026 en adelante).
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Ir al Formulario
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {customRecords.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {r.monthName} {r.year} ({r.date})
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {r.time} h
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {r.dayOfWeek}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Demanda Nacional: <strong className="text-slate-900">{r.nationalDemandMW.toLocaleString('es-PE')} MW</strong>
                          {r.growthYoY !== null && (
                            <span className="ml-2 font-medium text-emerald-700">
                              (YoY: {r.growthYoY > 0 ? `+${r.growthYoY}%` : `${r.growthYoY}%`})
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400 italic truncate max-w-md">
                          {r.notes}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteCustomRecord(r.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar este registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
