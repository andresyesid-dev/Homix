import { Component, OnDestroy, OnInit, ViewChild, HostListener } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc, increment, updateDoc, setDoc } from '@angular/fire/firestore';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Producto } from 'src/app/interfaces/producto/producto';
import { Direccion } from 'src/app/interfaces/usuario/subInterfaces/direccion';
import { Usuario, porComprar, referenciaCompra } from 'src/app/interfaces/usuario/usuario';
import { ComprarService } from 'src/app/servicios/comprar/comprar.service';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { ResumenCompraComponent } from './secciones/resumen-compra/resumen-compra.component';
import { provideIcons } from '@ng-icons/core';
import { matCheck } from '@ng-icons/material-icons/baseline';

@Component({
  selector: 'app-comprar',
  templateUrl: './comprar.component.html',
  styleUrls: ['./comprar.component.scss'],
  providers: [provideIcons({matCheck})]
})
export class ComprarComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private auth: Auth,
    private authService: AuthService,
    private comprarService: ComprarService,
    private firestore: Firestore
  ) { }

  private subscription!: Subscription;
  private routerSubscription!: Subscription;
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
  estadoPago: any = null;
  enRutaRespuesta = false; // Nueva propiedad para controlar el layout
  mostrarBotonPaso2 = true; // Controla la visibilidad del botón en el paso 2
  mostrarBotonPaso1 = false;
  
  // Control de pasos para móvil
  pasoActual: string = 'direccion';
  esModoMovil: boolean = false;
  pasos = [
    { numero: 1, id: 'direccion', titulo: 'Dirección de envío', completado: false },
    { numero: 2, id: 'detalles', titulo: 'Detalles de compra', completado: false },
    { numero: 3, id: 'pago', titulo: 'Pago', completado: false }
  ];

  // Referencias a componentes para móvil
  @ViewChild('resumenCompraMovil', { static: false }) resumenCompraMovil!: ResumenCompraComponent;

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    if (this.esModoMovil && this.pasoActual === 'detalles') {
      const scrollPosition = window.pageYOffset + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      
      // Ocultar el botón si el usuario está a 150px o menos del final de la página
      if (pageHeight - scrollPosition <= 150) {
        this.mostrarBotonPaso2 = false;
      } else {
        this.mostrarBotonPaso2 = true;
      }
    } else {
      // Asegurarse de que el botón esté visible en otros pasos/vistas
      this.mostrarBotonPaso2 = true;
    }
  }

  ngOnInit(): void {
    // Detectar modo móvil
    this.detectarModoMovil();
    window.addEventListener('resize', () => this.detectarModoMovil());
    
    // Suscribirse a cambios de ruta para saber en qué paso estamos
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.url;
      console.log('🔄 Detectando cambio de ruta:', url);
      
      // Detectar en qué paso estamos basado en la URL
      if (url.includes('/seleccionar-direccion')) {
        this.pasoActual = 'direccion';
        this.mostrarBotonPaso1 = true;
      } else if (url.includes('/agregar-direccion') || url.includes('/actualizar-direccion')) {
        this.pasoActual = 'direccion';
        this.mostrarBotonPaso1 = false;
      } else if (url.includes('/detalles-compra')) {
        this.pasoActual = 'detalles';
      } else if (url.includes('/pago')) {
        this.pasoActual = 'pago';
      }
      
      console.log('📍 Paso actual detectado:', this.pasoActual);
      
      // Si estamos en /comprar/checkout/response, redirigir a la ruta de respuesta
      if (url.includes('/comprar/checkout/response')) {
        this.enRutaRespuesta = true;
        const estadoPago = this.comprarService.getEstadoPago();
        if (estadoPago) {
          console.log('📊 Detectado estado de pago en ruta de respuesta:', estadoPago);
          this.compraExitosa = true;
        }
      } else {
        this.enRutaRespuesta = false;
      }
    });

    // Escuchar cuando el pago es aprobado para crear la venta
    const pagoAprobadoSub = this.comprarService.pagoAprobado$.subscribe(async (paymentData) => {
      console.log('✅ Pago aprobado recibido en ComprarComponent:', paymentData);
      console.log('📦 Creando venta en Firestore con datos de pago...');
      // Crear la venta en Firestore SOLO si el pago fue aprobado
      await this.comprar(paymentData);
    });
    this.subscription = pagoAprobadoSub;

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
    
    // Guardar el total en el servicio para que detalles-compra pueda acceder
    const total = precioProductos + precioEnvios;
    this.comprarService.setTotalCompra(total);
  }

  /**
   * Valida si el usuario puede procesar la compra
   * Debe tener una dirección seleccionada
   */
  validarPasoCompleto(): boolean {
    // Verificar que hay una dirección seleccionada en el servicio
    const direccion = this.comprarService.getDireccionEnvio();
    
    // El botón se habilita cuando hay una dirección seleccionada
    return !!direccion;
  }

  /**
   * Navega al paso de pago si aún no está ahí, o procesa la compra
   */
  async procesarONavegar(): Promise<void> {
    const direccion = this.comprarService.getDireccionEnvio();
    
    if (!direccion) {
      alert('Por favor selecciona una dirección de envío');
      this.router.navigate(['comprar/checkout/seleccionar-direccion']);
      return;
    }

    // DESKTOP: Comportamiento simplificado y robusto
    if (!this.esModoMovil) {
      console.log('🖥️ DESKTOP: Ejecutando lógica desktop');
      console.log('🖥️ DESKTOP: pasoActual =', this.pasoActual);
      console.log('🖥️ DESKTOP: URL =', this.router.url);
      
      if (this.pasoActual === 'direccion') {
        console.log('🖥️ DESKTOP: Navegando de dirección a detalles-compra');
        this.router.navigate(['comprar/checkout/detalles-compra']);
        return;
      }

      if (this.pasoActual === 'detalles') {
        console.log('🖥️ DESKTOP: Navegando de detalles a pago y abriendo formulario');
        this.router.navigate(['comprar/checkout/pago']).then(() => {
          this.comprarService.iniciarPagoMercadoPago();
        });
        return;
      }

      // Fallback: volver a detalles-compra
      console.log('🖥️ DESKTOP: Fallback - redirigiendo a detalles-compra');
      this.router.navigate(['comprar/checkout/detalles-compra']);
      return;
    }

    // MÓVIL: Lógica de pasos móviles con rutas explícitas
    console.log('📱 MÓVIL: Ejecutando lógica móvil');
    if (this.pasoActual === 'direccion') {
      console.log('📱 MÓVIL: Navegando de seleccionar-dirección a detalles-compra');
      this.router.navigate(['comprar/checkout/detalles-compra']);
      return;
    }

    if (this.pasoActual === 'detalles') {
      console.log('📱 MÓVIL: Navegando de detalles-compra a pago');
      this.router.navigate(['comprar/checkout/pago']);
      return;
    }

    if (this.pasoActual === 'pago') {
      console.log('📱 MÓVIL: Iniciando MercadoPago Bricks');
      this.comprarService.iniciarPagoMercadoPago();
      return;
    }
  }

