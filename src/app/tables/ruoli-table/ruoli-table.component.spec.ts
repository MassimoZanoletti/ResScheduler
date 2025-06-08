import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuoliTableComponent } from './ruoli-table.component';

describe('RuoliTableComponent', () => {
  let component: RuoliTableComponent;
  let fixture: ComponentFixture<RuoliTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuoliTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RuoliTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
