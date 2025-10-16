import { Component, Input } from '@angular/core';
import { Opinion } from 'src/app/interfaces/producto/producto';

@Component({
  selector: 'app-opinion',
  templateUrl: './opinion.component.html',
  styleUrls: ['./opinion.component.scss']
})
export class OpinionComponent {
  @Input() opinion!: Opinion;
}
