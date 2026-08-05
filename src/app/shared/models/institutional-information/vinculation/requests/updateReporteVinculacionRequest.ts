import { SectorVinculadoRequest }
  from './sectorVinculadoRequest';

/*
 * Representa la solicitud para actualizar
 * un reporte de vinculación.
 */
export interface UpdateReporteVinculacionRequest {

  idMapInstitucionPeriodo: number;

  intTotalConveniosActivos: number;

  bitPracticasProfesionales: boolean;

  bitServicioSocial: boolean;

  bitSeguimientoEgresados: boolean;

  idMecanismoSeguimiento: number | null;

  decimalPorcentajeLaborando: number;

  sectoresVinculados: SectorVinculadoRequest[];
}