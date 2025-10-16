import { Routes } from '@angular/router';

import { PublicarComponent } from './publicar.component';
import { PasoUnoComponent } from './pasos/paso-uno/paso-uno.component';
import { PasoDosComponent } from './pasos/paso-dos/paso-dos.component';
import { PasoTresComponent } from './pasos/paso-tres/paso-tres.component';
import { PasoCuatroComponent } from './pasos/paso-cuatro/paso-cuatro.component';
import { PasoCincoComponent } from './pasos/paso-cinco/paso-cinco.component';
import { PasoSeisComponent } from './pasos/paso-seis/paso-seis.component';
import { PasoSieteComponent } from './pasos/paso-siete/paso-siete.component';
import { PasoOchoComponent } from './pasos/paso-ocho/paso-ocho.component';
import { PasoNueveComponent } from './pasos/paso-nueve/paso-nueve.component';
import { PasoDiezComponent } from './pasos/paso-diez/paso-diez.component';
import { PublicadoComponent } from './pasos/publicado/publicado.component';

export const routes: Routes = [
  {
    path: 'formulario',
    component: PublicarComponent,
    children: [
      {
        path: 'paso1',
        component: PasoUnoComponent
      },
      {
        path: 'paso2',
        component: PasoDosComponent
      },
      {
        path: 'paso3',
        component: PasoTresComponent
      },
      {
        path: 'paso4',
        component: PasoCuatroComponent
      },
      {
        path: 'paso5',
        component: PasoCincoComponent
      },
      {
        path: 'paso6',
        component: PasoSeisComponent
      },
      {
        path: 'paso7',
        component: PasoSieteComponent
      },
      {
        path: 'paso8',
        component: PasoOchoComponent
      },
      {
        path: 'paso9',
        component: PasoNueveComponent
      },
      {
        path: 'paso10',
        component: PasoDiezComponent
      }
    ]
  },
  {
    path: 'producto-publicado/:id',
    component: PublicadoComponent
  }
]