//-------------------------------------------------------------------------- Crear venta ---------------------------------

  async comprar(paymentData?: any){
    if(!this.cargando){
      this.cargando = true;
      this.usuario = await this.authService.getUsuarioIdPromise(this.auth.currentUser!.uid!);
      
      // Obtener la dirección desde el servicio (la que el usuario seleccionó)
      const direccionSeleccionada = this.comprarService.getDireccionEnvio();
      
      if (!direccionSeleccionada) {
        alert('Por favor selecciona una dirección de envío');
        this.cargando = false;
        this.router.navigate(['comprar/checkout/seleccionar-direccion']);
        return;
      }
      
      if(this.usuario.referenciaCompra && this.usuario.referenciaCompra.length !== 0){
        await this.agruparReferenciasPorVendedor(this.usuario);
        for(let idVendedor in this.grupoReferencias){
          //----- obtener numero de venta y sumarle 1 -----
          const refVenta = doc(this.firestore, 'cookies/informacion');
          
          // Verificar si el documento existe, si no, crearlo
          const docSnapshot = await getDoc(refVenta);
          if (!docSnapshot.exists()) {
            // Crear el documento con el contador inicial
            await setDoc(refVenta, {
              ventas: 0
            });
            console.log('✅ Documento cookies/informacion creado');
          }
          
          // Incrementar el contador de ventas
          await updateDoc(refVenta, {
            ventas: increment(1)
          });
          
          const infoVentasRef = await getDoc(refVenta);
          //----------------------------------------------- definir valores -------
          const referencias = this.grupoReferencias[idVendedor];
          const numVenta = infoVentasRef.data()!;
          
          const venta: any = {
            numVenta: numVenta['ventas'],
            referencias: referencias,
            fechaVenta: new Date(),
            enCamino: false,
            entregado: false,
            idCliente: this.usuario.id!,
            idVendedor: idVendedor,
            datosEnvio: direccionSeleccionada, // Usar la dirección del servicio
            cancelada: false
          };
          
          // Agregar datos del pago de MercadoPago si existen
          if (paymentData) {
            venta.payment_id = paymentData.id;
            venta.payment_status = paymentData.status;
            venta.payment_method = paymentData.payment_method_id;
            venta.transaction_amount = paymentData.transaction_amount;
            console.log('💳 Venta creada con información de pago:', {
              payment_id: paymentData.id,
              status: paymentData.status
            });
          }
          
          await this.comprarService.agregarVenta(venta);
          console.log('✅ Venta registrada en Firestore:', venta);
        }
        
        // Después de procesar todas las ventas
        this.actualizacionExitosa = true;
        
        // Obtener el estado del pago guardado
        this.estadoPago = this.comprarService.getEstadoPago();
        console.log('📊 Estado del pago obtenido:', this.estadoPago);
        
        setTimeout(()=>{
          this.compraExitosa = true;
          console.log('✅ Compra completada exitosamente');
          
          // Solo navegar si no estamos ya en la página de respuesta
          if (!this.router.url.includes('checkout/response')) {
            console.log('🔄 Navegando a página de respuesta');
            this.router.navigate(['comprar/checkout/response']);
          } else {
            console.log('ℹ️ Ya estamos en la página de respuesta, no navegamos');
          }
          
          // Scroll to top para ver el mensaje de éxito
          window.scrollTo(0, 0);
        }, 1350);
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
      
      // Manejar foto: puede venir de fotos[] o ser undefined
      const foto = producto.fotos && producto.fotos.length > 0 ? producto.fotos[0] : '';
      
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

  /**
   * Detecta si estamos en modo móvil
   */
  detectarModoMovil(): void {
    this.esModoMovil = window.innerWidth <= 768;
    
    // Si cambiamos de móvil a desktop mientras estamos en "resumen", 
    // volver al paso de pago para mantener consistencia
    if (!this.esModoMovil && this.pasoActual === 'resumen') {
      this.pasoActual = 'pago';
    }
  }

  /**
   * Verifica si un paso está completado
   */
  pasoCompletado(paso: string): boolean {
    const pasos = ['direccion', 'detalles', 'pago'];
    const indiceActual = pasos.indexOf(this.pasoActual);
    const indicePaso = pasos.indexOf(paso);
    
    return indicePaso < indiceActual;
  }

  /**
   * Obtiene el paso anterior al actual
   */
  obtenerPasoAnterior(): string | null {
    const pasos = ['direccion', 'detalles', 'pago'];
    const indiceActual = pasos.indexOf(this.pasoActual);
    
    if (indiceActual > 0) {
      return pasos[indiceActual - 1];
    }
    
    return null;
  }

  /**
   * Navega al siguiente paso
   */
  siguientePaso(): void {
    if (this.pasoActual === 'direccion') {
      this.pasoActual = 'detalles';
    } else if (this.pasoActual === 'detalles') {
      this.pasoActual = 'pago';
    }
    
    // Scroll al inicio
    window.scrollTo(0, 0);
  }

  /**
   * Obtiene si el botón debe estar habilitado según el paso actual
   */
  obtenerBotonHabilitado(): boolean {
    if (this.pasoActual === 'detalles') {
      return true; // En paso detalles siempre habilitado
    } else if (this.pasoActual === 'pago') {
      return this.validarPasoCompleto(); // En paso pago usar validación normal
    }
    return false;
  }

  /**
   * Obtiene la función correcta a ejecutar según el paso actual
   */
  obtenerAccionProcesar(): () => void {
    // Usar procesarONavegar para manejar navegación de detalles a pago y para confirmar pago
    if (this.pasoActual === 'detalles' || this.pasoActual === 'pago') {
      return () => this.procesarONavegar();
    }
    return () => {};
  }

  /**
   * Navega al paso anterior
   */
  pasoAnterior(): void {
    if (this.pasoActual === 'pago') {
      // Si estamos en paso pago y hay bricks activos, cerrarlos primero
      if (this.resumenCompraMovil) {
        this.resumenCompraMovil.cerrarBricksDesdeMovil();
      }
      this.pasoActual = 'detalles';
    } else if (this.pasoActual === 'detalles') {
      this.pasoActual = 'direccion';
    }
    
    // Scroll al inicio
    window.scrollTo(0, 0);
  }

  /**
   * Navega al siguiente paso en móvil
   */
  siguientePasoMovil(): void {
    if (!this.validarPasoCompleto()) {
      return;
    }

    if (this.pasoActual === 'direccion') {
      this.router.navigate(['comprar/checkout/pago']);
    } else if (this.pasoActual === 'pago') {
      // En móvil, el paso "resumen" es mostrar el componente resumen-compra
      this.pasoActual = 'resumen';
    }
    
    // Scroll al inicio
    window.scrollTo(0, 0);
  }

  /**
   * Navega al paso anterior en móvil
   */
  pasoAnteriorMovil(): void {
    if (this.pasoActual === 'resumen') {
      // Volver a la ruta de pago sin cambiar la URL, solo el estado
      this.pasoActual = 'pago';
    } else if (this.pasoActual === 'pago') {
      this.router.navigate(['comprar/checkout/seleccionar-direccion']);
    }
    
    // Scroll al inicio
    window.scrollTo(0, 0);
  }

  /**
   * Maneja el evento cuando se cierra el formulario de MercadoPago
   * Navega de vuelta a detalles-compra
   */
  onCerrarBricks(): void {
    console.log('🔙 MercadoPago cerrado, navegando a detalles-compra');
    this.router.navigate(['comprar/checkout/detalles-compra']);
  }

  //-------------------------------------
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    this.comprarService.agregarDir = false;
    this.comprarService.agregarDir = false;
  }

}
