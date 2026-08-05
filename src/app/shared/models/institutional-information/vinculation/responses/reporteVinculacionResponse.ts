import { SectorVinculadoResponse }
  from './sectorVinculadoResponse';

/*
 * Representa la información del
 * reporte de vinculación.
 */
export interface ReporteVinculacionResponse {

  id: number;

  idMapInstitucionPeriodo: number;

  intTotalConveniosActivos: number;

  bitPracticasProfesionales: boolean;

  bitServicioSocial: boolean;

  bitSeguimientoEgresados: boolean;

  idMecanismoSeguimiento: number | null;

  decimalPorcentajeLaborando: number;

  dateTimeFechaRegistro: string;

  sectoresVinculados: SectorVinculadoResponse[];
}