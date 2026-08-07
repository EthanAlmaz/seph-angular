import { RespuestaAnalisisRequest }
  from './respuestaAnalisisRequest';

/*
 * Representa la solicitud para registrar
 * un reporte de análisis estratégico.
 */
export interface CreateReporteAnalisisEstrategicoRequest {

  idMapInstitucionPeriodo: number;

  idUsuarioRegistro: string;

  respuestasAnalisis: RespuestaAnalisisRequest[];
}