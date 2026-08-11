import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth/authService';
import { CatalogService } from '../../../core/services/catalogs/catalog.service';
import { StaffRegistrationService } from '../../../core/services/staff-registration/staff-registration.service';
import { ImageUploadService } from '../../../core/services/images/image-upload.service';
import { forkJoin, of, switchMap, tap } from 'rxjs';
import { CreateEmployeeRequest } from '../../../shared/models/staff-registration/requests/createEmployeeRequest';
import { UpdateDatosAcademicosRequest } from '../../../shared/models/staff-registration/requests/updateDatosAcademicosRequest';
import { UpdateEmpleadoBasicoRequest } from '../../../shared/models/staff-registration/requests/updateEmpleadoBasicoRequest';
import { SexResponse } from '../../../shared/models/catalogs/responses/sexResponse';
import { PerfilAcademicoResponse } from '../../../shared/models/catalogs/responses/perfilAcademicoResponse';

@Component({
  selector: 'app-personal-information',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './personal-information.html',
  styleUrl: './personal-information.scss'
})
export class PersonalInformationComponent implements OnInit {

  /* Id del empleado a retomar (registro incompleto).
  Si viene definido, el formulario se puebla con sus datos
  guardados antes de mostrarse. */
  @Input() employeeId: number | null = null;

  /* Sub-pantalla en la que debe iniciar al retomar un registro:
  'basico' (Atrás desde Historial de Contrato) o 'academico'
  (Continuar cuando solo falta el perfil académico/SNI). */
  @Input() initialSubStep: 'basico' | 'academico' = 'basico';

  private staffRegistrationService = inject(StaffRegistrationService);
  private authService = inject(AuthService);
  private catalogService = inject(CatalogService);
  private imageUploadService = inject(ImageUploadService);
  private cdr = inject(ChangeDetectorRef);

  /* La app es zoneless: los valores que se actualizan dentro de
  subscribe()/setTimeout() deben ser signals para que la vista
  se refresque sola (sin necesitar un clic adicional). */

  sexes = signal<SexResponse[]>([]);
  perfilesAcademicos = signal<PerfilAcademicoResponse[]>([]);

  /* "Información Personal" se captura en dos pantallas
  (según el diseño de Figma): primero los datos básicos,
  después el perfil académico y SNI/SNII. Ambas cuentan
  como el mismo paso del wizard (el stepper no avanza
  hasta terminar la segunda). */
  subStep = signal<'basico' | 'academico'>('basico');

  /* Id del empleado ya creado en la primera pantalla,
  necesario para guardar sus datos académicos. */
  employeeIdCreado: number | null = null;

  isSaving = signal(false);

  notificationMessage = signal('');
  notificationType = signal<'success' | 'error'>('success');
  /* Archivos nuevos seleccionados por el usuario. */
ineFile: File | null = null;
fotografiaFile: File | null = null;

/* Rutas que ya están guardadas en el backend. */
rutaIneExistente: string | null = null;
rutaFotografiaExistente: string | null = null;

/* Vistas previas mostradas en el formulario. */
inePreviewUrl = signal<string | null>(null);
fotografiaPreviewUrl = signal<string | null>(null);

employee: CreateEmployeeRequest = {
  strNombre: '',
  strApellidoPat: '',
  strApellidoMat: '',
  strCurp: '',
  idSexo: 0,
  idInstitucion: 0,
  strRutaIne: null,
  strRutaFotografia: null,
  dateTimeFechaRegistro: new Date().toISOString(),
  idUsuarioRegistro: '',
  bitActivo: true,
  dateTimeFechaBaja: new Date().toISOString()
  
};

  /* ¿El empleado tiene perfil académico? */
  tienePerfilAcademico: 'SI' | 'NO' = 'NO';

  /* Perfil académico seleccionado en el dropdown,
  pendiente de agregar a la lista. */
  perfilAcademicoSeleccionado: number | null = null;

