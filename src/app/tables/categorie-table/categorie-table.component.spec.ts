import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategorieTableComponent } from './categorie-table.component';

describe('CategorieTableComponent', () => {
  let component: CategorieTableComponent;
  let fixture: ComponentFixture<CategorieTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategorieTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CategorieTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
