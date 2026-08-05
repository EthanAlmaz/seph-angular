import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService }
  from '../../../core/services/auth/authService';

import { InstitutionalInformationService }
  from '../../../core/services/institutional-information/institutional-information.service';

import { CatalogService }
  from '../../../core/services/catalogs/catalog.service';

import { MecanismoResponse }
  from '../../../shared/models/catalogs/responses/mecanismoResponse';

import { SectorVinculadoResponse }
  from '../../../shared/models/catalogs/responses/sectorVinculadoResponse';

import { CreateReporteVinculacionRequest }
  from '../../../shared/models/institutional-information/vinculation/requests/createReporteVinculacionRequest';

import { UpdateReporteVinculacionRequest }
  from '../../../shared/models/institutional-information/vinculation/requests/updateReporteVinculacionRequest';

import { SectorVinculadoRequest }
  from '../../../shared/models/institutional-information/vinculation/requests/sectorVinculadoRequest';

import { BarChartComponent }
  from '../../../shared/ui/charts/bar-chart/bar-chart';
@Component({
  selector: 'app-vinculation-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BarChartComponent
  ],
  templateUrl: './vinculation-data.html',
  styleUrl: './vinculation-data.scss'
})
export class VinculationDataComponent implements OnInit {

  /*
   * Servicio encargado de consumir los endpoints
   * del Registro de Información Institucional.
   */
  private institutionalInformationService =
    inject(InstitutionalInformationService);

  /*
   * Servicio utilizado para obtener la información
   * del usuario que inició sesión.
   */
  private authService =
    inject(AuthService);

  /*
   * Servicio encargado de consultar
   * los catálogos del sistema.
   */
  private catalogService =
    inject(CatalogService);

  /*
   * Permite actualizar manualmente la vista
   * después de recibir información del backend.
   */
  private cdr =
    inject(ChangeDetectorRef);

  /*
   * Relación entre la institución del usuario
   * y el periodo activo.
   */
  idMapInstitucionPeriodo: number | null = null;

  /*
   * Nombre del periodo activo
   * mostrado dentro del formulario.
   */
  periodo = '';

  /*
   * Fecha en la que fue registrado
   * el reporte de vinculación.
   */
  fechaRegistro = '';

  /*
   * Vista activa del componente:
   * captura o previsualización.
   */
  activeView: 'capture' | 'preview' =
    'capture';

  /*
   * Catálogo de mecanismos
   * de seguimiento.
   */
  mecanismos: MecanismoResponse[] = [];

  /*
   * Catálogo de sectores
   * vinculados.
   */
  sectoresVinculados:
    SectorVinculadoResponse[] = [];

  /*
   * Indica si ya existe un reporte
   * registrado para el periodo activo.
   */
  reportSaved = false;

  /*
   * Indica si el usuario está modificando
   * un reporte previamente registrado.
   */
  isEditing = false;

  /*
   * Evita múltiples solicitudes mientras
   * se guarda o actualiza la información.
   */
  isSaving = false;

  /*
   * Indica si el componente se encuentra
   * cargando información.
   */
  isLoading = false;

  /*
   * Mensaje mostrado dentro
   * del formulario.
   */
  saveMessage = '';

  /*
   * Tipo del mensaje mostrado:
   * éxito o error.
   */
  saveMessageType:
    'success' | 'error' =
    'success';

  /*
   * Información capturada dentro
   * del reporte de vinculación.
   */
  vinculationReport = {

    totalConveniosActivos:
      null as number | null,

    practicasProfesionales:
      false,

    servicioSocial:
      false,

    seguimientoEgresados:
      false,

    idMecanismoSeguimiento:
      null as number | null,

    porcentajeLaborando:
      null as number | null,

    sectoresVinculados:
      [] as SectorVinculadoRequest[]

  };

  /*
 * Sector seleccionado para agregar
 * a la lista de sectores vinculados.
 */
selectedSectorId: number | null = null;

/*
 * Texto capturado cuando el sector
 * seleccionado corresponde a otro.
 */
otroSector = '';

  /*
   * Respaldo de la información utilizada
   * para restaurar los valores al cancelar una edición.
   */
  private originalValues:
    typeof this.vinculationReport | null =
    null;

