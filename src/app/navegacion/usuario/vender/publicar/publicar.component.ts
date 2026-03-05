import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { PasosVenderService } from 'src/app/servicios/vender/vender.service';

@Component({
  selector: 'app-publicar',
  templateUrl: './publicar.component.html',
  styleUrls: ['./publicar.component.scss']
})
export class PublicarComponent {
  constructor( private pasos: PasosVenderService, private authService : AuthService, private router: Router) {}
  private routeSubscription!: Subscription;

  ngOnInit(): void {
    this.routeSubscription = this.authService.userState$.subscribe((user)=>{
      user ? true : this.router.navigate(['']);
    })
  }

  getPaso(num: number): any {
    switch (num) {
      case 1: return this.pasos.paso1;
              break;
      case 2: return this.pasos.paso2;
              break;
      case 3: return this.pasos.paso3;
              break;
      case 4: return this.pasos.paso4;
              break;
      case 5: return this.pasos.paso5;
              break;
      case 6: return this.pasos.paso6;
      break;
    }
  }

  ngOnDestroy(): void {
    if(this.routeSubscription){
      this.routeSubscription.unsubscribe();
    }
    this.pasos.paso2 = false;
    this.pasos.paso3 = false;
    this.pasos.paso4 = false;
    this.pasos.paso5 = false;
  }
}
