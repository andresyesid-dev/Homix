import { Component, EventEmitter, NgZone, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Input } from '@angular/core';
import { Producto } from 'src/app/interfaces/producto/producto';
import { Usuario, referenciaCompra } from 'src/app/interfaces/usuario/usuario';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { ComprarService } from 'src/app/servicios/comprar/comprar.service';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { Subscription, first, firstValueFrom } from 'rxjs';
import { ProductosService } from 'src/app/servicios/productos/productos.service';

@Component({
  selector: 'app-producto-carrito',
  templateUrl: './producto-carrito.component.html',
  styleUrls: ['./producto-carrito.component.scss']
})
export class ProductoCarritoComponent implements OnInit, OnDestroy{
  @Output() eliminar = new EventEmitter<number>();
  @Input() carrito!: referenciaCompra[];
  @Input() productoCarrito!: Producto; 
  @Input() unidad!: number;
  @Input() tamanio!: number | string;
  @Input() indice!: number;
  private subscription!: Subscription;
  private usuario!: Usuario;
  userUsuario!: string;
  fotoUrl: string = '';
  imagenCargada: boolean = false;
  unidadesMaximas: number = 60;
  estiloNombre: string = '';
  
  constructor(private zone: NgZone, private router: Router, private firestore: Firestore, private auth:Auth, private comprarService: ComprarService, private authService: AuthService, private prdService: ProductosService){}

  async ngOnInit() {
    await this.cargarFoto();
    await this.cargarUnidadesMaximas();
    this.auth.onAuthStateChanged(async(user) => {
      if (user) {
        this.subscription = this.authService.getUsuarioId(user.uid).subscribe((usuario)=>{
          this.usuario = usuario;
        })
      }
      const usuario$ = this.authService.getUsuarioId(this.productoCarrito.idUsuario!);
      this.userUsuario = (await firstValueFrom(usuario$)).usuario!;
    });
  }

  async cargarFoto() {
    try {
      const estiloIndex = this.tamanio !== 'false' ? +this.tamanio : 0;
      const fotos = await this.prdService.obtenerFotoPorEstilo(this.productoCarrito, estiloIndex);
      this.fotoUrl = fotos[0] || '';
    } catch (error) {
      console.error('Error cargando foto:', error);
      if (this.productoCarrito.fotos && this.productoCarrito.fotos.length > 0) {
        this.fotoUrl = `assets/img/productos/${this.productoCarrito.fotos[0]}.webp`;
      }
    }
  }

  onImageLoad() {
    this.imagenCargada = true;
  }

  get maxUnidades(): number {
    return this.unidadesMaximas;
  }

  async cargarUnidadesMaximas() {
    if (this.tamanio === 'false' || !this.productoCarrito.estilos?.length) return;
    const estiloEntry = this.productoCarrito.estilos[+this.tamanio] as any;
    if (estiloEntry?.path) {
      // DocumentReference — load from Firestore
      const snap = await getDoc(estiloEntry);
      const data = snap.data() as any;
      this.unidadesMaximas = data?.['unidades'] ?? 60;
      this.estiloNombre = data?.['nombre'] || data?.['estilo'] || '';
    } else if (typeof estiloEntry?.unidades === 'number') {
      // Already loaded object
      this.unidadesMaximas = estiloEntry.unidades;
      this.estiloNombre = estiloEntry.nombre || estiloEntry.estilo || '';
    }
  }

  async cambiarUnidad(accion: string, index: number){
    const userRef = doc(this.firestore, `usuarios/${this.auth.currentUser?.uid}`);
    if(accion === '+'){
      if(this.unidad < this.maxUnidades){
        this.carrito![index].unidades += 1; 
        this.unidad += 1;
        await setDoc(userRef, {carrito: this.carrito}, {merge: true});
      }
    }
    if(accion === '-'){
      if(this.unidad !== 1){
        this.carrito![index].unidades -= 1; 
        this.unidad -= 1;
        await setDoc(userRef, {carrito: this.carrito}, {merge: true})
      }
    }
  }
  agregarGuardado(){
    if(this.productoCarrito){
      this.eliminar.emit(this.indice);
      this.comprarService.eliminarReferenciaCarrito(this.usuario, this.indice);
      if(typeof this.tamanio == 'number'){
        this.comprarService.agregarReferenciaGuardado(this.productoCarrito.id!, this.auth.currentUser?.uid!, this.unidad, this.tamanio as number);
      }else{
        this.comprarService.agregarReferenciaGuardado(this.productoCarrito.id!, this.auth.currentUser?.uid!, this.unidad);
      }
    }
  }

  eliminarCarrito(){
    if(this.productoCarrito){
      this.eliminar.emit(this.indice);
      this.comprarService.eliminarReferenciaCarrito(this.usuario, this.indice);
    }
  }
  
  navegar(ruta: any[]){
    this.zone.run(()=>{
      this.router.navigate(ruta);
      window.scroll(0,0)
    })
  }

  ngOnDestroy(): void {
    if(this.subscription){
      this.subscription.unsubscribe();
    }
  }
}
