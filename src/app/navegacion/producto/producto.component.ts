import { ChangeDetectorRef, Component, OnDestroy, OnInit, SimpleChanges, HostListener, OnChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Subscription, first, firstValueFrom } from 'rxjs';
import { Usuario } from '../../interfaces/usuario/usuario';
import { Producto } from '../../interfaces/producto/producto';
import { provideIcons } from '@ng-icons/core';
import { heroHeart } from '@ng-icons/heroicons/outline';
import { heroHeartSolid } from '@ng-icons/heroicons/solid';
import { matAddShoppingCart } from '@ng-icons/material-icons/baseline';
import { matShoppingCart } from '@ng-icons/material-icons/baseline';
import { heroChevronLeftSolid } from '@ng-icons/heroicons/solid';
import { heroChevronRightSolid } from '@ng-icons/heroicons/solid';
import { ProductosService } from 'src/app/servicios/productos/productos.service';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { ComprarService } from 'src/app/servicios/comprar/comprar.service';
import { Auth } from '@angular/fire/auth';
import { DocumentData, DocumentReference, Firestore, Timestamp, arrayUnion, doc, getDoc, increment, runTransaction, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-producto',
  templateUrl: './producto.component.html',
  styleUrls: ['./producto.component.scss'],
  providers: [provideIcons({heroHeart, heroHeartSolid,matAddShoppingCart,matShoppingCart, heroChevronLeftSolid, heroChevronRightSolid})]
})

export class ProductoComponent implements OnInit{
  constructor(private route: ActivatedRoute,private cd: ChangeDetectorRef, private authService: AuthService, private router: Router, private prdService: ProductosService, private comprarService: ComprarService, private auth: Auth, private firestore: Firestore) {}
  private routerSubscription!: Subscription;
  private productoId!: string;
  producto!: Producto;
  usuarioVendedor!: Usuario; //Proteger datos
  miUsuario!: Usuario; //Proteger datos
  productos!: Producto[];
  fotosProducto: string[][] = []; // Fotos obtenidas de Firebase Storage
  fotosActuales: string[] = []; // Fotos del estilo actual seleccionado

  enFavoritos: boolean = false;
  enCarrito: boolean = false;
  carouselSimilaress: Array<any> = [];

  sombraBool: boolean = false;
  indexFoto = 0;
  sombraOpinion: boolean = false;
  indexOpinion = 0;
  unidades: number = 1;

  productoCargado = false;
  productoPropio!: boolean; productoPropioFixed = false;
  tamanioSelec: [boolean, number] = [false, 0];
  ventas!: string;
  
