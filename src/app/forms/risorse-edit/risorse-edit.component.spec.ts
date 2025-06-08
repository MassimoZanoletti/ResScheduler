import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RisorseEditComponent } from './risorse-edit.component';

describe('RisorseEditComponent', () => {
  let component: RisorseEditComponent;
  let fixture: ComponentFixture<RisorseEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RisorseEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RisorseEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
