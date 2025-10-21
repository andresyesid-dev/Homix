import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { ComprarService } from 'src/app/servicios/comprar/comprar.service';
import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { Direccion } from 'src/app/interfaces/usuario/subInterfaces/direccion';
import { provideIcons } from '@ng-icons/core';
import { heroMapPin, heroPlus, heroHome, heroPhone, heroInformationCircle, heroPencil, heroTrash } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-selector-direcciones',
  templateUrl: './selector-direcciones.component.html',
  styleUrls: ['./selector-direcciones.component.scss'],
  providers: [provideIcons({heroMapPin, heroPlus, heroHome, heroPhone, heroInformationCircle, heroPencil, heroTrash})]
})
export class SelectorDireccionesComponent implements OnInit {
  usuario!: Usuario;
  direcciones: Direccion[] = [];
  direccionSeleccionada?: Direccion;
  cargando: boolean = true;
  mostrarFormulario: boolean = false;
  esModoMovil: boolean = window.innerWidth < 768;
  
  // Propiedades para modo edición
  modoEdicion: boolean = false;
  direccionParaEditar?: Direccion;
  indiceEdicion?: number;
  
  // Propiedades para modal de confirmación
  mostrarModalConfirmacion: boolean = false;
  direccionAEliminar?: Direccion;
  indiceAEliminar?: number;

  constructor(
    private auth: Auth,
    private authService: AuthService,
    private comprarService: ComprarService,
    private router: Router
  ) { }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.esModoMovil = event.target.innerWidth < 768;
  }

  async ngOnInit(): Promise<void> {
    await this.cargarDireccionesUsuario();
  }

  async cargarDireccionesUsuario(): Promise<void> {
    this.cargando = true;
    this.comprarService.clearDireccionEnvio(); // Limpiar dirección al iniciar
    
    try {
      if (!this.auth.currentUser) {
        console.log('❌ No hay usuario autenticado');
        this.router.navigate(['/cuenta/iniciar-sesion']);
        return;
      }

      console.log('✅ Usuario autenticado:', this.auth.currentUser.uid);
      this.usuario = await this.authService.getUsuarioIdPromise(this.auth.currentUser.uid);
      console.log('📦 Usuario completo obtenido:', this.usuario);
      console.log('📍 Direcciones del usuario:', this.usuario.direcciones);
      console.log('📊 Número de direcciones:', this.usuario.direcciones?.length || 0);
      
      if (this.usuario.direcciones && this.usuario.direcciones.length > 0) {
        this.direcciones = this.usuario.direcciones;
        console.log('✅ Se asignaron', this.direcciones.length, 'direcciones al componente');
        console.log('🏠 Direcciones:', this.direcciones);
        
        // Seleccionar la dirección predeterminada si existe o limpiar la selección
        const direccionPredeterminada = this.direcciones.find((dir: Direccion) => dir.direccionPredeterminada);
        if (direccionPredeterminada) {
          this.seleccionarDireccion(direccionPredeterminada);
          console.log('⭐ Dirección predeterminada seleccionada:', direccionPredeterminada);
        } else {
          // Si no hay predeterminada, limpiar la selección local y del servicio
          this.direccionSeleccionada = undefined;
          this.comprarService.clearDireccionEnvio();
          console.log('ℹ️ No hay dirección predeterminada, selección limpiada.');
        }
        
        this.mostrarFormulario = false;
        console.log('👁️ mostrarFormulario =', this.mostrarFormulario);
      } else {
        console.log('⚠️ No tiene direcciones guardadas, mostrando formulario');
        // No tiene direcciones, mostrar formulario directamente
        this.mostrarFormulario = true;
      }
      
      this.cargando = false;
      console.log('✅ Carga completada. Estado final:');
      console.log('  - cargando:', this.cargando);
      console.log('  - mostrarFormulario:', this.mostrarFormulario);
      console.log('  - direcciones.length:', this.direcciones.length);
    } catch (error) {
      console.error('❌ Error al cargar direcciones:', error);
      this.cargando = false;
      this.router.navigate(['/inicio']);
    }
  }

  seleccionarDireccion(direccion: Direccion): void {
    this.direccionSeleccionada = direccion;
    // Guardar automáticamente la dirección seleccionada en el servicio
    this.comprarService.setDireccionEnvio(direccion);
    console.log('✅ Dirección guardada en el servicio:', direccion);
  }

  agregarNuevaDireccion(): void {
    this.router.navigate(['/comprar/checkout/agregar-direccion']);
  }

  direccionAgregada(direccion: Direccion): void {
    this.direcciones.push(direccion);
    this.mostrarFormulario = false;
    this.seleccionarDireccion(direccion);
    this.cargarDireccionesUsuario();
  }

  direccionActualizada(event: { direccion: Direccion, indice: number }): void {
    this.direcciones[event.indice] = event.direccion;
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    if (this.direccionSeleccionada && this.indiceEdicion === this.direcciones.indexOf(this.direccionSeleccionada)) {
      this.seleccionarDireccion(event.direccion);
    }
    this.cargarDireccionesUsuario();
  }

  editarDireccion(direccion: Direccion, index: number): void {
    this.router.navigate(['/comprar/checkout/actualizar-direccion', index]);
  }

  confirmarEliminarDireccion(direccion: Direccion, index: number): void {
    this.mostrarModalConfirmacion = true;
    this.direccionAEliminar = direccion;
    this.indiceAEliminar = index;
  }

  async onConfirmarEliminacion(): Promise<void> {
    if (this.direccionAEliminar && this.auth.currentUser && this.indiceAEliminar !== undefined) {
      try {
        await this.comprarService.eliminarDireccion(this.usuario, this.indiceAEliminar);
        
        this.direcciones.splice(this.indiceAEliminar, 1);

        if (this.direccionSeleccionada === this.direccionAEliminar) {
          this.direccionSeleccionada = undefined;
          this.comprarService.clearDireccionEnvio();
        }

      } catch (error) {
        console.error('Error al eliminar la dirección:', error);
      } finally {
        this.onCancelarEliminacion();
        this.cargarDireccionesUsuario();
      }
    }
  }

  onCancelarEliminacion(): void {
    this.mostrarModalConfirmacion = false;
    this.direccionAEliminar = undefined;
    this.indiceAEliminar = undefined;
  }

  cancelarFormulario(): void {
    if (this.direcciones.length > 0) {
      this.mostrarFormulario = false;
    }
  }

  formatearDireccion(direccion: Direccion): string {
    if (direccion.direccion && direccion.direccion.length >= 4) {
      // Formato: Tipo Calle # Numero - Guion
      return `${direccion.direccion[0]} ${direccion.direccion[1]} # ${direccion.direccion[2]} - ${direccion.direccion[3]}`;
    }
    return 'Dirección no disponible';
  }
}