  anchoPagina: number = window.innerWidth;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.anchoPagina = event.target.innerWidth;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.productoPropioFixed = window.scrollY > 32;
  }

  async ngOnInit() {
    const urlSegments = (this.router.url).split('/');
    const idProducto = urlSegments[2].split('?')[0];
    const producto = await this.obtenerProducto(idProducto);
    this.prdService.obtenerProductosSimilares(producto!.categoria, producto!.id!).then(productos => {this.productos = productos});
    if(producto){
      this.productoPropio = false;
      if(this.auth.currentUser){
        this.authService.getUsuarioId(this.auth.currentUser?.uid!).pipe(first()).subscribe(usuario => {
          if(usuario.registroHistorial){
            this.prdService.agregarHistorial(producto.id!, usuario.id!, usuario.historial!);
          }
          this.miUsuario = usuario;
          this.definirCarrito(producto.id!);
          this.definirFavorito(usuario, producto.id!);
        });
        if(producto.idUsuario == this.auth.currentUser.uid || this.auth.currentUser.uid == '6qIaOVjTEiUFjMEhFfoKCZkCFCZ2' || this.auth.currentUser.uid == 'joEtHq7kc6f4YXBxsFz8RKyopBI2'){
          this.productoPropio = true;
        }else{
          this.agregarVista(producto);
        }
      }else{
        this.agregarVista(producto);
      }
      this.producto = producto;
      this.usuarioVendedor = await this.authService.getUsuarioIdPromise(this.producto.idUsuario!);

      this.productoCargado = true;
      //---------------------------------- Cargado -------
      this.subcription();
    }else{
      this.router.navigate(['']);
    }
  }
  subcription(){
    this.routerSubscription = this.router.events.subscribe(async (event) => {
      this.productoCargado = false;
      if (event instanceof NavigationEnd) {
        this.indexFoto = 0;
        this.indexOpinion = 0;
        const urlSegments = (event.urlAfterRedirects).split('/');
        const idProducto = urlSegments[urlSegments.length - 1];
        const producto = await this.obtenerProducto(idProducto);
        if(producto){
          this.productoPropio = false;
          if(this.auth.currentUser){
            this.authService.getUsuarioId(this.auth.currentUser.uid!).pipe(first()).subscribe(usuario => {
              if(usuario.registroHistorial){
                this.prdService.agregarHistorial(this.producto.id!, usuario.id!, usuario.historial!);
              }
              this.miUsuario = usuario;
              this.definirCarrito(producto.id!);
              this.definirFavorito(usuario, producto.id!);
            });
            if(producto.idUsuario == this.auth.currentUser.uid || this.auth.currentUser.uid == '6qIaOVjTEiUFjMEhFfoKCZkCFCZ2' || this.auth.currentUser.uid == 'joEtHq7kc6f4YXBxsFz8RKyopBI2'){
              this.productoPropio = true;
            }else{
              this.agregarVista(producto);
            }
          }else{
            this.agregarVista(producto);
          }
          this.producto = producto;
          this.productos = [];
          this.tamanioSelec = [false, 0];
          this.anchoPagina = window.innerWidth;
          this.prdService.obtenerProductosSimilares(producto!.categoria, producto!.id!).then(productos => {this.productos = productos});
          this.usuarioVendedor = await this.authService.getUsuarioIdPromise(this.producto.idUsuario!);
          this.productoCargado = true;
          //---------------------------------- Cargado -------
        }else{
          this.router.navigate(['']);
        }
      }
    });
  }
  //-------------
  asignarVentas(ventas: string){
    this.ventas = ventas;
  }

  //-------------------------------------

  async agregarVista(producto: Producto){
    const fechaActual = new Date();
    if(producto.vistas && producto.vistas.length !== 0){
      const timestamp = producto.vistas[producto.vistas.length - 1].fecha;
      const fechaFirestore = new Date(timestamp.seconds * 1000);
      if(this.sonMismoDia(fechaActual, fechaFirestore)){
        await runTransaction(this.firestore, async (transaction) => {
          const vistas = producto.vistas;
          const lastObject = vistas[vistas.length - 1];
          lastObject.cantidad += 1;
      
          transaction.update(doc(this.firestore, `productos/${producto.id}`), { vistas: vistas });
        });
      }else{ //Es un día nuevo y aún no tiene vistas, así que se agrega
        updateDoc(doc(this.firestore, `productos/${producto.id}`), {
          vistas: arrayUnion({
            fecha: new Date(),
            cantidad: 1
          })
        });
      }
    }else{ //Es nuevo, y no tiene vistas
      updateDoc(doc(this.firestore, `productos/${producto.id}`), {
        vistas: arrayUnion({
          fecha: new Date(),
          cantidad: 1
        })
      });
    }
  }

  sonMismoDia(fecha1: Date, fecha2: Date) {
    return fecha1.getFullYear() === fecha2.getFullYear() &&
      fecha1.getMonth() === fecha2.getMonth() &&
      fecha1.getDate() === fecha2.getDate();
  }

  seleccionarColor(index: number){
    // Cambiar a las fotos del color seleccionado
    if (this.fotosProducto && this.fotosProducto.length > index) {
      this.fotosActuales = this.fotosProducto[index];
    }
    this.producto.fotos = this.producto.colores![index].fotos;
  }
  seleccionarEstilo(index: number){
    // Cambiar a las fotos del estilo seleccionado
    if (this.fotosProducto && this.fotosProducto.length > index) {
      this.fotosActuales = this.fotosProducto[index];
    }
    this.producto.fotos = this.producto.estilos![index].fotos;
  }

  //------- definir carrito y favoritos ------

  async definirCarrito(productoId: string){
    const usuarioRef = doc(this.firestore, `usuarios/${this.miUsuario.id}`); //Obtener usuario actualizado. Esto en caso de haber agregado a carrito
    const snapshot = await getDoc(usuarioRef);
    const usuario = snapshot.data() as Usuario;
    if( usuario.carrito){
      const carrito = usuario.carrito.filter(ref => ref.producto.id == productoId);
      if(carrito && carrito.length !== 0){
        this.enCarrito = true;
        if(carrito.length == 2 && typeof carrito[0].tamanioIndex == "number" ){
          this.enCarrito = true;
        }else if(carrito[0].tamanioIndex || carrito[0].tamanioIndex == 0){
          if(carrito[0].tamanioIndex == this.tamanioSelec[1]){
            this.enCarrito = true;
          }else{
            this.enCarrito = false;
          }
        }
      }else{
        this.enCarrito = false;
      }
    }
  }

  definirFavorito(usuario: Usuario, productoId: string){
    if(usuario.favoritos){
      const favorito = usuario.favoritos.find(ref => ref.id === productoId);
      if(favorito){
        this.enFavoritos = true;
      }else{
        this.enFavoritos = false;
      }
    }
  }

  //------------------------------------------

  async obtenerProducto(idProducto: string): Promise<Producto | null> {
    const producto$ = this.prdService.obtenerProductoId(idProducto);
    const producto = await firstValueFrom(producto$);
    if(producto){
      // Obtener fotos desde Firebase Storage
      await this.cargarFotosProducto(producto);
      return producto
    }else{
      return null
    }
  }

  async cargarFotosProducto(producto: Producto): Promise<void> {
    try {
      // Cargar estilos completos con nombre y unidades (si es formato antiguo)
      await this.prdService.cargarEstilosCompletos(producto);
      
      // Obtener las fotos (ya están cargadas en producto.estilos si es formato antiguo)
      if (producto.estilos && Array.isArray(producto.estilos) && producto.estilos[0].fotos) {
        // Formato antiguo: las fotos ya están en los estilos después de cargarEstilosCompletos
        this.fotosProducto = producto.estilos.map(estilo => estilo.fotos);
      } else {
        // Formato nuevo: usar el método original
        this.fotosProducto = await this.prdService.obtenerFotosProducto(producto);
      }
      
      // Inicializar con las fotos del primer estilo
      this.fotosActuales = this.fotosProducto.length > 0 ? this.fotosProducto[0] : [];
    } catch (error) {
      console.error('Error cargando fotos del producto:', error);
      // Fallback a fotos locales si falla
      if (producto.fotos && producto.fotos.length > 0) {
        this.fotosActuales = producto.fotos.map(foto => `assets/img/productos/${foto}.webp`);
        this.fotosProducto = [this.fotosActuales];
      }
    }
  }


