import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CatalogService }
  from '../../../core/services/catalogs/catalog.service';

import { CatPreguntaAnalisisResponse }
  from '../../../shared/models/catalogs/responses/catPreguntaAnalisisResponse';

/*
 * Concentrado de preguntas de análisis estratégico.
 * Permite consultar, editar y cambiar el estado
 * de las preguntas registradas.
 */
@Component({
  selector:
    'app-strategic-analysis-questions-records',

  standalone: true,

  imports: [
    RouterLink,
    DatePipe
  ],

  templateUrl:
    './strategic-analysis-questions-records.html',

  styleUrl:
    './strategic-analysis-questions-records.scss'
})
export class StrategicAnalysisQuestionsRecordsComponent
  implements OnInit {

  private readonly catalogService =
    inject(CatalogService);

  /*
   * Preguntas registradas
   * en el catálogo.
   */
  registros =
    signal<CatPreguntaAnalisisResponse[]>([]);

  /*
   * Estado de carga
   * del concentrado.
   */
  isLoading =
    signal(false);

  /*
   * Notificación visual
   * de la pantalla.
   */
  notificationMessage =
    signal('');

  notificationType =
    signal<'success' | 'error'>(
      'success'
    );

  /*
   * Pregunta seleccionada
   * para mostrar su detalle.
   */
  selectedRegistro =
    signal<CatPreguntaAnalisisResponse | null>(
      null
    );

  ngOnInit(): void {

    this.loadRegistros();

  }

  /*
   * Obtiene todas las preguntas
   * registradas en el catálogo.
   */
  loadRegistros(): void {

    this.isLoading.set(true);

    this.catalogService
      .getPreguntasAnalisis()
      .subscribe({

        next: (response) => {

          this.registros.set(
            response.data ?? []
          );

          this.isLoading.set(false);

        },

        error: (error) => {

          console.error(
            'Error cargando preguntas:',
            error
          );

          this.showNotification(
            'No fue posible cargar el catálogo de preguntas.',
            'error'
          );

          this.isLoading.set(false);

        }

      });

  }

  /*
   * Abre la modal con el detalle
   * de la pregunta seleccionada.
   */
  openDetalle(
    registro: CatPreguntaAnalisisResponse
  ): void {

    this.selectedRegistro.set(
      registro
    );

  }

  /*
   * Cierra la modal
   * de detalle.
   */
  closeDetalle(): void {

    this.selectedRegistro.set(
      null
    );

  }

  /*
   * Desactiva una pregunta
   * sin eliminarla físicamente.
   */
  desactivar(
    registro: CatPreguntaAnalisisResponse
  ): void {

    const confirmado =
      confirm(
        '¿Desactivar esta pregunta de análisis estratégico?'
      );

    if (!confirmado) {

      return;

    }

    this.changeStatus(
      registro,
      false
    );

  }

  /*
   * Reactiva una pregunta
   * previamente desactivada.
   */
  reactivar(
    registro: CatPreguntaAnalisisResponse
  ): void {

    const confirmado =
      confirm(
        '¿Reactivar esta pregunta de análisis estratégico?'
      );

    if (!confirmado) {

      return;

    }

    this.changeStatus(
      registro,
      true
    );

  }

  /*
   * Envía al backend el nuevo
   * estado de la pregunta.
   */
  private changeStatus(
    registro: CatPreguntaAnalisisResponse,
    bitActivo: boolean
  ): void {

    this.catalogService
      .changePreguntaAnalisisStatus(
        registro.id,
        {
          bitActivo
        }
      )
      .subscribe({

        next: (response) => {

          if (
            response.statusCode !== 200
          ) {

            this.showNotification(
              response.message ??
              'No fue posible cambiar el estado de la pregunta.',
              'error'
            );

            return;

          }

          const message =
            bitActivo
              ? 'Pregunta reactivada correctamente.'
              : 'Pregunta desactivada correctamente.';

          this.showNotification(
            message,
            'success'
          );

          /*
           * Recarga el concentrado para reflejar
           * el nuevo estado del registro.
           */
          this.loadRegistros();

        },

        error: (error) => {

          console.error(
            'Error al cambiar el estado de la pregunta:',
            error
          );

          this.showNotification(
            error?.error?.message ??
            'No fue posible cambiar el estado de la pregunta.',
            'error'
          );

        }

      });

  }

  /*
   * Muestra temporalmente una notificación
   * de éxito o error.
   */
  private showNotification(
    message: string,
    type: 'success' | 'error'
  ): void {

    this.notificationMessage.set(
      message
    );

    this.notificationType.set(
      type
    );

    setTimeout(() => {

      this.notificationMessage.set('');

    }, 4000);

  }

}