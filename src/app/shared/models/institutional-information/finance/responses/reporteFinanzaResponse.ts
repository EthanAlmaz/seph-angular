import { ProyectoFinanciadoResponse }
  from './proyectoFinanciadoResponse';

/*
 * Representa la información del
 * reporte financiero.
 */
export interface ReporteFinanzaResponse {

  id: number;

  idMapInstitucionPeriodo: number;

  moneyPresupuestoAnual: number;

  moneySubsidioEstatal: number;

  moneySubsidioFederal: number;

  moneyIngresosPropios: number;

  moneyGastoEjercido: number;

  moneyGastoAlumno: number;

  bitAdeudos: boolean;

  moneyMontoAdeudo: number;

  proyectosFinanciados: ProyectoFinanciadoResponse[];
}