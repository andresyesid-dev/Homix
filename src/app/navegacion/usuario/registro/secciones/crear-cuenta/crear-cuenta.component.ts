import { Component, HostListener, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { aspectsSocialFacebook } from '@ng-icons/ux-aspects';
import { ionLogoTwitter } from '@ng-icons/ionicons';
import { ionLogoGoogle } from '@ng-icons/ionicons';
import { Router } from '@angular/router';
import { matCheck } from '@ng-icons/material-icons/baseline';
import { matClose } from '@ng-icons/material-icons/baseline';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { Auth } from '@angular/fire/auth';
import { DataSharingService } from 'src/app/servicios/usuarios/data-sharing.service';

@Component({
  selector: 'app-crear-cuenta',
  templateUrl: './crear-cuenta.component.html',
  styleUrls: ['./crear-cuenta.component.scss'],
  providers: [provideIcons({aspectsSocialFacebook, ionLogoTwitter, ionLogoGoogle, matCheck, matClose})]
})
export class CrearCuentaComponent implements OnInit{
  constructor(private fb: FormBuilder,private zone: NgZone, private router: Router, private authService: AuthService, private auth: Auth, private dataSharingService: DataSharingService) {}
  private readonly emailattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d-+_!@#$%^&*.,?]{6,}$/;
  private readonly nombreApellidoPattern = /^[A-Za-záéíóúÁÉÍÓÚñÑ\s]{2,20}$/;
  form!: FormGroup;
  user$!: Observable<any>;
  passwordCheck!: boolean | null;
  inputFunction = false;
  checkbox = true;
  checkedbox = false;
  requerimientos = [false, false, false];
  correoExistente = '';
  cargando = false;

  anchoPagina: number = window.innerWidth;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.anchoPagina = event.target.innerWidth;
  }

  ngOnInit(): void {
    this.initForm();
    //this.authService.signOut();
    this.user$ = this.authService.userState$;
  }

  private initForm():void {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2), Validators.pattern(this.nombreApellidoPattern)] ],
        lastname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(this.nombreApellidoPattern)] ],
        email: ['', [Validators.required, Validators.pattern(this.emailattern)] ],
        password: ['', [Validators.required, Validators.minLength(6),Validators.maxLength(25),Validators.pattern(this.passwordPattern)]],
        passwordVerify: ['', [Validators.required]],
        checkbox: false 
      });
  }
  validarContrasena(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    const tieneMinuscula = /[a-z]/.test(input);
    const tieneMayuscula = /[A-Z]/.test(input);
    const tieneNumero = /[0-9]/.test(input);
  
    if (tieneMinuscula) {
      this.requerimientos[0] = true;
    } else {
      this.requerimientos[0] = false;
    }
  
    if (tieneMayuscula) {
      this.requerimientos[1] = true;
    } else {
      this.requerimientos[1] = false;
    }
  
    if (tieneNumero) {
      this.requerimientos[2] = true;
    } else {
      this.requerimientos[2] = false;
    }
  }

  correoNuevo(){
    this.correoExistente = '';
  }
  
  passwordVerifyValidator(group: FormGroup){
    const password = group.get('password')?.value;
    const passwordVerify = group.get('passwordVerify')?.value;
    this.passwordCheck = password === passwordVerify ? true : false;
  }
  hasError(field: string ): boolean{
    const fieldName = this.form.get(field);
    return !! fieldName?.invalid && fieldName.touched;
  }

  //----------------------------------------------------------

  async onSubmit(): Promise<void> {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  
    if (this.form.valid) {
      this.passwordVerifyValidator(this.form);
      if(this.form.get('checkbox')!.value){
        if(this.passwordCheck){
          this.cargando = true;
          const { email, password, name, lastname } = this.form.value;
          await this.authService.getCorreoExistente(email).then((existe)=>{
            if(!existe){
              this.dataSharingService.setFormData({
                email: email,
                password: password,
                name: name,
                lastname: lastname,
                tipo: 'singUp'
              });
              this.router.navigate(['cuenta/phone-validation']);
            }else{
              this.cargando = false;
              this.correoExistente = 'Este correo ya se encuentra asociado a una cuenta existente.';
            }
          })
        }else{
          this.inputFunction = true;
        }
      }else{
        this.checkbox = false;
      }
    }
  }


  //------------------------------------------
  singInGoogle(){
    this.authService.singInGoogle();
  }
  //---------------------------------------------------------------
  navegar(ruta: string){
    this.zone.run(()=>{
      this.router.navigate([ruta]);
    })
  }
  handleCheckBoxChange() { // CheckBox
    const isChecked = this.form.get('checkbox')!.value;
    this.checkbox = isChecked;
    this.checkedbox = isChecked;
  }
}
