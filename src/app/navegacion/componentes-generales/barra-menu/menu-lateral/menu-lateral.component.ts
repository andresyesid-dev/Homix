import { Component, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { AnimationMenu } from './barra-menu-animation.component';

import { heroBars3Solid } from '@ng-icons/heroicons/solid';
import { heroUserCircleSolid } from '@ng-icons/heroicons/solid';
import { aspectsContactCard } from '@ng-icons/ux-aspects';
import { ionClose } from '@ng-icons/ionicons';
import { heroSquares2x2Solid } from '@ng-icons/heroicons/solid';
import { aspectsDeliver } from '@ng-icons/ux-aspects';
import { heroNewspaper } from '@ng-icons/heroicons/outline';
import { heroCheckBadge } from '@ng-icons/heroicons/outline';
import { heroArrowUturnLeft } from '@ng-icons/heroicons/outline';
import { heroUsers } from '@ng-icons/heroicons/outline';
import { iconoirViewStructureUp } from '@ng-icons/iconoir';

import { ionNotificationsOutline } from '@ng-icons/ionicons';
import { heroCalendarDays } from '@ng-icons/heroicons/outline';
import { heroArrowSmallLeftMini } from '@ng-icons/heroicons/mini';
import { heroChevronRightMini } from '@ng-icons/heroicons/mini';
import { heroCheckCircle } from '@ng-icons/heroicons/outline';
import { heroQuestionMarkCircle } from '@ng-icons/heroicons/outline';
import { aspectsLineChart } from '@ng-icons/ux-aspects';
import { heroLockClosed } from '@ng-icons/heroicons/outline';
import { heroFingerPrint } from '@ng-icons/heroicons/outline';
import { heroArrowRightOnRectangle } from '@ng-icons/heroicons/outline';
import { heroTruck } from '@ng-icons/heroicons/outline';
import { heroArrowSmallLeft } from '@ng-icons/heroicons/outline';

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
import { heroCurrencyDollar } from '@ng-icons/heroicons/outline';

import { heroDocumentText } from '@ng-icons/heroicons/outline';
import { Auth } from '@angular/fire/auth';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { InformacionPerfilService } from 'src/app/servicios/informacionPerfil/informacion-perfil.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { VendedorService } from 'src/app/servicios/vendedor/vendedor.service';

@Component({
  selector: 'app-menu-lateral',
  templateUrl: './menu-lateral.component.html',
  styleUrls: ['./menu-lateral.component.scss'],
  animations: AnimationMenu,
  providers: [provideIcons({iconoirViewStructureUp, heroBars3Solid, ionNotificationsOutline, heroTruck, heroUserCircleSolid,aspectsContactCard, heroArrowSmallLeft, ionClose, heroSquares2x2Solid, aspectsDeliver, heroNewspaper, heroCheckBadge, heroArrowUturnLeft, heroUsers, heroCalendarDays,/*-iconos- perfil*/ heroArrowSmallLeftMini, heroChevronRightMini, heroCheckCircle, heroQuestionMarkCircle, aspectsLineChart, heroLockClosed, heroFingerPrint, heroArrowRightOnRectangle, heroShoppingCart, heroStar, heroDocumentCheck, heroChatBubbleBottomCenterText, heroBanknotes,heroCurrencyDollar, heroRectangleGroup, heroBell, heroBuildingStorefront, heroChatBubbleLeftRight, heroBanknotesMini, heroDocumentChartBar, heroArrowTrendingUp, heroDocumentText})]
})
export class MenuLateralComponent implements OnInit{
  constructor(private auth: Auth, private authService: AuthService, private changeDetector: ChangeDetectorRef, private zone: NgZone, private router: Router, private perfilService: InformacionPerfilService, private firestore: Firestore, private vendedorService: VendedorService){}
  user!: string;
  idUsuario!: string;
  state = 'inactive';
  submenuState: Array<string> = ['inactive', 'inactive', 'inactive'];
  sinUsuario = false;
  usuarioInterno = false;
  usuarioVendedor = false;

  ngOnInit(): void {
    this.auth.onAuthStateChanged(async (user)=>{
      if(user){
        const usuario = await this.authService.getUsuarioIdPromise(user.uid);
        this.user = usuario.usuario;
        this.idUsuario = usuario.id!;
        
        // Verificar si es usuario interno
        const usuarioInternoSnapshot = await getDoc(doc(this.firestore, `usuarios-internos/${usuario.id}`));
        if(usuarioInternoSnapshot.exists()){
          this.usuarioInterno = true;
        }

        // Verificar si es vendedor activo usando el servicio
        this.usuarioVendedor = await this.vendedorService.esVendedorActivo(usuario);
      }else{
        this.sinUsuario = true;
      }
    })
  }

  navegar(ruta: any[], event: Event){
    event.preventDefault();
    this.zone.run(()=>{
      this.animarMenu();
      this.router.navigate(ruta);
      window.scroll(0,0)
    })
  }

  direccionarSeguridad(){
    this.animarMenu();
    this.perfilService.selected = 'seguridad';
    this.router.navigate([this.user + '/perfil/informacion'])
  }
  signOut(){
    this.authService.signOut();
  }

  animarMenu(): void {
    if ( this.state === 'active' ) {
      for (const submenu in this.submenuState) {
        if (Object.prototype.hasOwnProperty.call(this.submenuState, submenu)) {
          this.submenuState[submenu] = 'inactive';
        }
      }
    }
    this.state = this.state === 'inactive' ? 'active' : 'inactive';
  }

  animarSubmenu(submenu: number): void {
    this.submenuState[0] = this.submenuState[submenu] === 'inactive' ? 'active' : 'inactive';
    this.submenuState[submenu] = this.submenuState[submenu] === 'inactive' ? 'active' : 'inactive';
    this.changeDetector.detectChanges();
  }

}
