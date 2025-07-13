import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventoMasterEditComponent } from './evento-master-edit.component';

describe('EventoMasterEditComponent', () => {
  let component: EventoMasterEditComponent;
  let fixture: ComponentFixture<EventoMasterEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventoMasterEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventoMasterEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
