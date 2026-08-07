/*
 * Representa una pregunta registrada
 * en el catálogo de análisis estratégico.
 */
export interface CatPreguntaAnalisisResponse {

  id: number;

  strPregunta: string;

  dateTimeFechaRegistro: string;

  bitActivo: boolean;

  intOrden: number;
}