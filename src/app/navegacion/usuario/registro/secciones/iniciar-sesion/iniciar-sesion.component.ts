import { Component, HostListener, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { aspectsSocialFacebook } from '@ng-icons/ux-aspects';
import { ionLogoTwitter } from '@ng-icons/ionicons';
import { ionLogoGoogle } from '@ng-icons/ionicons';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { Observable} from 'rxjs';
import { DataSharingService } from 'src/app/servicios/usuarios/data-sharing.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.component.html',
  styleUrls: ['./iniciar-sesion.component.scss'],
  providers: [provideIcons({aspectsSocialFacebook, ionLogoTwitter, ionLogoGoogle})]
})
export class IniciarSesionComponent {
  constructor(private fb: FormBuilder,private zone: NgZone, private router: Router, private authService: AuthService, private dataSharingService: DataSharingService, private auth: Auth) {}
  public form!: FormGroup;
  public user$!: Observable<any>;
  private readonly emailpattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  public errorEmail = false;
  public errorPassword = false;
  public requiredEmail = false;
  public requiredPassword = false;
  anchoPagina: number = window.innerWidth;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.anchoPagina = event.target.innerWidth;
  }

  ngOnInit(): void {
    this.initForm();
    this.user$ = this.authService.userState$;
  }

  private initForm():void {
    this.form = this.fb.group(
      {
        email: ['', [Validators.required]],
        password: ['', [Validators.required]]
      }
    )
  }
  
  async onSubmit(): Promise<void>{
    const {email,password} = this.form.value;
    const errorMessage = await this.authService.singIn(email, password);
    if (errorMessage) {
      if(errorMessage === 'emailError'){
        this.errorEmail = true;
        this.errorPassword = false;
        this.requiredEmail = false;
        this.requiredPassword = false;
      }else if(errorMessage === 'passwordError'){
        this.errorEmail = false
        this.errorPassword = true;
        this.requiredEmail = false;
        this.requiredPassword = false;
      }
      else if(errorMessage === 'emailRequier'){
        this.errorEmail = false
        this.errorPassword = false;
        this.requiredEmail = true;
        this.requiredPassword = false;
      }
      else if(errorMessage === 'passwordRequier'){
        this.errorEmail = false
        this.errorPassword = false;
        this.requiredEmail = false;
        this.requiredPassword = true;
      }
    }else{
      this.errorEmail = false; this.errorPassword = false; this.requiredEmail = false; this.requiredPassword = false;
      
      const { email, password } = this.form.value;
      
      // Obtener el número de teléfono desde Firestore
      const userPhone = await this.authService.getUserPhoneFromFirestore(this.auth.currentUser?.uid);
      
      this.dataSharingService.setFormData({
        email: email,
        password: password,
        phone: userPhone,
        tipo: "singIn"
      });
      this.authService.signOut();
      this.router.navigate(['cuenta/phone-validation']);
    }
  }


  //------------------------------------------
  singInGoogle(){
    this.authService.singInGoogle();
  }
  /*-------- Crear Usuario y Producto ---------*/

  navegar(ruta: string){
    this.zone.run(()=>{
      this.router.navigate([ruta]);
    })
  }

}
