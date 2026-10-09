export type RegionId = 
  | 'nacional' 
  | 'centro' 
  | 'norte' 
  | 'sur' 
  | 'oriente';

export type SubRegionId = 
  | 'lima' 
  | 'arequipa' 
  | 'la_libertad' 
  | 'piura' 
  | 'sur_minero';

export type AllRegionKey = RegionId | SubRegionId;

export interface RegionInfo {
  id: AllRegionKey;
  name: string;
  shortName: string;
  category: 'macro' | 'departamental';
  description: string;
  color: string;
  accentBg: string;
  borderColor: string;
  typicalSharePercent: number;
}

export type DayOfWeek = 
  | 'Lunes' 
  | 'Martes' 
  | 'Miércoles' 
  | 'Jueves' 
  | 'Viernes' 
  | 'Sábado' 
  | 'Domingo';

export type DayType = 'Laborable' | 'Sábado' | 'Domingo/Feriado';

export interface RegionalDemandPoint {
  demandMW: number;
  sharePercentage: number;
}

export interface PeakDemandRecord {
  id: string; // e.g. "2024-03"
  year: number; // 2010 - 2026 (a la fecha)
  month: number; // 1 - 12
  monthName: string; // "Enero", "Febrero", etc.
  day: number; // 1 - 31
  date: string; // "YYYY-MM-DD"
  dayOfWeek: DayOfWeek;
  dayType: DayType;
  time: string; // "HH:mm" e.g. "19:45"
  hour: number; // 18, 19, 20, 21, 22
  minute: number; // 0, 15, 30, 45
  isPeakHour: boolean; // 18:00 - 23:00 (Horas de Punta según COES/OSINERGMIN)
  periodName: 'Hora Punta (HP)' | 'Fuera de Punta (HFP)';
  
  // Demanda máxima coincidente del SEIN nacional (MW)
  nationalDemandMW: number;
  
  // Desglose por regiones en ese momento de máxima demanda
  regions: Record<AllRegionKey, RegionalDemandPoint>;
  
  // Interconexión Internacional Perú - Ecuador
  exportEcuMW?: number;
  importEcuMW?: number;

  // Crecimiento interanual vs mismo mes del año anterior (%)
  growthYoY: number | null;
  
  // Ranking histórico (1 = récord histórico absoluto)
  rankHistoric?: number;
  
  // Contexto operativo o suceso relevante
  notes: string;

  // Validación con fuentes oficiales del COES / OSINERGMIN
  sourceDocument?: string;
  isOfficialCoesVerified?: boolean;
  isUserAdded?: boolean;
}

export interface FilterState {
  region: AllRegionKey;
  startYear: number;
  endYear: number;
  months: number[]; // empty means all
  daysOfWeek: DayOfWeek[]; // empty means all
  timeSlot: 'all' | 'hp' | 'hfp' | '19_20' | '20_21' | '21_22';
  minMW: number;
  maxMW: number;
  searchQuery: string;
}

export interface SystemStats {
  recordPeakMW: number;
  recordPeakRecord: PeakDemandRecord;
  averageDemandMW: number;
  minDemandMW: number;
  minDemandRecord: PeakDemandRecord;
  totalGrowthPercentage: number;
  cagrPercentage: number;
  mostFrequentHour: string;
  mostFrequentDay: DayOfWeek;
  recordsCount: number;
}
