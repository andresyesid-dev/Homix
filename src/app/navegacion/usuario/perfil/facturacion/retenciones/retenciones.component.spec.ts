import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetencionesComponent } from './retenciones.component';

describe('RetencionesComponent', () => {
  let component: RetencionesComponent;
  let fixture: ComponentFixture<RetencionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetencionesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RetencionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
