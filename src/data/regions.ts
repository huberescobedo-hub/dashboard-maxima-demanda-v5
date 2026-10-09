import { AllRegionKey, RegionInfo } from '../types';

export const REGIONS_METADATA: Record<AllRegionKey, RegionInfo> = {
  nacional: {
    id: 'nacional',
    name: 'SEIN Total (Nivel Nacional)',
    shortName: 'SEIN Nacional',
    category: 'macro',
    description: 'Sistema Eléctrico Interconectado Nacional completo del Perú (COES).',
    color: '#0284c7', // Sky 600
    accentBg: 'bg-sky-50 text-sky-700 border-sky-200',
    borderColor: '#0284c7',
    typicalSharePercent: 100,
  },
  centro: {
    id: 'centro',
    name: 'Región Centro (Lima, Callao, Ica, Junín, Pasco)',
    shortName: 'Centro',
    category: 'macro',
    description: 'Principal centro de consumo residencial, comercial e industrial manufacturero.',
    color: '#2563eb', // Blue 600
    accentBg: 'bg-blue-50 text-blue-700 border-blue-200',
    borderColor: '#2563eb',
    typicalSharePercent: 52.8,
  },
  sur: {
    id: 'sur',
    name: 'Región Sur (Arequipa, Moquegua, Tacna, Cusco, Puno)',
    shortName: 'Sur',
    category: 'macro',
    description: 'Alta concentración de gran minería cuprífera (Cerro Verde, Las Bambas, Toquepala, Cuajone).',
    color: '#d97706', // Amber 600
    accentBg: 'bg-amber-50 text-amber-700 border-amber-200',
    borderColor: '#d97706',
    typicalSharePercent: 23.4,
  },
  norte: {
    id: 'norte',
    name: 'Región Norte (La Libertad, Lambayeque, Piura, Cajamarca)',
    shortName: 'Norte',
    category: 'macro',
    description: 'Demanda de agroindustria exportadora, pesquería, refinería Talara e industrias.',
    color: '#059669', // Emerald 600
    accentBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderColor: '#059669',
    typicalSharePercent: 18.6,
  },
  oriente: {
    id: 'oriente',
    name: 'Región Oriente (San Martín, Ucayali, Huánuco Selva)',
    shortName: 'Oriente',
    category: 'macro',
    description: 'Creciente interconexión de la selva y ciudades de la Amazonía peruana.',
    color: '#7c3aed', // Violet 600
    accentBg: 'bg-violet-50 text-violet-700 border-violet-200',
    borderColor: '#7c3aed',
    typicalSharePercent: 5.2,
  },
  lima: {
    id: 'lima',
    name: 'Lima Metropolitana y Callao',
    shortName: 'Lima / Callao',
    category: 'departamental',
    description: 'Mayor densidad de población urbana y servicios del país (Luz del Sur y Pluz Energía / Enel).',
    color: '#0891b2', // Cyan 600
    accentBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    borderColor: '#0891b2',
    typicalSharePercent: 43.1,
  },
  arequipa: {
    id: 'arequipa',
    name: 'Arequipa Urbana e Industrial',
    shortName: 'Arequipa',
    category: 'departamental',
    description: 'Segundo polo industrial del país y centro de demanda sur (SEAL y grandes cargas).',
    color: '#ea580c', // Orange 600
    accentBg: 'bg-orange-50 text-orange-700 border-orange-200',
    borderColor: '#ea580c',
    typicalSharePercent: 8.7,
  },
  la_libertad: {
    id: 'la_libertad',
    name: 'La Libertad (Trujillo y Valles)',
    shortName: 'La Libertad',
    category: 'departamental',
    description: 'Chavimochic, agroexportación intensiva y siderurgia en Chimbote/Trujillo.',
    color: '#16a34a', // Green 600
    accentBg: 'bg-green-50 text-green-700 border-green-200',
    borderColor: '#16a34a',
    typicalSharePercent: 6.9,
  },
  piura: {
    id: 'piura',
    name: 'Piura y Tumbes',
    shortName: 'Piura',
    category: 'departamental',
    description: 'Sector hidrocarburos, refinería, pesca industrial e irrigación Olmos-Piura.',
    color: '#14b8a6', // Teal 600
    accentBg: 'bg-teal-50 text-teal-700 border-teal-200',
    borderColor: '#14b8a6',
    typicalSharePercent: 5.4,
  },
  sur_minero: {
    id: 'sur_minero',
    name: 'Corredor Minero Sur (Grandes Clientes Libres)',
    shortName: 'Minería Sur',
    category: 'departamental',
    description: 'Cargas libres de minería de tajo abierto y concentradoras de cobre.',
    color: '#b45309', // Amber 700
    accentBg: 'bg-amber-100 text-amber-800 border-amber-300',
    borderColor: '#b45309',
    typicalSharePercent: 13.8,
  },
};

export const MACRO_REGIONS: AllRegionKey[] = ['nacional', 'centro', 'sur', 'norte', 'oriente'];
export const SUB_REGIONS: AllRegionKey[] = ['lima', 'arequipa', 'la_libertad', 'piura', 'sur_minero'];
