import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatosPrincipalesComponent } from './datos-principales.component';

describe('DatosPrincipalesComponent', () => {
  let component: DatosPrincipalesComponent;
  let fixture: ComponentFixture<DatosPrincipalesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DatosPrincipalesComponent]
    });
    fixture = TestBed.createComponent(DatosPrincipalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
