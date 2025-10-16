import { Component, OnDestroy, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Producto } from 'src/app/interfaces/producto/producto';
import { ProductosService } from 'src/app/servicios/productos/productos.service';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { PasosVenderService } from 'src/app/servicios/vender/vender.service';

@Component({
  selector: 'app-publicado',
  templateUrl: './publicado.component.html',
  styleUrls: ['./publicado.component.scss']
})
export class PublicadoComponent  implements OnInit, OnDestroy{
  constructor(private auth: Auth, private router: Router, private pasos: PasosVenderService, private prdService: ProductosService, private authService: AuthService){
    if(!pasos.idProducto){
      router.navigate(['']);
    }
    this.foto = pasos.fotoProducto;
    this.productoId = pasos.idProducto!;
    this.nombre = pasos.nombre;
  }
  productoId!: string;
  nombre!: string;
  foto!: string;
  usuario!: string;

  async ngOnInit(): Promise<void> {
    this.auth.onAuthStateChanged(async (user)=>{
      if(user){
        const usuario = await this.authService.getUsuarioIdPromise(user.uid);
        this.usuario = usuario.usuario;
      }
    })
  }

  navegar(ruta: string){
    this.router.navigate([ruta]);
  }

  ngOnDestroy(): void {
    this.pasos.idProducto = null;
  }

} 
