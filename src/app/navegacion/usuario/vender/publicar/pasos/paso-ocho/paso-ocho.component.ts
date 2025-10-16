import { ChangeDetectorRef, Component, HostListener, NgZone, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { PasosVenderService } from '../../../../../../servicios/vender/vender.service';
import { provideIcons } from '@ng-icons/core';
import { heroArrowSmallLeft } from '@ng-icons/heroicons/outline';
import { Subscription } from 'rxjs';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-paso-ocho',
  templateUrl: './paso-ocho.component.html',
  styleUrls: ['./paso-ocho.component.scss'],
  providers: [provideIcons({heroArrowSmallLeft})]
})

export class PasoOchoComponent {
  constructor( private pasos: PasosVenderService, private router: Router, private currencyPipe: CurrencyPipe, private zone: NgZone, private formBuilder: FormBuilder) {}
  public form!: FormGroup; 
  btnSubmit = true;

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.pasos.paso8 ? this.buildForm() : this.router.navigate(['/publicar', 'formulario', 'paso7']);
  }

  private buildForm(): void {
    this.form = this.formBuilder.group({
      precio: [this.pasos.producto.precio, [Validators.required, Validators.minLength(5), Validators.maxLength(11)]]
    });
    this.transformarPrecio();
    this.subscriptions.push(this.form.valueChanges.subscribe(() => {
      this.transformarPrecio();
    }));
  }
  transformarPrecio(){
    if (this.form.value.precio) {
      const formattedPrice = this.form.value.precio.replace(/\D/g, '').replace(/^0+/, '');
      this.form.patchValue({
        precio: this.currencyPipe.transform(formattedPrice, '', '', '1.0-0')
      }, { emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subs => subs.unsubscribe());
  }

  submit(){
    this.pasos.paso9 = true;
    this.pasos.producto.precio = this.form.value.precio.replace(/\./g, '').replace(/,/g, '');
    this.router.navigate(['/publicar', 'formulario', 'paso9']);
  }

  atras(): void {
    if(this.form.value.precio != null){
      this.pasos.producto.precio = Number(this.form.value.precio.replace(/\./g, '').replace(/,/g, ''));
    }
    this.router.navigate(['/publicar', 'formulario', 'paso7']);
  }
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload($event: any): void {
      $event.returnValue = true;
  }
}
