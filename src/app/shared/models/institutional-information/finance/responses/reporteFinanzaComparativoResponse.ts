/*
 * Representa el comparativo de un
 * indicador del reporte financiero.
 */
export interface ReporteFinanzaComparativoResponse {

  indicador: string;

  periodoActual: string;

  valorActual: number;

  periodoAnterior: string | null;

  valorAnterior: number | null;

  diferencia: number;

  porcentajeCambio: number;

  estado: string;
}