import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GruppoEditComponent } from './gruppo-edit.component';

describe('GruppoEditComponent', () => {
  let component: GruppoEditComponent;
  let fixture: ComponentFixture<GruppoEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GruppoEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GruppoEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
