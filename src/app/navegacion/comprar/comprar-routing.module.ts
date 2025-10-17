import { ComprarComponent } from './comprar.component'
import { Routes } from '@angular/router';
import { SelectorDireccionesComponent } from './secciones/selector-direcciones/selector-direcciones.component';
import { MetodoPagoComponent } from './secciones/metodo-pago/metodo-pago.component';
import { CambiarDireccionComponent } from './secciones/cambiar-direccion/cambiar-direccion.component';
import { RespuestaCompraComponent } from './secciones/respuesta-compra/respuesta-compra.component';

export const routes: Routes = [
  {
    path: 'comprar/checkout',
    component: ComprarComponent,
    children: [
      {
        path: '',
        redirectTo: 'direccion',
        pathMatch: 'full'
      },
      {
        path: 'direccion',
        component: SelectorDireccionesComponent
      },
      {
        path: 'pago',
        component: MetodoPagoComponent
      },
      {
        path: 'cambiar-direccion',
        component: CambiarDireccionComponent
      },
      {
        path: 'response',
        component: RespuestaCompraComponent
      },
    ]
  }
]