  /* Perfiles académicos ya agregados para este empleado.
  Puede ser uno o varios. */
  perfilesAgregados: PerfilAcademicoResponse[] = [];

  /* ¿El empleado pertenece al SNI/SNII?
  El radio solo habilita el campo; si es "No", strSNII
  se guarda como null. */
  tieneSNII: 'SI' | 'NO' = 'NO';

  /* Valor del SNI/SNII capturado (solo aplica si tieneSNII === 'SI'). */
  snii = '';

  ngOnInit(): void {
    this.loadSexes();

    if (this.employeeId) {
      /* Retomando un registro ya existente: el empleado fue
      creado en una sesión anterior, así que "Guardar" en la
      pantalla básica debe actualizar, no volver a crear. */
      this.employeeIdCreado = this.employeeId;
      this.subStep.set(this.initialSubStep);

      this.loadPerfilesAcademicos(() => this.loadEmployeeData(this.employeeId!));
    } else {
      this.loadPerfilesAcademicos();
    }
  }

  loadSexes(): void {
    this.catalogService
      .getSexes()
      .subscribe({
        next: (response) => {
          this.sexes.set(response.data ?? []);
        },
        error: (error) => {
          console.error('Error cargando sexos:', error);
        }
      });
  }

  loadPerfilesAcademicos(onLoaded?: () => void): void {
    this.catalogService
      .getPerfilesAcademicos()
      .subscribe({
        next: (response) => {
          this.perfilesAcademicos.set(response.data ?? []);
          onLoaded?.();
        },
        error: (error) => {
          console.error('Error cargando perfiles académicos:', error);
          onLoaded?.();
        }
      });
  }

  /* Puebla el formulario (básico + académico) con los datos ya
  guardados de un empleado, al retomar un registro incompleto. */
  private loadEmployeeData(employeeId: number): void {
    this.staffRegistrationService
      .getEmpleadoById(employeeId)
      .subscribe({
        next: (response) => {
          const data = response.data;

          if (!data) {
            return;
          }

          this.employee.strNombre = data.strNombre;
          this.employee.strApellidoPat = data.strApellidoPat;
          this.employee.strApellidoMat = data.strApellidoMat;
          this.employee.strCurp = data.strCurp;
          this.employee.idSexo = data.idSexo;
          /* Conserva las rutas de las imágenes previamente guardadas. */
          this.rutaIneExistente = data.strRutaIne;
          this.rutaFotografiaExistente = data.strRutaFotografia;

          this.employee.strRutaIne = data.strRutaIne;
          this.employee.strRutaFotografia = data.strRutaFotografia;

        /* Recupera las imágenes existentes para mostrarlas. */
        if (data.strRutaIne) {
          this.loadExistingImagePreview(
            data.strRutaIne,
            this.inePreviewUrl
          );
        } else {
          this.inePreviewUrl.set(null);
        }

        if (data.strRutaFotografia) {
          this.loadExistingImagePreview(
            data.strRutaFotografia,
            this.fotografiaPreviewUrl
          );
        } else {
          this.fotografiaPreviewUrl.set(null);
        }

        this.tieneSNII = data.strSNII ? 'SI' : 'NO';
          
          this.snii = data.strSNII ?? '';

          this.perfilesAgregados = data.idsPerfilAcademico
            .map(id => this.perfilesAcademicos().find(perfil => perfil.id === id))
            .filter((perfil): perfil is PerfilAcademicoResponse => !!perfil);

          this.tienePerfilAcademico = this.perfilesAgregados.length > 0 ? 'SI' : 'NO';

          // Estas propiedades no son signals (van ligadas con ngModel);
          // al poblarse desde un subscribe() hay que forzar la detección
          // de cambios manualmente porque la app es zoneless.
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error cargando datos del empleado:', error);

          this.showNotification(
            'No fue posible cargar la información guardada del empleado.',
            'error'
          );
        }
      });
  }

