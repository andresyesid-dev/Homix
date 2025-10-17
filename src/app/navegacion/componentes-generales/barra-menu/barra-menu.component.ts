import { Component, ViewChild, OnInit, ChangeDetectorRef, NgZone, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

/*--------- Iconos ---------------*/
import { provideIcons } from '@ng-icons/core';
import { heroUserCircle } from '@ng-icons/heroicons/outline';
import { ionNotificationsOutline } from '@ng-icons/ionicons';
import { ionChevronDownOutline }from '@ng-icons/ionicons';
import { heroBars3Solid } from '@ng-icons/heroicons/solid';
import { heroUserCircleSolid } from '@ng-icons/heroicons/solid';
import { heroShoppingCartSolid } from '@ng-icons/heroicons/solid';
import { matShoppingCart } from '@ng-icons/material-icons/baseline';
import { heroMagnifyingGlassMini } from '@ng-icons/heroicons/mini';
import { heroCurrencyDollarMini } from '@ng-icons/heroicons/mini';
import { iconoirViewStructureUp } from '@ng-icons/iconoir';
import { heroTruckSolid } from '@ng-icons/heroicons/solid';
import { heroChartPie } from '@ng-icons/heroicons/outline';
import { heroCurrencyDollar } from '@ng-icons/heroicons/outline';
import { aspectsContactCard } from '@ng-icons/ux-aspects';

/*---- Componentes ----*/
import { MenuLateralComponent } from './menu-lateral/menu-lateral.component'; 
/*---------- Iconos Compras ---------*/
import { heroShoppingCart, } from '@ng-icons/heroicons/outline';
import { heroStar, } from '@ng-icons/heroicons/outline'; 
import { heroDocumentCheck, } from '@ng-icons/heroicons/outline';
import { heroChatBubbleBottomCenterText, } from '@ng-icons/heroicons/outline';
import { heroBanknotes, } from '@ng-icons/heroicons/outline';

/*----------- Iconos Ventas ----------*/
import { heroRectangleGroup, } from '@ng-icons/heroicons/outline'; 
import { heroBell, } from '@ng-icons/heroicons/outline';
import { heroBuildingStorefront, } from '@ng-icons/heroicons/outline';
import { heroChatBubbleLeftRight, } from '@ng-icons/heroicons/outline';
import { heroBanknotesMini, } from '@ng-icons/heroicons/mini';
import { heroDocumentChartBar, } from '@ng-icons/heroicons/outline';
import { heroArrowTrendingUp, } from '@ng-icons/heroicons/outline';

import { heroDocumentText } from '@ng-icons/heroicons/outline';
import { heroArrowRightOnRectangle } from '@ng-icons/heroicons/outline';
import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { Auth, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc} from '@angular/fire/firestore'; 
import { Notificacion } from 'src/app/interfaces/usuario/subInterfaces/notificacion';
import { InformacionPerfilService } from 'src/app/servicios/informacionPerfil/informacion-perfil.service';
import { VendedorService } from 'src/app/servicios/vendedor/vendedor.service';

@Component({
  selector: 'app-barra-menu',
  templateUrl: './barra-menu.component.html',
  styleUrls: ['./barra-menu.component.scss'],
  viewProviders: [provideIcons({ heroUserCircle, heroBars3Solid, heroMagnifyingGlassMini, heroUserCircleSolid, iconoirViewStructureUp,  heroShoppingCartSolid, matShoppingCart, heroCurrencyDollarMini,heroShoppingCart, heroStar, heroDocumentCheck, heroChatBubbleBottomCenterText, heroBanknotes, heroRectangleGroup, heroBell, heroBuildingStorefront, heroChatBubbleLeftRight, heroBanknotesMini, heroDocumentChartBar, heroArrowTrendingUp, heroDocumentText, heroArrowRightOnRectangle, ionNotificationsOutline, ionChevronDownOutline, heroTruckSolid, heroChartPie, heroCurrencyDollar, aspectsContactCard})]
})
export class BarraMenuComponent{
  constructor(private changeDetectorRef: ChangeDetectorRef, private zone: NgZone, private router: Router, private route: ActivatedRoute, private authService: AuthService, private auth: Auth, private firestore: Firestore, private perfilService: InformacionPerfilService, private vendedorService: VendedorService){}
  public ultimoDatoUrl!: string;
  public scrollDisplay: Boolean = true;
  private routeSubscription!: Subscription;
  @ViewChild(MenuLateralComponent, {static: false})
  menuLateral: MenuLateralComponent = new MenuLateralComponent(this.auth, this.authService, this.changeDetectorRef, this.zone,this.router, this.perfilService, this.firestore, this.vendedorService);

  usuarioInterno = false;
  usuarioVendedor = false;
  usuario!: Usuario | null;
  nombre!: string;
  inUser!: boolean;
  sign!: string;
  enBuscador: boolean =  false;

  routeStateSubsCription!: Subscription;
  notificaciones!: Notificacion[];
  nuevaNotificacion!: boolean;

  isMouseOver = false;
  height = '0px';

  productosEnCarrito: number = 0;

  anchoPagina: number = window.innerWidth;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.anchoPagina = event.target.innerWidth;
  }

  ngOnInit() {
    this.routeSubscription = this.route.paramMap.subscribe(()=> {
      this.decodificarURL();
    });

    this.auth.onAuthStateChanged(async (user)=>{
      if(user){
        this.inUser = true;
        this.obtenerUsuario();
      } else {this.inUser = false;}
    })
  }
  //Mostrar notificaciones -------
  mouseIn(){
    if(this.notificaciones){
      if (!this.isMouseOver) {
        this.isMouseOver = true;
        setTimeout(()=>{
          if(this.isMouseOver){
            if(this.notificaciones.length > 4){
              this.height = '497px';
            }else{
              this.height = (this.notificaciones.length * 115.5) + 31 + 'px';
            }
            this.marcarComoVisto(this.usuario?.notificaciones!)
          }
        }, 100)
      }
    }
  }
  mouseOut(){
    if(this.notificaciones){
      this.isMouseOver = false;
      setTimeout(()=>{
        if(!this.isMouseOver){
          this.height = '0px';
        }
      }, 200)
    }
  }

  async marcarComoVisto(notificaciones: Notificacion[]) {
    // Comienza desde el final del array y continúa hasta que hayas marcado 4 objetos o llegues al inicio del array
    for (let i = notificaciones.length - 1; i >= 0 && i >= notificaciones.length - 4; i--) {
      notificaciones[i].visto = true;
    }
    const usuarioRef = doc(this.firestore, `usuarios/${this.usuario?.id}`);
    await setDoc(usuarioRef, {notificaciones: notificaciones}, {merge: true});
  }
  //-------------------------
  obtenerUsuario(){
    this.routeSubscription = this.authService.getUsuarioId(this.auth.currentUser?.uid!).subscribe(async (usuario) =>{
      this.usuario = usuario;
      
      // Verificar si es usuario interno (empleado)
      const usuarioSnapshot = await getDoc(doc(this.firestore, `usuarios-internos/${usuario.id}`));
      if(usuarioSnapshot.exists()){
        this.usuarioInterno = true;
      }else{
        this.usuarioInterno = false;
      }

      // Verificar si es vendedor activo usando el servicio
      this.usuarioVendedor = await this.vendedorService.esVendedorActivo(usuario);

      //--- nombre ----
      const palabras = this.usuario.nombre!.trim().split(' ');
      this.nombre = palabras.slice(0, 2).join(' ');
      //---- notificaciones----
      let notificaciones: Notificacion[] = []
      if(usuario.notificaciones){
        for(let notificacion of usuario.notificaciones){
          notificaciones.unshift(notificacion);
        }
        this.nuevaNotificacion = usuario.notificaciones?.some(notificacion => notificacion.visto == false);
      }else{
        this.nuevaNotificacion = false;
      }
      this.notificaciones = notificaciones;
      //---- productos en carrito ------
      let cantidad = 0;
      if(this.usuario.carrito){
        for(let carrito of this.usuario.carrito){
          cantidad += carrito.unidades;
        }
      }
      this.productosEnCarrito = cantidad;
    });
  }

  signOut(){
    this.authService.signOut();
  }
  navegar(ruta: string): void{
    if(ruta == 'pedidos'){
      if(this.inUser){
        if(this.usuario){
          this.router.navigate([this.usuario.usuario + '/compras']);
          window.scroll(0,0)
        }
      }else{
        setTimeout(()=>{
          this.sign = 'pedidos';
        }, 10)
      }
    } else if(ruta == 'historial'){
      if(this.inUser){
        if(this.usuario){
          this.router.navigate([this.usuario.usuario + '/historial']);
          window.scroll(0,0)
        }
      }else{
        setTimeout(()=>{
          this.sign = 'historial';
        }, 10)
      }
    } else if(ruta == 'compras'){
      if(this.inUser){
        if(this.usuario){
          this.router.navigate([this.usuario.usuario + '/compras']);
          window.scroll(0,0)
        }
      }else{
        setTimeout(()=>{
          this.sign = 'compras';
        }, 10)
      }
    } else if(ruta == 'favoritos'){
      if(this.inUser){
        if(this.usuario){
          this.router.navigate([this.usuario.usuario + '/favoritos']);
          window.scroll(0,0)
        }
      }else{
        setTimeout(()=>{
          this.sign = 'favoritos';
        }, 10)
      }
    }  else{
      this.router.navigate([ruta]);
      window.scroll(0,0)
    }
  }

  @HostListener('document:click')
  closeSing() {
    if(this.sign !== ''){
      this.sign = '';
    }
  }
  //--------------------------------------------------  Funciones buscador ----------------------------------- //
  decodificarURL(){ // Saber el texto puesto en el Input
    const url = this.router.url.split('?')[0];
    const decodedUrl = decodeURIComponent(url);
    const segments = decodedUrl.split('/');
    if(segments[1] === 'busqueda'){
      this.ultimoDatoUrl = segments[segments.length - 1];
    }
  }
  buscar(busqueda: string){
    if(busqueda !== ''){
      this.zone.run(()=>{
        this.router.navigate(['busqueda/',busqueda]);
        window.scroll(0,0)
      })
    }else{
      this.zone.run(()=>{
        this.router.navigate(['']);
        window.scroll(0,0)
      })
    }
  }
  buscarEnter(busqueda: string){
    if(busqueda !== ''){
      this.zone.run(()=>{
        this.router.navigate(['busqueda/',busqueda]);
        window.scroll(0,0)
      })
    }
  }

  direccionarDirecciones(){
    if(this.inUser){
      if(this.usuario){
        this.perfilService.selected = 'direcciones';
        this.router.navigate([this.usuario?.usuario + '/perfil/informacion'])
        window.scroll(0,0)
      }
    }else{
      setTimeout(()=>{
        this.sign = 'direcciones';
      }, 10)
    }
  }

//---------------------------
  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
  
}
