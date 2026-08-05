import {
  ChangeDetectorRef,
  Component,
  ViewChild,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { EnrollmentDataComponent }
  from './enrollment-data/enrollment-data';

import { PersonalDataComponent }
  from './personal-data/personal-data';

import { InfrastructureDataComponent }
  from './infrastructure-data/infrastructure-data';

import { VinculationDataComponent }
  from './vinculation-data/vinculation-data';

@Component({
  selector: 'app-institutional-information',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    EnrollmentDataComponent,
    PersonalDataComponent,
    InfrastructureDataComponent,
    VinculationDataComponent
  ],
  templateUrl: './institutional-information.html',
  styleUrl: './institutional-information.scss'
})
export class InstitutionalInformationComponent {

  /*
   * Referencia al formulario de matrícula.
   * Permite ejecutar su método de guardado
   * desde el botón del componente contenedor.
   */
  @ViewChild(EnrollmentDataComponent)
  enrollmentDataComponent?: EnrollmentDataComponent;

  /*
   * Referencia al formulario de personal.
   * Permite ejecutar su método de guardado
   * desde el botón del componente contenedor.
   */
  @ViewChild(PersonalDataComponent)
  personalDataComponent?: PersonalDataComponent;

  /*
   * Referencia al formulario de infraestructura.
   * Permite ejecutar su método de guardado
   * desde el botón del componente contenedor.
   */
  @ViewChild(InfrastructureDataComponent)
  infrastructureDataComponent?: InfrastructureDataComponent;

  /*
   * Referencia al formulario de vinculación.
   * Permite ejecutar su método de guardado
   * desde el botón del componente contenedor.
   */
  @ViewChild(VinculationDataComponent)
  vinculationDataComponent?: VinculationDataComponent;

  private cdr =
    inject(ChangeDetectorRef);

  /*
   * Controla si el menú lateral
   * se encuentra abierto o colapsado.
   */
  menuCollapsed = false;

  /*
   * Paso visible dentro del Registro
   * de Información Institucional.
   */
  currentStep = 1;

  /*
   * Indica si la información de matrícula
   * ya fue registrada.
   */
  enrollmentCompleted = false;

  /*
   * Indica si la información de personal
   * ya fue registrada.
   */
  personalCompleted = false;

  /*
   * Evita varios clics mientras
   * se guarda la información.
   */
  isSaving = false;

  /*
   * Mensaje mostrado por
   * el componente contenedor.
   */
  notificationMessage = '';

  /*
   * Tipo del mensaje mostrado.
   */
  notificationType:
    'success' | 'error' =
    'success';

  /*
   * Expande o colapsa
   * el menú lateral.
   */
  toggleMenu(): void {

    this.menuCollapsed =
      !this.menuCollapsed;

  }

  /*
   * Cambia el módulo mostrado
   * dentro del formulario.
   */
  goToStep(
    step: number
  ): void {

    if (step === 1) {

      this.currentStep = step;

      return;

    }

    if (step === 2) {

      this.currentStep = step;

      return;

    }

    if (
      step === 3 &&
      this.personalCompleted
    ) {

      this.currentStep = step;

      return;

    }

    /*
     * El paso 4 queda reservado para Finanzas.
     * Vinculación corresponde al paso 5.
     */
    if (step === 5) {

      this.currentStep = step;

    }

  }

  /*
   * Ejecuta el guardado correspondiente
   * a la sección que se encuentra visible.
   */
  saveCurrentSection(): void {

    if (this.currentStep === 1) {

      this.saveEnrollmentSection();

      return;

    }

    if (this.currentStep === 2) {

      this.savePersonalSection();

      return;

    }

    if (this.currentStep === 3) {

      this.saveInfrastructureSection();

      return;

    }

    if (this.currentStep === 5) {

      this.saveVinculationSection();

    }

  }

  /*
   * Guarda la información de matrícula
   * utilizando el componente hijo.
   */
  private saveEnrollmentSection(): void {

    if (
      this.isSaving ||
      !this.enrollmentDataComponent
    ) {

      return;

    }

    this.isSaving = true;

    this.cdr.detectChanges();

    this.enrollmentDataComponent
      .saveEnrollmentData(

        () => {

          this.enrollmentCompleted = true;

          this.showNotification(
            'Datos de matrícula guardados correctamente.',
            'success'
          );

          this.cdr.detectChanges();

        },

        () => {

          this.isSaving = false;

          this.cdr.detectChanges();

        }

      );

  }

  /*
   * Guarda la información de personal
   * utilizando el componente hijo.
   */
  private savePersonalSection(): void {

    if (
      this.isSaving ||
      !this.personalDataComponent
    ) {

      return;

    }

    this.isSaving = true;

    this.cdr.detectChanges();

    this.personalDataComponent
      .savePersonalData(

        () => {

          this.personalCompleted = true;

          this.isSaving = false;

          this.cdr.detectChanges();

        }

      );

  }

  /*
   * Guarda la información de infraestructura
   * utilizando el componente hijo.
   */
  private saveInfrastructureSection(): void {

    if (
      !this.infrastructureDataComponent ||
      this.infrastructureDataComponent.isSaving
    ) {

      return;

    }

    this.infrastructureDataComponent
      .saveInfrastructureData();

  }

  /*
   * Guarda la información de vinculación
   * utilizando el componente hijo.
   */
  private saveVinculationSection(): void {

    if (
      !this.vinculationDataComponent ||
      this.vinculationDataComponent.isSaving
    ) {

      return;

    }

    this.vinculationDataComponent
      .saveVinculationData();

  }

  /*
   * Muestra una notificación dentro
   * del componente contenedor.
   */
  showNotification(
    message: string,
    type: 'success' | 'error'
  ): void {

    this.notificationMessage =
      message;

    this.notificationType =
      type;

    setTimeout(() => {

      this.notificationMessage = '';

      this.cdr.detectChanges();

    }, 4000);

  }

}