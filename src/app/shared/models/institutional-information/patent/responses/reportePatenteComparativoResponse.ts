/*
 * Representa el comparativo de un
 * indicador del reporte de patentes.
 */
export interface ReportePatenteComparativoResponse {

  indicador: string;

  periodoActual: string;

  valorActual: number;

  periodoAnterior: string | null;

  valorAnterior: number | null;

  diferencia: number;

  porcentajeCambio: number;

  estado: string;
}