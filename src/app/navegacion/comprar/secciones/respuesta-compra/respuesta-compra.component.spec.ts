import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RespuestaCompraComponent } from './respuesta-compra.component';

describe('RespuestaCompraComponent', () => {
  let component: RespuestaCompraComponent;
  let fixture: ComponentFixture<RespuestaCompraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RespuestaCompraComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RespuestaCompraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
