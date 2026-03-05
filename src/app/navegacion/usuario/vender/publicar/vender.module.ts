import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconsModule } from '@ng-icons/core';
import { FormsModule, ReactiveFormsModule}  from '@angular/forms'

import { RouterModule } from '@angular/router';
import { routes } from './vender-routing.module';

import { ComponentesGeneralesModule } from 'src/app/navegacion/componentes-generales/componentes-generales.module';

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

@NgModule({
  declarations: [
    PublicarComponent,
    PasoUnoComponent,
    PasoDosComponent,
    PasoTresComponent,
    PasoCuatroComponent,
    PasoCincoComponent,
    PasoSeisComponent,
    PasoSieteComponent,
    PasoOchoComponent,
    PasoNueveComponent,
    PasoDiezComponent,
    PublicadoComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ComponentesGeneralesModule,
    RouterModule.forChild(routes),
    CommonModule,
    NgIconsModule.withIcons({})
  ]
})
export class PublicarModule { }