  /* Selecciona la imagen del INE y genera su vista previa. */
onIneSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (!this.isValidImage(file)) {
    input.value = '';
    return;
  }

  this.ineFile = file;
  this.generateImagePreview(file, this.inePreviewUrl);
}

/* Selecciona la fotografía y genera su vista previa. */
onFotografiaSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (!this.isValidImage(file)) {
    input.value = '';
    return;
  }

  this.fotografiaFile = file;
  this.generateImagePreview(file, this.fotografiaPreviewUrl);
}

/* Valida el formato y tamaño de las imágenes seleccionadas. */
private isValidImage(file: File): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png'
  ];

  if (!allowedTypes.includes(file.type)) {
    this.showNotification(
      'La imagen debe tener formato JPG, JPEG o PNG.',
      'error'
    );

    return false;
  }

  const maximumSize = 5 * 1024 * 1024;

  if (file.size > maximumSize) {
    this.showNotification(
      'La imagen no debe superar los 5 MB.',
      'error'
    );

    return false;
  }

  return true;
}

/* Convierte el archivo en una URL temporal para mostrarlo. */
private generateImagePreview(
  file: File,
  previewSignal: ReturnType<typeof signal<string | null>>
): void {
  const reader = new FileReader();

  reader.onload = () => {
    previewSignal.set(reader.result as string);
  };

  reader.readAsDataURL(file);
}

