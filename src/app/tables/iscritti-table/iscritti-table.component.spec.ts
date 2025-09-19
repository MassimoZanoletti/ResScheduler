import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IscrittiTableComponent } from './iscritti-table.component';

describe('IscrittiTableComponent', () => {
  let component: IscrittiTableComponent;
  let fixture: ComponentFixture<IscrittiTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IscrittiTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IscrittiTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
