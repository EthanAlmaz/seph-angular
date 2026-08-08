import { InventorPatenteRequest }
  from './inventorPatenteRequest';

/*
 * Representa la solicitud para actualizar
 * un reporte de patente.
 */
export interface UpdateReportePatenteRequest {

  id: number;

  idMapInstitucionPeriodo: number;

  strNombreTitulo: string;

  strNumeroRegistroSolicitud: string;

  idTipoPatente: number;

  idEstatusPatente: number;

  dateFechaSolicitud: string;

  dateFechaConcesion: string | null;

  strTitularPatente: string;

  inventores: InventorPatenteRequest[];
}