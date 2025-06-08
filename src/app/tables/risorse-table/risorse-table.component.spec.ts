import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RisorseTableComponent } from './risorse-table.component';

describe('RisorseTableComponent', () => {
  let component: RisorseTableComponent;
  let fixture: ComponentFixture<RisorseTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RisorseTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RisorseTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
