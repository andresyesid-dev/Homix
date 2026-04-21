import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule}  from '@angular/forms';

import { ComponentesGeneralesModule } from '../../componentes-generales/componentes-generales.module';
import { NgIconsModule } from '@ng-icons/core';

import { ComoVenderComponent } from './como-vender.component';
import { EncabezadoVenderComponent } from './encabezado-vender/encabezado-vender.component';
import { AgendarLlamadaComponent } from './agendar-llamada/agendar-llamada.component';
import { FormularioAgendamientoComponent } from './agendar-llamada/componentes/formulario-agendamiento/formulario-agendamiento.component';
import { AgendaDisponibleComponent } from './agendar-llamada/componentes/agenda-disponible/agenda-disponible.component';
import { PasosVenderComponent } from './pasos-vender/pasos-vender.component';
import { ParteSuperiorVenderComponent } from './parte-superior-vender/parte-superior-vender.component';
import { AsesoriaVenderComponent } from './asesoria-vender/asesoria-vender.component';


@NgModule({
  declarations: [
    ComoVenderComponent,
    AsesoriaVenderComponent,
    EncabezadoVenderComponent,
    AgendarLlamadaComponent,
    FormularioAgendamientoComponent,
    AgendaDisponibleComponent,
    PasosVenderComponent,
    ParteSuperiorVenderComponent
  ],
  imports: [
    ReactiveFormsModule,
    NgIconsModule,
    ComponentesGeneralesModule,
    CommonModule
  ]
})
export class VenderModule { }
