import { Component, ElementRef, OnInit, Renderer2, ViewChild, Input, NgZone, SimpleChanges, OnChanges } from '@angular/core';
import { Storage, getDownloadURL, listAll, ref } from '@angular/fire/storage';
import { Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';

import { heroChevronLeftSolid } from '@ng-icons/heroicons/solid';
import { heroChevronRightSolid } from '@ng-icons/heroicons/solid';

import { Producto } from 'src/app/interfaces/producto/producto';
import { ProductosService } from 'src/app/servicios/productos/productos.service';

@Component({
  selector: 'app-carrusel',
  templateUrl: './carrusel.component.html',
  styleUrls: ['./carrusel.component.scss'],
  viewProviders: provideIcons({heroChevronLeftSolid, heroChevronRightSolid})
})
export class CarruselComponent implements OnInit, OnChanges {
  @Input() elements!: Producto[];
  @Input() categorias!: Array<any>;
  @Input() carousel = 0;

  public slickWidth!: number;

  public leftPosition!: number;

  public fotosUrls: string[] = [];
  public fotosMap: Map<string, string> = new Map();

  constructor(private renderer: Renderer2,private zone: NgZone,private router: Router, private storage: Storage, private prdService: ProductosService) { }

  @ViewChild('lista', { static: false }) carrucel!: ElementRef;

  scrollDerecha: number = 0;

  ngAfterViewInit() {
    this.carrucel.nativeElement.addEventListener('scroll', this.onScroll.bind(this));
  }

  onScroll(event: any) {
    const scrollLeft = event.target!.scrollLeft;
    this.scrollDerecha = scrollLeft;
  }

  navegar( ruta: any[]): any {
    this.zone.run(() => {
      this.router.navigate(ruta);
      window.scroll(0,0)
    });
  }

  async ngOnInit(): Promise<void> {
    if (this.carousel === 2){
        this.slickWidth = 250;
    }else
    if (this.carousel === 3){
        this.slickWidth = 252;
    }
    
    // Obtener URLs de fotos desde Firebase o assets
    if (this.elements && this.elements.length > 0) {
      await this.cargarFotos();
    }
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['elements'] && changes['elements'].currentValue) {
      await this.cargarFotos();
    }
  }

  async cargarFotos(): Promise<void> {
    if (!this.elements || this.elements.length === 0) return;
    
    try {
      this.fotosUrls = await this.prdService.obtenerFotos(this.elements);
      // Crear mapa para acceso rápido por ID de producto
      this.elements.forEach((producto, index) => {
        if (producto.id) {
          this.fotosMap.set(producto.id, this.fotosUrls[index]);
        }
      });
    } catch (error) {
      console.error('Error cargando fotos:', error);
    }
  }

  obtenerFotoProducto(producto: Producto): string {
    if (producto.id && this.fotosMap.has(producto.id)) {
      return this.fotosMap.get(producto.id)!;
    }
    return 'assets/img/categoria/pic-loading.svg';
  }

  Move(value: number): void {
    const contenedor = this.carrucel.nativeElement;

    // Obtener la posición actual del scroll horizontal
    const scrollLeft = contenedor.scrollLeft;

    if (value === 1) {
        // Mover hacia la izquierda
        contenedor.scrollTo({ left: scrollLeft - this.slickWidth, behavior: 'smooth' });
    } else if (value === 2) {
        // Mover hacia la derecha
        contenedor.scrollTo({ left: scrollLeft + this.slickWidth, behavior: 'smooth' });
    }
  }
}
