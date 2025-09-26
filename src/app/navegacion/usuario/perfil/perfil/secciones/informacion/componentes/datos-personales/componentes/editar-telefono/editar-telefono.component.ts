import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Auth, GoogleAuthProvider, PhoneAuthProvider, RecaptchaVerifier, getAuth, reauthenticateWithPopup, signInWithEmailAndPassword, signInWithPhoneNumber, updateEmail, updatePhoneNumber } from '@angular/fire/auth';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { provideIcons } from '@ng-icons/core';
import { ionClose } from '@ng-icons/ionicons';
import { matCheck } from '@ng-icons/material-icons/baseline';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';

@Component({
  selector: 'app-editar-telefono',
  templateUrl: './editar-telefono.component.html',
  styleUrls: ['./editar-telefono.component.scss'],
  providers: [provideIcons({ionClose, matCheck})]
})
export class EditarTelefonoComponent {
  constructor(private auth:Auth, private authService: AuthService, private firestore: Firestore){}
  @ViewChildren('verificationInput') verificationInputs!: QueryList<ElementRef>;
  @ViewChild('firstInput') firstInput!: ElementRef;
  private algo: boolean = false;
  enteredCodes: string[] = ['', '', '', '', '', ''];
  codigoIncorrecto = false;

  @Input() telefono!:  string;
  @Output() cerrar = new EventEmitter<void>();
  private verificationId!: string;
  password!: string;
  cargando = false;
  telefonoDefecto!: string;
  ingresarNumero = true;
  ingresarContrasena = false;
  ingresarCodigoEmail = false;
  ingresarSMS = false;
  error = '';
  actualizacionExitosa = false;

  capcha = false;

  appVerifier!: RecaptchaVerifier;

  ngOnInit(): void {
    this.telefono = this.telefono.substring(3);
    this.telefonoDefecto = this.telefono;
  }

  cerrarContenido(){
    this.cerrar.emit();
  }
  cerrarcontrasena(){
    this.ingresarContrasena = false; 
    this.error = '';
    this.password = '';
  }
  cerrarCodigoEmail(){
    this.ingresarCodigoEmail = false; 
    this.error = '';
  }
  cerrarSMS(){
    this.cerrar.emit();
  }

  validarInput(event: any) {
    const valor = event.target.value;
    const tecla = event.key;
    if ((valor.length >= 10 || tecla === 'e') && event.keyCode !== 8) {
      event.preventDefault();
    }
  }

  async submit(){
    if(this.telefono.toString().length == 10){
      if(this.telefonoDefecto !== this.telefono.toString() ){
        this.cargando = true;
        const existe = await this.authService.getTelefonoExistente('+57' + this.telefono);
        if(existe){
          this.cargando = false;
          this.error = 'Este número ya se encuentra asociado a una cuenta existente.';
        }else{
          this.cargando = false;
          this.ingresarContrasena = this.auth.currentUser!.providerData.some(provide => provide.providerId === 'password');
          if(!this.ingresarContrasena){
            this.ingresarCodigoEmail = true;
          }
        }
      }else{
        //El número sigue siendo el mismo
        this.error = 'Ingresa un número de teléfono diferente al actual.';
      }
    }else{
      this.error = 'El número ingresado es inválido.';
    }
  }

  async validarcontrasena(){
    this.cargando = true;
    this.error = '';
    const auth = getAuth();
    const email = auth.currentUser!.email!; // reemplaza esto con el correo electrónico del usuario

    signInWithEmailAndPassword(auth, email, this.password)
      .then(async () => {
        this.ingresarContrasena = false;
        this.ingresarSMS = true;
        this.ingresarNumero = false;
        this.cargando = false;
        setTimeout(() => {
          //this.enviarCodigo();
        }, 10);
      })
      .catch((error) => {
        this.cargando = false;
        // Error al iniciar sesión
        if(error = 'auth/wrong-password'){
          this.error = 'Contraseña incorrecta';
        }else{
          console.log(error)
        }
      });
  }

  async reautenticarGmail(){
    this.error = '';
    const provider = new GoogleAuthProvider();
    try {
      await reauthenticateWithPopup(this.auth.currentUser!, provider);
      // Permitir al usuario cambiar su número de teléfono
      this.ingresarSMS = true;
      this.ingresarCodigoEmail = false;
      this.ingresarNumero = false;
      setTimeout(() => {
        //this.enviarCodigo();
      }, 10);
    } catch (error: any) {
      if(error.code == 'auth/user-mismatch'){
        this.error = 'Cuenta incorrecta'
      }else{
        console.log(error);
      }
    }
  }

  async validarCodigo(){
    this.cargando = true;
    this.codigoIncorrecto = false;
    const enteredCode = this.enteredCodes.join('');
    const phoneCredential = PhoneAuthProvider.credential(this.verificationId, enteredCode);
    try {
      await updatePhoneNumber(this.auth.currentUser!, phoneCredential);
      const usuarioRef = doc(this.firestore, `usuarios/${this.auth.currentUser!.uid}`);
      updateDoc(usuarioRef, {telefono: '+57'+ this.telefono});
      this.actualizacionExitosa = true;
      setTimeout(()=>{
        this.cerrarContenido();
      }, 1700)
    } catch (error: any) {
      this.cargando = false;
      if (error.code == 'auth/invalid-verification-code') {
        console.log("Código incorrecto");
        this.codigoIncorrecto = true;
      }else {
        console.error('Error al verificar el código:', error);
      }
    }
  }


  onInput(event: Event,keyboardEvent: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    const enteredCode = input.value;
    this.enteredCodes[index] = enteredCode;
    const inputValue = input.value;

    if (/^\d$/.test(inputValue)) {
      if (inputValue.length === 1 && !this.algo) {
        const nextIndex = index + 1;
        const nextInput = this.verificationInputs.toArray()[nextIndex];
        if (nextInput) {
          nextInput.nativeElement.focus();
        }
      }
    } else {
      input.value = ''; 
    }

    if (inputValue.length > 1 ) {
      input.value = inputValue.charAt(0);
    }
    if (keyboardEvent.repeat) {
      keyboardEvent.preventDefault();
    }
  }
  
  onInputBefore(event: Event,keyboardEvent: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value;
    if (inputValue.length !== 0) {
      if (keyboardEvent.key === 'Backspace') {
        this.algo = false;
      }else{
        this.algo = true;
        keyboardEvent.preventDefault();
      }
    }
    if (inputValue.length === 0 && keyboardEvent.key === 'Backspace') {
      this.algo = false;
      const previousIndex = index - 1;
      if (previousIndex >= 0) {
        const previousInput = this.verificationInputs.toArray()[previousIndex];
        if (previousInput) {
          previousInput.nativeElement.focus();
          previousInput.nativeElement.value = '';
        }
      }
    }
    if (inputValue.length === 0 && keyboardEvent.key === 'e') {
      keyboardEvent.preventDefault();
    }
    if (inputValue.length === 0 && (keyboardEvent.key !== 'e' && keyboardEvent.key !== 'Backspace')) {
      this.algo = false;
    }

  }
}
