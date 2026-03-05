import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ComprarService } from 'src/app/servicios/comprar/comprar.service';
import { ProductosService } from 'src/app/servicios/productos/productos.service';
import { Direccion } from 'src/app/interfaces/usuario/subInterfaces/direccion';
import { Producto } from 'src/app/interfaces/producto/producto';
import { referenciaCompra } from 'src/app/interfaces/usuario/usuario';
import { provideIcons } from '@ng-icons/core';
import { heroMapPin, heroCreditCard, heroCheckCircle, heroPhone, heroInformationCircle, heroPencil } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-detalles-compra',
  templateUrl: './detalles-compra.component.html',
  styleUrls: ['./detalles-compra.component.scss'],
  providers: [provideIcons({heroMapPin, heroCreditCard, heroCheckCircle, heroPhone, heroInformationCircle, heroPencil})]
})
export class DetallesCompraComponent implements OnInit, OnDestroy {
  direccionEnvio: Direccion | null = null;
  totalCompra: number = 0;
  productos: Producto[] = [];
  referencias: referenciaCompra[] = [];
  cargandoProductos: boolean = true;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private comprarService: ComprarService,
    private productosService: ProductosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Obtener la dirección seleccionada del servicio
    this.direccionEnvio = this.comprarService.getDireccionEnvio();
    
    // Obtener el total de la compra del servicio
    this.totalCompra = this.comprarService.getTotalCompra();
    console.log('💰 Total de la compra:', this.totalCompra);
    
    // Si no hay dirección, redirigir al selector
    if (!this.direccionEnvio) {
      this.router.navigate(['comprar/checkout/seleccionar-direccion']);
      return;
    }

    // Obtener productos
    this.obtenerProductos();
    
    // Ya NO escuchamos el evento iniciarPago$ aquí
    // El Payment Brick se maneja completamente desde resumen-compra
    console.log('✅ Componente DetallesCompra inicializado - Payment Brick se maneja en ResumenCompra');
  }

  obtenerProductos(): void {
    this.cargandoProductos = true;
    
    const subscription = this.comprarService.$obtenerReferencias.subscribe(async (referencias) => {
      try {
        this.referencias = referencias;
        this.productos = await this.comprarService.obtenerProductos(referencias);
        
        // Cargar fotos para cada producto
        for (const producto of this.productos) {
          await this.cargarFotosProducto(producto);
        }
        
        console.log('🛒 Productos cargados con fotos:', this.productos);
      } catch (error) {
        console.error('❌ Error al cargar productos:', error);
      } finally {
        this.cargandoProductos = false;
      }
    });
    
    this.subscriptions.push(subscription);
  }

  async cargarFotosProducto(producto: Producto): Promise<void> {
    try {
      // Cargar estilos completos si es formato antiguo
      await this.productosService.cargarEstilosCompletos(producto);
      
      // Si tiene estilos con fotos cargadas (formato antiguo)
      if (producto.estilos && Array.isArray(producto.estilos) && producto.estilos[0]?.fotos) {
        // Las fotos ya están en los estilos después de cargarEstilosCompletos
        // No necesitamos hacer nada más, el método obtenerPrimeraFoto las usará
      } else if (producto.fotos && Array.isArray(producto.fotos)) {
        // Formato nuevo: las fotos ya son strings, solo necesitamos construir las rutas
        // El método obtenerPrimeraFoto se encargará de esto
      }
    } catch (error) {
      console.error('Error cargando fotos del producto:', error);
    }
  }

  obtenerCantidad(productoId: string): number {
    const ref = this.referencias.find(r => r.producto.id === productoId);
    return ref?.unidades || 1;
  }

  obtenerPrecioTotal(producto: Producto): number {
    const cantidad = this.obtenerCantidad(producto.id!);
    const precio = producto.precio || 0;
    return precio * cantidad;
  }

  obtenerPrimeraFoto(producto: Producto): string {
    // Primero verificar si tiene estilos con fotos (formato antiguo cargado)
    if (producto.estilos && Array.isArray(producto.estilos) && producto.estilos[0]?.fotos && producto.estilos[0].fotos.length > 0) {
      // Formato antiguo: las fotos ya son URLs completas de Firebase Storage
      return producto.estilos[0].fotos[0];
    }
    
    // Formato nuevo: verificar fotos en el producto
    if (producto.fotos && producto.fotos.length > 0) {
      const foto = producto.fotos[0];
      // Si la foto ya tiene la ruta completa (http o assets), devolverla tal cual
      if (foto.startsWith('http') || foto.startsWith('assets')) {
        return foto;
      }
      // Si no, construir la ruta a assets
      return `assets/img/productos/${foto}.webp`;
    }
    
    // Sin imagen - se mostrará fondo gris
    return '';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  formatearDireccion(direccion: Direccion): string {
    if (direccion.direccion && direccion.direccion.length >= 4) {
      return `${direccion.direccion[0]} ${direccion.direccion[1]} # ${direccion.direccion[2]} - ${direccion.direccion[3]}`;
    }
    return 'Dirección no disponible';
  }

  volverADireccion(): void {
    this.router.navigate(['comprar/checkout/seleccionar-direccion']);
  }
}