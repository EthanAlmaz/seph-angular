/*
 * Representa una respuesta enviada
 * dentro del análisis estratégico.
 */
export interface RespuestaAnalisisRequest {

  idPreguntaAnalisis: number;

  strRespuesta: string | null;
}