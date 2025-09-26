import { Component, EventEmitter, HostListener, Input, NgZone, OnChanges,OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Producto } from '../../../../interfaces/producto/producto';

import { provideIcons } from '@ng-icons/core';
import { matStarRound } from '@ng-icons/material-icons/round';
import { ionLogoWhatsapp } from '@ng-icons/ionicons';
import { heroTruck } from '@ng-icons/heroicons/outline';
import { matGppGoodOutline } from '@ng-icons/material-icons/outline';
import { heroXMark } from '@ng-icons/heroicons/outline';
import { heroCheckBadge } from '@ng-icons/heroicons/outline';
import { heroChevronRight } from '@ng-icons/heroicons/outline';
import { ComprarService } from 'src/app/servicios/comprar/comprar.service';
import { Auth } from '@angular/fire/auth';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { DocumentData, DocumentReference, Firestore, doc, getDoc } from '@angular/fire/firestore';
import { first } from 'rxjs';
import { MercadoPagoPaymentData, MercadoPagoBrickConfig } from 'src/app/interfaces/mercadopago';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-datos-producto',
  templateUrl: './datos-producto.component.html',
  styleUrls: ['./datos-producto.component.scss'],
  providers: [provideIcons({matStarRound, heroTruck, matGppGoodOutline, heroXMark, heroCheckBadge, heroChevronRight, ionLogoWhatsapp})]
})
export class DatosProductoComponent implements OnInit,OnChanges{
  constructor(private zone: NgZone, private router: Router, private comprarService: ComprarService, private auth: Auth, private authService: AuthService, private firestore: Firestore){}
  @Input() producto!: Producto;
  @Output() ventasHechas = new EventEmitter<string>();
  @Output() unidadeS = new EventEmitter<number>();
  @Output() seleccionarColr = new EventEmitter<number>();
  @Output() seleccionarEstl = new EventEmitter<number>();
  @Input() productoCargado!: boolean;
  entrega: string = '';

  unidades: number = 1;
  unaUnidad = true;

  vendidos!: string;

  productoPropio!: boolean;
  tamanioSelec = 0;

  anchoPagina: number = window.innerWidth;

  // MercadoPago properties
  mostrarModalPago = false;
  procestandoPago = false;
  pagoCompletado = false;
  errorPago: string | null = null;
  brickController: any = null;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.anchoPagina = event.target.innerWidth;
  }

  ngOnInit(): void {
    this.fechaEntregas();
  }
  

  fechaEntregas(){
    let hoy = new Date();
    let meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    let fechaUno = new Date();
    let fechaDos = new Date();
    fechaUno.setDate(hoy.getDate() + 1);
    fechaDos.setDate(hoy.getDate() + 2);
    if(fechaUno.getMonth == fechaDos.getMonth){ //Mañana y pasado mañana, siguen siendo en el mismo mes
      this.entrega = `${fechaUno.getDate()} y ${fechaDos.getDate()} de ${meses[fechaDos.getMonth()]}`;
    }else{
      this.entrega = `${fechaUno.getDate()} de ${meses[fechaUno.getMonth()]} y  el ${fechaDos.getDate()} de ${meses[fechaDos.getMonth()]}`;
    }
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['producto'] && changes['producto'].currentValue) {
      this.vendidos = this.calcularVentas(this.producto.ventas);
      this.ventasHechas.emit(this.vendidos);
      this.unidades= 1;
      this.productoPropio = false;
      this.tamanioSelec = 0;
      if(this.auth.currentUser){
        if(this.producto.idUsuario == this.auth.currentUser.uid){
          this.productoPropio = true;
        }
      }
    }
    setTimeout(()=>{
      const select: HTMLSelectElement | null = document.querySelector('#unidades');
      if(select){
        select!.value = '1';
      }
    })
    this.unaUnidad = true;
  }

  calcularVentas(ventas: number): string {
    if(ventas == 0){
      return "nuevo producto"
    }else if(ventas == 1){
      return `${ventas} vendido`;
    }else{
      return `${ventas} vendidos`;
    }
    //if (ventas <= 9 || ventas % 10 === 0 || ventas % 50 === 0 || ventas % 100 === 0) {
    //  if(ventas == 0){
    //    return "nuevo producto"
    //  }else if(ventas == 1){
    //    return `${ventas} vendido`;
    //  }else{
    //    return `${ventas} vendidos`;
    //  }
    //} else if (ventas < 100) {
    //  return `+ ${Math.floor(ventas / 10) * 10} vendidos`;
    //} else if (ventas < 1000) {
    //  return `+ ${Math.floor(ventas / 50) * 50} vendidos`;
    //} else {
    //  return `+ ${Math.floor(ventas / 100) * 100} vendidos`;
    //}
  }

