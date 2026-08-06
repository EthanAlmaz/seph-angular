import { Routes } from '@angular/router';

export const institutionPeriodsRoutes: Routes = [
  {
    /*
     * Vista principal del módulo:
     * concentrado de periodos asignados
     * a las instituciones.
     */
    path: '',
    loadComponent: () =>
      import('./institution-period-records').then(
        m => m.InstitutionPeriodRecordsComponent
      )
  },
  {
    /*
     * Registra una nueva asignación
     * entre institución y periodo.
     */
    path: 'new',
    loadComponent: () =>
      import(
        './institution-period-create/institution-period-create'
      ).then(
        m => m.InstitutionPeriodCreateComponent
      )
  },
  {
    /*
     * Edita una asignación existente.
     * El identificador corresponde
     * a MapInstitucionPeriodo.
     */
    path: ':id/edit',
    loadComponent: () =>
      import(
        './institution-period-create/institution-period-create'
      ).then(
        m => m.InstitutionPeriodCreateComponent
      )
  }
];