import { ProyectoFinanciadoRequest }
  from './proyectoFinanciadoRequest';

/*
 * Representa la solicitud para actualizar
 * un reporte financiero.
 */
export interface UpdateReporteFinanzaRequest {

  idMapInstitucionPeriodo: number;

  moneyPresupuestoAnual: number;

  moneySubsidioEstatal: number;

  moneySubsidioFederal: number;

  moneyIngresosPropios: number;

  moneyGastoEjercido: number;

  moneyGastoAlumno: number;

  bitAdeudos: boolean;

  moneyMontoAdeudo: number;

  proyectosFinanciados: ProyectoFinanciadoRequest[];
}