/* Recupera una imagen guardada y genera una URL para mostrarla. */
private loadExistingImagePreview(
  rutaRelativa: string,
  previewSignal: ReturnType<typeof signal<string | null>>
): void {
  this.imageUploadService
    .getImageBlob(rutaRelativa)
    .subscribe({
      next: (blob) => {
        const previousUrl = previewSignal();

        if (previousUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(previousUrl);
        }

        previewSignal.set(URL.createObjectURL(blob));
      },
      error: (error) => {
        console.error(
          `No fue posible cargar la imagen: ${rutaRelativa}`,
          error
        );

        previewSignal.set(null);
      }
    });
}

  /* Agrega el perfil académico seleccionado en el dropdown
  a la lista de perfiles agregados (evita duplicados). */
  agregarPerfilAcademico(): void {
    if (!this.perfilAcademicoSeleccionado) {
      return;
    }

    const yaAgregado = this.perfilesAgregados.some(
      perfil => perfil.id === this.perfilAcademicoSeleccionado
    );

    if (yaAgregado) {
      this.perfilAcademicoSeleccionado = null;
      return;
    }

    const perfil = this.perfilesAcademicos().find(
      p => p.id === this.perfilAcademicoSeleccionado
    );

    if (perfil) {
      this.perfilesAgregados = [...this.perfilesAgregados, perfil];
    }

    this.perfilAcademicoSeleccionado = null;
  }

  /* Quita un perfil académico de la lista de agregados. */
  quitarPerfilAcademico(idPerfil: number): void {
    this.perfilesAgregados = this.perfilesAgregados.filter(
      perfil => perfil.id !== idPerfil
    );
  }

  /* Punto de entrada llamado por el wizard contenedor al dar clic
  en "Siguiente". Según la sub-pantalla actual, guarda los datos
  básicos (y muestra la pantalla de perfil académico) o guarda
  los datos académicos (y ahí sí avanza a Historial de Contrato). */
  saveEmployee(
    onSuccess: (employeeId: number) => void,
    onFinish?: () => void
  ): void {
    if (this.isSaving()) {
      return;
    }

    if (this.subStep() === 'basico') {
      this.saveBasicData(onSuccess, onFinish);
    } else {
      this.saveAcademicData(onSuccess, onFinish);
    }
  }
  

  private saveBasicData(
  onSuccess: (employeeId: number) => void,
  onFinish?: () => void
): void {
  if (!this.validateBasicForm()) {
    onFinish?.();
    return;
  }

  if (this.employeeIdCreado) {
    /*
     * Retomando un registro ya existente: el empleado ya fue
     * creado en una sesión anterior, así que se actualiza en
     * lugar de crear uno nuevo.
     */
    this.updateExistingBasicData(onFinish);
    return;
  }

  this.isSaving.set(true);
  this.notificationMessage.set('');

  const finishSaving = (): void => {
    this.isSaving.set(false);
    onFinish?.();
  };

  const currentUser = this.authService.currentUser();

  if (!currentUser) {
    this.showNotification(
      'No se encontró información del usuario autenticado.',
      'error'
    );

    finishSaving();
    return;
  }

  if (!currentUser.idInstitucion) {
    this.showNotification(
      'El usuario no tiene una institución asignada.',
      'error'
    );

    finishSaving();
    return;
  }

  this.employee.idInstitucion = currentUser.idInstitucion;
  this.employee.idUsuarioRegistro = currentUser.id;
  this.employee.dateTimeFechaRegistro = new Date().toISOString();

  /*
   * Si se seleccionó un archivo, se sube al servidor de imágenes.
   * Si no se seleccionó, se conserva la ruta que ya tenga el modelo.
   */
  const ineUpload$ = this.ineFile
    ? this.imageUploadService.uploadImage('ine', this.ineFile)
    : of(null);

  const fotografiaUpload$ = this.fotografiaFile
    ? this.imageUploadService.uploadImage('foto', this.fotografiaFile)
    : of(null);

  forkJoin({
    ine: ineUpload$,
    fotografia: fotografiaUpload$
  })
    .pipe(
      switchMap(({ ine, fotografia }) => {
        if (ine) {
          this.employee.strRutaIne = ine.rutaRelativa;
        }

        if (fotografia) {
          this.employee.strRutaFotografia =
            fotografia.rutaRelativa;
        }

        return this.staffRegistrationService
          .createEmployee(this.employee);
      })
    )
    .subscribe({
      next: (response) => {
        if (response.statusCode !== 200) {
          this.showNotification(
            response.message ??
              'No fue posible guardar la información personal.',
            'error'
          );

          finishSaving();
          return;
        }

        const employeeId =
          typeof response.data === 'number'
            ? response.data
            : response.data?.id;

        if (!employeeId) {
          this.showNotification(
            'No se recibió el identificador del empleado.',
            'error'
          );

          finishSaving();
          return;
        }

        this.employeeIdCreado = employeeId;

        /*
         * Las rutas pasan a considerarse existentes después
         * de registrar correctamente al empleado.
         */
        this.rutaIneExistente =
          this.employee.strRutaIne ?? null;

        this.rutaFotografiaExistente =
          this.employee.strRutaFotografia ?? null;

        this.ineFile = null;
        this.fotografiaFile = null;

        this.subStep.set('academico');

        this.showNotification(
          'Información personal guardada. Continúa con el perfil académico.',
          'success'
        );

        finishSaving();

        /*
         * No se llama onSuccess aquí: el wizard permanece en este
         * mismo paso hasta guardar también los datos académicos.
         */
      },
      error: (error) => {
        console.error(
          'Error subiendo imágenes o registrando al empleado:',
          error
        );

        const errorMessage =
          this.getSaveEmployeeErrorMessage(error);

        this.showNotification(
          errorMessage,
          'error'
        );

        finishSaving();
      }
    });
}

  private updateExistingBasicData(onFinish?: () => void): void {
  this.isSaving.set(true);
  this.notificationMessage.set('');

  const finishSaving = (): void => {
    this.isSaving.set(false);
    onFinish?.();
  };

  let rutaIneNueva: string | null = null;
  let rutaFotografiaNueva: string | null = null;

  /*
   * Si se seleccionó una imagen nueva, se sube.
   * En caso contrario, se conservará la ruta existente.
   */
  const ineUpload$ = this.ineFile
    ? this.imageUploadService
        .uploadImage('ine', this.ineFile)
        .pipe(
          tap((response) => {
            rutaIneNueva = response.rutaRelativa;
          })
        )
    : of(null);

  const fotografiaUpload$ = this.fotografiaFile
    ? this.imageUploadService
        .uploadImage('foto', this.fotografiaFile)
        .pipe(
          tap((response) => {
            rutaFotografiaNueva = response.rutaRelativa;
          })
        )
    : of(null);

  forkJoin({
    ine: ineUpload$,
    fotografia: fotografiaUpload$
  })
    .pipe(
      switchMap(({ ine, fotografia }) => {
        const request: UpdateEmpleadoBasicoRequest = {
          strNombre: this.employee.strNombre,
          strApellidoPat: this.employee.strApellidoPat,
          strApellidoMat: this.employee.strApellidoMat,
          strCurp: this.employee.strCurp,
          idSexo: this.employee.idSexo,

          /*
           * Si existe una imagen nueva usa su ruta.
           * De lo contrario, conserva la ruta anterior.
           */
          strRutaIne:
            ine?.rutaRelativa ??
            this.rutaIneExistente,

          strRutaFotografia:
            fotografia?.rutaRelativa ??
            this.rutaFotografiaExistente
        };

        return this.staffRegistrationService
          .updateEmpleadoBasico(
            this.employeeIdCreado!,
            request
          );
      })
    )
    .subscribe({
      next: (response) => {
        if (response.statusCode !== 200) {
          /*
           * La actualización no fue aceptada. Se eliminan las
           * imágenes nuevas para no dejar archivos huérfanos.
           */
          this.deleteImageSilently(rutaIneNueva);
          this.deleteImageSilently(rutaFotografiaNueva);

          this.showNotification(
            response.message ??
              'No fue posible actualizar la información personal.',
            'error'
          );

          finishSaving();
          return;
        }

        /*
         * La actualización terminó correctamente. Ahora es seguro
         * eliminar las imágenes anteriores que fueron reemplazadas.
         */
        if (
          rutaIneNueva &&
          this.rutaIneExistente &&
          rutaIneNueva !== this.rutaIneExistente
        ) {
          this.deleteImageSilently(
            this.rutaIneExistente
          );
        }

        if (
          rutaFotografiaNueva &&
          this.rutaFotografiaExistente &&
          rutaFotografiaNueva !== this.rutaFotografiaExistente
        ) {
          this.deleteImageSilently(
            this.rutaFotografiaExistente
          );
        }

        if (rutaIneNueva) {
          this.rutaIneExistente = rutaIneNueva;
          this.employee.strRutaIne = rutaIneNueva;
        }

        if (rutaFotografiaNueva) {
          this.rutaFotografiaExistente =
            rutaFotografiaNueva;

          this.employee.strRutaFotografia =
            rutaFotografiaNueva;
        }

        this.ineFile = null;
        this.fotografiaFile = null;

        this.subStep.set('academico');

        this.showNotification(
          'Información personal actualizada. Continúa con el perfil académico.',
          'success'
        );

        finishSaving();
      },
      error: (error) => {
        /*
         * Si falló una carga o la actualización del empleado,
         * se eliminan las imágenes nuevas que alcanzaron a subirse.
         */
        this.deleteImageSilently(rutaIneNueva);
        this.deleteImageSilently(rutaFotografiaNueva);

        console.error(
          'Error actualizando la información personal:',
          error
        );

        this.showNotification(
          'No fue posible actualizar la información personal.',
          'error'
        );

        finishSaving();
      }
    });
}

