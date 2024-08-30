import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrakingOrderConfirmationComponent } from './traking-order-confirmation.component';

describe('TrakingOrderConfirmationComponent', () => {
  let component: TrakingOrderConfirmationComponent;
  let fixture: ComponentFixture<TrakingOrderConfirmationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TrakingOrderConfirmationComponent]
    });
    fixture = TestBed.createComponent(TrakingOrderConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
