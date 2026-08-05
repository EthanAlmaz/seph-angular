/*
 * Representa el comparativo de un
 * indicador del reporte de vinculación.
 */
export interface ReporteVinculacionComparativoResponse {

  indicador: string;

  periodoActual: string;

  valorActual: number;

  periodoAnterior: string | null;

  valorAnterior: number | null;

  diferencia: number;

  porcentajeCambio: number;

  estado: string;
}