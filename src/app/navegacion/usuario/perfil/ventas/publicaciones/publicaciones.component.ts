import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { getDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { heroMagnifyingGlassMini } from '@ng-icons/heroicons/mini';
import { heroAdjustmentsHorizontal } from '@ng-icons/heroicons/outline';
import { Subscription } from 'rxjs';
import { Producto } from 'src/app/interfaces/producto/producto';
import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { ProductosService } from 'src/app/servicios/productos/productos.service';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';

@Component({
  selector: 'app-publicaciones',
  templateUrl: './publicaciones.component.html',
  styleUrls: ['./publicaciones.component.scss'],
  providers: [provideIcons({heroMagnifyingGlassMini, heroAdjustmentsHorizontal})]
})
export class PublicacionesComponent implements OnInit, OnDestroy{
  constructor(private zone: NgZone,private router: Router, private route: ActivatedRoute, private authService: AuthService, private productosService: ProductosService) {}
  private routeSubscription!: Subscription;
  usuario!: Usuario;
  publicaciones!: Producto[];
  datosCargados = false;
  
  ngOnInit() {
    this.routeSubscription = this.route.parent!.params.subscribe(params => {
      const userId = params['id'];
      this.obtenerusuario(userId);
    });
  }

  async obtenerusuario(usuario: string){
    try {
      const usuarioData = await this.authService.getUsuarioUser(usuario);
      if(usuarioData){
        this.usuario = usuarioData;
        await this.obtenerProductos();
      } else {
        console.error('Usuario no encontrado');
        this.datosCargados = true;
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      this.datosCargados = true;
    }
  }

  async obtenerProductos() {
    try {
      if (this.usuario.publicaciones && this.usuario.publicaciones.length !== 0) {
        const productosSnapshot = await Promise.all(this.usuario?.publicaciones.map((ref:any) => getDoc(ref)));
        this.publicaciones = productosSnapshot.map((productoSnapshot)=>{
          const prd = productoSnapshot.data() as Producto;
          if(!prd){
            console.log('Producto snapshot sin data:', productoSnapshot)
          }
          prd.id = productoSnapshot.id;
          return prd
        })
      }
    } catch (error) {
      console.error('Error obteniendo productos:', error);
    } finally {
      this.datosCargados = true;
    }
  }

  async eliminarProducto(producto: Producto) {
    try {
      if (!producto.id || !this.usuario.id || !this.usuario.publicaciones) {
        console.error('Datos insuficientes para eliminar el producto');
        return;
      }

      await this.productosService.eliminarProducto(
        producto.id, 
        this.usuario.id, 
        this.usuario.publicaciones
      );

      // Actualizar la lista local eliminando el producto
      this.publicaciones = this.publicaciones.filter(p => p.id !== producto.id);
      
      // Actualizar el objeto usuario local
      this.usuario.publicaciones = this.usuario.publicaciones.filter(ref => ref.id !== producto.id);
      
      console.log('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      alert('Hubo un error al eliminar el producto. Por favor, intenta de nuevo.');
    }
  }


  navegar(ruta: any[], event: Event){
    event.preventDefault();
    this.zone.run(()=>{
      this.router.navigate(ruta);
      window.scroll(0,0)
    })
  }

  ngOnDestroy(): void {
    if(this.routeSubscription){
      this.routeSubscription.unsubscribe();
    }
  }

}
