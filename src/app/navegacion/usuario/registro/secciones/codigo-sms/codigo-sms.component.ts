import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Auth, EmailAuthProvider, createUserWithEmailAndPassword, linkWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { DataSharingService } from 'src/app/servicios/usuarios/data-sharing.service';

interface ErrorResponse  {
  code: string;
  message: string;
}

@Component({
  selector: 'app-codigo-sms',
  templateUrl: './codigo-sms.component.html',
  styleUrls: ['./codigo-sms.component.scss']
})
export class CodigoSMSComponent implements OnInit{
  constructor(
    private authService: AuthService, 
    private auth: Auth, 
    private router: Router, 
    private dataSharingService: DataSharingService, 
    private firestore: Firestore,
    private functions: Functions
  ){}
  @ViewChildren('verificationInput') verificationInputs!: QueryList<ElementRef>;
  @ViewChild('firstInput') firstInput!: ElementRef;
  private datos!: any;
  numero!: string;
  private algo: boolean = false;
  codigoIncorrecto = false;
  check = false;
  private generatedCode!: string; // El código que generamos y enviamos
  enteredCodes: string[] = ['', '', '', '', '', ''];
  cargando = false;



  ngOnInit(): void {
    const formData = this.dataSharingService.getFormData();
    if (formData) {
      if(Object.keys(formData).length === 0){
        this.router.navigate(['']);
      }
      this.datos = formData;
      if(this.datos.tipo === 'singUp' || this.datos.tipo === 'singUpGoogle'){
        this.numero = this.datos.phone.toString();
        this.numero = '+57' + this.numero;
      }else{
        this.numero = this.datos.phone;
      }
    }
    setTimeout(() => {
      this.sendVerificationCode();
    }, 10);
  }

  async sendVerificationCode() {
    try {
      // Generar código aleatorio de 6 dígitos
      this.generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Llamar a la Cloud Function para enviar WhatsApp
      const enviarWhatsApp = httpsCallable(this.functions, 'enviarWhatsApp');
      const result = await enviarWhatsApp({
        numero: this.numero,
        codigo: this.generatedCode
      });
      
      console.log('WhatsApp enviado exitosamente:', result);
      this.firstInput.nativeElement.focus();
    } catch (error) {
      console.error('Error al enviar WhatsApp:', error);
    }
  }

  async verifyCode() {
    this.cargando = true;
    const enteredCode = this.enteredCodes.join(''); // Código ingresado por el usuario
    
    // Verificar si el código ingresado coincide con el generado
    if (enteredCode !== this.generatedCode) {
      this.cargando = false;
      this.codigoIncorrecto = true;
      return;
    }

    try {
      // 3.1 - SignIn: Iniciar sesión con email y password
      if(this.datos.tipo === 'singIn'){
        await signInWithEmailAndPassword(this.auth, this.datos.email, this.datos.password);
      } 
      // 3.2 - SignUp: Crear cuenta con email y password
      else if(this.datos.tipo === 'singUp'){
        const userCredential = await createUserWithEmailAndPassword(this.auth, this.datos.email, this.datos.password);
        
        // Actualizar perfil del usuario
        await updateProfile(userCredential.user, {
          displayName: `${this.datos.name} ${this.datos.lastname}`
        });
        
        // Agregar usuario a Firestore y enviar email de verificación
        await this.authService.addUserFirestore();
        await this.authService.sendEmail(userCredential.user);
        
        // Actualizar número de teléfono en Firestore
        await updateDoc(doc(this.firestore, "usuarios", userCredential.user.uid), { 
          telefono: this.numero 
        });
        
        this.authService.usuarioNuevo = true;
      } 
      // 3.3 - Google SignIn/SignUp: Continuar sin phoneCredential
      else if(this.datos.tipo === 'singUpGoogle' || this.datos.tipo === 'singInGoogle'){
        const currentUser = this.auth.currentUser;
        if (currentUser) {
          // Solo actualizar el número en Firestore
          await updateDoc(doc(this.firestore, "usuarios", currentUser.uid), { 
            telefono: this.numero 
          });
          
          if(this.datos.tipo === 'singUpGoogle'){
            this.authService.usuarioNuevo = true;
          }
        }
      }
      
      //-----------------------------------------------------------
      // 3.4 - Forgot Password: Enviar email de reset si código es correcto
      if(this.datos.tipo !== 'forgotPassword'){
        this.dataSharingService.deleteData();
        this.check = true;
        this.router.navigate(['']);
      } else {
        try {
          await sendPasswordResetEmail(this.auth, this.datos.email);
          this.check = true;
          this.dataSharingService.setFormData({
            email: this.datos.email
          });
          this.router.navigate(['cuenta/email-sent']);
        } catch (error) {
          console.error("Error al enviar el correo electrónico:", error);
        }
      }
    } catch (error) {
      this.cargando = false;
      const {code, message} = error as ErrorResponse;
      console.error('Error en el proceso de autenticación:', error);
      this.codigoIncorrecto = false;
    }
  }

  //--- funcionalidad Inputs ----------------------------------------------------------------------
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

  ngOnDestroy(): void {
    if(!this.check){
      this.authService.signOut();
      this.dataSharingService.deleteData();
    }
  }
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload($event: any): void {
    if (!this.check) {
      this.authService.signOut();
      $event.returnValue = true;
    }
  }
  
}
