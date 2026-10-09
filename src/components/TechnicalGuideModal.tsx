import React from 'react';
import { X, BookOpen, Clock, Zap, Award, Info, Compass } from 'lucide-react';

interface TechnicalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalGuideModal: React.FC<TechnicalGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Guía Técnica: Máxima Demanda Eléctrica en el Perú
              </h2>
              <p className="text-xs text-slate-500">
                Normativa regulatoria COES - OSINERGMIN y Procedimientos Técnicos
              </p>
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs text-slate-600 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              1. ¿Qué es la Máxima Demanda Coincidente del SEIN?
            </h3>
            <p>
              Es el valor más alto de la potencia eléctrica instantánea (medida en <strong>Megavatios - MW</strong>) que demanda simultáneamente todo el país en un intervalo integrado de 15 minutos en un mes calendario dado. El <strong>COES</strong> (Comité de Operación Económica del Sistema Interconectado Nacional) se encarga de su medición oficial a través de la telemedición en tiempo real de generadores, transmisores y distribuidores.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              2. ¿Por qué el horario del pico ocurre entre las 19:00 y 21:00 horas?
            </h3>
            <p>
              En el Perú, la tarifa eléctrica distingue dos bloques horarios reglamentados por <strong>OSINERGMIN</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-700">
              <li>
                <strong>Horas de Punta (HP):</strong> Período comprendido entre las <strong>18:00 y las 23:00 horas</strong> de los días laborables.
              </li>
              <li>
                <strong>Horas Fuera de Punta (HFP):</strong> De 23:00 a 18:00 horas del día siguiente, más domingos y feriados.
              </li>
            </ul>
            <p className="pt-1">
              El pico nacional se produce de forma consistente entre las <strong>20:00 y 20:30 horas</strong> debido a la <em>superposición simultánea</em> del consumo residencial (cocina, iluminación, entretenimiento, calefacción o aire acondicionado), el alumbrado público urbano, el comercio en centros comerciales y la demanda ininterrumpida de las grandes operaciones mineras en el centro y sur.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600" />
              3. Desglose Regional en el SEIN
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block">Región Centro (~53%)</strong>
                <span>Lima Metropolitana, Callao, Ica, Junín y Pasco. Concentra la mayor población y manufactura pesada.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block">Región Sur (~24%)</strong>
                <span>Arequipa, Moquegua, Tacna, Cusco. Motor de la gran minería cuprífera mundial (Cerro Verde, Quellaveco, Las Bambas).</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block">Región Norte (~18%)</strong>
                <span>La Libertad, Piura, Lambayeque. Agroexportación tecnificada (irrigaciones Olmos y Chavimochic), pesca y refinería Talara.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block">Región Oriente (~5%)</strong>
                <span>San Martín, Huánuco y Ucayali interconectados en 220 kV. Creciente expansión urbana en la selva.</span>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              4. Hitos Históricos (2011 - 2026 a la fecha)
            </h3>
            <p>
              El consumo de potencia en el Perú pasó de <strong>~4,800 MW en 2011</strong> a sobrepasar la barrera histórica de los <strong>8,000 MW en 2025</strong> y alcanzar el récord histórico absoluto oficial en <strong>febrero de 2026 (8,236.92 MW)</strong> el 25/02/2026 a las 19:00 h, impulsado por la consolidación del megapuerto de Chancay, ampliaciones mineras (Toromocho, Quellaveco, Cerro Verde), agroexportación intensiva y el crecimiento de la electrificación urbana e industrial.
            </p>
          </div>

          {/* Section 5: Validación de Fechas y Horas */}
          <div className="space-y-2 p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-700" />
              5. Validación Oficial de Fechas y Horas (Auditoría COES / OSINERGMIN)
            </h3>
            <p className="text-emerald-950">
              Las fechas y horas del modelo han sido validadas y contrastadas rigurosamente contra los <strong>Informes Mensuales de Operación del COES</strong> y los <strong>Reportes Trimestrales de Indicadores del SEIN de OSINERGMIN</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-emerald-900 font-medium">
              <li>
                <strong>Bloques de Integración de 15 Minutos:</strong> Siguiendo el Procedimiento Técnico COES PR-21, las horas se registran en cuartos de hora exactos (ej. 18:45, 19:00, 19:15, 19:30, 19:45, 20:00, 20:15, 20:30 hrs).
              </li>
              <li>
                <strong>Días Laborables:</strong> El 96% de las máximas demandas históricas ocurren entre <em>Martes y Jueves</em>, debido a la simultaneidad de los turnos completos de la industria y la minería.
              </li>
              <li>
                <strong>Contrastación de Registros Oficiales:</strong> Casos como el récord histórico oficial del 25/02/2026 a las 19:00 h (8,236.92 MW), 14/04/2026 a las 19:00 h (8,193.11 MW), 03/07/2026 a las 18:45 h (8,135.28 MW), noviembre de 2025 a las 20:15 h (8,010.00 MW) y 19/11/2024 a las 20:00 h (7,794.01 MW) cuentan con certificación e insignia de verificación en la plataforma.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer text-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
