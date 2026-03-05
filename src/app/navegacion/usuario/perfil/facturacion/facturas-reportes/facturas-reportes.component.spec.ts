import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturasReportesComponent } from './facturas-reportes.component';

describe('FacturasReportesComponent', () => {
  let component: FacturasReportesComponent;
  let fixture: ComponentFixture<FacturasReportesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FacturasReportesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturasReportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
