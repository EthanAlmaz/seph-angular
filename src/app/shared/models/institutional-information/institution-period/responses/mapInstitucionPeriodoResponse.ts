/*
 * Representa una asignación de periodo
 * correspondiente a una institución.
 */
export interface MapInstitucionPeriodoResponse {

  id: number;

  idInstitucion: number;

  strInstitucion: string;

  strSiglasInstitucion: string | null;

  idPeriodo: number;

  strPeriodo: string;

  strDescripcionPeriodo: string;

  intAnio: number;

  intNumeroPeriodo: number;

  dateFechaInicioPeriodo: string;

  dateFechaFinPeriodo: string;

  idTipoPeriodo: number;

  strTipoPeriodo: string;

  bitCapturaAbierta: boolean;

  dateFechaApertura: string | null;

  dateFechaCierre: string | null;

  dateTimeFechaRegistro: string;

  idUsuarioRegistro: string;

  bitActivo: boolean;
}