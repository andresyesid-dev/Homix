import { Component, EventEmitter, Input, Output } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-modal-confirmacion',
  templateUrl: './modal-confirmacion.component.html',
  styleUrls: ['./modal-confirmacion.component.scss'],
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms', style({ opacity: 0 }))
      ])
    ]),
    trigger('modalContentAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ transform: 'scale(0.8)', opacity: 0 }))
      ])
    ])
  ]
})
export class ModalConfirmacionComponent {
  @Input() titulo: string = '¿Estás seguro?';
  @Input() mensaje: string = '¿Deseas continuar con esta acción?';
  @Input() textoConfirmar: string = 'Confirmar';
  @Input() textoCancelar: string = 'Cancelar';
  @Input() tipoAlerta: 'warning' | 'danger' | 'info' = 'warning';
  @Input() mostrar: boolean = false;
  
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  onConfirmar() {
    this.confirmar.emit();
  }

  onCancelar() {
    this.cancelar.emit();
  }

  onCerrar() {
    this.cerrar.emit();
  }

  // Prevenir que el click en el contenido cierre el modal
  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}
