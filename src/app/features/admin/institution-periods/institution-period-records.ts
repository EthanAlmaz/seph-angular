import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { InstitutionalInformationService }
  from '../../../core/services/institutional-information/institutional-information.service';

import { MapInstitucionPeriodoResponse }
  from '../../../shared/models/institutional-information/institution-period/responses/mapInstitucionPeriodoResponse';

/*
 * Concentrado de periodos asignados
 * a las instituciones.
 *
 * Muestra las asignaciones registradas
 * y permite consultar su detalle o editarlas.
 */
@Component({
  selector: 'app-institution-period-records',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe
  ],
  templateUrl: './institution-period-records.html',
  styleUrl: './institution-period-records.scss'
})
export class InstitutionPeriodRecordsComponent
  implements OnInit {

  private readonly institutionalInformationService =
    inject(InstitutionalInformationService);

  /*
   * Asignaciones institución-periodo
   * obtenidas desde el backend.
   */
  registros =
    signal<MapInstitucionPeriodoResponse[]>([]);

  /*
   * Indica si el concentrado
   * se encuentra cargando.
   */
  isLoading = signal(false);

  /*
   * Notificación visual de la pantalla.
   */
  notificationMessage = signal('');

  notificationType =
    signal<'success' | 'error'>('success');

  /*
   * Registro seleccionado para mostrar
   * posteriormente en la modal de detalle.
   */
  selectedRegistro =
    signal<MapInstitucionPeriodoResponse | null>(null);

  ngOnInit(): void {
    this.loadRegistros();
  }

  /*
   * Carga todas las asignaciones
   * de periodos por institución.
   */
  loadRegistros(): void {
    this.isLoading.set(true);

    this.institutionalInformationService
      .getMapInstitucionPeriodos()
      .subscribe({
        next: (response) => {
          this.registros.set(
            response.data ?? []
          );

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error(
            'Error cargando asignaciones de periodos:',
            error
          );

          this.showNotification(
            'No fue posible cargar las asignaciones de periodos.',
            'error'
          );

          this.isLoading.set(false);
        }
      });
  }

  /*
   * Selecciona una asignación
   * para mostrar su información.
   */
  openDetalle(
    registro: MapInstitucionPeriodoResponse
  ): void {
    this.selectedRegistro.set(registro);
  }

  /*
   * Cierra el detalle
   * de la asignación seleccionada.
   */
  closeDetalle(): void {
    this.selectedRegistro.set(null);
  }

  /*
   * Muestra una notificación temporal.
   */
  private showNotification(
    message: string,
    type: 'success' | 'error'
  ): void {
    this.notificationMessage.set(message);
    this.notificationType.set(type);

    setTimeout(() => {
      this.notificationMessage.set('');
    }, 4000);
  }
}