import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  FormsModule
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../../core/services/auth/authService';

import {
  CatalogService
} from '../../../../core/services/catalogs/catalog.service';

import {
  InstitutionsService
} from '../../../../core/services/institutions/institutions-service';

import {
  InstitutionalInformationService
} from '../../../../core/services/institutional-information/institutional-information.service';

import {
  PeriodResponse
} from '../../../../shared/models/catalogs/responses/periodResponse';

import {
  InstitutionsResponse
} from '../../../../shared/models/institutions/institutionsResponse';

import {
  CreateMapInstitucionPeriodoRequest
} from '../../../../shared/models/institutional-information/institution-period/requests/createMapInstitucionPeriodoRequest';

import {
  UpdateMapInstitucionPeriodoRequest
} from '../../../../shared/models/institutional-information/institution-period/requests/updateMapInstitucionPeriodoRequest';

/*
 * Alta y edición de asignaciones entre
 * instituciones y periodos.
 *
 * Cuando la ruta contiene un identificador,
 * se carga la asignación existente para editarla.
 *
 * Se utilizan signals porque la aplicación
 * trabaja de manera zoneless.
 */
@Component({
  selector: 'app-institution-period-create',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './institution-period-create.html',
  styleUrl: './institution-period-create.scss'
})
export class InstitutionPeriodCreateComponent
  implements OnInit {

  private readonly authService =
    inject(AuthService);

  private readonly catalogService =
    inject(CatalogService);

  private readonly institutionsService =
    inject(InstitutionsService);

  private readonly institutionalInformationService =
    inject(InstitutionalInformationService);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  /*
   * Identificador de MapInstitucionPeriodo.
   * Es null cuando se registra una asignación nueva.
   */
  assignmentId: number | null = null;

  /*
   * Catálogos utilizados por el formulario.
   */
  institutions =
    signal<InstitutionsResponse[]>([]);

  periods =
    signal<PeriodResponse[]>([]);

  /*
   * Estados visuales del formulario.
   */
  isLoading = signal(false);

  isSaving = signal(false);

  notificationMessage = signal('');

  notificationType =
    signal<'success' | 'error'>('success');

  /*
   * Información capturada para crear
   * o actualizar la asignación.
   */
  assignment: CreateMapInstitucionPeriodoRequest = {
    idInstitucion: 0,
    idPeriodo: 0,
    bitCapturaAbierta: true,
    dateFechaApertura: null,
    dateFechaCierre: null,
    idUsuarioRegistro: ''
  };

  ngOnInit(): void {
    this.loadInstitutions();
    this.loadPeriods();

    const idParam =
      this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      return;
    }

    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      this.showNotification(
        'El identificador de la asignación no es válido.',
        'error'
      );

      return;
    }

    this.assignmentId = id;
    this.loadAssignment(id);
  }

  /*
   * Obtiene las instituciones disponibles
   * para llenar el selector.
   */
  loadInstitutions(): void {
    this.institutionsService
      .getInstitutions()
      .subscribe({
        next: (response) => {
          this.institutions.set(
            response.data ?? []
          );
        },
        error: (error) => {
          console.error(
            'Error cargando instituciones:',
            error
          );

          this.showNotification(
            'No fue posible cargar las instituciones.',
            'error'
          );
        }
      });
  }

  /*
   * Obtiene los periodos registrados
   * para llenar el selector.
   */
  loadPeriods(): void {
    this.catalogService
      .getPeriods()
      .subscribe({
        next: (response) => {
          this.periods.set(
            response.data ?? []
          );
        },
        error: (error) => {
          console.error(
            'Error cargando periodos:',
            error
          );

          this.showNotification(
            'No fue posible cargar los periodos.',
            'error'
          );
        }
      });
  }

  /*
   * Obtiene la asignación seleccionada
   * y llena el formulario para editarla.
   */
  loadAssignment(id: number): void {
    this.isLoading.set(true);

    this.institutionalInformationService
      .getMapInstitucionPeriodo(id)
      .subscribe({
        next: (response) => {
          const data = response.data;

          if (!data) {
            this.showNotification(
              'No se encontró la asignación solicitada.',
              'error'
            );

            this.isLoading.set(false);
            return;
          }

          this.assignment = {
            idInstitucion:
              data.idInstitucion,

            idPeriodo:
              data.idPeriodo,

            bitCapturaAbierta:
              data.bitCapturaAbierta,

            dateFechaApertura:
              this.formatDateForInput(
                data.dateFechaApertura
              ),

            dateFechaCierre:
              this.formatDateForInput(
                data.dateFechaCierre
              ),

            /*
             * Este valor solo se utiliza en creación.
             * Durante la edición el backend conserva
             * el usuario que registró originalmente.
             */
            idUsuarioRegistro:
              data.idUsuarioRegistro
          };

          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          console.error(
            'Error cargando la asignación:',
            error
          );

          this.showNotification(
            this.getErrorMessage(
              error,
              'No fue posible cargar la asignación.'
            ),
            'error'
          );

          this.isLoading.set(false);
        }
      });
  }

  /*
   * Registra una asignación nueva
   * o actualiza la existente.
   */
  saveAssignment(): void {
    if (this.isSaving()) {
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    const currentUser =
      this.authService.currentUser();

    if (!currentUser?.id) {
      this.showNotification(
        'No fue posible identificar al usuario de la sesión.',
        'error'
      );

      return;
    }

    this.isSaving.set(true);

    if (this.assignmentId) {
      this.updateAssignment(
        this.assignmentId
      );

      return;
    }

    const request: CreateMapInstitucionPeriodoRequest = {
      idInstitucion:
        this.assignment.idInstitucion,

      idPeriodo:
        this.assignment.idPeriodo,

      bitCapturaAbierta:
        this.assignment.bitCapturaAbierta,

      dateFechaApertura:
        this.assignment.dateFechaApertura,

      dateFechaCierre:
        this.assignment.dateFechaCierre,

      idUsuarioRegistro:
        currentUser.id
    };

    this.createAssignment(request);
  }

  /*
   * Envía al backend una nueva
   * asignación institución-periodo.
   */
  private createAssignment(
    request: CreateMapInstitucionPeriodoRequest
  ): void {
    this.institutionalInformationService
      .createMapInstitucionPeriodo(request)
      .subscribe({
        next: (response) => {
          if (
            response.statusCode < 200 ||
            response.statusCode >= 300
          ) {
            this.showNotification(
              response.message ??
                'No fue posible registrar la asignación.',
              'error'
            );

            this.isSaving.set(false);
            return;
          }

          this.showNotification(
            'Periodo asignado correctamente a la institución.',
            'success'
          );

          setTimeout(() => {
            this.isSaving.set(false);

            this.router.navigateByUrl(
              '/admin/institution-periods'
            );
          }, 1500);
        },
        error: (error: unknown) => {
          console.error(
            'Error registrando la asignación:',
            error
          );

          this.showNotification(
            this.getErrorMessage(
              error,
              'No fue posible registrar la asignación.'
            ),
            'error'
          );

          this.isSaving.set(false);
        }
      });
  }

  /*
   * Actualiza una asignación existente.
   */
  private updateAssignment(
    id: number
  ): void {
    const request: UpdateMapInstitucionPeriodoRequest = {
      id,

      idInstitucion:
        this.assignment.idInstitucion,

      idPeriodo:
        this.assignment.idPeriodo,

      bitCapturaAbierta:
        this.assignment.bitCapturaAbierta,

      dateFechaApertura:
        this.assignment.dateFechaApertura,

      dateFechaCierre:
        this.assignment.dateFechaCierre
    };

    this.institutionalInformationService
      .updateMapInstitucionPeriodo(
        id,
        request
      )
      .subscribe({
        next: (response) => {
          if (
            response.statusCode < 200 ||
            response.statusCode >= 300
          ) {
            this.showNotification(
              response.message ??
                'No fue posible actualizar la asignación.',
              'error'
            );

            this.isSaving.set(false);
            return;
          }

          this.showNotification(
            'Asignación actualizada correctamente.',
            'success'
          );

          setTimeout(() => {
            this.isSaving.set(false);

            this.router.navigateByUrl(
              '/admin/institution-periods'
            );
          }, 1500);
        },
        error: (error: unknown) => {
          console.error(
            'Error actualizando la asignación:',
            error
          );

          this.showNotification(
            this.getErrorMessage(
              error,
              'No fue posible actualizar la asignación.'
            ),
            'error'
          );

          this.isSaving.set(false);
        }
      });
  }

  /*
   * Comprueba las reglas principales
   * antes de enviar el formulario.
   */
  private validateForm(): boolean {
    if (!this.assignment.idInstitucion) {
      this.showNotification(
        'Debe seleccionar una institución.',
        'error'
      );

      return false;
    }

    if (!this.assignment.idPeriodo) {
      this.showNotification(
        'Debe seleccionar un periodo.',
        'error'
      );

      return false;
    }

    if (
      this.assignment.dateFechaApertura &&
      this.assignment.dateFechaCierre
    ) {
      const openingDate = new Date(
        `${this.assignment.dateFechaApertura}T00:00:00`
      );

      const closingDate = new Date(
        `${this.assignment.dateFechaCierre}T00:00:00`
      );

      if (closingDate < openingDate) {
        this.showNotification(
          'La fecha de cierre no puede ser menor que la fecha de apertura.',
          'error'
        );

        return false;
      }
    }

    return true;
  }

  /*
   * Convierte una fecha recibida de la API
   * al formato utilizado por input type="date".
   */
  private formatDateForInput(
    value: string | null
  ): string | null {
    if (!value) {
      return null;
    }

    return value.split('T')[0];
  }

  /*
   * Obtiene el mensaje enviado
   * por el backend.
   */
  private getErrorMessage(
    error: unknown,
    defaultMessage: string
  ): string {
    if (error instanceof HttpErrorResponse) {
      return (
        error.error?.message ??
        defaultMessage
      );
    }

    return defaultMessage;
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