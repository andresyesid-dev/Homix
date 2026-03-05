import { Component, EventEmitter, HostListener, Input, NgZone, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Producto } from '../../../../interfaces/producto/producto';

import { provideIcons } from '@ng-icons/core';
import { matStarRound } from '@ng-icons/material-icons/round';
import { ionLogoWhatsapp } from '@ng-icons/ionicons';
import { heroTruck } from '@ng-icons/heroicons/outline';
import { matGppGoodOutline } from '@ng-icons/material-icons/outline';
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
  providers: [provideIcons({matStarRound, heroTruck, matGppGoodOutline, heroChevronRight, ionLogoWhatsapp})]
})
export class DatosProductoComponent implements OnInit, OnChanges {
  constructor(
    private zone: NgZone, 
    private router: Router, 
    private comprarService: ComprarService, 
    private auth: Auth, 
    private authService: AuthService, 
    private firestore: Firestore
  ) {}

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
  selectEstilo: number = 0; // Índice del estilo seleccionado
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
      console.log(this.producto)
      this.vendidos = this.calcularVentas(this.producto.ventas);
      this.ventasHechas.emit(this.vendidos);
      this.unidades= 1;
      this.productoPropio = false;
      this.tamanioSelec = 0;
      this.selectEstilo = 0; // Reset estilo seleccionado
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

  // Método helper para crear array de unidades
  crearArrayUnidades(unidadesDisponibles: number): any[] {
    const max = unidadesDisponibles > 10 ? 9 : unidadesDisponibles - 1;
    return Array(max);
  }

  calcularVentas(ventas: number): string {
    if(ventas == 0){
      return "nuevo producto"
    }else if(ventas == 1){
      return `${ventas} vendido`;
    }else{
      return `${ventas} vendidos`;
    }
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
    }
  }

  async seleccionarEstilo(htmlSelect: any){
    this.selectEstilo = Number(htmlSelect.target.value);
    this.seleccionarEstl.emit(this.selectEstilo);
  }

  cambiarUnidades(event: any) {
    this.unidades = event.target.value;
    this.unaUnidad = event.target.value == 1;
    this.unidadeS.emit(this.unidades);
  }

  async comprar(){
    console.log('🚀 Iniciando flujo Comprar Ahora');
    if(!this.producto){
      alert('El producto aún no está cargado. Espera un momento.');
      return;
    }
    if(!this.auth.currentUser){
      this.router.navigate(['cuenta/crear-cuenta']);
      return;
    }
    if(this.productoPropio){
      alert('Este es tu propio producto');
      return;
    }
    try {
      await this.comprarService.prepararCompraRapida(this.producto, this.unidades, this.tamanioSelec);
      // Navegar al flujo de checkout actualizado: direccion -> pago -> confirmación
      this.router.navigate(['comprar/checkout/direccion']);
    } catch (e) {
      console.error('Error preparando compra rápida', e);
      alert('No fue posible iniciar la compra. Intenta nuevamente.');
    }
  }

  async agregarAlCarrito() {
    console.log('🛒 Agregando producto al carrito...');
    
    if (this.producto) {
      if (this.auth.currentUser) {
        if (this.productoPropio) {
          console.log('❌ Este es tu propio producto');
          alert('No puedes agregar tu propio producto al carrito');
        } else {
          try {
            // Agregar al carrito usando el servicio
            await this.comprarService.agregarReferenciaCarrito(
              this.producto.id!,
              this.auth.currentUser.uid,
              this.unidades,
              this.producto.tamanios ? this.tamanioSelec : undefined
            );
            console.log('✅ Producto agregado al carrito');
            alert('Producto agregado al carrito exitosamente');
          } catch (error) {
            console.error('❌ Error al agregar al carrito:', error);
            alert('Error al agregar el producto al carrito');
          }
        }
      } else {
        console.log('❌ Usuario no autenticado');
        this.router.navigate(['cuenta/crear-cuenta']);
      }
    } else {
      console.log('❌ Producto no cargado');
      alert('El producto aún no está cargado');
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