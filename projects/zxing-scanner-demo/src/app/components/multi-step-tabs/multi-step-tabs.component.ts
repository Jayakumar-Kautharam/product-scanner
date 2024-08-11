import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { interval, Subscription, of } from 'rxjs';
import { environment } from 'projects/zxing-scanner-demo/src/environments/environment';
import { UserInterface } from '../../interface/UserInterface';
import { ShipstationService } from '../../services/shipstation.service';

@Component({
  selector: 'app-multi-step-tabs',
  templateUrl: './multi-step-tabs.component.html',
  styleUrls: ['./multi-step-tabs.component.css']
})
export class MultiStepTabsComponent implements OnInit, OnDestroy {

  @ViewChild('barcodeInput', { static: true }) barcodeInput: ElementRef;

  private sessionCheckInterval = 1000; // Check every 10 seconds
  private cacheDuration = 24 * 60 * 60 * 1000; // 1 day in milliseconds
  private sessionSubscription: Subscription;
  private barcodeData = '';  // Temporary storage for barcode data

  currentStep = 1;
  userDeatils: UserInterface = { Authentication: false, UserId: '' };
  shipstationTrakingNumber = 0;
  message = '';

  constructor(private shipStationService: ShipstationService) { }

  ngOnInit(): void {
    this.initializeSessionCheck();
  }

  ngOnDestroy(): void {
    this.stopSessionCheck();
  }

  private initializeSessionCheck(): void {
    this.sessionSubscription = interval(this.sessionCheckInterval).subscribe(() => this.validateSession());
    this.validateSession();
  }

  private stopSessionCheck(): void {
    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
    }
  }

  private validateSession(): void {
    const session = this.getUserSession();
    if (!session) {
      this.currentStep = 1;
    }
  }

  private getUserSession() {
    const cachedData = localStorage.getItem(environment.userDetails);
    const cachedTimestamp = localStorage.getItem(`${environment.userDetails}_timestamp`) || '0';
    if (cachedData && (Date.now() - Number(cachedTimestamp) < this.cacheDuration)) {
      this.userDeatils = { Authentication: true, UserId: cachedData };
      this.currentStep = 2;
      return cachedData;
    } else {
      this.userDeatils = { Authentication: false, UserId: '' };
      this.currentStep = 1;
      return null;
    }
  }

  logoutUserAuth(): void {
    localStorage.removeItem(environment.userDetails);
    localStorage.removeItem(`${environment.userDetails}_timestamp`);
    localStorage.clear();
    this.validateSession();
  }

  getScannedValue(scannedValue: string): void {
    if (this.currentStep === 1) {
      this.startUserSession(scannedValue);
    } else if (this.currentStep === 2) {
      this.processOrderNumber(scannedValue);
    } else if (this.currentStep === 3) {
      this.verifyTrackingNumber(scannedValue);
    }
  }

  private startUserSession(scannedValue: string): void {
    localStorage.setItem(environment.userDetails, scannedValue);
    localStorage.setItem(`${environment.userDetails}_timestamp`, String(Date.now()));
    this.currentStep = 2;
  }

  private processOrderNumber(orderNumber: string): void {
    const sanitizedHex = orderNumber.replace(/[^a-fA-F0-9]/g, '');
    const decimalOutput = this.convertHexToDecimal(sanitizedHex);

    this.shipStationService.getShisatationData(decimalOutput).subscribe({
      next: data => this.handleOrderResponse(data),
      error: error => console.error("Error:", error)
    });
  }

  private convertHexToDecimal(hex: string): number | null {
    const decimal = parseInt(hex, 16);
    return isNaN(decimal) ? null : decimal;
  }

  private handleOrderResponse(data: any): void {
    if (data.shipments.length > 0) {
      this.shipstationTrakingNumber = Number(data.shipments[0].trackingNumber);
      this.currentStep = 3;
      this.displayMessage('Order Scan Successful..!');
    } else {
      this.currentStep = 2;
    }
  }

  private verifyTrackingNumber(trackingNumber: string): void {
    //trackingNumber = '802643821990232660';
    this.shipStationService.getShisatationDataByTrakingNumber(trackingNumber).subscribe({
      next: data => this.handleTrackingResponse(data),
      error: error => console.error("Error:", error)
    });
  }

  private handleTrackingResponse(data: any): void {
    if (data.shipments.length > 0) {
      const receivedTrackingNumber = Number(data.shipments[0].trackingNumber);
      if (receivedTrackingNumber === this.shipstationTrakingNumber) {
        this.currentStep = 4;
      } else {
        this.displayMessage('Something Went Wrong..!', 3);
      }
    } else {
      this.displayMessage('Something Went Wrong..!', 3);
    }
  }

  private displayMessage(msg: string, step: number = 2): void {
    this.message = msg;
    setTimeout(() => {
      this.message = '';
      this.currentStep = step;
    }, 5000);
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onBarcodeInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.getScannedValue(input);
  }
}
