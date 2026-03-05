import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvioComponent } from './envio.component';

describe('EnvioComponent', () => {
  let component: EnvioComponent;
  let fixture: ComponentFixture<EnvioComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EnvioComponent]
    });
    fixture = TestBed.createComponent(EnvioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
