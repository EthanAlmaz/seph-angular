import { Routes } from '@angular/router';

export const strategicAnalysisQuestionsRoutes: Routes = [
  {
    /*
     * Vista principal del módulo:
     * concentrado de preguntas registradas.
     */
    path: '',
    loadComponent: () =>
      import(
        './strategic-analysis-questions-records'
      ).then(
        m =>
          m.StrategicAnalysisQuestionsRecordsComponent
      )
  },
  {
    /*
     * Alta de una nueva pregunta
     * de análisis estratégico.
     */
    path: 'nueva',
    loadComponent: () =>
      import(
        './question-create/question-create'
      ).then(
        m =>
          m.StrategicAnalysisQuestionCreateComponent
      )
  },
  {
    /*
     * Edición de una pregunta existente.
     * El id permite cargar el registro seleccionado.
     */
    path: ':id/editar',
    loadComponent: () =>
      import(
        './question-create/question-create'
      ).then(
        m =>
          m.StrategicAnalysisQuestionCreateComponent
      )
  }
];