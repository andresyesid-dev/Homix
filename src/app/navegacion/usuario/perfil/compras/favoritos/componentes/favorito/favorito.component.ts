import { Component, EventEmitter, NgZone, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Input } from '@angular/core';
import { Producto } from 'src/app/interfaces/producto/producto';
import { provideIcons } from '@ng-icons/core';
import { matDelete } from '@ng-icons/material-icons/baseline';
import { ProductosService } from 'src/app/servicios/productos/productos.service';

@Component({
  selector: 'app-favorito',
  templateUrl: './favorito.component.html',
  styleUrls: ['./favorito.component.scss'],
  providers: [provideIcons({matDelete})]
})
export class FavoritoComponent implements OnInit {
  @Input() favorito!: Producto;
  @Output() elimar = new EventEmitter<string>()
  subMenu: boolean = false;
  fotoUrl: string = '';
  
  constructor(private zone: NgZone, private router: Router, private prdService: ProductosService){
  }

  async ngOnInit() {
    await this.cargarFoto();
  }

  imagenCargada: boolean = false;

  async cargarFoto() {
    try {
      // Verificar si tiene estilos con fotos cargadas (ya procesadas por cargarEstilosCompletos)
      if (this.favorito.estilos && this.favorito.estilos.length > 0) {
        const primerEstilo = this.favorito.estilos[0];
        if (primerEstilo.fotos && primerEstilo.fotos.length > 0) {
          this.fotoUrl = primerEstilo.fotos[0];
          return;
        }
      }
      
      // Fallback: usar fotos directas del producto
      if (this.favorito.fotos && this.favorito.fotos.length > 0) {
        this.fotoUrl = `assets/img/productos/${this.favorito.fotos[0]}.webp`;
      }
    } catch (error) {
      console.error('Error cargando foto:', error);
      if (this.favorito.fotos && this.favorito.fotos.length > 0) {
        this.fotoUrl = `assets/img/productos/${this.favorito.fotos[0]}.webp`;
      }
    }
  }

  onImageLoad() {
    this.imagenCargada = true;
  }
  
  desplegar(){
    this.subMenu = !this.subMenu;
  }

  eliminar(){
    this.elimar.emit(this.favorito.id);
  }
   
  navegar(ruta: any[], event: Event){
    event.preventDefault();
    this.zone.run(()=>{
      this.router.navigate(ruta);
      window.scroll(0,0)
    })
  }
}
