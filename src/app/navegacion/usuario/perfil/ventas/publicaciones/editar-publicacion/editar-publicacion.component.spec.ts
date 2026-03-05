import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarPublicacionComponent } from './editar-publicacion.component';

describe('EditarPublicacionComponent', () => {
  let component: EditarPublicacionComponent;
  let fixture: ComponentFixture<EditarPublicacionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditarPublicacionComponent]
    });
    fixture = TestBed.createComponent(EditarPublicacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
