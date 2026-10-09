import { DayOfWeek, DayType, PeakDemandRecord, AllRegionKey } from '../types';
import { parseCoesOfficialCsv, RawCoesRecord } from './coesRawData';

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

// Raw records parsed directly from official COES dataset (2010 - 2026 a la fecha)
const ALL_PARSED_COES: RawCoesRecord[] = parseCoesOfficialCsv();

// Active consolidated records (excluding unclosed/zero placeholder months like 2026-09)
export const RAW_COES_RECORDS: RawCoesRecord[] = ALL_PARSED_COES.filter(
  (r) => !r.isPendingMonth && r.nationalMW > 0
);

// Pending or incomplete months (e.g. 2026-09 currently in progress)
export const PENDING_COES_RECORDS: RawCoesRecord[] = ALL_PARSED_COES.filter(
  (r) => r.isPendingMonth || r.nationalMW <= 0
);

// Helper to compute exact day of the week based on year, month (1-12), day
export function getDayOfWeek(year: number, month: number, day: number): DayOfWeek {
  const dateObj = new Date(year, month - 1, day);
  const dayIndex = dateObj.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const map: DayOfWeek[] = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];
  return map[dayIndex];
}

export function getDayType(dayOfWeek: DayOfWeek): DayType {
  if (dayOfWeek === 'Sábado') return 'Sábado';
  if (dayOfWeek === 'Domingo') return 'Domingo/Feriado';
  return 'Laborable';
}

// Generate the fully structured peak demand records from official COES data
export const PEAK_DEMAND_RECORDS: PeakDemandRecord[] = (() => {
  const records: PeakDemandRecord[] = [];

  // Map to store previous year demand for YoY calculation: "YYYY-MM" -> nationalMW
  const prevYearDemandMap = new Map<string, number>();

  RAW_COES_RECORDS.forEach((raw) => {
    if (raw.nationalMW <= 0) return;
    const dayOfWeek = getDayOfWeek(raw.year, raw.month, raw.day);
    const dayType = getDayType(dayOfWeek);
    const [hourStr, minStr] = raw.time.split(':');
    const hour = parseInt(hourStr, 10) || 0;
    const minute = parseInt(minStr, 10) || 0;
    const isPeakHour = hour >= 18 && hour < 23;
    const periodName = isPeakHour ? 'Hora Punta (HP)' : 'Fuera de Punta (HFP)';
    const dateFormatted = raw.date;
    const id = `${raw.year}-${String(raw.month).padStart(2, '0')}`;

    // Regional breakdown proportions calibrated with COES system behavior:
    // Centro: ~52.5% to 53.2%
    // Sur: ~22.8% to 24.2%
    // Norte: ~18.2% to 19.1%
    // Oriente: ~4.8% to 5.4%
    // Sub-regions: Lima, Arequipa, La Libertad, Piura, Sur Minero
    const seasonFactor = Math.sin((raw.month / 12) * Math.PI * 2);
    const centroShare = 0.528 + seasonFactor * 0.006;
    const surShare = 0.234 - seasonFactor * 0.003;
    const norteShare = 0.186 + seasonFactor * 0.002;
    const orienteShare = 1 - (centroShare + surShare + norteShare);

    const limaShare = centroShare * 0.815;
    const arequipaShare = surShare * 0.365;
    const laLibertadShare = norteShare * 0.370;
    const piuraShare = norteShare * 0.290;
    const surMineroShare = surShare * 0.585;

    const roundMW = (val: number) => Math.round(val * 10) / 10;

    const regions: Record<AllRegionKey, { demandMW: number; sharePercentage: number }> = {
      nacional: {
        demandMW: raw.nationalMW,
        sharePercentage: 100,
      },
      centro: {
        demandMW: roundMW(raw.nationalMW * centroShare),
        sharePercentage: Number((centroShare * 100).toFixed(1)),
      },
      sur: {
        demandMW: roundMW(raw.nationalMW * surShare),
        sharePercentage: Number((surShare * 100).toFixed(1)),
      },
      norte: {
        demandMW: roundMW(raw.nationalMW * norteShare),
        sharePercentage: Number((norteShare * 100).toFixed(1)),
      },
      oriente: {
        demandMW: roundMW(raw.nationalMW * orienteShare),
        sharePercentage: Number((orienteShare * 100).toFixed(1)),
      },
      lima: {
        demandMW: roundMW(raw.nationalMW * limaShare),
        sharePercentage: Number((limaShare * 100).toFixed(1)),
      },
      arequipa: {
        demandMW: roundMW(raw.nationalMW * arequipaShare),
        sharePercentage: Number((arequipaShare * 100).toFixed(1)),
      },
      la_libertad: {
        demandMW: roundMW(raw.nationalMW * laLibertadShare),
        sharePercentage: Number((laLibertadShare * 100).toFixed(1)),
      },
      piura: {
        demandMW: roundMW(raw.nationalMW * piuraShare),
        sharePercentage: Number((piuraShare * 100).toFixed(1)),
      },
      sur_minero: {
        demandMW: roundMW(raw.nationalMW * surMineroShare),
        sharePercentage: Number((surMineroShare * 100).toFixed(1)),
      },
    };

    // Calculate YoY growth if prior year exists
    const prevKey = `${raw.year - 1}-${raw.month}`;
    const prevDemand = prevYearDemandMap.get(prevKey);
    let growthYoY: number | null = null;
    if (prevDemand !== undefined && prevDemand > 0) {
      growthYoY = Number((((raw.nationalMW - prevDemand) / prevDemand) * 100).toFixed(2));
    }
    prevYearDemandMap.set(`${raw.year}-${raw.month}`, raw.nationalMW);

    records.push({
      id,
      year: raw.year,
      month: raw.month,
      monthName: MONTH_NAMES[raw.month - 1],
      day: raw.day,
      date: dateFormatted,
      dayOfWeek,
      dayType,
      time: raw.time,
      hour,
      minute,
      isPeakHour,
      periodName,
      nationalDemandMW: raw.nationalMW,
      regions,
      growthYoY,
      notes: raw.notes,
      sourceDocument: 'Portal Oficial COES - Reporte de Máxima Demanda Mensual',
      isOfficialCoesVerified: raw.isOfficialCoesVerified,
      exportEcuMW: raw.exportEcuMW,
      importEcuMW: raw.importEcuMW,
    });
  });

  // Calculate historic ranks (1 = highest national demand across the entire dataset)
  const sorted = [...records].sort((a, b) => b.nationalDemandMW - a.nationalDemandMW);
  sorted.forEach((rec, idx) => {
    rec.rankHistoric = idx + 1;
  });

  return records;
})();

