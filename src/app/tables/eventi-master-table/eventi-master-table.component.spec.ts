import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventiMasterTableComponent } from './eventi-master-table.component';

describe('EventiMasterTableComponent', () => {
  let component: EventiMasterTableComponent;
  let fixture: ComponentFixture<EventiMasterTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventiMasterTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventiMasterTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
