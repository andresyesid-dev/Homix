import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ValidatorFn, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { PasosVenderService } from '../../../../../../servicios/vender/vender.service';
import { provideIcons } from '@ng-icons/core';
import { heroArrowSmallLeft } from '@ng-icons/heroicons/outline';
import { matContentPasteSearchOutline } from '@ng-icons/material-icons/outline';

@Component({
  selector: 'app-paso-dos',
  templateUrl: './paso-dos.component.html',
  styleUrls: ['./paso-dos.component.scss'],
  providers: [provideIcons({heroArrowSmallLeft})]
})
export class PasoDosComponent {
  constructor( private pasos: PasosVenderService, private router: Router, private changeDetector: ChangeDetectorRef, private formBuilder: FormBuilder) {}
  form!: FormGroup;

  ngOnInit(): void {
    this.pasos.paso2 ? this.buildForm(this.pasos.producto.nombre) : this.router.navigate(['/publicar', 'formulario', 'paso1']);
    this.changeDetector.detectChanges();
  }

  private buildForm(inDefault: string): void {
    this.form = this.formBuilder.group({
      titulo: [inDefault, [Validators.required, this.pasos.characterCountValidator(10,70)]]
    });
  }

  submit(): any {
    if (this. form && this.form.valid) {
      this.pasos.producto.nombre = this.form.value.titulo.replace(/\s+/g, ' ').trim();
      this.pasos.paso3 = true;
      this.router.navigate(['/publicar', 'formulario', 'paso3']);
    }
  }

  atras(): void {
    this.pasos.producto.nombre = this.form.value.titulo;
    this.pasos.paso1 = true;
    this.router.navigate(['/publicar', 'formulario', 'paso1']);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload($event: any): void {
      $event.returnValue = true;
  }
}
