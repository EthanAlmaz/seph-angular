/*
 * Representa un proyecto financiado
 * registrado dentro del reporte financiero.
 */
export interface ProyectoFinanciadoResponse {

  id: number;

  strNombre: string;

  strOrigenFinanciamiento: string;

  strObjetivo: string;
}