import {AfterViewInit, ChangeDetectorRef,Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, Renderer2,ViewChild, } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

import { provideIcons } from '@ng-icons/core';
import { heroChevronDown } from '@ng-icons/heroicons/outline';
import { heroUserCircleSolid } from '@ng-icons/heroicons/solid'; 

/*---------- Iconos Compras ---------*/
import { heroShoppingCartSolid } from '@ng-icons/heroicons/solid';
import { heroShoppingCart } from '@ng-icons/heroicons/outline';
import { heroStar } from '@ng-icons/heroicons/outline'; 
import { heroDocumentCheck } from '@ng-icons/heroicons/outline';
import { heroChatBubbleBottomCenterText } from '@ng-icons/heroicons/outline';

/*----------- Iconos Ventas ----------*/
import { heroRectangleGroup } from '@ng-icons/heroicons/outline'; 
import { heroBell } from '@ng-icons/heroicons/outline';
import { heroBuildingStorefront } from '@ng-icons/heroicons/outline';
import { heroChatBubbleLeftRight } from '@ng-icons/heroicons/outline';
import { heroBanknotesMini } from '@ng-icons/heroicons/mini';
import { heroCurrencyDollarSolid } from '@ng-icons/heroicons/solid';
import { heroCurrencyDollar } from '@ng-icons/heroicons/outline';
import { heroArrowTrendingUp } from '@ng-icons/heroicons/outline';
import { heroChartPie } from '@ng-icons/heroicons/outline';
import { heroNewspaper } from '@ng-icons/heroicons/outline';
import { heroTrophy } from '@ng-icons/heroicons/outline';
import { heroDocumentText } from '@ng-icons/heroicons/outline';

import { heroDocumentTextSolid } from '@ng-icons/heroicons/solid';

import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  animations: [
    trigger('submenu', [
      state('active', style({
        maxHeight: '460px'
      })),
      state('inactive', style({
        maxHeight: '0'
      })),
      transition('inactive => active', animate('300ms')),
      transition('active => inactive', animate('300ms'))
    ])
  ],
  providers: [provideIcons({heroChevronDown, heroShoppingCartSolid, heroUserCircleSolid, heroShoppingCart, heroStar, heroDocumentCheck, heroChatBubbleBottomCenterText, heroBanknotesMini,heroRectangleGroup, heroBell,heroBuildingStorefront, heroChatBubbleLeftRight, heroCurrencyDollar, heroCurrencyDollarSolid, heroArrowTrendingUp, heroChartPie, heroNewspaper, heroTrophy, heroDocumentText, heroDocumentTextSolid})]
})
export class PerfilComponent implements AfterViewInit, OnDestroy, OnInit{

  constructor(private router: Router,private route: ActivatedRoute,private renderer: Renderer2,private changeDetector: ChangeDetectorRef,private zone: NgZone, private authService: AuthService, private auth: Auth) {}
  private routerSubscription!: Subscription;
  private subscripciones: Subscription[] = [];
  private listenMouseEnterMenu!: () => void;
  private listenMouseLeaveMenu!: () => void;
  private listenFooterSlide!: () => void;
  @ViewChild('principalUL') principalUL!: ElementRef;
  @ViewChild('body') body1!: ElementRef;

