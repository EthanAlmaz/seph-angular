/*
 * Representa los datos necesarios para asignar
 * un periodo a una institución.
 */
export interface CreateMapInstitucionPeriodoRequest {

  idInstitucion: number;

  idPeriodo: number;

  bitCapturaAbierta: boolean;

  dateFechaApertura: string | null;

  dateFechaCierre: string | null;

  idUsuarioRegistro: string;
}