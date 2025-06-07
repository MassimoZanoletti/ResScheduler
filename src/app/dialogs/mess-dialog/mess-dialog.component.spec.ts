import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessDialogComponent } from './mess-dialog.component';

describe('MessDialogComponent', () => {
  let component: MessDialogComponent;
  let fixture: ComponentFixture<MessDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MessDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
