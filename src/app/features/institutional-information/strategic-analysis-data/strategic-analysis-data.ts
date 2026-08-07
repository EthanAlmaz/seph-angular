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

import { CreateReporteAnalisisEstrategicoRequest }
  from '../../../shared/models/institutional-information/strategic-analysis/requests/createReporteAnalisisEstrategicoRequest';

import { UpdateReporteAnalisisEstrategicoRequest }
  from '../../../shared/models/institutional-information/strategic-analysis/requests/updateReporteAnalisisEstrategicoRequest';

import { RespuestaAnalisisRequest }
  from '../../../shared/models/institutional-information/strategic-analysis/requests/respuestaAnalisisRequest';

import { RespuestaAnalisisResponse }
  from '../../../shared/models/institutional-information/strategic-analysis/responses/respuestaAnalisisResponse';

@Component({
  selector: 'app-strategic-analysis-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './strategic-analysis-data.html',
  styleUrl: './strategic-analysis-data.scss'
})
export class StrategicAnalysisDataComponent
  implements OnInit {

  /*
   * Servicio encargado de consumir
   * los endpoints institucionales.
   */
  private institutionalInformationService =
    inject(InstitutionalInformationService);

  /*
   * Servicio utilizado para obtener
   * la información del usuario actual.
   */
  private authService =
    inject(AuthService);

  /*
   * Permite actualizar manualmente
   * la vista después de consumir la API.
   */
  private cdr =
    inject(ChangeDetectorRef);

  /*
   * Identificador de la relación entre
   * institución y periodo activo.
   */
  idMapInstitucionPeriodo: number | null =
    null;

  /*
   * Nombre del periodo activo.
   */
  periodo = '';

  /*
   * Vista mostrada dentro del componente.
   */
  activeView:
    'capture' | 'preview' =
    'capture';

  /*
   * Preguntas y respuestas mostradas
   * dinámicamente dentro del formulario.
   */
  respuestasAnalisis:
    RespuestaAnalisisResponse[] = [];

  /*
   * Indica si ya existe un reporte
   * registrado para el periodo activo.
   */
  reportSaved = false;

  /*
   * Indica si el reporte existente
   * se encuentra en modo edición.
   */
  isEditing = false;

  /*
   * Evita múltiples solicitudes
   * mientras se guarda información.
   */
  isSaving = false;

  /*
   * Indica si se está cargando
   * información desde el backend.
   */
  isLoading = false;

  /*
   * Mensaje mostrado dentro
   * del formulario.
   */
  saveMessage = '';

  /*
   * Tipo de mensaje mostrado.
   */
  saveMessageType:
    'success' | 'error' =
    'success';

  /*
   * Respaldo de las respuestas utilizado
   * para restaurarlas al cancelar la edición.
   */
  private originalValues:
    RespuestaAnalisisResponse[] = [];

  /*
   * Inicializa la información necesaria
   * para mostrar el análisis estratégico.
   */
  ngOnInit(): void {

    this.loadActivePeriod();

  }

  /*
   * Obtiene el periodo activo
   * de la institución del usuario.
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

    this.isLoading = true;

    this.institutionalInformationService
      .getPeriodoActivo(idInstitucion)
      .subscribe({

        next: (response) => {

          const periodoActivo =
            response.data;

          if (!periodoActivo) {

            this.isLoading = false;

            this.showError(
              'No existe un periodo activo para la institución.'
            );

            return;

          }

          this.idMapInstitucionPeriodo =
            periodoActivo.idMapInstitucionPeriodo;

          this.periodo =
            periodoActivo.strPeriodo;

          this.loadReporteAnalisisEstrategico();

        },

        error: (
          error: HttpErrorResponse
        ) => {

          console.error(error);

          this.isLoading = false;

          this.showError(
            'No fue posible obtener el periodo activo.'
          );

        }

      });

  }

  /*
   * Obtiene las preguntas y respuestas
   * correspondientes al periodo activo.
   */
  private loadReporteAnalisisEstrategico(): void {

    if (!this.idMapInstitucionPeriodo) {

      this.isLoading = false;

      return;

    }

    this.institutionalInformationService
      .getReporteAnalisisEstrategico(
        this.idMapInstitucionPeriodo
      )
      .subscribe({

        next: (response) => {

          const reporte =
            response.data;

          if (!reporte) {

            this.isLoading = false;

            this.showError(
              'No fue posible obtener las preguntas del análisis estratégico.'
            );

            return;

          }

          /*
           * El backend devuelve Id = 0
           * cuando todavía no existe reporte.
           */
          this.reportSaved =
            reporte.id > 0;

          /*
           * El backend devuelve las preguntas
           * activas y las preguntas históricas
           * que ya cuentan con respuesta.
           */
          this.respuestasAnalisis =
            reporte.respuestasAnalisis.map(
              respuesta => ({

                id:
                  respuesta.id,

                idPreguntaAnalisis:
                  respuesta.idPreguntaAnalisis,

                strPregunta:
                  respuesta.strPregunta,

                strRespuesta:
                  respuesta.strRespuesta

              })
            );

          /*
           * Guarda una copia para poder
           * restaurar la información.
           */
          this.originalValues =
            this.cloneResponses(
              this.respuestasAnalisis
            );

          this.isLoading = false;

          this.cdr.detectChanges();

        },

        error: (
          error: HttpErrorResponse
        ) => {

          console.error(error);

          this.isLoading = false;

          this.showError(
            'No fue posible consultar el análisis estratégico.'
          );

        }

      });

  }

  /*
   * Construye la colección de respuestas
   * que será enviada al backend.
   */
  private buildResponsesRequest():
    RespuestaAnalisisRequest[] {

    return this.respuestasAnalisis.map(
      respuesta => ({

        idPreguntaAnalisis:
          respuesta.idPreguntaAnalisis,

        strRespuesta:
          respuesta.strRespuesta?.trim()
            || null

      })
    );

  }

  /*
   * Construye la solicitud para registrar
   * un nuevo análisis estratégico.
   */
  private buildCreateRequest():
    CreateReporteAnalisisEstrategicoRequest {

    return {

      idMapInstitucionPeriodo:
        this.idMapInstitucionPeriodo!,

      idUsuarioRegistro:
        String(
          this.authService.currentUser()?.id
            ?? ''
        ),

      respuestasAnalisis:
        this.buildResponsesRequest()

    };

  }

  /*
   * Construye la solicitud para actualizar
   * un análisis estratégico existente.
   */
  private buildUpdateRequest():
    UpdateReporteAnalisisEstrategicoRequest {

    return {

      idMapInstitucionPeriodo:
        this.idMapInstitucionPeriodo!,

      respuestasAnalisis:
        this.buildResponsesRequest()

    };

  }

  /*
   * Guarda la información capturada.
   * Crea o actualiza según corresponda.
   */
  saveStrategicAnalysisData(): void {

    if (
      this.isSaving ||
      !this.idMapInstitucionPeriodo
    ) {

      return;

    }

    if (this.reportSaved) {

      this.updateStrategicAnalysisData();

      return;

    }

    this.createStrategicAnalysisData();

  }

  /*
   * Registra un nuevo reporte
   * de análisis estratégico.
   */
  private createStrategicAnalysisData(): void {

    const idUsuario =
      this.authService.currentUser()?.id;

    if (!idUsuario) {

      this.showError(
        'No fue posible identificar al usuario que realiza el registro.'
      );

      return;

    }

    this.isSaving = true;

    const request =
      this.buildCreateRequest();

    this.institutionalInformationService
      .createReporteAnalisisEstrategico(
        request
      )
      .subscribe({

        next: (response) => {

          this.reportSaved = true;

          this.isEditing = false;

          this.activeView =
            'capture';

          this.originalValues =
            this.cloneResponses(
              this.respuestasAnalisis
            );

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

          this.isSaving = false;

          this.showError(
            error.error?.message ??
            'No fue posible guardar el análisis estratégico.'
          );

        }

      });

  }

  /*
   * Actualiza un reporte
   * previamente registrado.
   */
  private updateStrategicAnalysisData(): void {

    this.isSaving = true;

    const request =
      this.buildUpdateRequest();

    this.institutionalInformationService
      .updateReporteAnalisisEstrategico(
        request
      )
      .subscribe({

        next: (response) => {

          this.isEditing = false;

          this.activeView =
            'capture';

          this.originalValues =
            this.cloneResponses(
              this.respuestasAnalisis
            );

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

          this.isSaving = false;

          this.showError(
            error.error?.message ??
            'No fue posible actualizar el análisis estratégico.'
          );

        }

      });

  }

  /*
   * Habilita la edición de un
   * reporte previamente registrado.
   */
  enableEdit(): void {

    this.originalValues =
      this.cloneResponses(
        this.respuestasAnalisis
      );

    this.isEditing = true;

    this.activeView =
      'capture';

    this.cdr.detectChanges();

  }

  /*
   * Cancela la edición y restaura
   * las respuestas originales.
   */
  cancelEdit(): void {

    this.respuestasAnalisis =
      this.cloneResponses(
        this.originalValues
      );

    this.isEditing = false;

    this.cdr.detectChanges();

  }

  /*
   * Muestra la vista de captura.
   */
  showCapture(): void {

    this.activeView =
      'capture';

  }

  /*
   * Muestra la vista previa
   * del análisis estratégico.
   */
  showPreview(): void {

    this.activeView =
      'preview';

  }

  /*
   * Crea una copia independiente
   * de la colección de respuestas.
   */
  private cloneResponses(
    responses: RespuestaAnalisisResponse[]
  ): RespuestaAnalisisResponse[] {

    return responses.map(
      respuesta => ({
        ...respuesta
      })
    );

  }

  /*
   * Muestra un mensaje después
   * de guardar o actualizar.
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