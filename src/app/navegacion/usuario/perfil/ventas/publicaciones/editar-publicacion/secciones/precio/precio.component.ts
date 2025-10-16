import { CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { provideIcons } from '@ng-icons/core';
import { matCheck } from '@ng-icons/material-icons/baseline';

@Component({
  selector: 'app-precio',
  templateUrl: './precio.component.html',
  styleUrls: ['./precio.component.scss'],
  providers: [provideIcons({matCheck})]
})
export class PrecioComponent {
  constructor( private router: Router, private currencyPipe: CurrencyPipe, private formBuilder: FormBuilder, private firestore: Firestore) {}
  @Input() precio!: number;
  @Input() productoId!: string;
  public form!: FormGroup; 
  btnSubmit = true;
  actualizacionExitosa = false;
  cambios = false;
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.form = this.formBuilder.group({
      precio: [this.precio, [Validators.required, Validators.minLength(5), Validators.maxLength(11)]]
    });
    this.transformarPrecio();
    this.subscriptions.push(this.form.valueChanges.subscribe(() => {
      this.transformarPrecio();
      this.cambios = true;
    }));
  }
  transformarPrecio(){
    if (this.form.value.precio) {
      const formattedPrice = this.form.value.precio.toString().replace(/\D/g, '').replace(/^0+/, '');
      this.form.patchValue({
        precio: this.currencyPipe.transform(formattedPrice, '', '', '1.0-0')
      }, { emitEvent: false });
    }
  }


  ngOnDestroy(): void {
    this.subscriptions.forEach(subs => subs.unsubscribe());
  }

  async submit(){
    this.actualizacionExitosa = true;
    setTimeout(()=>{
      this.actualizacionExitosa = false;
      this.cambios = false;
    }, 1500)
    await updateDoc(doc(this.firestore, `productos/${this.productoId}`), {precio: this.form.value.precio.replace(/\./g, '').replace(/,/g, '')});
  }
}