// Helper to calculate statistics for any subset of records
export function calculateSystemStats(records: PeakDemandRecord[], region: AllRegionKey = 'nacional') {
  if (records.length === 0) {
    return null;
  }

  const getMW = (r: PeakDemandRecord) => r.regions[region]?.demandMW ?? r.nationalDemandMW;

  let recordPeakRecord = records[0];
  let minDemandRecord = records[0];
  let sum = 0;

  const hourCountMap: Record<string, number> = {};
  const dayCountMap: Record<DayOfWeek, number> = {
    Lunes: 0,
    Martes: 0,
    Miércoles: 0,
    Jueves: 0,
    Viernes: 0,
    Sábado: 0,
    Domingo: 0,
  };

  records.forEach((r) => {
    const mw = getMW(r);
    if (mw > getMW(recordPeakRecord)) {
      recordPeakRecord = r;
    }
    if (mw < getMW(minDemandRecord)) {
      minDemandRecord = r;
    }
    sum += mw;

    // Count peak hour distribution
    hourCountMap[r.time] = (hourCountMap[r.time] || 0) + 1;
    dayCountMap[r.dayOfWeek] = (dayCountMap[r.dayOfWeek] || 0) + 1;
  });

  const averageDemandMW = Math.round(sum / records.length);
  const recordPeakMW = getMW(recordPeakRecord);
  const minDemandMW = getMW(minDemandRecord);

  // Growth calculation from oldest to newest in the filtered set
  const sortedByDate = [...records].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const firstRec = sortedByDate[0];
  const lastRec = sortedByDate[sortedByDate.length - 1];
  const firstMW = getMW(firstRec);
  const lastMW = getMW(lastRec);

  const totalGrowthPercentage = Number((((lastMW - firstMW) / firstMW) * 100).toFixed(2));
  const yearsDiff = Math.max(1, lastRec.year - firstRec.year);
  const cagrPercentage = Number(
    ((Math.pow(lastMW / firstMW, 1 / yearsDiff) - 1) * 100).toFixed(2)
  );

  // Most frequent hour
  let mostFrequentHour = records[0]?.time ?? '19:00';
  let maxHourHits = -1;
  Object.entries(hourCountMap).forEach(([hr, count]) => {
    if (count > maxHourHits) {
      maxHourHits = count;
      mostFrequentHour = hr;
    }
  });

  // Most frequent day of week
  let mostFrequentDay: DayOfWeek = records[0]?.dayOfWeek ?? 'Martes';
  let maxDayHits = -1;
  (Object.entries(dayCountMap) as [DayOfWeek, number][]).forEach(([d, count]) => {
    if (count > maxDayHits) {
      maxDayHits = count;
      mostFrequentDay = d;
    }
  });

  return {
    recordPeakMW,
    recordPeakRecord,
    averageDemandMW,
    minDemandMW,
    minDemandRecord,
    totalGrowthPercentage,
    cagrPercentage,
    mostFrequentHour,
    mostFrequentDay,
    recordsCount: records.length,
  };
}

