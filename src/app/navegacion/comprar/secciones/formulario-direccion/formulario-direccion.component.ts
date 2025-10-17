import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { Direccion } from 'src/app/interfaces/usuario/subInterfaces/direccion';
import { provideIcons } from '@ng-icons/core';
import { ionChevronDown } from '@ng-icons/ionicons';
import { heroXMark } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-formulario-direccion',
  templateUrl: './formulario-direccion.component.html',
  styleUrls: ['./formulario-direccion.component.scss'],
  providers: [provideIcons({ionChevronDown, heroXMark})]
})
export class FormularioDireccionComponent implements OnInit {
  @Output() direccionGuardada = new EventEmitter<Direccion>();
  @Output() cancelar = new EventEmitter<void>();

  form!: FormGroup;
  guardando: boolean = false;
  errorGuardado: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private authService: AuthService,
    private firestore: Firestore
  ) { }

  ngOnInit(): void {
    this.createForm();
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
      const nuevaDireccion: Direccion = {
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

      // Si se marca como predeterminada, obtener usuario y actualizar todas las direcciones
      const usuarioRef = doc(this.firestore, 'usuarios', this.auth.currentUser.uid);
      
      if (nuevaDireccion.direccionPredeterminada) {
        // Primero obtener el usuario actual
        const usuario = await this.authService.getUsuarioIdPromise(this.auth.currentUser.uid);
        
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
      
    } catch (error: any) {
      console.error('Error al guardar dirección:', error);
      this.errorGuardado = 'Error al guardar la dirección. Por favor, intenta nuevamente.';
    } finally {
      this.guardando = false;
    }
  }

  cancelarFormulario(): void {
    this.cancelar.emit();
  }
}
