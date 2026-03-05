import { Component, OnDestroy, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc, increment, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Subscription} from 'rxjs';
import { Producto } from 'src/app/interfaces/producto/producto';
import { Direccion } from 'src/app/interfaces/usuario/subInterfaces/direccion';
import { Usuario, porComprar, referenciaCompra } from 'src/app/interfaces/usuario/usuario';
import { ComprarService } from 'src/app/servicios/comprar/comprar.service';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { provideIcons } from '@ng-icons/core';
import { matCheck } from '@ng-icons/material-icons/baseline';

@Component({
  selector: 'app-comprar',
  templateUrl: './comprar.component.html',
  styleUrls: ['./comprar.component.scss'],
  providers: [provideIcons({matCheck})]
})
export class ComprarComponent implements OnInit, OnDestroy{
  constructor(private router: Router, private auth: Auth, private authService: AuthService, private comprarService: ComprarService, private firestore: Firestore){}
  private subscription!: Subscription;
  usuario!: Usuario;
  productosLenght!: number;
  productos: Producto[] = [];
  precioProductos!: number;
  precioEnvios!: number;
  grupoReferencias: { [idUsuario: string]: porComprar[] } = {};
  tamanios: (number | string)[] = [];
  cargando = false;
  actualizacionExitosa = false;
  compraExitosa = false;

  ngOnInit(): void {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        const usuario = await this.authService.getUsuarioIdPromise(user.uid);
        if(!this.cargando){
          this.usuario = usuario;
          if(usuario.referenciaCompra && usuario.referenciaCompra.length !== 0){
            this.obtenerProductos();
          }else{
            // Posible condición de carrera: referencia aún no sincronizada
            const memoria = this.comprarService.getProductoCompra();
            if(memoria.producto){
              setTimeout(async ()=>{
                const refrescado = await this.authService.getUsuarioIdPromise(user.uid);
                if(refrescado.referenciaCompra && refrescado.referenciaCompra.length !== 0){
                  this.usuario = refrescado;
                  this.obtenerProductos();
                }else{
                  this.router.navigate(['']);
                }
              }, 350);
            }else{
              this.router.navigate(['']);
            }
          }
        }
      } else {
        this.router.navigate(['cuenta/iniciar-sesion']);
      }
    });
  }

  async obtenerProductos(){
    if(this.usuario.referenciaCompra){
      const productosRef = await Promise.all(this.usuario?.referenciaCompra.map((ref:referenciaCompra) => getDoc(ref.producto)));
      productosRef.forEach((productSnapshot, index) => {
        const prd = productSnapshot.data() as Producto;
        prd.id = productSnapshot.id;
        this.productos.push(prd);
      });
      this.subscription = this.comprarService.$obtenerReferencias.subscribe(async (referencias)=>{
        this.tamanios = referencias.map((ref)=>{
          if(typeof ref.tamanioIndex === 'number'){
            return ref.tamanioIndex
          }else{
            return 'false';
          }
        });
        this.obtenerPrecios(referencias);
        let productosLenght = 0;
        for(let referencia of referencias){
          productosLenght += referencia.unidades;
        }
        this.productosLenght = productosLenght;
        this.productos = await this.comprarService.obtenerProductos(referencias);
      });
    }
  }

  obtenerPrecios(referencias: referenciaCompra[]){
    let precioProductos = 0;
    let precioEnvios = 0;
    if(this.productosLenght == 1){
      if(typeof this.tamanios[0] == 'number'){
        precioProductos = this.productos[0].tamanios![this.tamanios[0]].precio;
      }else{
        precioProductos = this.productos[0].precio!;
      }
      if(!this.productos[0].envioGratis){
        precioEnvios = this.productos[0].precioEnvio!;
      }
    }else{
      for (const [index, producto] of this.productos.entries()) {
        if(typeof this.tamanios[index] == 'number'){
          precioProductos = producto.tamanios![this.tamanios[index] as number].precio * referencias[index].unidades;
        }else{
          precioProductos += producto.precio! * referencias[index].unidades;
        }
        if(!producto.envioGratis){
          precioEnvios += producto.precioEnvio!;
        }else{
          precioEnvios += 0;
        }
      }
    }
    this.precioProductos = precioProductos;
    this.precioEnvios = precioEnvios;
  }

