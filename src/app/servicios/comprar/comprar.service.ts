import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, arrayUnion, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Direccion } from 'src/app/interfaces/usuario/subInterfaces/direccion';
import { AuthService } from '../usuarios/auth.service';
import { Observable, map } from 'rxjs';
import { Usuario, porComprar, referenciaCompra } from 'src/app/interfaces/usuario/usuario';
import { Producto } from 'src/app/interfaces/producto/producto';
import { Venta } from 'src/app/interfaces/venta';
import { MercadoPagoPaymentData, MercadoPagoPaymentResponse } from 'src/app/interfaces/mercadopago';
import { Functions, httpsCallable } from '@angular/fire/functions';
@Injectable({
  providedIn: 'root'
})
export class ComprarService {
  constructor(
    private firestore: Firestore, 
    private auth: Auth, 
    private authService: AuthService,
    private functions: Functions
  ){}
  agregarDir = false;
  modificarDir = false;
  direccionIndex!: number;

  // Variables para el flujo de compra
  private productoCompra: Producto | null = null;
  private unidadesCompra: number = 1;
  private tamanioSeleccionado: number = 0;

  get $obtenerReferencias(): Observable<referenciaCompra[]>{
    return this.authService.getUsuarioId(this.auth.currentUser?.uid!).pipe(
      map(usuario => usuario.referenciaCompra!)
    );
  }

  get $obtenerCarrito(): Observable<referenciaCompra[]>{
    return this.authService.getUsuarioId(this.auth.currentUser?.uid!).pipe(
      map(usuario => usuario.carrito!)
    );
  }

  get $obtenerGuardado(): Observable<referenciaCompra[]>{
    return this.authService.getUsuarioId(this.auth.currentUser?.uid!).pipe(
      map(usuario => usuario.guardados!)
    );
  }

  // Métodos para manejar el flujo de compra
  setProductoCompra(producto: Producto, unidades: number, tamanioSelec: number = 0): void {
    this.productoCompra = producto;
    this.unidadesCompra = unidades;
    this.tamanioSeleccionado = tamanioSelec;
  }

  getProductoCompra(): { producto: Producto | null, unidades: number, tamanioSelec: number } {
    return {
      producto: this.productoCompra,
      unidades: this.unidadesCompra,
      tamanioSelec: this.tamanioSeleccionado
    };
  }

  /**
   * Construye la ruta dentro de assets para una foto de producto cuando solo se guarda el identificador base.
   * Si la foto ya parece ser una URL absoluta o ruta assets válida, se retorna sin cambios.
   */
  buildRutaFotoProducto(foto: string | undefined | null): string {
    if(!foto){
      return 'assets/img/productos/producto-default.png';
    }
    if(/^https?:\/\//i.test(foto) || /^data:/i.test(foto)){
      return foto;
    }
    if(/^assets\//.test(foto)){
      return foto;
    }
    // Si la cadena ya trae extensión
    if(/\.(png|jpg|jpeg|webp|gif|svg)$/i.test(foto)){
      return `assets/img/productos/${foto}`;
    }
    // Agregar .png por convención
    return `assets/img/productos/${foto}.png`;
  }

  clearProductoCompra(): void {
    this.productoCompra = null;
    this.unidadesCompra = 1;
    this.tamanioSeleccionado = 0;
  }
  
  /**
   * Prepara el flujo de "Comprar ahora":
   * 1. Guarda en memoria el producto (para render inmediato en checkout)
   * 2. Persiste referenciaCompra en Firestore (fuente de verdad para el resto del flujo)
   * Evita condición de carrera donde checkout se monta antes de que Firestore propague la referencia.
   */
  async prepararCompraRapida(producto: Producto, unidades: number, tamanioSelec: number = 0): Promise<void> {
    if(!producto?.id){
      throw new Error('Producto inválido: falta ID');
    }
    if(!this.auth.currentUser){
      throw new Error('Usuario no autenticado');
    }
    // Guardar en memoria inmediatamente
    this.setProductoCompra(producto, unidades, tamanioSelec);
    // Persistir en Firestore (sobrescribe compra rápida anterior)
    await this.agregarReferenciaCompra(
      producto.id,
      this.auth.currentUser.uid,
      unidades,
      (producto.tamanios && producto.tamanios.length > 0) ? tamanioSelec : undefined
    );
  }
//-----------------------------------------
  async agregarReferenciaCompra(idProducto: string, idUsuario: string, unidades: number, tamanioI?: number): Promise<void>{
    const productoRef = doc(this.firestore, '/productos/' + idProducto);
    const usuarioRef = doc(this.firestore, '/usuarios/' + idUsuario);
    if(typeof tamanioI == 'number'){
      await updateDoc(usuarioRef, {
        referenciaCompra: [{
          producto: productoRef,
          unidades: unidades,
          tamanioIndex: tamanioI
        }]
      })
    }else{
      await updateDoc(usuarioRef, {
        referenciaCompra: [{
          producto: productoRef,
          unidades: unidades
        }]
      })
    }
  }
  async agregarReferenciaCarritoCompra(referencias: referenciaCompra[], idUsuario: string): Promise<void>{
    const usuarioRef = doc(this.firestore, '/usuarios/' + idUsuario);
    await updateDoc(usuarioRef, {
      referenciaCompra: referencias
    })
  }

