import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuoloEditComponent } from './ruolo-edit.component';

describe('RuoloEditComponent', () => {
  let component: RuoloEditComponent;
  let fixture: ComponentFixture<RuoloEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuoloEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RuoloEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
