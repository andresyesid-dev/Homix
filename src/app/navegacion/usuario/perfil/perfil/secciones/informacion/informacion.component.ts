import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { NavigationEnd, Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { heroCog8ToothSolid } from '@ng-icons/heroicons/solid';
import { iconoirNavArrowRight } from '@ng-icons/iconoir';

import { iconoirUser } from '@ng-icons/iconoir';
import { heroLockClosed } from '@ng-icons/heroicons/outline';
import { heroShieldCheck } from '@ng-icons/heroicons/outline';
import { aspectsContactCard } from '@ng-icons/ux-aspects';
import { heroMapPin } from '@ng-icons/heroicons/outline';
import { iconoirMailOut } from '@ng-icons/iconoir';

import { Subscription } from 'rxjs';
import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { InformacionPerfilService } from 'src/app/servicios/informacionPerfil/informacion-perfil.service';

@Component({
  selector: 'app-informacion',
  templateUrl: './informacion.component.html',
  styleUrls: ['./informacion.component.scss'],
  providers: [provideIcons({iconoirNavArrowRight, iconoirUser,heroCog8ToothSolid, heroLockClosed, heroShieldCheck, aspectsContactCard, heroMapPin, iconoirMailOut})]
})
export class InformacionComponent implements OnInit, OnDestroy{
  constructor(private router: Router, private auth: Auth, private authService: AuthService, private perfilService: InformacionPerfilService){}
  private subscription!: Subscription;
  usuarioDiferente!: boolean;
  usuario!: Usuario;
  selected!: string;

  habilitarEdicion: boolean = false;
  recuadroContenido!: string;

  editarDireccionIndex!: number | undefined;

  ngOnInit(): void {
    if(this.perfilService.selected){
      this.selected = this.perfilService.selected;
    }else{
      this.selected = 'datosPersonales';
    }
    this.obtenerDatos();
    this.subscription = this.router.events.subscribe(async event => {
      if (event instanceof NavigationEnd) {
        this.obtenerDatos();
      }
    });
  }

  cambiarInformacion(nuevoDato: string){
    this.selected = nuevoDato;
  }
  obtenerDatos(){
    const usuarioUrl = (this.router.url).split('/')[1];
    this.auth.onAuthStateChanged(async (usuario)=>{
      if(usuario){
        const miUsuario = await this.authService.getUsuarioIdPromise(usuario.uid);
        if(miUsuario.usuario == usuarioUrl){
          this.usuario = miUsuario;
          console.log(this.usuario)
        }else{
          this.router.navigate(['']);
        }
      }else{
        this.router.navigate(['']);
      }
      
      const user = await this.authService.getUsuarioUser(usuarioUrl);
      if(user){
        this.usuario = user;
      }
      
    });
  }

  mostrarContenido(editar: string){
    this.recuadroContenido = editar;
    this.habilitarEdicion = true;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.perfilService.selected = null;
  }
}
