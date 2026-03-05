import { Component, Input } from '@angular/core';

interface Retencion {
  id?: string;
  fecha?: any;
  tipo?: string;
  monto?: number;
  porcentaje?: number;
  descripcion?: string;
  estado?: 'pendiente' | 'aplicado';
}

@Component({
  selector: 'app-retencion',
  templateUrl: './retencion.component.html',
  styleUrls: ['./retencion.component.scss']
})
export class RetencionComponent {
  @Input() retencion!: Retencion;
}
