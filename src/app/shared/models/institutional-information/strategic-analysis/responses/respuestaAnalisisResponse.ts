/*
 * Representa una respuesta registrada
 * dentro del análisis estratégico.
 */
export interface RespuestaAnalisisResponse {

  id: number;

  idPreguntaAnalisis: number;

  strPregunta: string;

  strRespuesta: string | null;
}