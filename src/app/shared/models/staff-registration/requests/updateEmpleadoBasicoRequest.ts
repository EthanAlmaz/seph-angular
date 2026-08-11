/*
 * Modelo utilizado para actualizar los datos básicos
 * (nombre, apellidos, CURP, sexo, INE y fotografía)
 * de un empleado ya registrado.
 * Se usa al retomar un registro incompleto.
 */
export interface UpdateEmpleadoBasicoRequest {
  strNombre: string;
  strApellidoPat: string;
  strApellidoMat: string;
  strCurp: string;
  idSexo: number;
  strRutaIne?: string | null;
  strRutaFotografia?: string | null;
}