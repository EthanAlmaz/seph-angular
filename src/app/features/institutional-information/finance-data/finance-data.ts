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

import { CreateReporteFinanzaRequest }
  from '../../../shared/models/institutional-information/finance/requests/createReporteFinanzaRequest';

import { UpdateReporteFinanzaRequest }
  from '../../../shared/models/institutional-information/finance/requests/updateReporteFinanzaRequest';

import { ProyectoFinanciadoRequest }
  from '../../../shared/models/institutional-information/finance/requests/proyectoFinanciadoRequest';

import { BarChartComponent }
  from '../../../shared/ui/charts/bar-chart/bar-chart';

@Component({
  selector: 'app-finance-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BarChartComponent
  ],
  templateUrl: './finance-data.html',
  styleUrl: './finance-data.scss'
})
export class FinanceDataComponent implements OnInit {

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
   * Permite actualizar manualmente la vista
   * después de recibir información del backend.
   */
  private cdr =
    inject(ChangeDetectorRef);

  /*
   * Relación entre la institución del usuario
   * y el periodo activo.
   */
  idMapInstitucionPeriodo: number | null =
    null;

  /*
   * Nombre del periodo activo
   * mostrado dentro del formulario.
   */
  periodo = '';

  /*
   * Vista activa del componente:
   * captura o previsualización.
   */
  activeView: 'capture' | 'preview' =
    'capture';

    /*
    * Controla la página visible dentro
    * de la captura financiera.
    */
    capturePage: 1 | 2 = 1;

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
   * del reporte financiero.
   */
  financeReport = {

    presupuestoAnual:
      null as number | null,

    subsidioEstatal:
      null as number | null,

    subsidioFederal:
      null as number | null,

    ingresosPropios:
      null as number | null,

    gastoEjercido:
      null as number | null,

    gastoAlumno:
      null as number | null,

    adeudos:
      false,

    montoAdeudo:
      null as number | null,

    proyectosFinanciados:
      [] as ProyectoFinanciadoRequest[]

  };

  /*
   * Información temporal utilizada
   * para agregar un proyecto financiado.
   */
  proyectoFinanciado = {

    strNombre: '',

    strOrigenFinanciamiento: '',

    strObjetivo: ''

  };

  /*
   * Respaldo de la información utilizada
   * para restaurar los valores al cancelar una edición.
   */
  private originalValues:
    typeof this.financeReport | null =
    null;

