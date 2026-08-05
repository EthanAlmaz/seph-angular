import { SectorVinculadoRequest }
  from './sectorVinculadoRequest';

/*
 * Representa la solicitud para registrar
 * un reporte de vinculación.
 */
export interface CreateReporteVinculacionRequest {

  idMapInstitucionPeriodo: number;

  intTotalConveniosActivos: number;

  bitPracticasProfesionales: boolean;

  bitServicioSocial: boolean;

  bitSeguimientoEgresados: boolean;

  idMecanismoSeguimiento: number | null;

  decimalPorcentajeLaborando: number;

  idUsuarioRegistro: string;

  sectoresVinculados: SectorVinculadoRequest[];
}