  footer: any;
  footerHeight: any;
  footerSlide!: number;
  fotosombra!: boolean;
  mouseInMenu = false;
  screenWidth: number = window.innerWidth;
  screenHeight: number = window.innerHeight;
  interruptor = true;
  stateSubMenu: string[] = ['inactive', 'inactive', 'inactive'];
  miNombre!: string;
  miUsuario!: string;

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    if(this.footer){
      this.footerSlide = (this.footer.nativeElement.getBoundingClientRect().top) - this.screenHeight;
      this.interruptor = this.footerSlide > 0 ? true : false;
      this.submenuScroll(this.interruptor);
    }
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: any): void {
    this.scrollMenu();
  }

  ngOnInit(): any { 
    this.obtenerUsuario();
    this.routerSubscription = this.router.events.subscribe(async event => {
      if (event instanceof NavigationEnd) {
        this.obtenerUsuario();
      }
    });
  }

  obtenerUsuario(){
    const url = (this.router.url).split('/');
    this.auth.onAuthStateChanged(async (usuario)=>{
      if(usuario){
        const miUsuario = await this.authService.getUsuarioIdPromise(usuario.uid);
        if(miUsuario.usuario == url[1]){
          //---- en caso de estár en mi perfil
          this.miNombre = miUsuario.nombre!.split(' ').slice(0, 2).join(' ');
          this.miUsuario = miUsuario.usuario;
        }else{
          if(url[2] == 'perfil' && (url[3] == 'informacion' || url[3] == 'productos')){
            //---- en caso de estár en un perfil de otro usuario, ya con cuenta iniciada
            const usuarioUrl = await this.authService.getUsuarioUser(url[1]);
            if(usuarioUrl){
              this.miNombre = miUsuario.nombre!.split(' ').slice(0, 2).join(' ');
              this.miUsuario = miUsuario.usuario!;
            }else{
              this.router.navigate(['']); // usuario de la url no existe
            }
          }else{
            this.router.navigate(['']);
          }
        }
      }else{
        if(url[2] == 'perfil' && (url[3] == 'informacion' || url[3] == 'productos')){
          const usuarioUrl = await this.authService.getUsuarioUser(url[1]);
          if(!usuarioUrl){
            this.router.navigate(['']); // usuario de la url no existe
          }
          //---- en caso de estár en un perfil de otro usuario, sin cuenta iniciada
        }else{
          this.router.navigate(['cuenta/crear-cuenta']);
        }
      }
      
    });
  }


  //---------------------------------

  ngAfterViewInit() {
    if (this.screenWidth < 1950) {
      this.listenMouseEnterMenu = this.renderer.listen(this.principalUL.nativeElement, 'mouseenter', () => {
        this.mouseInMenu = true;
        this.changeDetector.detectChanges();
      });
      this.listenMouseLeaveMenu = this.renderer.listen(this.principalUL.nativeElement, 'mouseleave', () => {
        this.mouseInMenu = false;
        this.changeDetector.detectChanges();
      });
    }
    this.listenFooterSlide = this.renderer.listen('window', 'load', () => {
      if(this.footer){
        this.footerSlide = (this.footer.nativeElement.getBoundingClientRect().top) - this.screenHeight;
        this.interruptor = this.footerSlide > 0 ? true : false;
      }
    });
  }

  desplegarSubmenu(numero: number) {
    if (this.stateSubMenu[numero] === 'inactive') {
      this.stateSubMenu[numero] = 'active';
    } else {
      this.stateSubMenu[numero] = 'inactive';
    }
  }

  scroll() {
    if (this.interruptor && this.screenWidth < 1950) {
      setTimeout(() => {
        const div = this.principalUL.nativeElement;
        div.scrollTo({
          top: div.scrollHeight,
          behavior: 'smooth'
        });
      }, 10);
      this.interruptor = false;
    }
  }

  scrollMenu(): void {
    if(this.footer){
      this.footerSlide = (this.footer.nativeElement.getBoundingClientRect().top) - this.screenHeight;
      this.interruptor = this.footerSlide > 0 ? true : false;
      this.submenuScroll(this.interruptor);
    }
  }

  submenuScroll(interruptor: boolean): any {
    let numeroResta = 0;
    const scroll = window.scrollY;
    if (interruptor){
      if (scroll >= 0 && scroll <= 32){
        numeroResta = scroll;
        this.renderer.setStyle(this.principalUL.nativeElement, 'position', 'fixed');
        this.renderer.setStyle(this.principalUL.nativeElement, 'top', `${91 - numeroResta}px`);
        this.renderer.setStyle(this.principalUL.nativeElement, 'height', `${window.innerHeight - 90 + numeroResta}px`);
      } else if (scroll >= 32){
        this.renderer.setStyle(this.principalUL.nativeElement, 'position', 'fixed');
        this.renderer.setStyle(this.principalUL.nativeElement, 'top', '57px');
        this.renderer.setStyle(this.principalUL.nativeElement, 'height', `${window.innerHeight - 58 + numeroResta}px`);
      } else if (scroll < 32){
        this.renderer.setStyle(this.principalUL.nativeElement, 'position', 'sticky');
        this.renderer.setStyle(this.principalUL.nativeElement, 'top', '0px');
        this.renderer.setStyle(this.principalUL.nativeElement, 'height', `${window.innerHeight - 90 + numeroResta}px`);
        this.renderer.setStyle(this.principalUL.nativeElement, 'margin-top', '0');
      }
    }

    if (interruptor === false){
      this.renderer.setStyle(this.principalUL.nativeElement, 'position', 'absolute');
      this.renderer.setStyle(this.principalUL.nativeElement, 'height', `${window.innerHeight - 58 + numeroResta}px`);
      const heightMenu = this.principalUL.nativeElement.offsetHeight;
      const footerHeight = this.footerHeight.nativeElement.offsetHeight;
      const pageHeight = this.body1.nativeElement.offsetHeight;
      const resultado = pageHeight - (footerHeight + heightMenu );
      this.renderer.setStyle(this.principalUL.nativeElement, 'top', `${resultado}px`);
    }
  }

  navegar(ruta: any[], event: Event): any {
    event.preventDefault();
    this.zone.run(() => {
      try {
        this.router.navigate(ruta);
        window.scroll(0, 0);
      } catch (error) {
        this.router.navigate(['/']);
      }
    });
  }

  getFooterHeight(height: any) {
    this.footerHeight = height;
  }

  getFooter(footer: any) {
    this.footer = footer;
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.listenMouseEnterMenu) {
      this.listenMouseEnterMenu();
    }
    if (this.listenMouseLeaveMenu) {
      this.listenMouseLeaveMenu();
    }
    if (this.listenFooterSlide) {
      this.listenFooterSlide();
    }
  }

}
