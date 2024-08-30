import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { interval, Subscription, of } from 'rxjs';
import { environment } from 'projects/zxing-scanner-demo/src/environments/environment';
import { UserInterface } from '../../interface/UserInterface';
import { ShipstationService } from '../../services/shipstation.service';
import { Item } from '../../models/item.model';
import { TranslateService } from '@ngx-translate/core';

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
  public signInMessage = '';

  currentStep = 1;
  userDeatils: UserInterface = { Authentication: false, UserId: '' };
  shipstationTrakingNumber:String[] = [];
  public notifyMessage:string = '';
  errorMessage:boolean = false;
  scanning:boolean = false;

  cameraMode:boolean = false;

  scannedValue:any="";

  selectedLanguage:string = 'en';

  constructor(
    private shipStationService: ShipstationService,
    private translate: TranslateService
    ) {
      this.translate.setDefaultLang(this.selectedLanguage); // Set the default language

      this.signInMessage = 'SIGN_IN_MESSAGE';
     }

  ngOnInit(): void {
    this.initializeSessionCheck();
  }

  ngOnDestroy(): void {
    this.stopSessionCheck();
  }

  private initializeSessionCheck(): void {
    if(this.getUserSession()){
      this.signInMessage = '';
      this.currentStep = 2;
      this.errorMessage = false;
      this.displayMessage('USER_AUTHENTICATED');
      setTimeout(() => {
        this.signInMessage = 'SCAN_ORDER_LABEL';
      }, 3000);
    }
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
    this.signInMessage = 'SIGN_IN_MESSAGE';
    this.validateSession();
  }

  getScannedValue(scannedValue: string): void {
    //console.log('currentStep', this.currentStep);
    this.scannedValue = scannedValue;
    if (this.currentStep === 1) {
      this.startUserSession(scannedValue);
    } else if (this.currentStep === 2) {
      this.processOrderNumber(scannedValue);
    } else if (this.currentStep === 3) {
      this.verifyTrackingNumber(scannedValue);
    }
  }

  private startUserSession(scannedValue: string): void {
    this.signInMessage = '';
    const refinedValue = this.removeSpecialChars(scannedValue);
    if(refinedValue.trim() != ''){
      localStorage.setItem(environment.userDetails, refinedValue);
      localStorage.setItem(`${environment.userDetails}_timestamp`, String(Date.now()));
      this.currentStep = 2;
      //this.signInMessage = 'User Authenticated';
      this.errorMessage = false;
      this.displayMessage('USER_AUTHENTICATED');
      setTimeout(() => {
        this.signInMessage = 'SCAN_ORDER_LABEL';
      }, 3000);
    }else{
      this.errorMessage = true;
      this.displayMessage('AUTHENTICATION_FAILED');
      this.currentStep = 1;
    }

  }

  removeSpecialChars(orderNumber):string{
    return orderNumber.replace(/[^\w]/g, '');
  }

  private processOrderNumber(orderNumber: string): void {
    const sanitizedHex = this.removeSpecialChars(orderNumber);
    const decimalOutput = this.convertHexToDecimal(sanitizedHex);
    //const decimalOutput = '762075407';
    this.shipStationService.getShisatationData(sanitizedHex).subscribe({
      next: data => this.handleOrderResponse(data),
      error: (error:any) => {
        this.errorMessage = true;
        this.displayMessage('INVALID_ORDER_ID');
        console.error("Error:", error);
      }
    });
  }

  private convertHexToDecimal(hex: string): number | null {
    const decimal = parseInt(hex, 16);
    return isNaN(decimal) ? null : decimal;
  }

  private handleOrderResponse(data: any): void {
    if (data && data.shipments.length > 0) {
      //this.shipstationTrakingNumber = data.shipments[0].trackingNumber;
      this.shipstationTrakingNumber = data.shipments.map(shipment => shipment.trackingNumber);
      this.currentStep = 3;
      this.signInMessage = 'SCAN_TRACKER_LABEL';
      this.errorMessage = false;
      this.displayMessage('ORDER_SCANNED_SUCCESSFUL');
    } else {
      this.currentStep = 2;
      this.signInMessage = 'SCAN_ORDER_LABEL';
      this.errorMessage = true;
      this.displayMessage('INVALID_ORDER_ID');
    }
  }

  private verifyTrackingNumber(trackingNumber: string): void {
    //const refinedValue = '802643821990232660';
    const refinedValue = this.removeSpecialChars(trackingNumber);
    this.shipStationService.getShisatationDataByTrakingNumber(refinedValue).subscribe({
      next: data => this.handleTrackingResponse(data),
      error: (error:any) => {
        this.errorMessage = true;
        this.displayMessage('INVALID_TRACKING_NUMBER');
        console.error("Error:", error);
      }
    });
  }

  private handleTrackingResponse(data: any): void {

    if (data && data.shipments && data.shipments.length > 0) {
      const receivedTrackingNumbers: string[] = data.shipments.map(shipment => shipment.trackingNumber);
      const isTrackingNumberExists = receivedTrackingNumbers.some(trackingNumber =>
        this.shipstationTrakingNumber.includes(trackingNumber)
      );
      if (isTrackingNumberExists) {
        this.currentStep = 4;
        setTimeout(() => {
          this.notifyMessage = '';
          this.currentStep = 2;
          this.signInMessage = 'SCAN_ORDER_LABEL';
        }, 5000);
      } else {
        this.signInMessage = 'SCAN_TRACKER_LABEL';
        this.errorMessage = false;
        this.displayMessage('INVALID_TRACKING_NUMBER');
      }
    } else {
      this.signInMessage = 'SCAN_TRACKER_LABEL';
      this.errorMessage = true;
      this.displayMessage('TRACKING_DATA_NOT_FOUND');
    }
  }

  private displayMessage(msg: string): void {
    this.notifyMessage = msg;
    setTimeout(() => {
      if(!this.errorMessage){
        this.notifyMessage = '';
      }

    }, 5000);
  }

  previousStep(): void {
    this.signInMessage = 'SCAN_ORDER_LABEL';
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.scanning) {
      this.scanning = true;
      this.barcodeData = '';  // Reset the barcode data
    }

    // Append the current key to the barcode data
    if (event.key && event.key.length === 1 && event.key != 'Enter') {
      this.barcodeData += event.key;
    }

    // When the "Enter" key is pressed, process the barcode data
    if (event.key === 'Enter') {
      this.getScannedValue(this.barcodeData);  // Process the entire scanned value
      this.barcodeData = '';  // Clear the barcode data after processing
      this.scanning = false;  // Reset scanning state
    }
  }

  getCameraMode(event){
    this.cameraMode = event;
  }

  changeLanguage(event:any){
    const selectedLang = event.target.value;
    this.translate.use(selectedLang);
  }


}
