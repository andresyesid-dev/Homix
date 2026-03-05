import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoPublicacionComponent } from './tipo-publicacion.component';

describe('TipoPublicacionComponent', () => {
  let component: TipoPublicacionComponent;
  let fixture: ComponentFixture<TipoPublicacionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TipoPublicacionComponent]
    });
    fixture = TestBed.createComponent(TipoPublicacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
