import { Component, OnDestroy, OnInit } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { matEdit } from '@ng-icons/material-icons/baseline';
import { heroMapPin } from '@ng-icons/heroicons/outline'; 
import { Auth } from '@angular/fire/auth';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { Subscription, first, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { Direccion } from 'src/app/interfaces/usuario/subInterfaces/direccion';
import { ComprarService } from 'src/app/servicios/comprar/comprar.service';
import { Producto } from 'src/app/interfaces/producto/producto';
import { ProductosService } from 'src/app/servicios/productos/productos.service';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-resumen',
  templateUrl: './resumen.component.html',
  styleUrls: ['./resumen.component.scss'],
  providers: [provideIcons({matEdit, heroMapPin})]
})
export class ResumenComponent implements OnInit{
  constructor(private router: Router, private auth: Auth, private authService: AuthService, private comprarService: ComprarService, private prdsService: ProductosService, private firestore: Firestore){}
  private usuario!: Usuario;
  private routeSubscription!: Subscription;
  direccion!: Direccion;
  direccionString!: string;
  productos!: Producto[];
  unidades!: number[];
  tamanios: (number | string)[] = [];
  fotosUrls: string[] = [];
  imagenesCargadas: boolean[] = [];
  
  ngOnInit(): void {
    this.authService.getUsuarioId(this.auth.currentUser?.uid!).pipe(first()).subscribe((usuario)=>{
      if(usuario.direcciones && usuario.direcciones.length !== 0){
        this.usuario = usuario;
        this.obtenerDireccion();
        this.obtenerProductos();
      }else{
        this.comprarService.agregarDir = true;
        this.router.navigate(['comprar/checkout/detalles-envio']);
      }
    })
  }

  obtenerDireccion(){
    const direcciones = this.usuario.direcciones;
    for(let direccion of direcciones!){
      if(direccion.direccionPredeterminada){
        this.direccion = direccion //Obtener dirección que tenga por defecto
      }
    }
    if(!this.direccion){
      this.direccion = direcciones![direcciones!.length - 1]; //Obtener la ultima dirección que tenga el usuario
    }
    this.obtenerDireccionString();
  }
  obtenerDireccionString(){
    const arrayModificado: string[] = this.direccion.direccion!.map((element, index) => {
      if (index === 2) {
        return `#${element}`;
      } else if (index === 3) {
        if(element !== ''){
          return `- ${element}`;
        }else{
          return ''
        }
      } else {
        return element
      }
    });

    this.direccionString = arrayModificado.join(' ');
  }

  async obtenerProductos(){
    const referencias$ = this.comprarService.$obtenerReferencias;
    const referencias = await firstValueFrom(referencias$);
    this.tamanios = referencias.map((ref)=>{
      if(typeof ref.tamanioIndex === 'number'){
        return ref.tamanioIndex
      }else{
        return 'false';
      }
    });
    this.productos = await this.comprarService.obtenerProductos(referencias);
    this.tamanios = referencias.map((ref)=>{
      if(typeof ref.tamanioIndex === 'number'){
        return ref.tamanioIndex
      }else{
        return 'false';
      }
    });
    this.unidades = this.usuario.referenciaCompra!.map((referencia)=>{
      return referencia.unidades;
    });
    
    // Cargar fotos de todos los productos
    await this.cargarFotos();
  }

  async cargarFotos() {
    this.fotosUrls = await Promise.all(
      this.productos.map(async (producto) => {
        try {
          const fotos = await this.prdsService.obtenerFotoUno(producto);
          return fotos[0] || '';
        } catch (error) {
          console.error('Error cargando foto:', error);
          if (producto.fotos && producto.fotos.length > 0) {
            return `assets/img/productos/${producto.fotos[0]}.webp`;
          }
          return '';
        }
      })
    );
    // Inicializar el array de imagenes cargadas
    this.imagenesCargadas = new Array(this.productos.length).fill(false);
  }

  onImageLoad(index: number) {
    this.imagenesCargadas[index] = true;
  }

  async cambiarUnidad(accion: string, index: number){
    const userRef = doc(this.firestore, `usuarios/${this.usuario.id}`);
    if(accion === '+'){
      if(this.unidades[index] < 59){
        const referencias = this.usuario.referenciaCompra;
        referencias![index].unidades += 1; 
        this.unidades[index] += 1;
        await setDoc(userRef, {referenciaCompra: referencias}, {merge: true});
      }
    }
    if(accion === '-'){
      if(this.unidades[index] !== 1){
        const referencias = this.usuario.referenciaCompra;
        referencias![index].unidades -= 1; 
        this.unidades[index] -= 1;
        await setDoc(userRef, {referenciaCompra: referencias}, {merge: true})
      }
    }
  }

  cambiarUbicacion(){
    this.router.navigate(['comprar/checkout/cambiar-direccion']);
  }

}
