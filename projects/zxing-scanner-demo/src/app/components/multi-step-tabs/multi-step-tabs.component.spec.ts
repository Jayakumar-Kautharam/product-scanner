import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiStepTabsComponent } from './multi-step-tabs.component';

describe('MultiStepTabsComponent', () => {
  let component: MultiStepTabsComponent;
  let fixture: ComponentFixture<MultiStepTabsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MultiStepTabsComponent]
    });
    fixture = TestBed.createComponent(MultiStepTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
