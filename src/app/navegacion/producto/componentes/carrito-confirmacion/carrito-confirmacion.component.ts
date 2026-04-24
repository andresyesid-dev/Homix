import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Producto } from '../../../../interfaces/producto/producto';

@Component({
  selector: 'app-carrito-confirmacion',
  templateUrl: './carrito-confirmacion.component.html',
  styleUrls: ['./carrito-confirmacion.component.scss']
})
export class CarritoConfirmacionComponent {
  @Input() producto!: Producto;
  @Input() unidades: number = 1;
  @Input() unidadesEnCarrito: number = 1;
  @Input() fotoActual: string = '';
  @Input() visible = false;
  @Input() esError = false;
  @Input() usuarioVendedorNombre: string = '';
  @Input() usuarioActualId: string = '';
  @Output() cerrar = new EventEmitter<void>();

  constructor(private router: Router) {}

  seguirComprando() {
    this.cerrar.emit();
  }

  verVendedor() {
    this.cerrar.emit();
    this.router.navigate([this.usuarioVendedorNombre, 'perfil', 'publicaciones']);
  }

  irAlCarrito() {
    this.cerrar.emit();
    this.router.navigate([this.usuarioActualId, 'carrito']);
  }
}