  async agregarReferenciaCarrito(idProducto: string, idUsuario: string, unidades: number, tamanioI?: number): Promise<void>{
    const productoRef = doc(this.firestore, '/productos/' + idProducto);
    const usuarioRef = doc(this.firestore, '/usuarios/' + idUsuario);
    console.log(tamanioI);
    if(typeof tamanioI == 'number'){
      await updateDoc(usuarioRef, {
        carrito: arrayUnion({
          producto: productoRef,
          unidades: unidades,
          tamanioIndex: tamanioI
        })
      })
    }else{
      await updateDoc(usuarioRef, {
        carrito: arrayUnion({
          producto: productoRef,
          unidades: unidades
        })
      })
    }
  }
  async agregarReferenciaGuardado(idProducto: string, idUsuario: string, unidades: number, tamanioI?: number): Promise<void>{
    const productoRef = doc(this.firestore, '/productos/' + idProducto);
    const usuarioRef = doc(this.firestore, '/usuarios/' + idUsuario);
    if(typeof tamanioI == 'number'){
      await updateDoc(usuarioRef, {
        guardados: arrayUnion({
          producto: productoRef,
          unidades: unidades,
          tamanioIndex: tamanioI
        })
      })
    }else{
      await updateDoc(usuarioRef, {
        guardados: arrayUnion({
          producto: productoRef,
          unidades: unidades
        })
      })
    }
  }

//---------------------
  async eliminarReferenciaCarrito(usuario: Usuario, index: number): Promise<void>{
    const usuarioRef = doc(this.firestore, '/usuarios/' + usuario.id);
    if(usuario.carrito){
      const carrito = usuario.carrito;
      carrito.splice(index, 1);
      await setDoc(usuarioRef, {carrito: carrito}, {merge: true});
    }
  }
  async eliminarReferenciaGuardado(usuario: Usuario, index: number): Promise<void>{
    const usuarioRef = doc(this.firestore, '/usuarios/' + usuario.id);
    if(usuario.guardados){
      const guardados = usuario.guardados;
      guardados.splice(index, 1);
      await setDoc(usuarioRef, {guardados: guardados}, {merge: true});
    }
  }

//--------------------
  async obtenerProductos(referencias: referenciaCompra[]): Promise<Producto[]>{
    const promises = referencias.map(async (referencia) => {
      const doc = await getDoc(referencia.producto);
      const producto = doc.data() as Producto;
      producto.id = doc.id;
      return producto;
    });
  
    const productos = await Promise.all(promises);
    return productos;
  } 

//------------------------------------------------------------------------------ Direcciones -----------

  async agregarDireccion(usuario: Usuario, direccion: Direccion): Promise<void>{
    const usuarioRef = doc(this.firestore, '/usuarios/' + usuario.id);
    if(direccion.direccionPredeterminada){
      if(usuario.direcciones){
        const direcciones = usuario.direcciones;
        for(let dir of direcciones){
          dir.direccionPredeterminada = false;
        }
        await setDoc(usuarioRef, {direcciones: direcciones}, {merge: true})
      }
      await updateDoc(usuarioRef, {
        direcciones: arrayUnion(direccion)
      });
    }else{
      await updateDoc(usuarioRef, {
        direcciones: arrayUnion(direccion)
      });
    }
  }

  async modificarDireccion(usuario: Usuario, direccion: Direccion): Promise<void>{
    const usuarioRef = doc(this.firestore, '/usuarios/' + usuario.id);
    if(usuario.direcciones){
        const direcciones = usuario.direcciones;
        for(let dir of direcciones){
          dir.direccionPredeterminada = false;
        }
        direcciones[this.direccionIndex] = direccion;
        await setDoc(usuarioRef, {direcciones: direcciones}, {merge: true});
    }
  }

  async seleccionarDireccion(usuario: Usuario, direccion: Direccion, index: number): Promise<void>{
    const usuarioRef = doc(this.firestore, '/usuarios/' + usuario.id);

    if(usuario.direcciones){
        const direcciones = usuario.direcciones;
        for(let dir of direcciones){
          dir.direccionPredeterminada = false;
        }
        direccion.direccionPredeterminada = true;
        direcciones[index] = direccion;
        await setDoc(usuarioRef, {direcciones: direcciones}, {merge: true});
    }
  }

  async eliminarDireccion(usuario: Usuario, index: number): Promise<void>{
    const usuarioRef = doc(this.firestore, '/usuarios/' + usuario.id);
    if(usuario.direcciones){
        const direcciones = usuario.direcciones;
        direcciones.splice(index, 1);
        await setDoc(usuarioRef, {direcciones: direcciones}, {merge: true});
    }
  }

  //----------------- Agregar venta ---------

