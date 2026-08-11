/* Modelo utilizado para enviar información
 del empleado al backend.
Se utiliza en Registro Personal */

export interface CreateEmployeeRequest {
  strNombre: string;
  strApellidoPat: string;
  strApellidoMat: string;
  strCurp: string;
  idSexo: number;
  idInstitucion: number;
  strRutaIne?: string | null;
  strRutaFotografia?: string | null;
  dateTimeFechaRegistro: string;
  idUsuarioRegistro: string;
  bitActivo: boolean;
  dateTimeFechaBaja: string;
}