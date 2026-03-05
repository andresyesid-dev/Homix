import { Component, Input } from '@angular/core';

interface FacturaReporte {
  id?: string;
  fecha?: any;
  tipo: 'factura' | 'reporte';
  periodo?: string;
  monto?: number;
  estado?: 'pendiente' | 'procesado' | 'completado';
  descripcion?: string;
}

@Component({
  selector: 'app-factura-reporte',
  templateUrl: './factura-reporte.component.html',
  styleUrls: ['./factura-reporte.component.scss']
})
export class FacturaReporteComponent {
  @Input() facturaReporte!: FacturaReporte;
}
