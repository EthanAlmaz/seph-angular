import { RespuestaAnalisisRequest }
  from './respuestaAnalisisRequest';

/*
 * Representa la solicitud para actualizar
 * un reporte de análisis estratégico.
 */
export interface UpdateReporteAnalisisEstrategicoRequest {

  idMapInstitucionPeriodo: number;

  respuestasAnalisis: RespuestaAnalisisRequest[];
}