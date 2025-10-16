import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';

@Component({
  selector: 'app-parte-superior-vender',
  templateUrl: './parte-superior-vender.component.html',
  styleUrls: ['./parte-superior-vender.component.scss']
})
export class ParteSuperiorVenderComponent implements OnInit, OnDestroy{
  constructor(private zone: NgZone, private router: Router, private authService : AuthService, private auth: Auth){}
  private routeSubscription!: Subscription;
  inUser!: Boolean;
  usuario!: boolean;
  correoVerificado!: boolean;
  documento!: boolean;

  ngOnInit(): void {
    this.auth.onAuthStateChanged(async (user)=>{
      if(user){
        this.usuario = true;
        this.correoVerificado = user.emailVerified;
        const documento = (await this.authService.getUsuarioIdPromise(user.uid)).documento;
        if(documento){
          this.documento = true;
        }else{
          this.documento = false;
        }
      }else{
        this.usuario = false;
        this.correoVerificado = false;
        this.documento = false;
      }
    })
    this.routeSubscription = this.authService.userState$.subscribe((user)=>{
      user ? this.inUser = true : this.inUser = false;
    })
  }

  navegar(ruta: string){
    this.router.navigate([ruta]);
    window.scroll(0,0)
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

}
