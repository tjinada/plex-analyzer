import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryAnalyzerComponent } from './library-analyzer.component';

describe('LibraryAnalyzerComponent', () => {
  let component: LibraryAnalyzerComponent;
  let fixture: ComponentFixture<LibraryAnalyzerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryAnalyzerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LibraryAnalyzerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
