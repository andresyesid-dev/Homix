import { Component, HostListener, NgZone, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Input } from '@angular/core';
import { Producto } from 'src/app/interfaces/producto/producto';
import { provideIcons } from '@ng-icons/core';
import { heroChevronDownMini } from '@ng-icons/heroicons/mini';
import { Storage, getDownloadURL, listAll, ref } from '@angular/fire/storage';
import { getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-publicacion',
  templateUrl: './publicacion.component.html',
  styleUrls: ['./publicacion.component.scss'],
  providers: [provideIcons({heroChevronDownMini})]
})
export class PublicacionComponent implements OnInit{
  constructor(private zone: NgZone, private router: Router, private storage: Storage){}
  @Input() publicacion!: Producto;
  @Output() eliminarProducto = new EventEmitter<Producto>();
  
  subMenu: boolean = false;
  unidades: boolean = false;
  unidadesMasEstilos: boolean = false;
  fecha!: Date;
  totalUnidades: number = 0;
  estado = true;
  fotoUrl: string = '';
  imagenCargada: boolean = false;
  mostrarModalEliminar: boolean = false;

  vistas: number = 0;

  async ngOnInit(): Promise<void> {
    await this.cargarFoto();
    
    if(!this.publicacion.estado){
      this.estado = false;
    }
    if(this.publicacion.vistas){
      this.publicacion.vistas.forEach((vista)=>{
        this.vistas += vista.cantidad;
      })
    }
    this.obtenerFecha();
  }

  obtenerFecha(){
    const timestamp = this.publicacion.fecha;
    this.fecha = new Date(timestamp.seconds * 1000);
  }

  desplegarSubMenu(event: Event){
    event.stopPropagation();
    this.subMenu = !this.subMenu;
  }
  desplegarUnidades(){
    this.unidades = !this.unidades;
  }

  async cargarFoto() {
    try {
      // Verificar si usa formato antiguo con estilos como referencias
      if (this.publicacion.estilos && Array.isArray(this.publicacion.estilos) && typeof this.publicacion.estilos[0] === 'object' && (this.publicacion.estilos[0] as any).path) {
        const estiloRef = this.publicacion.estilos[0] as any;
        const estiloSnapshot = await getDoc(estiloRef);
        const estilo = estiloSnapshot.data() as any;
        const imgRef = ref(this.storage, `productos/${this.publicacion.id}/${estiloRef.id}/${estilo.fotos[0].id}`);
        this.fotoUrl = await getDownloadURL(imgRef);
      } else if (this.publicacion.fotos && this.publicacion.fotos.length > 0) {
        // Formato nuevo
        this.fotoUrl = `assets/img/productos/${this.publicacion.fotos[0]}.webp`;
      }
    } catch (error) {
      console.error('Error cargando foto:', error);
      if (this.publicacion.fotos && this.publicacion.fotos.length > 0) {
        this.fotoUrl = `assets/img/productos/${this.publicacion.fotos[0]}.webp`;
      }
    }
  }

  onImageLoad() {
    this.imagenCargada = true;
  }

  editarProducto(){
    const idUrl = this.router.url.split('/')[1];
    this.router.navigate([idUrl + '/editar-publicacion/' + this.publicacion.id]);
  }

  navegar(ruta: any[], event: Event){
    event.preventDefault();
    this.zone.run(()=>{
      this.router.navigate(ruta);
      window.scroll(0,0)
    })
  }

  abrirModalEliminar(event: Event) {
    event.stopPropagation();
    this.mostrarModalEliminar = true;
    this.subMenu = false;
  }

  confirmarEliminar() {
    this.mostrarModalEliminar = false;
    this.eliminarProducto.emit(this.publicacion);
  }

  cancelarEliminar() {
    this.mostrarModalEliminar = false;
  }

  cerrarModal() {
    this.mostrarModalEliminar = false;
  }

  @HostListener('document:click')
  closeMenu() {
    this.subMenu = false;
  }
  
}
