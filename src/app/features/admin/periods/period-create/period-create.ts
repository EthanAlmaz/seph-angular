import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CatalogService } from '../../../../core/services/catalogs/catalog.service';
import { CreatePeriodRequest } from '../../../../shared/models/catalogs/requests/createPeriodRequest';
import { UpdatePeriodRequest } from '../../../../shared/models/catalogs/requests/updatePeriodRequest';
import { HttpErrorResponse } from '@angular/common/http';

import { TipoPeriodoResponse } from '../../../../shared/models/catalogs/responses/tipoPeriodoResponse';
/* Alta y edición de periodos.
Si la ruta contiene un :id, se carga el periodo correspondiente
y el formulario actualiza el registro en lugar de crear uno nuevo.

Se utilizan signals porque la aplicación trabaja de manera zoneless. */
@Component({
  selector: 'app-period-create',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './period-create.html',
  styleUrl: './period-create.scss'
})
export class PeriodCreateComponent implements OnInit {

  private readonly catalogService = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /* Id del periodo que se está editando.
  Es null cuando se registra un periodo nuevo. */
  periodoId: number | null = null;

  isSaving = signal(false);
  isLoading = signal(false);

  notificationMessage = signal('');
  notificationType = signal<'success' | 'error'>('success');

  tiposPeriodo = signal<TipoPeriodoResponse[]>([]);
  tipoPeriodoNombre = signal('');

  periodo: CreatePeriodRequest = {
    intAnio: new Date().getFullYear(),
    intNumeroPeriodo: 1,
    dateFechaInicio: '',
    dateFechaFin: '',
   idTipoPeriodo: 0
    
  };

  ngOnInit(): void {
  this.loadTiposPeriodo();

  const idParam = this.route.snapshot.paramMap.get('id');

  if (idParam) {
    this.periodoId = Number(idParam);
    this.loadPeriodo(this.periodoId);
  }
}
/* Carga los tipos de periodo disponibles. */
private loadTiposPeriodo(): void {
  this.catalogService.getTiposPeriodo().subscribe({
    next: (response) => {
      this.tiposPeriodo.set(
        (response.data ?? []).filter(
          tipoPeriodo => tipoPeriodo.bitActivo
        )
      );

      // Recalcula el tipo cuando ya existen fechas cargadas.
      this.calcularTipoPeriodo();
    },
    error: (error) => {
      console.error(
        'Error cargando tipos de periodo:',
        error
      );

      this.showNotification(
        'No fue posible cargar los tipos de periodo.',
        'error'
      );
    }
  });
}
  /* Consulta los periodos y localiza el registro que será editado. */
  loadPeriodo(id: number): void {
    this.isLoading.set(true);

    this.catalogService.getPeriods().subscribe({
      next: (response) => {
        const registro = response.data?.find(
          periodo => periodo.id === id
        );

        if (!registro) {
          this.showNotification(
            'No se encontró el periodo solicitado.',
            'error'
          );

          this.isLoading.set(false);
          return;
        }

        this.periodo = {
  intAnio: registro.intAnio,
  intNumeroPeriodo: registro.intNumeroPeriodo,

  dateFechaInicio: registro.dateFechaInicio
    ? registro.dateFechaInicio.split('T')[0]
    : '',

  dateFechaFin: registro.dateFechaFin
    ? registro.dateFechaFin.split('T')[0]
    : '',

  idTipoPeriodo: registro.idTipoPeriodo
};

this.tipoPeriodoNombre.set(
  registro.strTipoPeriodo ?? ''
);

this.calcularTipoPeriodo();

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando periodo:', error);

        this.showNotification(
          'No fue posible cargar la información del periodo.',
          'error'
        );

        this.isLoading.set(false);
      }
    });
  }
/* Calcula automáticamente el tipo de periodo más cercano
con base en los tipos activos registrados en el catálogo. */
calcularTipoPeriodo(): void {
  const fechaInicioTexto = this.periodo.dateFechaInicio;
  const fechaFinTexto = this.periodo.dateFechaFin;

  if (!fechaInicioTexto || !fechaFinTexto) {
    this.limpiarTipoPeriodo();
    return;
  }

  const fechaInicio = new Date(
    `${fechaInicioTexto}T00:00:00`
  );

  const fechaFin = new Date(
    `${fechaFinTexto}T00:00:00`
  );

  if (fechaFin < fechaInicio) {
    this.limpiarTipoPeriodo();
    return;
  }

  const milisegundosPorDia =
    1000 * 60 * 60 * 24;

  const numeroDias =
    Math.floor(
      (
        fechaFin.getTime() -
        fechaInicio.getTime()
      ) / milisegundosPorDia
    ) + 1;

  const tiposActivos = this.tiposPeriodo()
    .filter(tipo => tipo.bitActivo);

  if (tiposActivos.length === 0) {
    this.limpiarTipoPeriodo();

    this.tipoPeriodoNombre.set(
      'No existen tipos de periodo activos'
    );

    return;
  }

  /*
   Busca el tipo cuya duración esperada sea
   la más cercana a la duración capturada.
  */
  const candidatos = tiposActivos.map(tipo => {
    const diasEsperados =
      tipo.intNumeroMeses * 30.4375;

    const diferenciaDias =
      Math.abs(numeroDias - diasEsperados);

    const toleranciaDias =
      diasEsperados * 0.15;

    return {
      tipo,
      diferenciaDias,
      toleranciaDias
    };
  });

  candidatos.sort(
    (a, b) =>
      a.diferenciaDias - b.diferenciaDias
  );

  const mejorCoincidencia = candidatos[0];

  if (
    !mejorCoincidencia ||
    mejorCoincidencia.diferenciaDias >
      mejorCoincidencia.toleranciaDias
  ) {
    this.limpiarTipoPeriodo();

    this.tipoPeriodoNombre.set(
      'La duración no corresponde a un tipo de periodo registrado'
    );

    return;
  }

  this.periodo.idTipoPeriodo =
    mejorCoincidencia.tipo.id;

  this.tipoPeriodoNombre.set(
    mejorCoincidencia.tipo.strValor
  );
}
/* Limpia el tipo calculado cuando las fechas no son válidas. */
private limpiarTipoPeriodo(): void {
  this.periodo.idTipoPeriodo = 0;
  this.tipoPeriodoNombre.set('');
}

/* Registra un periodo nuevo o actualiza el periodo seleccionado. */
savePeriodo(): void {
  if (this.isSaving()) {
    return;
  }

  if (!this.validateForm()) {
    return;
  }

  this.isSaving.set(true);

  const request: UpdatePeriodRequest = {
      intAnio: this.periodo.intAnio,
  intNumeroPeriodo:
    this.periodo.intNumeroPeriodo,
  dateFechaInicio:
    this.periodo.dateFechaInicio,
  dateFechaFin:
    this.periodo.dateFechaFin,
  idTipoPeriodo:
    this.periodo.idTipoPeriodo
  };

  if (this.periodoId) {
    this.updatePeriodo(this.periodoId, request);
    return;
  }

  this.createPeriodo(request);
}
/* Registra un nuevo periodo. */
private createPeriodo(request: CreatePeriodRequest): void {
  this.catalogService.createPeriod(request).subscribe({
    next: (response) => {
      if (
        response.statusCode < 200 ||
        response.statusCode >= 300
      ) {
        this.showNotification(
          response.message ?? 'No fue posible registrar el periodo.',
          'error'
        );

        this.isSaving.set(false);
        return;
      }

      this.showNotification(
        'Periodo registrado correctamente.',
        'success'
      );

      setTimeout(() => {
        this.isSaving.set(false);
        this.router.navigateByUrl('/admin/periodos');
      }, 1500);
    },
    error: (error: unknown) => {
      console.error('Error al guardar periodo:', error);

      this.showNotification(
        this.getErrorMessage(
          error,
          'No fue posible registrar el periodo.'
        ),
        'error'
      );

      this.isSaving.set(false);
    }
  });
}

/* Actualiza un periodo existente. */
private updatePeriodo(
  id: number,
  request: UpdatePeriodRequest
): void {
  this.catalogService.updatePeriod(id, request).subscribe({
    next: (response) => {
      if (
        response.statusCode < 200 ||
        response.statusCode >= 300
      ) {
        this.showNotification(
          response.message ?? 'No fue posible actualizar el periodo.',
          'error'
        );

        this.isSaving.set(false);
        return;
      }

      this.showNotification(
        'Periodo actualizado correctamente.',
        'success'
      );

      setTimeout(() => {
        this.isSaving.set(false);
        this.router.navigateByUrl('/admin/periodos');
      }, 1500);
    },
    error: (error: unknown) => {
      console.error('Error al actualizar periodo:', error);

      this.showNotification(
        this.getErrorMessage(
          error,
          'No fue posible actualizar el periodo.'
        ),
        'error'
      );

      this.isSaving.set(false);
    }
  });
}

