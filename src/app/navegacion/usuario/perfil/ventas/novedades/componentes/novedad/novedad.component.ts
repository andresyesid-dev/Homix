import { Component, Input } from '@angular/core';
import { Novedad } from 'src/app/interfaces/novedad';

@Component({
  selector: 'app-novedad',
  templateUrl: './novedad.component.html',
  styleUrls: ['./novedad.component.scss']
})
export class NovedadComponent {
  @Input() novedad!: Novedad;
}