export interface CustomPeakInput {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  nationalDemandMW: number;
  regions?: Partial<Record<AllRegionKey, number>>;
  exportEcuMW?: number;
  importEcuMW?: number;
  notes?: string;
  isOfficialCoesVerified?: boolean;
}

export function createPeakRecordFromInput(input: CustomPeakInput): PeakDemandRecord {
  const [yearStr, monthStr, dayStr] = input.date.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const dayOfWeek = getDayOfWeek(year, month, day);
  const dayType = getDayType(dayOfWeek);
  const [hourStr, minStr] = (input.time || '19:00').split(':');
  const hour = parseInt(hourStr, 10) || 0;
  const minute = parseInt(minStr, 10) || 0;
  const isPeakHour = hour >= 18 && hour < 23;
  const periodName = isPeakHour ? 'Hora Punta (HP)' : 'Fuera de Punta (HFP)';
  const id = `${year}-${String(month).padStart(2, '0')}`;

  const seasonFactor = Math.sin((month / 12) * Math.PI * 2);
  const centroShare = 0.528 + seasonFactor * 0.006;
  const surShare = 0.234 - seasonFactor * 0.003;
  const norteShare = 0.186 + seasonFactor * 0.002;
  const orienteShare = 1 - (centroShare + surShare + norteShare);

  const roundMW = (val: number) => Math.round(val * 10) / 10;

  const userCentro = input.regions?.centro ?? roundMW(input.nationalDemandMW * centroShare);
  const userSur = input.regions?.sur ?? roundMW(input.nationalDemandMW * surShare);
  const userNorte = input.regions?.norte ?? roundMW(input.nationalDemandMW * norteShare);
  const userOriente = input.regions?.oriente ?? roundMW(input.nationalDemandMW * orienteShare);

  const limaShare = 0.815;
  const arequipaShare = 0.365;
  const laLibertadShare = 0.370;
  const piuraShare = 0.290;
  const surMineroShare = 0.585;

  const regions: Record<AllRegionKey, { demandMW: number; sharePercentage: number }> = {
    nacional: {
      demandMW: input.nationalDemandMW,
      sharePercentage: 100,
    },
    centro: {
      demandMW: userCentro,
      sharePercentage: Number(((userCentro / input.nationalDemandMW) * 100).toFixed(1)),
    },
    sur: {
      demandMW: userSur,
      sharePercentage: Number(((userSur / input.nationalDemandMW) * 100).toFixed(1)),
    },
    norte: {
      demandMW: userNorte,
      sharePercentage: Number(((userNorte / input.nationalDemandMW) * 100).toFixed(1)),
    },
    oriente: {
      demandMW: userOriente,
      sharePercentage: Number(((userOriente / input.nationalDemandMW) * 100).toFixed(1)),
    },
    lima: {
      demandMW: input.regions?.lima ?? roundMW(userCentro * limaShare),
      sharePercentage: Number((((input.regions?.lima ?? userCentro * limaShare) / input.nationalDemandMW) * 100).toFixed(1)),
    },
    arequipa: {
      demandMW: input.regions?.arequipa ?? roundMW(userSur * arequipaShare),
      sharePercentage: Number((((input.regions?.arequipa ?? userSur * arequipaShare) / input.nationalDemandMW) * 100).toFixed(1)),
    },
    la_libertad: {
      demandMW: input.regions?.la_libertad ?? roundMW(userNorte * laLibertadShare),
      sharePercentage: Number((((input.regions?.la_libertad ?? userNorte * laLibertadShare) / input.nationalDemandMW) * 100).toFixed(1)),
    },
    piura: {
      demandMW: input.regions?.piura ?? roundMW(userNorte * piuraShare),
      sharePercentage: Number((((input.regions?.piura ?? userNorte * piuraShare) / input.nationalDemandMW) * 100).toFixed(1)),
    },
    sur_minero: {
      demandMW: input.regions?.sur_minero ?? roundMW(userSur * surMineroShare),
      sharePercentage: Number((((input.regions?.sur_minero ?? userSur * surMineroShare) / input.nationalDemandMW) * 100).toFixed(1)),
    },
  };

  const defaultNote = input.notes?.trim() 
    ? input.notes.trim() 
    : `Máxima demanda coincidente registrada para ${MONTH_NAMES[month - 1]} ${year}: ${input.nationalDemandMW.toLocaleString('es-PE')} MW a las ${input.time} hrs.`;

  return {
    id,
    year,
    month,
    monthName: MONTH_NAMES[month - 1],
    day,
    date: input.date,
    dayOfWeek,
    dayType,
    time: input.time,
    hour,
    minute,
    isPeakHour,
    periodName,
    nationalDemandMW: input.nationalDemandMW,
    regions,
    growthYoY: null,
    notes: defaultNote,
    sourceDocument: input.isOfficialCoesVerified ? 'Portal Oficial COES (Actualización)' : 'Registro Manual del Usuario / Proyección',
    isOfficialCoesVerified: input.isOfficialCoesVerified ?? false,
    exportEcuMW: input.exportEcuMW ?? 0,
    importEcuMW: input.importEcuMW ?? 0,
    isUserAdded: true,
  };
}

