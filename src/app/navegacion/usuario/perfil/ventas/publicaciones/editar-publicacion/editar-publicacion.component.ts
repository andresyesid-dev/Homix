import { Component, OnInit } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { heroCog8ToothSolid } from '@ng-icons/heroicons/solid';
import { iconoirNavArrowRight } from '@ng-icons/iconoir';

import { iconoirUser } from '@ng-icons/iconoir';
import { heroLockClosed } from '@ng-icons/heroicons/outline';
import { heroShieldCheck } from '@ng-icons/heroicons/outline';
import { aspectsContactCard } from '@ng-icons/ux-aspects';
import { heroMapPin } from '@ng-icons/heroicons/outline';
import { iconoirMailOut } from '@ng-icons/iconoir';
import { Auth } from '@angular/fire/auth';
import { Firestore, getDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductosService } from 'src/app/servicios/productos/productos.service';
import { Estilo, Producto } from 'src/app/interfaces/producto/producto';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-editar-publicacion',
  templateUrl: './editar-publicacion.component.html',
  styleUrls: ['./editar-publicacion.component.scss'],
  providers: [provideIcons({heroCog8ToothSolid, iconoirNavArrowRight, iconoirUser, heroLockClosed, heroShieldCheck, aspectsContactCard, heroMapPin, iconoirMailOut})]
})
export class EditarPublicacionComponent implements OnInit{
  constructor(private router: Router, private auth: Auth, private firestore: Firestore, private prdService: ProductosService){}
  estilosActualizados!: Estilo[] | boolean;
  nuevosEstilos!: any;
  subscription!: Subscription;
  producto!: Producto;
  estilos!: Estilo[];
  selected = 'titulo';

  ngOnInit(): void {
    this.auth.onAuthStateChanged((user)=>{
      if(user){
        this.obtenerProducto()
      }
    })
  }

  async obtenerProducto(){
    const idUrl = this.router.url.split('/')[3];
    this.subscription = this.prdService.obtenerProductoId(idUrl).subscribe(async (producto)=>{
      if(producto){
        this.producto = producto;
        this.nuevosEstilos = producto.estilos;
        this.estilos = await Promise.all((producto.estilos || []).map(async (estiloRef: any)=>{
          const docSnaptShot = await getDoc(estiloRef);
          let estilo = docSnaptShot.data() as Estilo;
          estilo.id = docSnaptShot.id;
          return estilo;
        }));
        if(this.estilosActualizados == true){
          this.estilosActualizados = this.estilos;
        }
      }else{
        this.router.navigate(['']);
      }
    })
  }

  async nuevosDatos(){
    this.estilosActualizados = true;
    await this.obtenerProducto();
  }

  cambiarInformacion(dato: string){
    this.selected = dato;
  }

  cambiarEstilos(event: Event){
    this.nuevosEstilos = event;
  }
}
