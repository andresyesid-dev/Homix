import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { heroBell } from '@ng-icons/heroicons/outline';
import { Subscription } from 'rxjs';
import { Novedad } from 'src/app/interfaces/novedad';
import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { Firestore, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-novedades',
  templateUrl: './novedades.component.html',
  styleUrls: ['./novedades.component.scss'],
  providers: [provideIcons({heroBell})]
})
export class NovedadesComponent implements OnInit, OnDestroy{
  constructor(private zone: NgZone, private router: Router, private route: ActivatedRoute, private authService: AuthService, private firestore: Firestore) {}
  private routeSubscription!: Subscription;
  private usuario!: Usuario;
  novedades!: Novedad[];
  datosCargados = false;
  
  ngOnInit() {
    this.routeSubscription = this.route.parent!.params.subscribe(params => {
      const userId = params['id'];
      this.obtenerusuario(userId);
    });
  }

  async obtenerusuario(usuario: string){
    await this.authService.getUsuarioUser(usuario).then((user)=>{
      if(user){
        this.usuario = user;
        this.obtenerNovedades();
      }
    });
  }

  async obtenerNovedades() {
    if (this.usuario.novedades && this.usuario.novedades.length !== 0) {
      const novedadesSnapshot = await Promise.all(this.usuario.novedades.map((ref:any) => getDoc(ref!)));
      this.novedades = novedadesSnapshot.map((snapshot)=>{
        const novedad = snapshot.data() as Novedad;
        novedad.id = snapshot.id;
        return novedad
      }).sort((a, b) => {
        const aTime = a.fecha?.toMillis() || 0;
        const bTime = b.fecha?.toMillis() || 0;
        return bTime - aTime;
      });
    }
    this.datosCargados = true;
  }

  navegar(ruta: any[], event: Event){
    event.preventDefault();
    this.zone.run(()=>{
      this.router.navigate(ruta)
    })
  }

  ngOnDestroy(): void {
    if(this.routeSubscription){
      this.routeSubscription.unsubscribe();
    }
  }
}
