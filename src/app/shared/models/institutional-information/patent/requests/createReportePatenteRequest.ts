import { InventorPatenteRequest }
  from './inventorPatenteRequest';

/*
 * Representa la solicitud para registrar
 * un reporte de patente.
 */
export interface CreateReportePatenteRequest {

  idMapInstitucionPeriodo: number;

  strNombreTitulo: string;

  strNumeroRegistroSolicitud: string;

  idTipoPatente: number;

  idEstatusPatente: number;

  dateFechaSolicitud: string;

  dateFechaConcesion: string | null;

  strTitularPatente: string;

  idUsuarioRegistro: string;

  inventores: InventorPatenteRequest[];
}