  /*
   * Inicializa la información necesaria
   * para mostrar el formulario.
   */
  ngOnInit(): void {

    this.loadActivePeriod();

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

          this.loadReporteFinanza();

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
   * Consulta si ya existe un reporte
   * financiero para el periodo activo.
   */
  private loadReporteFinanza(): void {

    if (!this.idMapInstitucionPeriodo) {
      return;
    }

    this.institutionalInformationService
      .getReporteFinanza(
        this.idMapInstitucionPeriodo
      )
      .subscribe({

        next: (response) => {

          const reporte =
            response.data;

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
          this.financeReport = {

            presupuestoAnual:
              reporte.moneyPresupuestoAnual,

            subsidioEstatal:
              reporte.moneySubsidioEstatal,

            subsidioFederal:
              reporte.moneySubsidioFederal,

            ingresosPropios:
              reporte.moneyIngresosPropios,

            gastoEjercido:
              reporte.moneyGastoEjercido,

            gastoAlumno:
              reporte.moneyGastoAlumno,

            adeudos:
              reporte.bitAdeudos,

            montoAdeudo:
              reporte.moneyMontoAdeudo,

            proyectosFinanciados:
              reporte.proyectosFinanciados.map(
                proyecto => ({

                  id:
                    proyecto.id,

                  strNombre:
                    proyecto.strNombre,

                  strOrigenFinanciamiento:
                    proyecto.strOrigenFinanciamiento,

                  strObjetivo:
                    proyecto.strObjetivo

                })
              )

          };

          /*
           * Guarda una copia de la información
           * obtenida para restaurarla si se
           * cancela la edición.
           */
          this.originalValues = {

            ...this.financeReport,

            proyectosFinanciados:
              this.financeReport
                .proyectosFinanciados
                .map(proyecto => ({
                  ...proyecto
                }))

          };

          this.cdr.detectChanges();

        },

        error: (
          error: HttpErrorResponse
        ) => {

          /*
           * Si todavía no existe un reporte,
           * permite continuar con la captura.
           */
          if (error.status === 404) {
            return;
          }

          console.error(error);

          this.showError(
            'No fue posible consultar el reporte financiero.'
          );

        }

      });

  }

  /*
   * Muestra la pantalla de captura
   * del reporte financiero.
   */
  showCapture(): void {

    this.activeView = 'capture';

  }

  /*
   * Muestra la vista previa con el resumen
   * y las gráficas financieras.
   */
  showPreview(): void {

    this.activeView = 'preview';

  }

  /*
 * Muestra la página de información
 * financiera dentro de la captura.
 */
showFinancialDataPage(): void {

  this.capturePage = 1;

}

/*
 * Muestra la página de proyectos
 * financiados dentro de la captura.
 */
showFinancedProjectsPage(): void {

  this.capturePage = 2;

}

  /*
   * Agrega un proyecto financiado
   * a la lista del reporte.
   */
  addProyectoFinanciado(): void {

    const nombre =
      this.proyectoFinanciado
        .strNombre
        .trim();

    const origenFinanciamiento =
      this.proyectoFinanciado
        .strOrigenFinanciamiento
        .trim();

    const objetivo =
      this.proyectoFinanciado
        .strObjetivo
        .trim();

    /*
     * Valida que todos los datos
     * del proyecto estén completos.
     */
    if (
      !nombre ||
      !origenFinanciamiento ||
      !objetivo
    ) {

      this.validationError(
        'Debe completar todos los datos del proyecto financiado.'
      );

      return;

    }

    /*
     * Evita registrar dos proyectos
     * con el mismo nombre.
     */
    const proyectoExists =
      this.financeReport
        .proyectosFinanciados
        .some(
          proyecto =>
            proyecto.strNombre
              .trim()
              .toLowerCase() ===
            nombre.toLowerCase()
        );

    if (proyectoExists) {

      this.validationError(
        'El proyecto financiado ya fue agregado.'
      );

      return;

    }

    this.financeReport
      .proyectosFinanciados
      .push({

        /*
         * Los proyectos nuevos se envían con
         * identificador cero al backend.
         */
        id: 0,

        strNombre:
          nombre,

        strOrigenFinanciamiento:
          origenFinanciamiento,

        strObjetivo:
          objetivo

      });

    /*
     * Limpia los campos temporales
     * después de agregar el proyecto.
     */
    this.proyectoFinanciado = {

      strNombre: '',

      strOrigenFinanciamiento: '',

      strObjetivo: ''

    };

    this.cdr.detectChanges();

  }

  /*
   * Elimina un proyecto financiado
   * de la lista del reporte.
   */
  removeProyectoFinanciado(
    index: number
  ): void {

    this.financeReport
      .proyectosFinanciados
      .splice(index, 1);

    this.cdr.detectChanges();

  }

  /*
   * Guarda la información capturada.
   * Si el reporte ya existe se actualiza;
   * en caso contrario, se crea uno nuevo.
   */
  saveFinanceData(): void {

    if (this.isSaving) {
      return;
    }

    if (!this.validateFinanceData()) {
      return;
    }

    this.isSaving = true;

    if (this.reportSaved) {

      this.updateFinanceData();

    } else {

      this.createFinanceData();

    }

  }

  /*
   * Registra un nuevo reporte
   * financiero.
   */
  private createFinanceData(): void {

    const request =
      this.buildCreateRequest();

    this.institutionalInformationService
      .createReporteFinanza(request)
      .subscribe({

        next: (response) => {

          this.reportSaved = true;

          this.isEditing = false;

          this.activeView = 'capture';

          this.originalValues = {

            ...this.financeReport,

            proyectosFinanciados:
              this.financeReport
                .proyectosFinanciados
                .map(proyecto => ({
                  ...proyecto
                }))

          };

          this.showSaveMessage(
            response.message ||
            'La información se guardó correctamente.',
            'success'
          );

          this.isSaving = false;

          this.cdr.detectChanges();

        },

        error: (
          error: HttpErrorResponse
        ) => {

          console.error(error);

          this.showError(
            error.error?.message ??
            'No fue posible guardar la información financiera.'
          );

          this.isSaving = false;

        }

      });

  }

  /*
   * Actualiza un reporte financiero
   * previamente registrado.
   */
  private updateFinanceData(): void {

    const request =
      this.buildUpdateRequest();

    this.institutionalInformationService
      .updateReporteFinanza(request)
      .subscribe({

        next: (response) => {

          this.isEditing = false;

          this.activeView = 'capture';

          this.originalValues = {

            ...this.financeReport,

            proyectosFinanciados:
              this.financeReport
                .proyectosFinanciados
                .map(proyecto => ({
                  ...proyecto
                }))

          };

          this.showSaveMessage(
            response.message ||
            'La información se actualizó correctamente.',
            'success'
          );

          this.isSaving = false;

          this.cdr.detectChanges();

        },

        error: (
          error: HttpErrorResponse
        ) => {

          console.error(error);

          this.showError(
            error.error?.message ??
            'No fue posible actualizar la información financiera.'
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

      ...this.financeReport,

      proyectosFinanciados:
        this.financeReport
          .proyectosFinanciados
          .map(proyecto => ({
            ...proyecto
          }))

    };

    this.isEditing = true;

  }

  /*
   * Cancela la edición y restaura
   * los valores originales.
   */
  cancelEdit(): void {

    if (this.originalValues) {

      this.financeReport = {

        ...this.originalValues,

        proyectosFinanciados:
          this.originalValues
            .proyectosFinanciados
            .map(proyecto => ({
              ...proyecto
            }))

      };

    }

    this.isEditing = false;

    this.cdr.detectChanges();

  }

  /*
   * Valida que los campos obligatorios
   * tengan un valor capturado.
   */
  private validateRequiredFields(): boolean {

    if (

      this.financeReport.presupuestoAnual === null ||

      this.financeReport.subsidioEstatal === null ||

      this.financeReport.subsidioFederal === null ||

      this.financeReport.ingresosPropios === null ||

      this.financeReport.gastoEjercido === null ||

      this.financeReport.gastoAlumno === null 

    ) {

      this.validationError(
        'Todos los campos obligatorios deben ser capturados.'
      );

      return false;

    }

    return true;

  }

  /*
   * Valida que los valores financieros
   * no sean negativos.
   */
  private validateNegativeValues(): boolean {

    if (

      this.financeReport.presupuestoAnual! < 0 ||

      this.financeReport.subsidioEstatal! < 0 ||

      this.financeReport.subsidioFederal! < 0 ||

      this.financeReport.ingresosPropios! < 0 ||

      this.financeReport.gastoEjercido! < 0 ||

      this.financeReport.gastoAlumno! < 0

    ) {

      this.validationError(
        'Los valores financieros no pueden ser negativos.'
      );

      return false;

    }

    return true;

  }

  /*
   * Valida el monto del adeudo cuando
   * la institución indica que tiene adeudos.
   */
  private validateDebtAmount(): boolean {

    if (

      this.financeReport.adeudos &&

      (
        this.financeReport.montoAdeudo === null ||

        this.financeReport.montoAdeudo <= 0
      )

    ) {

      this.validationError(
        'El monto del adeudo debe ser mayor que cero.'
      );

      return false;

    }

    return true;

  }

  /*
   * Ejecuta todas las validaciones antes
   * de guardar la información financiera.
   */
  private validateFinanceData(): boolean {

    if (!this.validateRequiredFields()) {
      return false;
    }

    if (!this.validateNegativeValues()) {
      return false;
    }

    if (!this.validateDebtAmount()) {
      return false;
    }

    return true;

  }

  /*
   * Construye la solicitud para crear
   * un nuevo reporte financiero.
   */
  private buildCreateRequest():
    CreateReporteFinanzaRequest {

    return {

      idMapInstitucionPeriodo:
        this.idMapInstitucionPeriodo!,

      moneyPresupuestoAnual:
        this.financeReport.presupuestoAnual!,

      moneySubsidioEstatal:
        this.financeReport.subsidioEstatal!,

      moneySubsidioFederal:
        this.financeReport.subsidioFederal!,

      moneyIngresosPropios:
        this.financeReport.ingresosPropios!,

      moneyGastoEjercido:
        this.financeReport.gastoEjercido!,

      moneyGastoAlumno:
        this.financeReport.gastoAlumno!,

      bitAdeudos:
        this.financeReport.adeudos,

      moneyMontoAdeudo:
        this.financeReport.adeudos
          ? this.financeReport.montoAdeudo!
          : 0,

      idUsuarioRegistro:
        String(
          this.authService.currentUser()?.id ?? ''
        ),

      proyectosFinanciados:
        this.financeReport.proyectosFinanciados

    };

  }

  /*
   * Construye la solicitud para actualizar
   * un reporte financiero registrado.
   */
  private buildUpdateRequest():
    UpdateReporteFinanzaRequest {

    return {

      idMapInstitucionPeriodo:
        this.idMapInstitucionPeriodo!,

      moneyPresupuestoAnual:
        this.financeReport.presupuestoAnual!,

      moneySubsidioEstatal:
        this.financeReport.subsidioEstatal!,

      moneySubsidioFederal:
        this.financeReport.subsidioFederal!,

      moneyIngresosPropios:
        this.financeReport.ingresosPropios!,

      moneyGastoEjercido:
        this.financeReport.gastoEjercido!,

      moneyGastoAlumno:
        this.financeReport.gastoAlumno!,

      bitAdeudos:
        this.financeReport.adeudos,

      moneyMontoAdeudo:
        this.financeReport.adeudos
          ? this.financeReport.montoAdeudo!
          : 0,

      proyectosFinanciados:
        this.financeReport.proyectosFinanciados

    };

  }

  /*
   * Muestra un mensaje cuando alguna
   * validación no se cumple.
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
   * Muestra un mensaje de éxito o error
   * después de guardar o actualizar.
   */
  private showSaveMessage(
    message: string,
    type: 'success' | 'error'
  ): void {

    this.saveMessage =
      message;

    this.saveMessageType =
      type;

    this.cdr.detectChanges();

    setTimeout(() => {

      this.saveMessage = '';

      this.cdr.detectChanges();

    }, 4000);

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