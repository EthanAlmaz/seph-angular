/*
 * Representa las estadísticas del
 * reporte financiero.
 */
export interface ReporteFinanzaEstadisticasResponse {

  periodo: string;

  moneyPresupuestoAnual: number;

  moneySubsidioEstatal: number;

  moneySubsidioFederal: number;

  moneyIngresosPropios: number;

  moneyGastoEjercido: number;

  moneyGastoAlumno: number;

  moneyMontoAdeudo: number;
}