    /*
 * Inicializa la información necesaria
 * para mostrar el formulario.
 */
ngOnInit(): void {

  this.loadActivePeriod();

  this.loadMecanismos();

  this.loadSectoresVinculados();

}

/*
 * Obtiene el periodo activo
 * de la institución asignada al usuario.
 */
private loadActivePeriod(): void {

  const idInstitucion =
    this.authService.currentUser()
      ?.idInstitucion;

  if (!idInstitucion) {

    this.showError(
      'El usuario no tiene una institución asignada.'
    );

    return;

  }

  this.institutionalInformationService
    .getPeriodoActivo(idInstitucion)
    .subscribe({

      next: (response) => {

        const periodoActivo =
          response.data;

        if (!periodoActivo) {

          this.showError(
            'No existe un periodo activo para la institución.'
          );

          return;

        }

        this.idMapInstitucionPeriodo =
          periodoActivo.idMapInstitucionPeriodo;

        this.periodo =
          periodoActivo.strPeriodo;

        this.loadReporteVinculacion();

      },

      error: (
        error: HttpErrorResponse
      ) => {

        console.error(error);

        this.showError(
          'No fue posible obtener el periodo activo.'
        );

      }

    });

}

/*
 * Obtiene el catálogo de mecanismos
 * de seguimiento.
 */
private loadMecanismos(): void {

  this.catalogService
    .getMecanismos()
    .subscribe({

      next: (response) => {

        this.mecanismos =
          response.data ?? [];

        this.cdr.detectChanges();

      },

      error: (
        error: HttpErrorResponse
      ) => {

        console.error(error);

        this.showError(
          'No fue posible cargar el catálogo de mecanismos de seguimiento.'
        );

      }

    });

}

/*
 * Obtiene el catálogo de sectores
 * vinculados.
 */
private loadSectoresVinculados(): void {

  this.catalogService
    .getSectoresVinculados()
    .subscribe({

      next: (response) => {

        this.sectoresVinculados =
          response.data ?? [];

        this.cdr.detectChanges();

      },

      error: (
        error: HttpErrorResponse
      ) => {

        console.error(error);

        this.showError(
          'No fue posible cargar el catálogo de sectores vinculados.'
        );

      }

    });

}

/*
 * Consulta si ya existe un reporte
 * registrado para el periodo activo.
 */
private loadReporteVinculacion(): void {

  if (!this.idMapInstitucionPeriodo) {
    return;
  }

  this.institutionalInformationService
    .getReporteVinculacion(
      this.idMapInstitucionPeriodo
    )
    .subscribe({

      next: (response) => {

        const reporte = response.data;

        if (!reporte) {
          return;
        }

        /*
         * Confirma que ya existe
         * un reporte registrado.
         */
        this.reportSaved = true;

        /*
         * Llena el formulario con la
         * información obtenida del backend.
         */
        this.vinculationReport = {

          totalConveniosActivos:
            reporte.intTotalConveniosActivos,

          practicasProfesionales:
            reporte.bitPracticasProfesionales,

          servicioSocial:
            reporte.bitServicioSocial,

          seguimientoEgresados:
            reporte.bitSeguimientoEgresados,

          idMecanismoSeguimiento:
            reporte.idMecanismoSeguimiento,

          porcentajeLaborando:
            reporte.decimalPorcentajeLaborando,

          sectoresVinculados:
            reporte.sectoresVinculados.map(
              sector => ({
                idSectorVinculado:
                  sector.idSectorVinculado,

                strOtros:
                  sector.strOtros
              })
            )

        };

        /*
         * Guarda una copia de la información
         * obtenida para poder restaurarla si
         * el usuario cancela la edición.
         */
        this.originalValues = {
          ...this.vinculationReport,
          sectoresVinculados:
            [...this.vinculationReport.sectoresVinculados]
        };

        /*
         * Muestra la fecha en la que
         * fue registrado el reporte.
         */
        this.fechaRegistro =
          new Date(
            reporte.dateTimeFechaRegistro
          ).toLocaleDateString('es-MX');

        this.cdr.detectChanges();

      },

      error: (
        error: HttpErrorResponse
      ) => {

        /*
         * Si aún no existe un reporte,
         * simplemente continúa.
         */
        if (error.status === 404) {
          return;
        }

        console.error(error);

        this.showError(
          'No fue posible consultar el reporte de vinculación.'
        );

      }

    });

}

/*
 * Valida que los campos obligatorios
 * tengan un valor capturado.
 */
private validateRequiredFields(): boolean {

  if (

    this.vinculationReport.totalConveniosActivos === null ||

    this.vinculationReport.idMecanismoSeguimiento === null ||

    this.vinculationReport.porcentajeLaborando === null ||

    this.vinculationReport.sectoresVinculados.length === 0

  ) {

    this.validationError(
      'Todos los campos obligatorios deben ser capturados.'
    );

    return false;

  }

  return true;

}

/*
 * Valida que los valores numéricos
 * no sean negativos.
 */
private validateNegativeValues(): boolean {

  if (

    this.vinculationReport.totalConveniosActivos! < 0 ||

    this.vinculationReport.porcentajeLaborando! < 0

  ) {

    this.validationError(
      'Los valores numéricos no pueden ser negativos.'
    );

    return false;

  }

  return true;

}

/*
 * Valida que el porcentaje
 * se encuentre entre 0 y 100.
 */
private validatePercentage(): boolean {

  const porcentaje =
    this.vinculationReport.porcentajeLaborando!;

  if (

    porcentaje < 0 ||

    porcentaje > 100

  ) {

    this.validationError(
      'El porcentaje de egresados laborando debe estar entre 0 y 100.'
    );

    return false;

  }

  return true;

}

/*
 * Ejecuta todas las validaciones
 * antes de guardar la información.
 */
private validateVinculationData(): boolean {

  if (!this.validateRequiredFields()) {
    return false;
  }

  if (!this.validateNegativeValues()) {
    return false;
  }

  if (!this.validatePercentage()) {
    return false;
  }

  return true;

}

/*
 * Muestra un mensaje cuando
 * alguna validación no se cumple.
 */
private validationError(
  message: string
): void {

  this.saveMessage =
    message;

  this.saveMessageType =
    'error';

  this.cdr.detectChanges();

  setTimeout(() => {

    this.saveMessage = '';

    this.cdr.detectChanges();

  }, 4000);

}

/*
 * Construye la solicitud para crear
 * un nuevo reporte de vinculación.
 */
private buildCreateRequest(): CreateReporteVinculacionRequest {

  return {

    idMapInstitucionPeriodo:
      this.idMapInstitucionPeriodo!,

    intTotalConveniosActivos:
      this.vinculationReport.totalConveniosActivos!,

    bitPracticasProfesionales:
      this.vinculationReport.practicasProfesionales,

    bitServicioSocial:
      this.vinculationReport.servicioSocial,

    bitSeguimientoEgresados:
      this.vinculationReport.seguimientoEgresados,

    idMecanismoSeguimiento:
      this.vinculationReport.idMecanismoSeguimiento,

    decimalPorcentajeLaborando:
      this.vinculationReport.porcentajeLaborando!,

    idUsuarioRegistro:
      String(
        this.authService.currentUser()?.id ?? ''
      ),

    sectoresVinculados:
      this.vinculationReport.sectoresVinculados

  };

}

/*
 * Construye la solicitud para actualizar
 * un reporte previamente registrado.
 */
private buildUpdateRequest(): UpdateReporteVinculacionRequest {

  return {

    idMapInstitucionPeriodo:
      this.idMapInstitucionPeriodo!,

    intTotalConveniosActivos:
      this.vinculationReport.totalConveniosActivos!,

    bitPracticasProfesionales:
      this.vinculationReport.practicasProfesionales,

    bitServicioSocial:
      this.vinculationReport.servicioSocial,

    bitSeguimientoEgresados:
      this.vinculationReport.seguimientoEgresados,

    idMecanismoSeguimiento:
      this.vinculationReport.idMecanismoSeguimiento,

    decimalPorcentajeLaborando:
      this.vinculationReport.porcentajeLaborando!,

    sectoresVinculados:
      this.vinculationReport.sectoresVinculados

  };

}


/*
 * Guarda la información capturada.
 * Si el reporte ya existe se actualiza,
 * en caso contrario se crea uno nuevo.
 */
saveVinculationData(): void {

  if (this.isSaving) {
    return;
  }

  if (!this.validateVinculationData()) {
    return;
  }

  this.isSaving = true;

  if (this.reportSaved) {

    this.updateVinculationData();

  } else {

    this.createVinculationData();

  }

}

/*
 * Registra un nuevo reporte
 * de vinculación.
 */
private createVinculationData(): void {

  const request =
    this.buildCreateRequest();

  this.institutionalInformationService
    .createReporteVinculacion(request)
    .subscribe({

      next: (response) => {

        this.reportSaved = true;

        this.isEditing = false;

        this.activeView = 'capture';

        this.originalValues = {
          ...this.vinculationReport,
          sectoresVinculados: [
            ...this.vinculationReport.sectoresVinculados
          ]
        };

        this.showSaveMessage(
          response.message ||
          'La información se guardó correctamente.',
          'success'
        );

        this.isSaving = false;

        this.cdr.detectChanges();

      },

      error: (error: HttpErrorResponse) => {

        console.error(error);

        this.showError(
          error.error?.message ??
          'No fue posible guardar la información.'
        );

        this.isSaving = false;

      }

    });

}


/*
 * Actualiza un reporte
 * previamente registrado.
 */
private updateVinculationData(): void {

  const request =
    this.buildUpdateRequest();

  this.institutionalInformationService
    .updateReporteVinculacion(request)
    .subscribe({

      next: (response) => {

        this.isEditing = false;

        this.activeView = 'capture';

        this.originalValues = {
          ...this.vinculationReport,
          sectoresVinculados: [
            ...this.vinculationReport.sectoresVinculados
          ]
        };

        this.showSaveMessage(
          response.message ||
          'La información se actualizó correctamente.',
          'success'
        );

        this.isSaving = false;

        this.cdr.detectChanges();

      },

      error: (error: HttpErrorResponse) => {

        console.error(error);

        this.showError(
          error.error?.message ??
          'No fue posible actualizar la información.'
        );

        this.isSaving = false;

      }

    });

}

/*
 * Habilita el modo edición
 * del formulario.
 */
enableEdit(): void {

  this.originalValues = {
    ...this.vinculationReport,
    sectoresVinculados: [
      ...this.vinculationReport.sectoresVinculados
    ]
  };

  this.isEditing = true;

}

/*
 * Cancela la edición y restaura
 * los valores originales.
 */
cancelEdit(): void {

  if (this.originalValues) {

    this.vinculationReport = {
      ...this.originalValues,
      sectoresVinculados: [
        ...this.originalValues.sectoresVinculados
      ]
    };

  }

  this.isEditing = false;

  this.cdr.detectChanges();

}

/*
 * Muestra un mensaje de éxito
 * después de guardar o actualizar.
 */
private showSaveMessage(
  message: string,
  type: 'success' | 'error'
): void {

  this.saveMessage = message;

  this.saveMessageType = type;

  this.cdr.detectChanges();

  setTimeout(() => {

    this.saveMessage = '';

    this.cdr.detectChanges();

  }, 4000);

}

/*
 * Muestra la pantalla de captura
 * del reporte de vinculación.
 */
showCapture(): void {

  this.activeView = 'capture';

}

/*
 * Muestra la vista previa con el resumen
 * y las gráficas de vinculación.
 */
showPreview(): void {

  this.activeView = 'preview';

}



/*
 * Agrega un sector vinculado
 * a la lista del reporte.
 */
addSector(): void {

  if (this.selectedSectorId === null) {

    this.validationError(
      'Debe seleccionar un sector vinculado.'
    );

    return;

  }

  /*
   * Cuando se selecciona el sector Otro,
   * es obligatorio especificar su descripción.
   */
  if (
    this.selectedSectorId === 6 &&
    !this.otroSector.trim()
  ) {

    this.validationError(
      'Debe especificar el nombre del otro sector.'
    );

    return;

  }

  const sectorExists =
    this.vinculationReport
      .sectoresVinculados
      .some(
        sector =>
          sector.idSectorVinculado ===
          this.selectedSectorId
      );

  if (sectorExists) {

    this.validationError(
      'El sector seleccionado ya fue agregado.'
    );

    return;

  }

  this.vinculationReport
    .sectoresVinculados
    .push({

      idSectorVinculado:
        this.selectedSectorId,

      strOtros:
        this.selectedSectorId === 6
          ? this.otroSector.trim()
          : null

    });

  this.selectedSectorId = null;

  this.otroSector = '';

  this.cdr.detectChanges();

}

/*
 * Elimina un sector vinculado
 * de la lista del reporte.
 */
removeSector(
  idSectorVinculado: number
): void {

  this.vinculationReport
    .sectoresVinculados =
      this.vinculationReport
        .sectoresVinculados
        .filter(
          sector =>
            sector.idSectorVinculado !==
            idSectorVinculado
        );

  this.cdr.detectChanges();

}

/*
 * Obtiene el nombre correspondiente
 * al sector vinculado.
 */
getSectorName(
  idSectorVinculado: number
): string {

  const sector =
    this.sectoresVinculados.find(
      item =>
        item.id ===
        idSectorVinculado
    );

  return sector?.strValor ??
    'Sector no identificado';

}

/*
 * Obtiene el nombre correspondiente
 * al mecanismo de seguimiento seleccionado.
 */
getMecanismoName(): string {

  const mecanismo =
    this.mecanismos.find(
      item =>
        item.id ===
        this.vinculationReport
          .idMecanismoSeguimiento
    );

  return mecanismo?.strValor ??
    'Sin seleccionar';

}



  /*
   * Muestra un mensaje de error
   * dentro del formulario.
   */
  private showError(
    message: string
  ): void {

    this.saveMessage =
      message;

    this.saveMessageType =
      'error';

    this.cdr.detectChanges();

    setTimeout(() => {

      this.saveMessage = '';

      this.cdr.detectChanges();

    }, 4000);

  }

}