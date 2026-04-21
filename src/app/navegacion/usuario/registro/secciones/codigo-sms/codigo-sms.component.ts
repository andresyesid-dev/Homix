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
  codigoIncorrecto = false;
  check = false;
  private generatedCode!: string; // El código que generamos y enviamos
  enteredCodes: string[] = ['', '', '', '', '', ''];
  cargando = false;
  enviando = false;
  enviandoSms = false;
  codigoReenviado = false;
  tiempoRestante = 60;
  private intervalo: any;

  get tiempoFormateado(): string {
    const min = Math.floor(this.tiempoRestante / 60);
    const seg = this.tiempoRestante % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
  }



  ngOnInit(): void {
    const formData = this.dataSharingService.getFormData();
    if (formData) {
      if(Object.keys(formData).length === 0){
        this.router.navigate(['']);
      }
      this.datos = formData;
      
      console.log('🔍 Datos recibidos:', this.datos);
      console.log('📞 Phone original:', this.datos.phone);
      console.log('📋 Tipo:', this.datos.tipo);
      
      // Normalizar el número siempre
      let numeroLimpio = this.datos.phone.toString();
      
      // Remover cualquier +57 existente para evitar duplicados
      if(numeroLimpio.startsWith('+57')){
        numeroLimpio = numeroLimpio.substring(3);
      } else if(numeroLimpio.startsWith('57')){
        numeroLimpio = numeroLimpio.substring(2);
      }
      
      // Siempre agregar +57 al final
      this.numero = '+57' + numeroLimpio;
      
      console.log('📱 Número final construido:', this.numero);
    }
    setTimeout(() => {
      this.sendVerificationCode();
    }, 10);
  }

  private iniciarCronometro(): void {
    this.tiempoRestante = 60;
    clearInterval(this.intervalo);
    this.intervalo = setInterval(() => {
      if (this.tiempoRestante > 0) {
        this.tiempoRestante--;
      } else {
        clearInterval(this.intervalo);
      }
    }, 1000);
  }

  async reenviarCodigo(): Promise<void> {
    this.enviando = true;
    this.codigoIncorrecto = false;
    this.enteredCodes = ['', '', '', '', '', ''];
    this.verificationInputs.forEach(input => input.nativeElement.value = '');
    await this.sendVerificationCode();
    this.enviando = false;
    this.codigoReenviado = true;
  }

  async enviarPorSms(): Promise<void> {
    this.enviandoSms = true;
    this.codigoReenviado = true;
    this.codigoIncorrecto = false;
    this.enteredCodes = ['', '', '', '', '', ''];
    this.verificationInputs.forEach(input => input.nativeElement.value = '');
    try {
      this.generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const enviarSMS = httpsCallable(this.functions, 'enviarSMS');
      await enviarSMS({ numero: this.numero, codigo: this.generatedCode });
      this.iniciarCronometro();
      this.firstInput.nativeElement.focus();
    } catch (error: any) {
      console.error('Error al enviar SMS:', error);
      alert(`Error SMS: ${error.message}`);
    }
    this.enviandoSms = false;
  }

  async sendVerificationCode() {
    try {
      // Generar código aleatorio de 6 dígitos
      this.generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log('🚀 Enviando WhatsApp...');
      console.log('📱 FROM (debería ser sandbox): whatsapp:+14155238886');
      console.log('📱 TO (número de destino):', `whatsapp:${this.numero}`);
      console.log('🔢 Código:', this.generatedCode);
      
      // Llamar a la Cloud Function para enviar WhatsApp
      const enviarWhatsApp = httpsCallable(this.functions, 'enviarWhatsApp');
      const result = await enviarWhatsApp({
        numero: this.numero,
        codigo: this.generatedCode
      });
      
      console.log('✅ WhatsApp enviado exitosamente:', result);
      this.iniciarCronometro();
      this.firstInput.nativeElement.focus();
    } catch (error: any) {
      console.error('❌ Error al enviar WhatsApp:', error);
      console.error('❌ Código de error:', error.code);
      console.error('❌ Mensaje completo:', error.message);
      
      // Mostrar el error específico
      alert(`Error WhatsApp: ${error.message}`);
    }
  }

  async verifyCode() {
    this.cargando = true;
    const enteredCode = this.enteredCodes.join(''); // Código ingresado por el usuario
    const tipo = this.datos?.tipo;
    const isSignIn = tipo === 'singIn' || tipo === 'signIn';
    const isSignUp = tipo === 'singUp' || tipo === 'signUp';
    const isGoogleFlow = tipo === 'singUpGoogle' || tipo === 'singInGoogle';
    const isForgotPassword = tipo === 'forgotPassword';
    
    // Verificar si el código ingresado coincide con el generado
    if (enteredCode !== this.generatedCode) {
      this.cargando = false;
      this.codigoIncorrecto = true;
      return;
    }

    try {
      let autenticacionExitosa = false;

      // 3.1 - SignIn: Iniciar sesión con email y password
      if(isSignIn){
        await signInWithEmailAndPassword(this.auth, this.datos.email, this.datos.password);
        autenticacionExitosa = true;
      } 
      // 3.2 - SignUp: Crear cuenta con email y password
      else if(isSignUp){
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
        autenticacionExitosa = true;
      } 
      // 3.3 - Google SignIn/SignUp: Continuar sin phoneCredential
      else if(isGoogleFlow){
        const currentUser = this.auth.currentUser;
        if (!currentUser) {
          throw new Error('No hay sesión activa para completar la validación con Google.');
        }

        // Solo actualizar el número en Firestore
        await updateDoc(doc(this.firestore, "usuarios", currentUser.uid), { 
          telefono: this.numero 
        });
        
        if(tipo === 'singUpGoogle'){
          this.authService.usuarioNuevo = true;
        }

        autenticacionExitosa = true;
      } else if (!isForgotPassword) {
        throw new Error(`Tipo de autenticación no soportado: ${tipo}`);
      }
      
      //-----------------------------------------------------------
      // 3.4 - Forgot Password: Enviar email de reset si código es correcto
      if(!isForgotPassword){
        if (!autenticacionExitosa) {
          throw new Error('No se completó la autenticación.');
        }

        this.dataSharingService.deleteData();
        this.check = true;
        this.cargando = false;
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
        this.cargando = false;
      }
    } catch (error) {
      this.cargando = false;
      const {code, message} = error as ErrorResponse;
      console.error('Error en el proceso de autenticación:', error);
      this.codigoIncorrecto = false;
    }
  }

  //--- funcionalidad Inputs ----------------------------------------------------------------------
  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Solo permitir un dígito
    if (!/^\d$/.test(value)) {
      input.value = '';
      this.enteredCodes[index] = '';
      return;
    }

    this.enteredCodes[index] = value;
    this.codigoIncorrecto = false;

    // Avanzar al siguiente input
    const inputs = this.verificationInputs.toArray();
    if (index < inputs.length - 1) {
      inputs[index + 1].nativeElement.focus();
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    const inputs = this.verificationInputs.toArray();

    if (event.key === 'Enter') {
      const codigoCompleto = this.enteredCodes.every(code => /^\d$/.test(code));
      if (codigoCompleto && !this.cargando) {
        this.verifyCode();
      }
      event.preventDefault();
      return;
    }

    if (event.key === 'Backspace') {
      if (input.value) {
        input.value = '';
        this.enteredCodes[index] = '';
      } else if (index > 0) {
        inputs[index - 1].nativeElement.focus();
        inputs[index - 1].nativeElement.value = '';
        this.enteredCodes[index - 1] = '';
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputs[index - 1].nativeElement.focus();
    } else if (event.key === 'ArrowRight' && index < inputs.length - 1) {
      inputs[index + 1].nativeElement.focus();
    } else if (/^\d$/.test(event.key) && input.value) {
      // Si ya tiene un dígito, reemplazar y avanzar
      input.value = event.key;
      this.enteredCodes[index] = event.key;
      if (index < inputs.length - 1) {
        inputs[index + 1].nativeElement.focus();
      }
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text')?.trim() || '';
    const digits = paste.replace(/\D/g, '').substring(0, 6);

    if (!digits.length) return;

    const inputs = this.verificationInputs.toArray();
    for (let i = 0; i < 6; i++) {
      const digit = digits[i] || '';
      inputs[i].nativeElement.value = digit;
      this.enteredCodes[i] = digit;
    }

    // Enfocar el siguiente input vacío, o el último si se llenaron todos
    const focusIndex = Math.min(digits.length, 5);
    inputs[focusIndex].nativeElement.focus();
    this.codigoIncorrecto = false;
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
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
