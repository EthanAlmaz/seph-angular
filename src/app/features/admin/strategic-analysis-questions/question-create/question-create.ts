import {Component,OnInit,inject,signal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {ActivatedRoute,Router,RouterLink} from '@angular/router';
import { HttpErrorResponse }from '@angular/common/http';

import { CatalogService }from '../../../../core/services/catalogs/catalog.service';

import { CreateCatPreguntaAnalisisRequest }from '../../../../shared/models/catalogs/requests/createCatPreguntaAnalisisRequest';

import { UpdateCatPreguntaAnalisisRequest }from '../../../../shared/models/catalogs/requests/updateCatPreguntaAnalisisRequest';

/*
 * Alta y edición de preguntas de análisis estratégico.
 * Cuando la ruta contiene un id se carga la pregunta
 * seleccionada y el formulario actualiza el registro.
 */
@Component({selector:
        'app-strategic-analysis-question-create',

    standalone: true,

    imports: [
        FormsModule,
        RouterLink
    ],

    templateUrl:
        './question-create.html',

    styleUrl:
        './question-create.scss'
})
export class StrategicAnalysisQuestionCreateComponent
    implements OnInit {

    private readonly catalogService =
        inject(CatalogService);

    private readonly route =
        inject(ActivatedRoute);

    private readonly router =
        inject(Router);

    /*
     * Identificador de la pregunta editada.
     * Es null cuando se registra una nueva.
     */
    preguntaId: number | null =
        null;

    isSaving =
        signal(false);

    isLoading =
        signal(false);

    notificationMessage =
        signal('');

    notificationType =
        signal<'success' | 'error'>(
            'success'
        );

    /*
     * Información capturada
     * en el formulario.
     */
    pregunta:
        CreateCatPreguntaAnalisisRequest = {

            strPregunta: ''

        };

    ngOnInit(): void {

        const idParam =
            this.route.snapshot.paramMap.get(
                'id'
            );

        if (idParam) {

            this.preguntaId =
                Number(idParam);

            this.loadPregunta(
                this.preguntaId
            );

        }

    }

    /*
     * Consulta el catálogo y localiza
     * la pregunta que será editada.
     */
    private loadPregunta(
        id: number
    ): void {

        this.isLoading.set(true);

        this.catalogService
            .getPreguntasAnalisis()
            .subscribe({

                next: (response) => {

                    const registro =
                        response.data?.find(
                            pregunta =>
                                pregunta.id === id
                        );

                    if (!registro) {

                        this.showNotification(
                            'No se encontró la pregunta solicitada.',
                            'error'
                        );

                        this.isLoading.set(false);

                        return;

                    }

                    this.pregunta = {

                        strPregunta:
                            registro.strPregunta

                    };

                    this.isLoading.set(false);

                },

                error: (error) => {

                    console.error(
                        'Error cargando pregunta:',
                        error
                    );

                    this.showNotification(
                        'No fue posible cargar la información de la pregunta.',
                        'error'
                    );

                    this.isLoading.set(false);

                }

            });

    }

    /*
     * Registra una nueva pregunta
     * o actualiza la seleccionada.
     */
    savePregunta(): void {

        if (this.isSaving()) {

            return;

        }

        if (!this.validateForm()) {

            return;

        }

        this.isSaving.set(true);

        const strPregunta =
            this.pregunta.strPregunta.trim();

        if (this.preguntaId) {

            const request:
                UpdateCatPreguntaAnalisisRequest = {

                strPregunta

            };

            this.updatePregunta(
                this.preguntaId,
                request
            );

            return;

        }

        const request:
            CreateCatPreguntaAnalisisRequest = {

            strPregunta

        };

        this.createPregunta(
            request
        );

    }

    /*
     * Registra una nueva pregunta
     * de análisis estratégico.
     */
    private createPregunta(
        request:
            CreateCatPreguntaAnalisisRequest
    ): void {

        this.catalogService
            .createPreguntaAnalisis(
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
                            'No fue posible registrar la pregunta.',
                            'error'
                        );

                        this.isSaving.set(false);

                        return;

                    }

                    this.showNotification(
                        'Pregunta registrada correctamente.',
                        'success'
                    );

                    setTimeout(() => {

                        this.isSaving.set(false);

                        this.router.navigateByUrl(
                            '/admin/strategic-analysis-questions'
                        );

                    }, 1500);

                },

                error: (error: unknown) => {

                    console.error(
                        'Error al guardar pregunta:',
                        error
                    );

                    this.showNotification(
                        this.getErrorMessage(
                            error,
                            'No fue posible registrar la pregunta.'
                        ),
                        'error'
                    );

                    this.isSaving.set(false);

                }

            });

    }

    /*
     * Actualiza una pregunta
     * existente.
     */
    private updatePregunta(
        id: number,
        request:
            UpdateCatPreguntaAnalisisRequest
    ): void {

        this.catalogService
            .updatePreguntaAnalisis(
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
                            'No fue posible actualizar la pregunta.',
                            'error'
                        );

                        this.isSaving.set(false);

                        return;

                    }

                    this.showNotification(
                        'Pregunta actualizada correctamente.',
                        'success'
                    );

                    setTimeout(() => {

                        this.isSaving.set(false);

                        this.router.navigateByUrl(
                            '/admin/strategic-analysis-questions'
                        );

                    }, 1500);

                },

                error: (error: unknown) => {

                    console.error(
                        'Error al actualizar pregunta:',
                        error
                    );

                    this.showNotification(
                        this.getErrorMessage(
                            error,
                            'No fue posible actualizar la pregunta.'
                        ),
                        'error'
                    );

                    this.isSaving.set(false);

                }

            });

    }

    /*
     * Valida las reglas principales
     * antes de enviar la información.
     */
    private validateForm(): boolean {

        const strPregunta =
            this.pregunta.strPregunta.trim();

        if (!strPregunta) {

            this.showNotification(
                'La pregunta es obligatoria.',
                'error'
            );

            return false;

        }

        if (strPregunta.length > 300) {

            this.showNotification(
                'La pregunta no puede exceder los 300 caracteres.',
                'error'
            );

            return false;

        }

        return true;

    }

    /*
     * Obtiene el mensaje enviado
     * por el backend cuando ocurre un error.
     */
    private getErrorMessage(
        error: unknown,
        defaultMessage: string
    ): string {

        if (
            error instanceof
            HttpErrorResponse
        ) {

            return (
                error.error?.message ??
                defaultMessage
            );

        }

        return defaultMessage;

    }

    /*
     * Muestra temporalmente una
     * notificación de éxito o error.
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