//------------------------------------------------------
  saboresBatidos: any = {
    vainilla: 'prod/0MDi2sGNF4mLVTzaQJpD',
    fresa: 'prod/2iUqgXkQd7Ya7szCNKtB',
    cookiesandcream: 'prod/2C225aI5Lf0lC307TGVC',
    canelayespecias: 'prod/BCkcBetjBHdoLrCZPsrI',
    cafelatte: 'prod/EcCgFOLi5SR2Vdots6kb',
    chocoavellana: 'prod/LrIE3BECxcRf6KbqmLbO',
    mango: 'prod/kAJJXZYZOM5DeSAShNgg',
    bananacaramelo: 'prod/WLCQWkTHjcYboCMPb3M2',
    dulcedelechecremoso: 'prod/vqb0HjLakVjyyswSF599'
  }
  saboresGuarana: any = {
    guarana: 'prod/yNGbGRHFIzdokqnuQo0t',
    guaranatropical: 'prod/EtnWcoqdm9543iUDEAFg'
  }
  saboresAloe: any = {
    original: 'prod/QIR7CN8x6OmKIe65kTrw',
    mandarina: 'prod/wgx6IvVRTNJqykmiG71h',
    mango: 'prod/uY2mwoVkSh7f71EEOv4p'
  }
  saboresBebidas: any = {
    original: 'prod/3Ar8IiBQug4E6EhkNGc6',
    limon: 'prod/9PWVOmf0UsBlsxFG1Foq',
    frambuesa: 'prod/Whpm7t5mCj2Zna5MsNNv',
    durazno: 'prod/rjXwvvbEFnUyfRZwf8RT',
    chai: 'prod/h2nSCuYoskY9IKjVkZ7q'
  }
  saboresKit: any = {
    vainilla: 'prod/gJnZ6IfKpac9WP4OkHmi',
    fresa: 'prod/t4LDF385McKnc9BLQpkz',
    cookiesandcream: 'prod/1XAfXaHYm5FEmUs29jJ3',
    canelayespecias: 'prod/mlQtiDL8O7FFWNfTmM1t',
    cafelatte: 'prod/UUVyc112LtywbskmgmVZ',
    chocoavellana: 'prod/Lm7RExnUfQpxpvmHHlgU',
    mango: 'prod/YXCd4C1zajChAvBdtkUM',
    bananacaramelo: 'prod/DHbjqfffiX7Hnpl3i4Jo',
    dulcedelechecremoso: 'prod/kfc3oui1335AH8UYGXON'
  }
  

  async seleccionarColor(htmlSelect: any){
    let index = htmlSelect.target.value;
    if(this.producto.colores && this.producto.colores.length !== 1){
      this.seleccionarColr.emit(index);
      this.producto.botonCompra!.id = this.producto.colores[index].idBoton;
      this.producto.botonCompra!.idDocumento = this.producto.colores[index].idBotonDocumento;
      this.producto.botonCompra!.variante = this.producto.colores[index].variante;
    }
  }

  async seleccionarEstilo(htmlSelect: any){
    let index = htmlSelect.target.value;
    if(this.producto.estilos && this.producto.estilos.length !== 1){
      this.seleccionarEstl.emit(index);
      this.producto.botonCompra!.id = this.producto.estilos[index].idBoton;
      this.producto.botonCompra!.idDocumento = this.producto.estilos[index].idBotonDocumento;
      this.producto.botonCompra!.variante = this.producto.estilos[index].variante;
    }
  }

  cambiarUnidades(event: any) {
    this.unidades = event.target.value;
    this.unaUnidad = event.target.value == 1;
    this.unidadeS.emit(this.unidades);
  }

  async comprar(){
    console.log('🚀 Botón Comprar presionado');
    console.log('Estado:', {
      productoCargado: this.productoCargado,
      producto: !!this.producto,
      currentUser: !!this.auth.currentUser,
      productoPropio: this.productoPropio
    });

    if(this.producto){ //verificar que el producto ah cargado para no enviar datos undefined
      if(this.auth.currentUser){
        if(this.productoPropio){
          console.log('❌ Este es tu propio producto');
          alert('Este es tu propio producto');
        }else{
          console.log('✅ Iniciando proceso de pago...');
          // Mostrar modal de pago con MercadoPago Bricks
          await this.iniciarProcesoPago();
        }
      }else{
        console.log('❌ Usuario no autenticado, redirigiendo...');
        this.router.navigate(['cuenta/crear-cuenta']);
      }
    } else {
      console.log('❌ Producto no cargado');
      alert('El producto aún no está cargado. Espera un momento.');
    }
  }

  async iniciarProcesoPago() {
    try {
      console.log('💳 Iniciando proceso de pago...');
      this.mostrarModalPago = true;
      this.errorPago = null;
      
      console.log('🔧 Inicializando MercadoPago SDK...');
      // Inicializar MercadoPago
      await this.comprarService.inicializarMercadoPago(environment.mercadoPago.publicKey);
      
      console.log('🎯 Configurando brick de pago...');
      // Configurar el brick de pago
      await this.configurarBrickPago();
      console.log('✅ Modal de pago configurado correctamente');
    } catch (error: any) {
      console.error('❌ Error inicializando pago:', error);
      this.errorPago = 'Error al inicializar el sistema de pago: ' + error.message;
      this.mostrarModalPago = false;
      alert('Error al inicializar el pago: ' + error.message);
    }
  }

  async configurarBrickPago() {
    const total = this.comprarService.calcularTotalCompra(this.producto, this.unidades, this.tamanioSelec);
    
    console.log('💰 Total calculado:', total);
    
    // Verificar que el contenedor existe
    const container = document.getElementById('brick-container');
    if (!container) {
      throw new Error('Contenedor brick-container no encontrado');
    }
    
    // Limpiar cualquier brick anterior
    container.innerHTML = '';
    
    const brickConfig = {
      initialization: {
        amount: total,
        payer: {
          email: '' // Se completará en el formulario
        }
      },
      customization: {
        paymentMethods: {
          creditCard: 'all',
          debitCard: 'all'
        },
        visual: {
          hidePaymentButton: false,
          hideFormTitle: false
        }
      },
      callbacks: {
        onReady: () => {
          console.log('✅ Brick configurado y listo');
        },
        onSubmit: async (data: any) => {
          console.log('📤 Datos del formulario recibidos');
          return await this.procesarPago(data);
        },
        onError: (error: any) => {
          console.error('❌ Error en brick:', error);
          this.errorPago = `Error en el formulario de pago: ${error.message || 'Error desconocido'}`;
        }
      }
    };

    console.log('🔧 Configuración del brick:', brickConfig);

    try {
      // Crear el brick
      this.brickController = await window.MercadoPago.bricks().create('payment', 'brick-container', brickConfig);
      console.log('✅ Brick creado exitosamente');
    } catch (error: any) {
      console.error('❌ Error creando brick:', error);
      throw new Error(`Error creando brick: ${error.message}`);
    }
  }

  async procesarPago(formData: any) {
    try {
      this.procestandoPago = true;
      this.errorPago = null;

      // Obtener datos del usuario
      const usuario = await this.authService.getUsuarioId(this.auth.currentUser!.uid).pipe(first()).toPromise();
      
      if (!usuario?.correo) {
        throw new Error('Email del usuario no encontrado');
      }

      const total = this.comprarService.calcularTotalCompra(this.producto, this.unidades, this.tamanioSelec);
      
      const paymentData: MercadoPagoPaymentData = {
        token: formData.token,
        amount: total,
        description: `${this.producto.nombre} x${this.unidades}`,
        installments: formData.installments || 1,
        payment_method_id: formData.payment_method_id,
        payer: {
          email: usuario.correo,
          identification: formData.payer?.identification || {
            type: 'CC',
            number: ''
          }
        }
      };

      // Procesar pago a través de Firebase Functions
      const response = await this.comprarService.procesarPagoMercadoPago(paymentData);
      
      if (response.success && response.payment) {
        // Pago exitoso
        this.pagoCompletado = true;
        this.procestandoPago = false;
        
        // Agregar referencia de compra y redirigir
        if (this.producto.tamanios) {
          await this.comprarService.agregarReferenciaCompra(
            this.producto.id!, 
            this.auth.currentUser!.uid, 
            Number(this.unidades), 
            this.tamanioSelec
          );
        } else {
          await this.comprarService.agregarReferenciaCompra(
            this.producto.id!, 
            this.auth.currentUser!.uid, 
            Number(this.unidades)
          );
        }

        // Cerrar modal después de un momento
        setTimeout(() => {
          this.cerrarModalPago();
          this.router.navigate(['comprar/checkout/resumen']);
        }, 2000);
        
      } else {
        throw new Error(response.error || 'Error al procesar el pago');
      }
    } catch (error: any) {
      console.error('Error procesando pago:', error);
      this.errorPago = error.message || 'Error al procesar el pago';
      this.procestandoPago = false;
    }
  }

  cerrarModalPago() {
    this.mostrarModalPago = false;
    this.procestandoPago = false;
    this.pagoCompletado = false;
    this.errorPago = null;
    
    if (this.brickController) {
      this.brickController.unmount();
      this.brickController = null;
    }
  }

  calcularTotal(): number {
    return this.comprarService.calcularTotalCompra(this.producto, this.unidades, this.tamanioSelec);
  }

  // Método para debug - puedes llamarlo desde el template para verificar el estado
  debugBotones(): void {
    console.log('Debug Botones:', {
      productoCargado: this.productoCargado,
      producto: !!this.producto,
      productoNombre: this.producto?.nombre,
      productoEstado: this.producto?.estado
    });
  }

  async agregarAlCarrito() {
    console.log('🛒 Botón Agregar al Carrito presionado');
    console.log('Estado:', {
      producto: !!this.producto,
      currentUser: !!this.auth.currentUser,
      productoPropio: this.productoPropio,
      unidades: this.unidades
    });

    if (this.producto && this.auth.currentUser) {
      if (this.productoPropio) {
        console.log('❌ Este es tu propio producto');
        alert('No puedes agregar tu propio producto al carrito');
        return;
      }

      try {
        console.log('✅ Agregando al carrito...');
        if (this.producto.tamanios) {
          await this.comprarService.agregarReferenciaCarrito(
            this.producto.id!, 
            this.auth.currentUser.uid, 
            Number(this.unidades), 
            this.tamanioSelec
          );
        } else {
          await this.comprarService.agregarReferenciaCarrito(
            this.producto.id!, 
            this.auth.currentUser.uid, 
            Number(this.unidades)
          );
        }
        
        console.log('✅ Producto agregado al carrito exitosamente');
        alert('¡Producto agregado al carrito!');
        
      } catch (error) {
        console.error('❌ Error agregando al carrito:', error);
        alert('Error al agregar al carrito: ' + error);
      }
    } else if (!this.auth.currentUser) {
      console.log('❌ Usuario no autenticado, redirigiendo...');
      this.router.navigate(['cuenta/crear-cuenta']);
    } else {
      console.log('❌ Producto no disponible');
      alert('El producto no está disponible');
    }
  }

  navegar( ruta: any[], event: Event): void{
    event.preventDefault();
    this.zone.run(()=>{
      this.router.navigate(ruta);
      window.scroll(0,0)
    })
  }
  opiniones(){
    window.scroll(0,3000)
  }
}
