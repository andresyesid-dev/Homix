import { Component, HostListener, NgZone, OnDestroy } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { DataSharingService } from 'src/app/servicios/usuarios/data-sharing.service';

@Component({
  selector: 'app-validar-telefono',
  templateUrl: './validar-telefono.component.html',
  styleUrls: ['./validar-telefono.component.scss']
})
export class ValidarTelefonoComponent implements OnDestroy{
  constructor(private fb: FormBuilder,private zone: NgZone, private router: Router, private dataSharingService: DataSharingService, private authService: AuthService, private auth: Auth) {}
  form!: FormGroup;
  datosRegistros!: any;
  public numeroLength = 0;
  public error = '';
  public check = false;

  ngOnInit(): void {
    const formData = this.dataSharingService.getFormData();

    if (formData) {
      this.datosRegistros = formData;
      if(formData.tipo === 'singIn'){
        this.dataSharingService.setFormData({
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          tipo: formData.tipo
        });
        this.check = true;
        this.router.navigate(['cuenta/phone-validation/enter-code']);
      }else if(formData.tipo === 'singInGoogle' && formData.phone !== undefined && formData.phone !== null){
        this.dataSharingService.setFormData({
          tipo: 'singInGoogle',
          phone: formData.phone
        });
        this.check = true;
        this.router.navigate(['cuenta/phone-validation/enter-code']);
      }
      if(Object.keys(formData).length === 0){
       this.router.navigate(['']);
      }
    }
    this.initForm();
  }
  
  private initForm():void {
    this.form = this.fb.group(
      {
        phone: ['', [Validators.required] ],
      }
    )
  }

  valorInput(){
    if(this.form.get('phone')?.value !== null){
      this.numeroLength = (this.form.get('phone')!.value.toString()).length;
    }else{
      this.numeroLength = 0;
    }
  }

  //------------------------------ SUBMIT -----------------------------------

  async onSubmit(): Promise<void> {
    if (this.numeroLength !== 0) {
      if (this.numeroLength === 10) {
        const { phone } = this.form.value;
        const numero = await this.authService.getTelefonoExistente('+57' + phone).then((existe)=>{
          if(!existe){
            if(this.datosRegistros.tipo === 'singUp'){
              this.dataSharingService.setFormData({
                email: this.datosRegistros.email,
                password: this.datosRegistros.password,
                name: this.datosRegistros.name,
                lastname: this.datosRegistros.lastname,
                phone: phone,
                tipo: 'singUp'
              });
            }else if(this.datosRegistros.tipo === 'singUpGoogle' || this.datosRegistros.tipo === 'singInGoogle'){
              this.dataSharingService.setFormData({
                tipo: this.datosRegistros.tipo, // Mantener el tipo original
                phone: phone
              });
            }
            this.check = true;
            this.router.navigate(['cuenta/phone-validation/enter-code']);
          }else{
            this.error = 'Este número ya se encuentra asociado a una cuenta existente.';
          }
        })
      }else{
        this.error = 'El numero debe de tener 10 carácteres';
      }
    }else{
      this.error = 'El campo es requerido';
    }
  }


  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload($event: any): void {
      if(this.check !== true){
        this.authService.signOut();
        $event.returnValue = true;
      }
  }

  ngOnDestroy(): void {
    if(this.check !== true){
      this.authService.signOut();
      this.dataSharingService.deleteData();
    }
  }

  navegar(ruta: string){
    this.zone.run(()=>{
      this.router.navigate([ruta]);
    })
  }
}
