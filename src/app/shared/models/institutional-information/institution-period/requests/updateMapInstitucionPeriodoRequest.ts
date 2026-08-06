/*
 * Representa los datos necesarios para actualizar
 * una asignación de periodo por institución.
 */
export interface UpdateMapInstitucionPeriodoRequest {

  id: number;

  idInstitucion: number;

  idPeriodo: number;

  bitCapturaAbierta: boolean;

  dateFechaApertura: string | null;

  dateFechaCierre: string | null;
}