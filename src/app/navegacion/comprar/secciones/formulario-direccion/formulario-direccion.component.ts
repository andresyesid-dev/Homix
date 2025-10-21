import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { Direccion } from 'src/app/interfaces/usuario/subInterfaces/direccion';
import { provideIcons } from '@ng-icons/core';
import { ionChevronDown } from '@ng-icons/ionicons';
import { heroXMark } from '@ng-icons/heroicons/outline';
import { ActivatedRoute, Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario/usuario';

@Component({
  selector: 'app-formulario-direccion',
  templateUrl: './formulario-direccion.component.html',
  styleUrls: ['./formulario-direccion.component.scss'],
  providers: [provideIcons({ionChevronDown, heroXMark})]
})
export class FormularioDireccionComponent implements OnInit {
  @Input() direccionParaEditar?: Direccion;  // Dirección a editar (si existe)
  @Input() indiceEdicion?: number;           // Índice de la dirección en el array
  @Input() modoEdicion: boolean = false;     // Flag para modo edición
  
  @Output() direccionGuardada = new EventEmitter<Direccion>();
  @Output() direccionActualizada = new EventEmitter<{direccion: Direccion, indice: number}>();
  @Output() cancelar = new EventEmitter<void>();

  form!: FormGroup;
  guardando: boolean = false;
  errorGuardado: string = '';
  usuario!: Usuario;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private authService: AuthService,
    private firestore: Firestore,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    this.createForm();
    
    const user = this.auth.currentUser;
    if (user) {
      this.usuario = await this.authService.getUsuarioIdPromise(user.uid);
    }

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id !== null && this.usuario && this.usuario.direcciones) {
        this.modoEdicion = true;
        this.indiceEdicion = +id;
        this.direccionParaEditar = this.usuario.direcciones[this.indiceEdicion];
        this.cargarDatosParaEdicion();
      }
    });
  }

  createForm(): void {
    this.form = this.fb.group({
      nombresApellidos: ['', [Validators.required, Validators.maxLength(50)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      tipoIdentidad: ['', Validators.required],
      numeroIdentificacion: ['', [Validators.required, Validators.maxLength(10)]],
      municipioLocalidad: ['', Validators.required],
      barrio: ['', [Validators.required, Validators.maxLength(30)]],
      tipoCalle: ['', Validators.required],
      calle: ['', [Validators.required, Validators.maxLength(10)]],
      numero: ['', [Validators.required, Validators.maxLength(10)]],
      guion: ['', [Validators.required, Validators.maxLength(10)]],
      detalle: ['', [Validators.required, Validators.maxLength(50)]],
      indicaciones: ['', Validators.maxLength(100)],
      direccionPredeterminada: [false]
    });
  }

  cargarDatosParaEdicion(): void {
    if (!this.direccionParaEditar) return;

    const direccion = this.direccionParaEditar;
    
    this.form.patchValue({
      nombresApellidos: direccion.nombresApellidos,
      telefono: direccion.telefono,
      tipoIdentidad: direccion.tipoIdentidad,
      numeroIdentificacion: direccion.numeroIdentificacion,
      municipioLocalidad: direccion.municipioLocalidad,
      barrio: direccion.barrio,
      tipoCalle: direccion.direccion?.[0] || '',
      calle: direccion.direccion?.[1] || '',
      numero: direccion.direccion?.[2] || '',
      guion: direccion.direccion?.[3] || '',
      detalle: direccion.detalle,
      indicaciones: direccion.indicaciones || '',
      direccionPredeterminada: direccion.direccionPredeterminada || false
    });
  }

  invalid(input: string): boolean {
    const inputForm = this.form?.get(input);
    return !!(inputForm?.invalid && (inputForm?.dirty || inputForm?.touched));
  }

  async guardarDireccion(): Promise<void> {
    if (!this.form.valid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.guardando = true;
    this.errorGuardado = '';

    try {
      if (!this.auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const formValue = this.form.value;
      
      // Construir el objeto Direccion
      const direccionData: Direccion = {
        nombresApellidos: formValue.nombresApellidos,
        telefono: formValue.telefono,
        tipoIdentidad: formValue.tipoIdentidad,
        numeroIdentificacion: formValue.numeroIdentificacion,
        municipioLocalidad: formValue.municipioLocalidad,
        barrio: formValue.barrio,
        direccion: [
          formValue.tipoCalle,
          formValue.calle,
          formValue.numero,
          formValue.guion
        ],
        detalle: formValue.detalle,
        indicaciones: formValue.indicaciones || '',
        direccionPredeterminada: formValue.direccionPredeterminada || false
      };

      if (this.modoEdicion && this.indiceEdicion !== undefined) {
        // Modo edición: actualizar dirección existente
        await this.actualizarDireccion(direccionData);
      } else {
        // Modo creación: agregar nueva dirección
        await this.agregarNuevaDireccion(direccionData);
      }
      
    } catch (error: any) {
      console.error('Error al guardar dirección:', error);
      this.errorGuardado = 'Error al guardar la dirección. Por favor, intenta nuevamente.';
    } finally {
      this.guardando = false;
    }
  }

  private async agregarNuevaDireccion(nuevaDireccion: Direccion): Promise<void> {
    const usuarioRef = doc(this.firestore, 'usuarios', this.auth.currentUser!.uid);
    
    if (nuevaDireccion.direccionPredeterminada) {
      // Primero obtener el usuario actual
      const usuario = await this.authService.getUsuarioIdPromise(this.auth.currentUser!.uid);
      
      // Si hay direcciones existentes, desmarcarlas como predeterminadas
      if (usuario.direcciones && usuario.direcciones.length > 0) {
        const direccionesActualizadas = usuario.direcciones.map(dir => ({
          ...dir,
          direccionPredeterminada: false
        }));
        
        // Agregar la nueva dirección como predeterminada
        direccionesActualizadas.push(nuevaDireccion);
        
        // Actualizar todo el array
        await updateDoc(usuarioRef, {
          direcciones: direccionesActualizadas
        });
      } else {
        // No hay direcciones, simplemente agregar la nueva
        await updateDoc(usuarioRef, {
          direcciones: arrayUnion(nuevaDireccion)
        });
      }
    } else {
      // Agregar la dirección sin marcarla como predeterminada
      await updateDoc(usuarioRef, {
        direcciones: arrayUnion(nuevaDireccion)
      });
    }

    // Emitir evento de éxito
    this.direccionGuardada.emit(nuevaDireccion);
    this.form.reset();
    this.router.navigate(['/comprar/checkout/seleccionar-direccion']);
  }

  private async actualizarDireccion(direccionActualizada: Direccion): Promise<void> {
    // Obtener el usuario actual
    const usuario = await this.authService.getUsuarioIdPromise(this.auth.currentUser!.uid);
    
    if (!usuario.direcciones || this.indiceEdicion === undefined) {
      throw new Error('No se puede actualizar la dirección');
    }

    // Crear una copia del array de direcciones
    const direccionesActualizadas = [...usuario.direcciones];
    
    // Si se marca como predeterminada, desmarcar todas las demás
    if (direccionActualizada.direccionPredeterminada) {
      direccionesActualizadas.forEach((dir, index) => {
        if (index !== this.indiceEdicion) {
          dir.direccionPredeterminada = false;
        }
      });
    }
    
    // Actualizar la dirección en el índice específico
    direccionesActualizadas[this.indiceEdicion] = direccionActualizada;

    // Actualizar en Firestore
    const usuarioRef = doc(this.firestore, 'usuarios', this.auth.currentUser!.uid);
    await updateDoc(usuarioRef, {
      direcciones: direccionesActualizadas
    });

    // Emitir evento de actualización
    this.direccionActualizada.emit({
      direccion: direccionActualizada,
      indice: this.indiceEdicion
    });
    
    console.log('✅ Dirección actualizada exitosamente');
    this.router.navigate(['/comprar/checkout/seleccionar-direccion']);
  }

  cancelarFormulario(): void {
    this.router.navigate(['/comprar/checkout/seleccionar-direccion']);
  }
}
