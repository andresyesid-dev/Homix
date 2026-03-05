import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { FormsModule, ReactiveFormsModule}  from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { EditarPublicacionComponent } from './editar-publicacion.component';
import { TituloComponent } from './secciones/titulo/titulo.component';
import { DatosPrincipalesComponent } from './secciones/datos-principales/datos-principales.component';
import { EstilosComponent } from './secciones/estilos/estilos.component';
import { FotosComponent } from './secciones/fotos/fotos.component';
import { DetallesComponent } from './secciones/detalles/detalles.component';
import { DescripcionComponent } from './secciones/descripcion/descripcion.component';
import { PrecioComponent } from './secciones/precio/precio.component';
import { EnvioComponent } from './secciones/envio/envio.component';
import { TipoPublicacionComponent } from './secciones/tipo-publicacion/tipo-publicacion.component';


@NgModule({
  declarations: [
    EditarPublicacionComponent,
    TituloComponent,
    DatosPrincipalesComponent,
    EstilosComponent,
    FotosComponent,
    DetallesComponent,
    DescripcionComponent,
    PrecioComponent,
    EnvioComponent,
    TipoPublicacionComponent
  ],
  imports: [
    HttpClientModule,
    CommonModule,
    RouterModule,
    NgIconsModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EditarPublicacionModule { }
