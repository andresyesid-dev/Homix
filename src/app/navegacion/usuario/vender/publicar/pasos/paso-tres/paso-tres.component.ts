import { Component, OnInit, AfterViewInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PasosVenderService } from '../../../../../../servicios/vender/vender.service';
import { provideIcons } from '@ng-icons/core';
import { heroArrowSmallLeft } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-paso-tres',
  templateUrl: './paso-tres.component.html',
  styleUrls: ['./paso-tres.component.scss'],
  providers: [provideIcons({heroArrowSmallLeft})]
})
export class PasoTresComponent implements OnInit{
  constructor(private pasos: PasosVenderService,private router: Router,private formBuilder: FormBuilder, private changeDetector: ChangeDetectorRef) {}
  form!: FormGroup;
  submitValue = false;
  producto!: any;
  hechoPorMi = false;
  autoriaEntrante!: string;
  hechoPorMiEntrante!: boolean;

  ngOnInit(): void {
    this.pasos.paso3 ? this.buildForm(this.pasos.producto) : this.router.navigate(['/publicar', 'formulario', 'paso2']);

  }

  private buildForm(producto: any): void {
    if(this.pasos.producto.autoria == 'Hecho por mi'){
      this.hechoPorMiEntrante = true;
      this.hechoPorMi = true;
      this.submitValue = true;
    }else if(this.pasos.producto.autoria){
      this.autoriaEntrante = this.pasos.producto.autoria;
    }
    this.producto = producto;
    this.form = this.formBuilder.group({
      autoria: [this.autoriaEntrante, [Validators.required, this.pasos.characterCountValidator(2,50)]],
      hechoPorMi: [this.hechoPorMiEntrante, []],
      marca: [producto.marca, []],
      modelo: [producto.modelo, []],
    });
    if(this.form.valid){
      this.submitValue = true;
    }
  }

  validar(){
    if(this.form.value.hechoPorMi == true){
      this.hechoPorMi = true;
      this.submitValue = true;
    }else{
      this.hechoPorMi = false;
      this.submitValue = false;
      if(this.form.valid){
        this.submitValue = true;
      }
    }
  }

  submit(): void {
    if(this.form.value.hechoPorMi == true){
      this.producto.autoria = 'Hecho por mi';
    }else{
      this.producto.autoria = this.form.value.autoria.replace(/\s+/g, ' ').trim();
    }
    this.form.value.marca ? this.producto.marca = this.form.value.marca.replace(/\s+/g, ' ').trim() : this.producto.marca = 'Genérica'
    this.form.value.modelo ? this.producto.modelo = this.form.value.modelo.replace(/\s+/g, ' ').trim() : this.producto.modelo = 'N/A'
    //-------------------
    this.pasos.paso4 = true;
    this.router.navigate(['/publicar', 'formulario', 'paso4']);
  }

  atras(): void {
    if(this.form.value.hechoPorMi == true){
      this.producto.autoria = 'Hecho por mi';
    }else{
      this.producto.autoria = this.form.value.autoria;
    }
    this.form.value.marca ? this.producto.marca = this.form.value.marca : this.producto.marca = 'Genérica'
    this.form.value.modelo ? this.producto.modelo = this.form.value.modelo : this.producto.modelo = 'N/A'

    this.router.navigate(['/publicar', 'formulario', 'paso2']);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload($event: any): void {
      $event.returnValue = true;
  }
}
