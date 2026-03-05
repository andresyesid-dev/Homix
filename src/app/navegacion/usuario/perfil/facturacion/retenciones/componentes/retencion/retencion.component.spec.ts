import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetencionComponent } from './retencion.component';

describe('RetencionComponent', () => {
  let component: RetencionComponent;
  let fixture: ComponentFixture<RetencionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetencionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RetencionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