  async agregarVenta(venta: Venta){
    try {
      const clienteRef = doc(this.firestore, `usuarios/${venta.idCliente}`);
      const vendedorRef = doc(this.firestore, `usuarios/${venta.idVendedor}`);
      await setDoc(doc(this.firestore, `ventas/${venta.numVenta}`), venta);
      const ventaRef = doc(this.firestore, `ventas/${venta.numVenta}`);
      await updateDoc(vendedorRef, {
        ventas: arrayUnion(ventaRef)
      })
      await updateDoc(clienteRef, {
        compras: arrayUnion(ventaRef)
      })
      if(venta.referencias.length !== 1){
        await updateDoc(clienteRef, {
          carrito: []
        })
      }
      //--- agregar chat
      const chat = {
        bloqueoCliente: false,
        bloqueoVendedor: false
      }
      await setDoc(doc(this.firestore, `chats/${venta.numVenta}`), chat);
    } catch (error) {
      console.error("ERROR",error);
    }
  }

  //----------------- MercadoPago Integration ---------

  /**
   * Procesa un pago con MercadoPago usando la función de Firebase
   */
  async procesarPagoMercadoPago(paymentData: MercadoPagoPaymentData): Promise<MercadoPagoPaymentResponse> {
    try {
      const crearPago = httpsCallable(this.functions, 'crearPagoMercadoPago');
      const response = await crearPago(paymentData);
      return response.data as MercadoPagoPaymentResponse;
    } catch (error: any) {
      console.error('Error procesando pago:', error);
      throw new Error(error.message || 'Error al procesar el pago');
    }
  }

  /**
   * Calcula el total de una compra incluyendo envío
   */
  calcularTotalCompra(producto: Producto, unidades: number, tamanioIndex?: number): number {
    let precioProducto: number;
    
    if (producto.tamanios && typeof tamanioIndex === 'number') {
      precioProducto = producto.tamanios[tamanioIndex].precio;
    } else {
      precioProducto = producto.precio;
    }
    
    const subtotal = precioProducto * unidades;
    const costoEnvio = producto.envioGratis ? 0 : (producto.precioEnvio || 0);
    
    return subtotal + costoEnvio;
  }

  /**
   * Inicializa MercadoPago SDK
   */
  async inicializarMercadoPago(publicKey: string): Promise<void> {
    console.log('🔑 Inicializando MercadoPago con clave:', publicKey);
    
    if (typeof window === 'undefined') {
      throw new Error('Window no está disponible');
    }

    if (!publicKey || publicKey === 'TEST-your-public-key-here') {
      throw new Error('Clave pública de MercadoPago no configurada correctamente');
    }

    if (!window.MercadoPago) {
      console.log('📦 Cargando SDK de MercadoPago...');
      // Cargar el SDK si no está cargado
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.onload = () => {
          try {
            // Inicializar MercadoPago correctamente
            window.MercadoPago = new (window as any).MercadoPago(publicKey);
            console.log('✅ MercadoPago SDK cargado e inicializado con clave:', publicKey);
            resolve();
          } catch (error: any) {
            console.error('❌ Error inicializando MercadoPago:', error);
            reject(new Error('Error inicializando MercadoPago: ' + error.message));
          }
        };
        script.onerror = () => {
          reject(new Error('Error cargando el SDK de MercadoPago'));
        };
        document.head.appendChild(script);
      });
    } else {
      try {
        // Re-inicializar con la nueva clave pública
        window.MercadoPago = new (window as any).MercadoPago(publicKey);
        console.log('✅ MercadoPago re-inicializado con clave:', publicKey);
        return Promise.resolve();
      } catch (error: any) {
        console.error('❌ Error re-inicializando MercadoPago:', error);
        return Promise.reject(new Error('Error re-inicializando MercadoPago: ' + error.message));
      }
    }
  }

  /**
   * Método completo para procesar el pago en la página de checkout
   */
  async procesarPagoCompleto(datosPago: any): Promise<MercadoPagoPaymentResponse> {
    try {
      // Construir los datos para MercadoPago
      const paymentData: MercadoPagoPaymentData = {
        token: datosPago.datosPago.token,
        amount: datosPago.total,
        description: `${datosPago.producto.nombre} - ${datosPago.unidades} unidades`,
        installments: datosPago.datosPago.installments || 1,
        payment_method_id: datosPago.datosPago.payment_method_id,
        payer: {
          email: datosPago.datosPago.payer.email,
          identification: datosPago.datosPago.payer.identification ? {
            type: datosPago.datosPago.payer.identification.type || 'CC',
            number: datosPago.datosPago.payer.identification.number
          } : undefined
        }
      };

      // Procesar el pago usando el método existente
      const resultado = await this.procesarPagoMercadoPago(paymentData);
      
      console.log('✅ Pago procesado exitosamente:', resultado);
      return resultado;
      
    } catch (error: any) {
      console.error('❌ Error procesando pago completo:', error);
      throw new Error(error.message || 'Error al procesar el pago completo');
    }
  }

}