//-------------------------- carrito y favoritos ------------------------

  async editarFavorito(){
    if(this.usuarioVendedor){
      if(this.enFavoritos){
        if(this.auth.currentUser){ //Eliminar
          this.enFavoritos = false;
          const usuarioRef = doc(this.firestore, `usuarios/${this.auth.currentUser.uid}`);
          const productoRef = doc(this.firestore, `productos/${this.producto.id}`);
          const snapshot = await getDoc(usuarioRef);
          const usuario = snapshot.data();
          const index = usuario!['favoritos'].findIndex((referencia: DocumentReference<DocumentData>) => referencia.id == productoRef.id);
          usuario!['favoritos'].splice(index, 1);
          this.prdService.eliminarFavorito(this.auth.currentUser.uid, usuario!['favoritos'], productoRef);
        }else{
          this.router.navigate(['cuenta/crear-cuenta']);
        }
      }else{
        if(this.auth.currentUser){ //Agregar
          this.enFavoritos = true;
          this.prdService.agregarFavorito(this.producto.id!, this.auth.currentUser.uid);
        }else{
          this.router.navigate(['cuenta/crear-cuenta']);
        }
      }
    }
  }

//------------------------- carrito

  editarCarrito(){
    if(this.usuarioVendedor){
      if(this.enCarrito){
        this.eliminarCarritoUsuario();
      }else{
        this.agregarCarritoUsuario()
      }
    }
  }
  
  async agregarCarritoUsuario(){
    if(this.auth.currentUser){
      if(this.producto.idUsuario !== this.auth.currentUser.uid){
        this.enCarrito = true;
        if(this.tamanioSelec[0]){ //Verifica si el producto tiene tamaños disponibles
          this.comprarService.agregarReferenciaCarrito(this.producto.id!, this.auth.currentUser.uid, Number(this.unidades), this.tamanioSelec[1] as number);
        }else{  
          this.comprarService.agregarReferenciaCarrito(this.producto.id!, this.auth.currentUser.uid, Number(this.unidades));
        }
      }else{
        //Este es tu producto
      }
    }else{
      this.router.navigate(['cuenta/crear-cuenta']);
    }
  }

  async eliminarCarritoUsuario(){
    if(this.auth.currentUser){
      this.enCarrito = false;

      const usuarioRef = doc(this.firestore, `usuarios/${this.auth.currentUser.uid}`);
      const snapshot = await getDoc(usuarioRef);
      const usuario = snapshot.data() as Usuario;
      const productosEnCarrito = usuario['carrito']?.filter((referencia)=>referencia.producto.id == this.producto.id);
      if(productosEnCarrito!.length == 2 || typeof productosEnCarrito![0].tamanioIndex == 'number' ){
        const index = usuario['carrito']?.findIndex((referencia)=>referencia.producto.id == this.producto.id && referencia.tamanioIndex == this.tamanioSelec[1]);
        usuario['carrito']!.splice(index!, 1);
      }else{
        const index = usuario['carrito']?.findIndex((referencia)=>referencia.producto.id == this.producto.id);
        usuario['carrito']!.splice(index!, 1);
      }
      this.prdService.eliminarCarrito(this.auth.currentUser.uid, usuario['carrito']);
    }else{
      this.router.navigate(['cuenta/crear-cuenta']);
    }
  }
  
  


//----------------- Mostrar fotos ------------------------------------------------------
  nuevoDatoHijoSombra(newDato: boolean){ //Al recibir nuevo dato de componente Hijo
    this.sombraBool = newDato;
  }

  mostrarOpinionFoto(index: number){
    this.sombraOpinion = true;
    this.indexOpinion = index;
  };

  nuevoIndex(numero: number){ //Al recibir nuevo dato de componente Hijo
    this.indexFoto = numero;
  }

  fotoNex() {
    const totalFotos = this.fotosActuales.length || this.producto.fotos.length;
    this.indexFoto = (this.indexFoto + 1) % totalFotos;
  }

  fotoPrev() {
    const totalFotos = this.fotosActuales.length || this.producto.fotos.length;
    this.indexFoto = (this.indexFoto - 1 + totalFotos) % totalFotos;
  }

  @HostListener('document:keydown', ['$event'])
  miFuncionPersonalizada(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' && this.sombraBool === true) {
      this.fotoPrev();
    }else if (event.key === 'ArrowRight' && this.sombraBool === true){
      this.fotoNex()
    }
  }

  ngOnDestroy() {
    if(this.routerSubscription){
      this.routerSubscription.unsubscribe();
    }
  }
}
