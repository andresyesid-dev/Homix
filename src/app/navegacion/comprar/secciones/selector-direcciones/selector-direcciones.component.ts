import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { ComprarService } from 'src/app/servicios/comprar/comprar.service';
import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { Direccion } from 'src/app/interfaces/usuario/subInterfaces/direccion';
import { provideIcons } from '@ng-icons/core';
import { heroMapPin, heroPlus, heroHome, heroPhone, heroInformationCircle } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-selector-direcciones',
  templateUrl: './selector-direcciones.component.html',
  styleUrls: ['./selector-direcciones.component.scss'],
  providers: [provideIcons({heroMapPin, heroPlus, heroHome, heroPhone, heroInformationCircle})]
})
export class SelectorDireccionesComponent implements OnInit {
  usuario!: Usuario;
  direcciones: Direccion[] = [];
  direccionSeleccionada?: Direccion;
  cargando: boolean = true;
  mostrarFormulario: boolean = false;

  constructor(
    private auth: Auth,
    private authService: AuthService,
    private comprarService: ComprarService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    await this.cargarDireccionesUsuario();
  }

  async cargarDireccionesUsuario(): Promise<void> {
    this.cargando = true;
    
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
        
        // Seleccionar la dirección predeterminada si existe
        const direccionPredeterminada = this.direcciones.find(dir => dir.direccionPredeterminada);
        if (direccionPredeterminada) {
          this.direccionSeleccionada = direccionPredeterminada;
          console.log('⭐ Dirección predeterminada seleccionada:', direccionPredeterminada);
        } else {
          console.log('ℹ️ No hay dirección predeterminada');
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
    this.mostrarFormulario = true;
  }

  direccionAgregada(direccion: Direccion): void {
    // Recargar direcciones del usuario
    this.cargarDireccionesUsuario();
    this.mostrarFormulario = false;
    // Seleccionar automáticamente la dirección recién agregada
    this.seleccionarDireccion(direccion);
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
