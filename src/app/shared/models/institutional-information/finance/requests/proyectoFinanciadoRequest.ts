/*
 * Representa un proyecto financiado
 * asociado al reporte financiero.
 */
export interface ProyectoFinanciadoRequest {

  id: number;

  strNombre: string;

  strOrigenFinanciamiento: string;

  strObjetivo: string;
}