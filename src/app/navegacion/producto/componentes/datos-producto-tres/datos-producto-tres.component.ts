import { Component, Input, SimpleChanges } from '@angular/core';
import { Producto } from 'src/app/interfaces/producto/producto';

@Component({
  selector: 'app-datos-producto-tres',
  templateUrl: './datos-producto-tres.component.html',
  styleUrls: ['./datos-producto-tres.component.scss']
})
export class DatosProductoTresComponent {
  @Input() producto!: Producto;
  public detalles: string[][] = []; // se guardan los datos de todos los detalles en formato de string[][]

  //-------------- ASIGNACIÓN DE VARIABLES ------------
  ngOnInit(){
    this.procesarDetalles();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['producto'] && changes['producto'].currentValue) {
      this.procesarDetalles();
    }
  }

  procesarDetalles() {
    console.log(typeof this.producto.detalles);
    if (this.producto && this.producto.detalles) {
      console.log("Entra: ")
      // Convertir el objeto a array de arrays [etiqueta, valor]
      this.detalles = Object.entries(this.producto.detalles).map(
        ([etiqueta, valor]) => [etiqueta, String(valor)]
      );
      console.log(this.detalles)
    } else {
      this.detalles = [];
    }
  }
}