/* Elimina una imagen sin interrumpir el flujo principal. */
private deleteImageSilently(
  rutaRelativa: string | null
): void {
  if (!rutaRelativa) {
    return;
  }

  this.imageUploadService
    .deleteImage(rutaRelativa)
    .subscribe({
      error: (error) => {
        console.error(
          `No fue posible eliminar la imagen: ${rutaRelativa}`,
          error
        );
      }
    });
}

  private saveAcademicData(
    onSuccess: (employeeId: number) => void,
    onFinish?: () => void
  ): void {
    if (!this.employeeIdCreado) {
      this.showNotification(
        'No se encontró el empleado registrado.',
        'error'
      );
      onFinish?.();
      return;
    }

    if (this.tienePerfilAcademico === 'SI' && this.perfilesAgregados.length === 0) {
      this.showNotification(
        'Agrega al menos un perfil académico o selecciona "No".',
        'error'
      );
      onFinish?.();
      return;
    }

    if (this.tieneSNII === 'SI' && !this.snii.trim()) {
      this.showNotification(
        'Captura el SNI/SNII o selecciona "No".',
        'error'
      );
      onFinish?.();
      return;
    }

    if (this.tieneSNII === 'SI' && this.snii.trim().length > 12) {
      this.showNotification(
        'El SNI/SNII no debe superar 12 caracteres.',
        'error'
      );
      onFinish?.();
      return;
    }

    this.isSaving.set(true);
    this.notificationMessage.set('');

    const request: UpdateDatosAcademicosRequest = {
      strSNII: this.tieneSNII === 'SI' ? this.snii.trim() : null,
      idsPerfilAcademico: this.tienePerfilAcademico === 'SI'
        ? this.perfilesAgregados.map(perfil => perfil.id)
        : []
    };

    this.staffRegistrationService
      .updateDatosAcademicos(this.employeeIdCreado, request)
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);
          onFinish?.();

          if (response.statusCode !== 200) {
            this.showNotification(
              response.message ?? 'No fue posible guardar los datos académicos.',
              'error'
            );
            return;
          }

          onSuccess(this.employeeIdCreado!);
        },
        error: () => {
          this.isSaving.set(false);
          onFinish?.();

          this.showNotification(
            'No fue posible guardar los datos académicos.',
            'error'
          );
        }
      });
  }

  /* Valida los datos básicos antes de guardar, reflejando las mismas
  reglas que ya exige el backend (EmpleadosCommandValidator): nombre,
  apellidos y CURP obligatorios con su longitud máxima, y sexo
  seleccionado. Evita un viaje de red solo para que el backend
  rechace el formulario. */
  private validateBasicForm(): boolean {
    if (!this.employee.strNombre.trim()) {
      this.showNotification('El nombre es obligatorio.', 'error');
      return false;
    }

    if (this.employee.strNombre.length > 250) {
      this.showNotification('El nombre no debe superar 250 caracteres.', 'error');
      return false;
    }

    if (!this.employee.strApellidoPat.trim()) {
      this.showNotification('El apellido paterno es obligatorio.', 'error');
      return false;
    }

    if (this.employee.strApellidoPat.length > 250) {
      this.showNotification('El apellido paterno no debe superar 250 caracteres.', 'error');
      return false;
    }

    if (!this.employee.strApellidoMat.trim()) {
      this.showNotification('El apellido materno es obligatorio.', 'error');
      return false;
    }

    if (this.employee.strApellidoMat.length > 250) {
      this.showNotification('El apellido materno no debe superar 250 caracteres.', 'error');
      return false;
    }

    if (!this.employee.strCurp.trim()) {
      this.showNotification('La CURP es obligatoria.', 'error');
      return false;
    }

    if (this.employee.strCurp.length > 18) {
      this.showNotification('La CURP no debe superar 18 caracteres.', 'error');
      return false;
    }

    if (!this.employee.idSexo) {
      this.showNotification('El sexo es obligatorio.', 'error');
      return false;
    }

    return true;
  }

  private getSaveEmployeeErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }

    if (error.status === 409) {
      return 'La CURP ya se encuentra registrada.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 500) {
      return 'Ocurrió un error inesperado al guardar la información.';
    }

    return 'No fue posible guardar la información personal.';
  }

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