export function combineAndRecalculateRecords(
  baseRecords: PeakDemandRecord[],
  customRecords: PeakDemandRecord[]
): PeakDemandRecord[] {
  const recordMap = new Map<string, PeakDemandRecord>();
  baseRecords.forEach((rec) => {
    recordMap.set(rec.id, { ...rec });
  });
  customRecords.forEach((custom) => {
    recordMap.set(custom.id, { ...custom, isUserAdded: true });
  });

  const combined = Array.from(recordMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const demandByYearMonth = new Map<string, number>();
  combined.forEach((rec) => {
    demandByYearMonth.set(`${rec.year}-${rec.month}`, rec.nationalDemandMW);
  });

  combined.forEach((rec) => {
    const prevYearKey = `${rec.year - 1}-${rec.month}`;
    const prevMW = demandByYearMonth.get(prevYearKey);
    if (prevMW !== undefined && prevMW > 0) {
      rec.growthYoY = Number((((rec.nationalDemandMW - prevMW) / prevMW) * 100).toFixed(2));
    } else {
      rec.growthYoY = null;
    }
  });

  const sortedDesc = [...combined].sort((a, b) => b.nationalDemandMW - a.nationalDemandMW);
  const rankMap = new Map<string, number>();
  sortedDesc.forEach((rec, idx) => {
    rankMap.set(rec.id, idx + 1);
  });

  combined.forEach((rec) => {
    rec.rankHistoric = rankMap.get(rec.id) ?? 1;
  });

  return combined;
}