//-------------------------------------------------------------------------- Crear venta ---------------------------------

  async comprar(){
    if(!this.cargando){
      this.cargando = true;
      this.usuario = await this.authService.getUsuarioIdPromise(this.auth.currentUser!.uid!);
      if(this.usuario.referenciaCompra && this.usuario.referenciaCompra.length !== 0){
        await this.agruparReferenciasPorVendedor(this.usuario);
        for(let idVendedor in this.grupoReferencias){
          //----- obtener numero de venta y sumarle 1 -----
          const refVenta = doc(this.firestore, 'cookies/informacion');
          await updateDoc(refVenta, {
            ventas: increment(1)
          });
          const infoVentasRef = await getDoc(refVenta);
          const direcciones = this.usuario.direcciones;
          //----------------------------------------------- definir valores -------
          const referencias = this.grupoReferencias[idVendedor];
          const numVenta = infoVentasRef.data()!;
          let direccion!: Direccion;
          for(let dir of direcciones!){
            if(dir.direccionPredeterminada){
              direccion = dir //Obtener dirección que tenga por defecto
            }
          }
          const venta = {
            numVenta: numVenta['ventas'],
            referencias: referencias,
            fechaVenta: new Date(),
            enCamino: false,
            entregado: false,
            idCliente: this.usuario.id!,
            idVendedor: idVendedor,
            datosEnvio: direccion,
            cancelada: false
          }
          await this.comprarService.agregarVenta(venta);
          this.actualizacionExitosa = true;
          setTimeout(()=>{
            this.compraExitosa = true;
          },1350)
        }
      }
    }
  }
  
  async agruparReferenciasPorVendedor(usuario: Usuario): Promise<void>{
    const referenciasCompra = await this.convertirReferenciasACompra(usuario.referenciaCompra!);
    const productosSnapshot = await Promise.all(referenciasCompra.map(async (ref: porComprar) => {
      return await getDoc(doc(this.firestore, `productos/${ref.idProducto}`))
    })); //--Obtener referencias totales

    productosSnapshot.forEach((productoSnapshot, index) => {
      const prd = productoSnapshot.data() as Producto;
      const idVendedor = prd.idUsuario;

      if (!this.grupoReferencias[idVendedor!]) { //Se agrega el id del producto de la referencia a grupoReferencias si aún no existe. Si ya existe, agrega la referencia al id.
        this.grupoReferencias[idVendedor!] = [];
      }

      this.grupoReferencias[idVendedor!].push(referenciasCompra[index]);
    });
  }

  async convertirReferenciasACompra(referencias: referenciaCompra[]): Promise<porComprar[]>{
    return await Promise.all(referencias!.map( async(referencia: referenciaCompra) => {
      const productoSnapshot = await getDoc(referencia.producto);
      const producto = productoSnapshot.data() as Producto;
      await updateDoc(referencia.producto, {ventas: increment(1)});
      const foto = producto.fotos[0];
      return {
        idProducto: referencia.producto.id,
        tituloProducto: producto.nombre,
        precioProducto: producto.precio,
        foto: foto,
        unidades: referencia.unidades,
        envioGratis: producto.envioGratis,
        precioEnvio: producto.precioEnvio,
        gramosTamanio: typeof referencia.tamanioIndex == 'number' ? producto.tamanios![referencia.tamanioIndex].gramos : 'false'
      } as porComprar
    }));
  }

  navegar(ruta: any[]){
    this.router.navigate(ruta);
    window.scroll(0,0) 
  }
  //-------------------------------------
  ngOnDestroy(): void {
    if(this.subscription){
      this.subscription.unsubscribe();
    }
    this.comprarService.agregarDir = false;
    this.comprarService.agregarDir = false;
  }
  
}
