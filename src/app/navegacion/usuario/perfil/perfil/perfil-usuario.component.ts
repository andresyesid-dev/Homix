import { provideIcons } from '@ng-icons/core';
import { matCameraAlt } from '@ng-icons/material-icons/baseline';
import { matPersonAddAlt } from '@ng-icons/material-icons/baseline';
import { matPerson } from '@ng-icons/material-icons/baseline';
import { heroBuildingStorefrontSolid } from '@ng-icons/heroicons/solid';
import { heroDocumentTextSolid } from '@ng-icons/heroicons/solid';
import { heroPlaySolid } from '@ng-icons/heroicons/solid';
import { heroShareSolid } from '@ng-icons/heroicons/solid';

import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router} from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { Subscription } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { Firestore, arrayUnion, doc, increment, setDoc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.scss'],
  providers: [provideIcons({matCameraAlt, matPersonAddAlt, matPerson, heroBuildingStorefrontSolid, heroDocumentTextSolid, heroPlaySolid, heroShareSolid})]
})
export class PerfilUsuarioComponent implements OnInit, OnDestroy{
  constructor(private zone: NgZone, private router: Router, private authService: AuthService, private auth: Auth, private firestore: Firestore) {}
  private routeSubscription!: Subscription;
  public state!: string;
  public url!: string;

  public userUsuario!: string;
  private usuario!: Usuario;
  public datosUsuario!: any;
  public diasHomix!: string;

  usuarioDiferente!: boolean;
  usuariosSiguiendo: string[] = []; //Mi usuario
  miIdUsuario!: string;
  siguiendo!: boolean;

  ngOnInit(): any { 
    this.obtenerDatos();
    const urlSegments = this.router.url.split('/');
    this.url = urlSegments[urlSegments.length - 1];

    this.routeSubscription = this.router.events.subscribe(async event => {
      if (event instanceof NavigationEnd) {
          this.obtenerDatos();
          const urlSegments = this.router.url.split('/');
          this.url = urlSegments[urlSegments.length - 1];
        }
    });
    
  }

  obtenerDatos(){
    const usuarioUrl = (this.router.url).split('/')[1];
    this.auth.onAuthStateChanged(async (usuario)=>{
      if(usuario){
        const miUsuario = await this.authService.getUsuarioIdPromise(usuario.uid);
        if(miUsuario.siguiendo && miUsuario.siguiendo.length !== 0){
          this.usuariosSiguiendo = miUsuario.siguiendo!;
        }else{
          this.siguiendo = false;
        }
        this.miIdUsuario = miUsuario.id!;

        if(miUsuario.usuario == usuarioUrl){
          this.usuarioDiferente = false;
        }else{
          this.usuarioDiferente = true;
        }
      }else{
        this.usuarioDiferente = true;
      }

      const user = await this.authService.getUsuarioUser(usuarioUrl);
      if(user){
        this.usuario = user;
        this.datosPublicosUsuario();
        this.diasHomix = this.obtenerTiempoTranscurrido(this.usuario?.diasComoVendedor!);
        if(this.usuariosSiguiendo){
          this.siguiendo = this.usuariosSiguiendo.some(seguidor => seguidor === user.id)
        }
      }else{
        this.router.navigate(['']);
      }
    });
  }

  async funcionSeguidor(){
    const miUsuarioRef = doc(this.firestore, `usuarios/${this.miIdUsuario}`);
    const usuarioRef = doc(this.firestore, `usuarios/${this.usuario.id}`);
    if(this.siguiendo){
      this.siguiendo = false;
      const index = this.usuariosSiguiendo.findIndex(seguidor => seguidor === this.usuario.id);
      this.usuariosSiguiendo.splice(index, 1);

      this.datosUsuario!.seguidores! -= 1;
      await updateDoc(usuarioRef, {seguidores: increment(-1)});
      await setDoc(miUsuarioRef, {siguiendo: this.usuariosSiguiendo}, {merge: true});
    }else{
      this.siguiendo = true;
      this.usuariosSiguiendo.push(this.usuario.id!);

      this.datosUsuario!.seguidores! += 1;
      await updateDoc(usuarioRef, {seguidores: increment(1)});
      await updateDoc(miUsuarioRef, {siguiendo: arrayUnion(this.usuario.id)});
    }

  }
  datosPublicosUsuario(){
    this.datosUsuario = {
      nombre: this.usuario.nombre,
      seguidores: this.usuario.seguidores,
      diasComoVendedor: this.usuario.diasComoVendedor,
      usuario: this.usuario.usuario
    }
  }


  obtenerTiempoTranscurrido(dias: number) {
    if (dias < 0) {
      return 'Error: Los días no pueden ser negativos';
    }
  
    if (dias === 1) {
      return '1 día';
    } else if (dias < 30) {
      return `${dias} días`;
    } else if (dias >= 30 && dias < 365) {
      const meses = Math.floor(dias / 30);
      const diasRestantes = dias % 30;
      if (diasRestantes === 0) {
        return `${meses} mes${meses > 1 ? 'es' : ''}`;
      } else {
        return `${meses} mes${meses > 1 ? 'es' : ''} y ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}`;
      }
    } else {
      const anios = Math.floor(dias / 365);
      const diasRestantes = dias % 365;
      const meses = Math.floor(diasRestantes / 30);
      const diasExtras = diasRestantes % 30;
      return `${anios} año${anios > 1 ? 's' : ''} y ${meses} mes${meses > 1 ? 'es' : ''}`;
    }
  }

  //--------------------------------------------------------------

  cambiarEstado(newState: string): any {
    this.state = newState;
  }

  navegar(enlace: any[], event: Event): void {
    event.preventDefault();
    this.zone.run(() => {
      this.router.navigate(enlace);
      window.scroll(0,0)
    });
  }

  navegarInicio(){
    this.zone.run(() => {
      this.router.navigate(['']);
      window.scroll(0,0)
    });
  }

  ngOnDestroy(): void {
    if(this.routeSubscription){
      this.routeSubscription.unsubscribe();
    }
  }

}
