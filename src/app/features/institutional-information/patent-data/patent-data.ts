import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse }
  from '@angular/common/http';

import { AuthService }
  from '../../../core/services/auth/authService';

import { InstitutionalInformationService }
  from '../../../core/services/institutional-information/institutional-information.service';

import { CatalogService }
  from '../../../core/services/catalogs/catalog.service';

import { TipoPatenteResponse }
  from '../../../shared/models/catalogs/responses/tipoPatenteResponse';

import { EstatusPatenteResponse }
  from '../../../shared/models/catalogs/responses/estatusPatenteResponse';

import { CreateReportePatenteRequest }
  from '../../../shared/models/institutional-information/patent/requests/createReportePatenteRequest';

import { UpdateReportePatenteRequest }
  from '../../../shared/models/institutional-information/patent/requests/updateReportePatenteRequest';

import { InventorPatenteRequest }
  from '../../../shared/models/institutional-information/patent/requests/inventorPatenteRequest';

import { ReportePatenteResponse }
  from '../../../shared/models/institutional-information/patent/responses/reportePatenteResponse';

@Component({
  selector: 'app-patent-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './patent-data.html',
  styleUrl: './patent-data.scss'
})
export class PatentDataComponent
  implements OnInit {

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
   * Catálogo de tipos
   * de patente.
   */
  tiposPatente: TipoPatenteResponse[] = [];

  /*
   * Catálogo de estatus
   * de patente.
   */
  estatusPatente: EstatusPatenteResponse[] = [];

  /*
   * Patentes registradas
   * durante el periodo activo.
   */
  patentes: ReportePatenteResponse[] = [];

  /*
   * Identificador de la patente
   * seleccionada para editar.
   */
  selectedPatentId: number | null = null;

  /*
   * Vista activa del componente:
   * listado, captura o vista previa.
   */
  activeView:
    'list' | 'capture' | 'preview' =
    'list';

  /*
   * Indica si el usuario está modificando
   * una patente previamente registrada.
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
   * del reporte de patente.
   */
  patentReport = {

    nombreTitulo: '',

    numeroRegistroSolicitud: '',

    idTipoPatente:
      null as number | null,

    idEstatusPatente:
      null as number | null,

    fechaSolicitud: '',

    fechaConcesion:
      null as string | null,

    titularPatente: '',

    inventores:
      [] as InventorPatenteRequest[]

  };

  /*
   * Nombre del inventor que será
   * agregado a la patente.
   */
  nuevoInventor = '';

  /*
   * Respaldo de la información utilizada
   * para restaurar los valores al cancelar.
   */
  private originalValues:
    typeof this.patentReport | null =
    null;

  /*
   * Inicializa la información necesaria
   * para mostrar el módulo de Patentes.
   */
  ngOnInit(): void {

    this.loadActivePeriod();

    this.loadTiposPatente();

    this.loadEstatusPatente();

  }

  /*
 * Obtiene las patentes registradas
 * durante el periodo activo.
 */
private loadReportesPatenteByPeriodo(): void {

  if (!this.idMapInstitucionPeriodo) {

    return;

  }

  this.isLoading = true;

  this.institutionalInformationService
    .getReportesPatenteByPeriodo(
      this.idMapInstitucionPeriodo
    )
    .subscribe({

      next: (response) => {

        this.patentes =
          response.data ?? [];

        this.isLoading = false;

        this.cdr.detectChanges();

      },

      error: (
        error: HttpErrorResponse
      ) => {

        console.error(error);

        this.patentes = [];

        this.isLoading = false;

        this.showError(
          'No fue posible cargar las patentes registradas.'
        );

        this.cdr.detectChanges();

      }

    });

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
        this.loadReportesPatenteByPeriodo();

        this.cdr.detectChanges();

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
 * Muestra el listado
 * de patentes registradas.
 */
showList(): void {

  this.activeView = 'list';

  this.saveMessage = '';

}

/*
 * Muestra el formulario
 * de captura de patente.
 */
showCapture(): void {

  this.activeView = 'capture';

  this.saveMessage = '';

}

/*
 * Muestra la vista previa
 * de la patente capturada.
 */
showPreview(): void {

  if (!this.validatePatentReport()) {

    return;

  }

  this.activeView = 'preview';

  this.saveMessage = '';

}
/*
 * Agrega un inventor
 * a la patente capturada.
 */
addInventor(): void {

  const nombre =
    this.nuevoInventor.trim();

  if (!nombre) {

    this.showError(
      'Ingresa el nombre completo del inventor.'
    );

    return;

  }

  const inventorDuplicado =
    this.patentReport.inventores.some(
      inventor =>
        inventor.strNombreCompleto
          .trim()
          .toLowerCase() ===
        nombre.toLowerCase()
    );

  if (inventorDuplicado) {

    this.showError(
      'El inventor ya fue agregado.'
    );

    return;

  }

  this.patentReport.inventores.push({

    strNombreCompleto: nombre

  });

  this.nuevoInventor = '';

  this.saveMessage = '';

}

/*
 * Elimina un inventor
 * de la patente capturada.
 */
removeInventor(
  index: number
): void {

  this.patentReport.inventores.splice(
    index,
    1
  );

  this.saveMessage = '';

}

/*
 * Prepara una patente registrada
 * para modificar su información.
 */
editPatent(
  patent: ReportePatenteResponse
): void {

  this.selectedPatentId =
    patent.id;

  this.isEditing = true;

  this.patentReport = {

    nombreTitulo:
      patent.strNombreTitulo,

    numeroRegistroSolicitud:
      patent.strNumeroRegistroSolicitud,

    idTipoPatente:
      patent.idTipoPatente,

    idEstatusPatente:
      patent.idEstatusPatente,

    fechaSolicitud:
      patent.dateFechaSolicitud,

    fechaConcesion:
      patent.dateFechaConcesion,

    titularPatente:
      patent.strTitularPatente,

    inventores:
      patent.inventores.map(
        inventor => ({

          strNombreCompleto:
            inventor.strNombreCompleto

        })
      )

  };

  this.originalValues = {

    ...this.patentReport,

    inventores:
      this.patentReport.inventores.map(
        inventor => ({ ...inventor })
      )

  };

  this.nuevoInventor = '';

  this.activeView = 'capture';

  this.saveMessage = '';

}

/*
 * Cancela la edición y restaura
 * la información original.
 */
cancelEdit(): void {

  if (
    this.isEditing &&
    this.originalValues
  ) {

    this.patentReport = {

      ...this.originalValues,

      inventores:
        this.originalValues.inventores.map(
          inventor => ({ ...inventor })
        )

    };

  } else {

    this.resetPatentReport();

  }

  this.selectedPatentId = null;

  this.isEditing = false;

  this.originalValues = null;

  this.nuevoInventor = '';

  this.activeView = 'list';

  this.saveMessage = '';

}

/*
 * Registra una nueva patente o actualiza
 * la patente seleccionada.
 */
savePatent(): void {

  if (!this.validatePatentReport()) {

    return;

  }

  if (!this.idMapInstitucionPeriodo) {

    this.showError(
      'No existe un periodo activo para registrar la patente.'
    );

    return;

  }

  this.isSaving = true;

  if (
    this.isEditing &&
    this.selectedPatentId !== null
  ) {

    const updateRequest:
      UpdateReportePatenteRequest = {

        id:
          this.selectedPatentId,

        idMapInstitucionPeriodo:
          this.idMapInstitucionPeriodo,

        strNombreTitulo:
          this.patentReport.nombreTitulo.trim(),

        strNumeroRegistroSolicitud:
          this.patentReport
            .numeroRegistroSolicitud
            .trim(),

        idTipoPatente:
          this.patentReport.idTipoPatente!,

        idEstatusPatente:
          this.patentReport.idEstatusPatente!,

        dateFechaSolicitud:
          this.patentReport.fechaSolicitud,

        dateFechaConcesion:
          this.patentReport.fechaConcesion || null,

        strTitularPatente:
          this.patentReport.titularPatente.trim(),

        inventores:
          this.patentReport.inventores.map(
            inventor => ({

              strNombreCompleto:
                inventor.strNombreCompleto.trim()

            })
          )

      };

    this.institutionalInformationService
      .updateReportePatente(updateRequest)
      .subscribe({

        next: () => {

          this.finishPatentSave(
            'La patente se actualizó correctamente.'
          );

        },

        error: (
          error: HttpErrorResponse
        ) => {

          console.error(error);

          this.isSaving = false;

          this.showError(
            'No fue posible actualizar la patente.'
          );

        }

      });

    return;

  }

  const idUsuarioRegistro =
    this.authService.currentUser()?.id;

  if (!idUsuarioRegistro) {

    this.isSaving = false;

    this.showError(
      'No fue posible identificar al usuario.'
    );

    return;

  }

  const createRequest:
    CreateReportePatenteRequest = {

      idMapInstitucionPeriodo:
        this.idMapInstitucionPeriodo,

      strNombreTitulo:
        this.patentReport.nombreTitulo.trim(),

      strNumeroRegistroSolicitud:
        this.patentReport
          .numeroRegistroSolicitud
          .trim(),

      idTipoPatente:
        this.patentReport.idTipoPatente!,

      idEstatusPatente:
        this.patentReport.idEstatusPatente!,

      dateFechaSolicitud:
        this.patentReport.fechaSolicitud,

      dateFechaConcesion:
        this.patentReport.fechaConcesion || null,

      strTitularPatente:
        this.patentReport.titularPatente.trim(),

      idUsuarioRegistro:
        idUsuarioRegistro,

      inventores:
        this.patentReport.inventores.map(
          inventor => ({

            strNombreCompleto:
              inventor.strNombreCompleto.trim()

          })
        )

    };

  this.institutionalInformationService
    .createReportePatente(createRequest)
    .subscribe({

      next: () => {

        this.finishPatentSave(
          'La patente se registró correctamente.'
        );

      },

      error: (
        error: HttpErrorResponse
      ) => {

        console.error(error);

        this.isSaving = false;

        this.showError(
          'No fue posible registrar la patente.'
        );

      }

    });

}

/*
 * Prepara el formulario para registrar
 * una nueva patente.
 */
startNewPatent(): void {

  this.selectedPatentId = null;

  this.isEditing = false;

  this.originalValues = null;

  this.resetPatentReport();

  this.activeView = 'capture';

  this.saveMessage = '';

}

/*
 * Restablece los campos utilizados
 * para capturar una patente.
 */
private resetPatentReport(): void {

  this.patentReport = {

    nombreTitulo: '',

    numeroRegistroSolicitud: '',

    idTipoPatente: null,

    idEstatusPatente: null,

    fechaSolicitud: '',

    fechaConcesion: null,

    titularPatente: '',

    inventores: []

  };

  this.nuevoInventor = '';

}

/*
 * Valida la información obligatoria
 * antes de mostrar la vista previa.
 */
private validatePatentReport(): boolean {

  if (!this.patentReport.nombreTitulo.trim()) {

    this.showError(
      'Ingresa el nombre o título de la patente.'
    );

    return false;

  }

  if (
    !this.patentReport
      .numeroRegistroSolicitud
      .trim()
  ) {

    this.showError(
      'Ingresa el número de registro o solicitud.'
    );

    return false;

  }

  if (
    this.patentReport.idTipoPatente === null
  ) {

    this.showError(
      'Selecciona el tipo de patente.'
    );

    return false;

  }

  if (
    this.patentReport.idEstatusPatente === null
  ) {

    this.showError(
      'Selecciona el estatus de la patente.'
    );

    return false;

  }

  if (!this.patentReport.fechaSolicitud) {

    this.showError(
      'Selecciona la fecha de solicitud.'
    );

    return false;

  }

  if (
    this.patentReport.fechaConcesion &&
    this.patentReport.fechaConcesion <
      this.patentReport.fechaSolicitud
  ) {

    this.showError(
      'La fecha de concesión no puede ser anterior a la fecha de solicitud.'
    );

    return false;

  }

  if (
    !this.patentReport
      .titularPatente
      .trim()
  ) {

    this.showError(
      'Ingresa el titular de la patente.'
    );

    return false;

  }

  if (
    this.patentReport.inventores.length === 0
  ) {

    this.showError(
      'Agrega al menos un inventor.'
    );

    return false;

  }

  return true;

}

/*
 * Obtiene el catálogo
 * de tipos de patente.
 */
private loadTiposPatente(): void {

  this.catalogService
    .getTiposPatente()
    .subscribe({

      next: (response) => {

        this.tiposPatente =
          response.data ?? [];

        this.cdr.detectChanges();

      },

      error: (
        error: HttpErrorResponse
      ) => {

        console.error(error);

        this.showError(
          'No fue posible cargar el catálogo de tipos de patente.'
        );

      }

    });

}

/*
 * Obtiene el catálogo
 * de estatus de patente.
 */
private loadEstatusPatente(): void {

  this.catalogService
    .getEstatusPatente()
    .subscribe({

      next: (response) => {

        this.estatusPatente =
          response.data ?? [];

        this.cdr.detectChanges();

      },

      error: (
        error: HttpErrorResponse
      ) => {

        console.error(error);

        this.showError(
          'No fue posible cargar el catálogo de estatus de patente.'
        );

      }

    });

}

/*
 * Restablece el formulario y actualiza
 * el listado después de guardar.
 */
private finishPatentSave(
  message: string
): void {

  this.isSaving = false;

  this.selectedPatentId = null;

  this.isEditing = false;

  this.originalValues = null;

  this.resetPatentReport();

  this.loadReportesPatenteByPeriodo();

  this.activeView = 'list';

  this.saveMessage = message;

  this.saveMessageType = 'success';

  this.cdr.detectChanges();

}

/*
 * Muestra un mensaje de error
 * dentro del componente.
 */
private showError(
  message: string
): void {

  this.saveMessage = message;

  this.saveMessageType = 'error';

  this.cdr.detectChanges();

}

/*
 * Obtiene el nombre del tipo
 * de patente seleccionado.
 */
getTipoPatenteName(
  idTipoPatente: number | null
): string {

  if (idTipoPatente === null) {

    return 'No especificado';

  }

  return this.tiposPatente.find(
    tipo =>
      tipo.id === idTipoPatente
  )?.strDescripcion ??
    'No especificado';

}

/*
 * Obtiene el nombre del estatus
 * de patente seleccionado.
 */
getEstatusPatenteName(
  idEstatusPatente: number | null
): string {

  if (idEstatusPatente === null) {

    return 'No especificado';

  }

  return this.estatusPatente.find(
    estatus =>
      estatus.id === idEstatusPatente
  )?.strDescripcion ??
    'No especificado';

}

}