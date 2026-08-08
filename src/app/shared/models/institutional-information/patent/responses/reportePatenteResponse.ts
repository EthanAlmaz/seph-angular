import { InventorPatenteResponse }
  from './inventorPatenteResponse';

/*
 * Representa la información
 * de un reporte de patente.
 */
export interface ReportePatenteResponse {

  id: number;

  idMapInstitucionPeriodo: number;

  strNombreTitulo: string;

  strNumeroRegistroSolicitud: string;

  idTipoPatente: number;

  idEstatusPatente: number;

  dateFechaSolicitud: string;

  dateFechaConcesion: string | null;

  strTitularPatente: string;

  inventores: InventorPatenteResponse[];
}