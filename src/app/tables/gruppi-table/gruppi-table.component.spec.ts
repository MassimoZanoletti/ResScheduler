import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GruppiTableComponent } from './gruppi-table.component';

describe('GruppiTableComponent', () => {
  let component: GruppiTableComponent;
  let fixture: ComponentFixture<GruppiTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GruppiTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GruppiTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
