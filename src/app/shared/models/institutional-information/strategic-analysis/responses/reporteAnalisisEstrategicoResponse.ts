import { RespuestaAnalisisResponse }
  from './respuestaAnalisisResponse';

/*
 * Representa la información de un
 * reporte de análisis estratégico.
 */
export interface ReporteAnalisisEstrategicoResponse {

  id: number;

  idMapInstitucionPeriodo: number;

  respuestasAnalisis: RespuestaAnalisisResponse[];
}