  /* Valida en Angular las mismas reglas principales del backend. */
  private validateForm(): boolean {
    if (!this.periodo.intAnio || this.periodo.intAnio <= 0) {
      this.showNotification(
        'El año debe ser mayor que cero.',
        'error'
      );
      return false;
    }

    if (
      !this.periodo.intNumeroPeriodo ||
      this.periodo.intNumeroPeriodo <= 0
    ) {
      this.showNotification(
        'El número de periodo debe ser mayor que cero.',
        'error'
      );
      return false;
    }

    if (!this.periodo.dateFechaInicio) {
      this.showNotification(
        'La fecha de inicio es obligatoria.',
        'error'
      );
      return false;
    }

    if (!this.periodo.dateFechaFin) {
      this.showNotification(
        'La fecha de fin es obligatoria.',
        'error'
      );
      return false;
    }

    const fechaInicio = new Date(
      `${this.periodo.dateFechaInicio}T00:00:00`
    );

    const fechaFin = new Date(
      `${this.periodo.dateFechaFin}T00:00:00`
    );

    if (fechaFin < fechaInicio) {
      this.showNotification(
        'La fecha de fin no puede ser menor que la fecha de inicio.',
        'error'
      );
      return false;
    }

    if (fechaInicio.getFullYear() !== this.periodo.intAnio) {
      this.showNotification(
        'El año debe coincidir con el año de la fecha de inicio.',
        'error'
      );
      return false;
    }
    if (!this.periodo.idTipoPeriodo) {
      this.showNotification(
       'Las fechas deben corresponder a un periodo bimestral o cuatrimestral.',
       'error'
  );
  return false;
}
    return true;
  }

  /* Obtiene el mensaje enviado por el backend cuando ocurre un error. */
private getErrorMessage(
  error: unknown,
  defaultMessage: string
): string {
  if (error instanceof HttpErrorResponse) {
    return error.error?.message ?? defaultMessage;
  }

  return defaultMessage;
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