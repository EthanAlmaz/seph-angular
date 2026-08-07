import { ProyectoFinanciadoRequest }
  from './proyectoFinanciadoRequest';

/*
 * Representa la solicitud para registrar
 * un reporte financiero.
 */
export interface CreateReporteFinanzaRequest {

  idMapInstitucionPeriodo: number;

  moneyPresupuestoAnual: number;

  moneySubsidioEstatal: number;

  moneySubsidioFederal: number;

  moneyIngresosPropios: number;

  moneyGastoEjercido: number;

  moneyGastoAlumno: number;

  bitAdeudos: boolean;

  moneyMontoAdeudo: number;

  idUsuarioRegistro: string;

  proyectosFinanciados: ProyectoFinanciadoRequest[];
}