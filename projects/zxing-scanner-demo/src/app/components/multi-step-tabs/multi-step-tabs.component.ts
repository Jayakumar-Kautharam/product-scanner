import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { interval, Subscription, of } from 'rxjs';
import { environment } from 'projects/zxing-scanner-demo/src/environments/environment';
import { UserInterface } from '../../interface/UserInterface';
import { ShipstationService } from '../../services/shipstation.service';
import { Item } from '../../models/item.model';
import { TranslateService } from '@ngx-translate/core';
import { NgbCarouselConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TrakingOrderConfirmationComponent } from '../../model-popups/traking-order-confirmation/traking-order-confirmation.component';

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
  userDeatils: UserInterface = { Authentication: false, UserData: {} };
  shipstationTrakingNumber:String[] = [];
  public notifyMessage:string = '';
  errorMessage:boolean = false;
  scanning:boolean = false;

  cameraMode:boolean = false;

  scannedValue:any="";

  selectedLanguage:string = 'en';
  barcodeScanned:boolean = false;

  orderDetailsExist:boolean = false;

  constructor(
    private shipStationService: ShipstationService,
    private translate: TranslateService,
    private modalService: NgbModal,
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
    this.validateStep2();
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
    const cachedData:any = JSON.parse(localStorage.getItem(environment.userDetails));
    //const cachedTimestamp = localStorage.getItem(`${environment.userDetails}_timestamp`) || '0';
    if (cachedData) {
      this.userDeatils = { Authentication: true, UserData: cachedData };
      return cachedData;
    } else {
      this.userDeatils = { Authentication: false, UserData: {} };
      this.currentStep = 1;
      return null;
    }
  }

  logoutUserAuth(): void {
    localStorage.removeItem(environment.userDetails);
    localStorage.removeItem(environment.step2);
    localStorage.removeItem(environment.step2TrakingDetails);
    localStorage.clear();
    this.signInMessage = 'SIGN_IN_MESSAGE';
    this.validateSession();
  }

  getScannedValue(scannedValue: string): void {
    //this.getConfirmationFromUser();
    this.scannedValue = scannedValue;
    if (!this.barcodeScanned && this.currentStep === 1) {
      this.startUserSession(scannedValue);
    } else if (!this.barcodeScanned && this.currentStep === 2) {
      this.processOrderNumber(scannedValue);
    } else if (!this.barcodeScanned && this.currentStep === 3) {
      this.verifyTrackingNumber(scannedValue);
    }
  }


  /****************************** Start Of Step-1  *********************************/

  async startUserSession(scannedValue: string) {
    this.barcodeScanned = true;
    this.signInMessage = '';
    //const refinedValue = this.removeSpecialChars(scannedValue);
    const userBarcode:any = {
      "barcode": scannedValue
    }
    await this.shipStationService.userUthentication(userBarcode).subscribe({
      next:(data)=>this.handleUserSession(data, scannedValue),
      error:(e)=>{
        console.log(e);
      }
    });
  }

  handleUserSession(data:any, scannedValue){
    this.barcodeScanned = false;
    if(data && data.UserId){
      const UserData:any = {
        'UserId':data.UserId,
        'UserBarcode':scannedValue,
        'SessionId': this.generateSessionId(scannedValue),
      }
      this.currentStep = 2;
      this.errorMessage = false;
      this.displayMessage('USER_AUTHENTICATED');
      this.userDeatils = { Authentication: true, UserData: UserData };
      localStorage.setItem(environment.userDetails, JSON.stringify(UserData));
      this.signInMessage = 'SCAN_ORDER_LABEL';
    }else{
      this.errorMessage = true;
      this.displayMessage('AUTHENTICATION_FAILED');
      this.userDeatils = { Authentication: true, UserData: null };
      this.currentStep = 1;
    }
  }

  private generateSessionId(scannedValue: string): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    const formattedDate = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;

    return `${scannedValue}_${formattedDate}`;
}


  /****************************** End Of Step-1  *********************************/




  /****************************** Start Of Step-2  *********************************/

  async processOrderNumber(orderNumber: string) {
    this.barcodeScanned = true;
    const sanitizedHex = this.removeSpecialChars(orderNumber);
    //const decimalOutput = '762075407';
    let userDetails:any = JSON.parse(localStorage.getItem(environment.userDetails));
    userDetails.OrderId = Number(sanitizedHex);
    await this.shipStationService.orderScan(userDetails).subscribe({
      next: data => this.handleOrderResponse(data),
      error: (error:any) => {
        this.errorMessage = true;
        this.displayMessage('INVALID_ORDER_ID');
        console.error("Error:", error);
      }
    });
  }

  removeSpecialChars(orderNumber):string{
    return orderNumber.replace(/[^\w]/g, '');
  }

  private handleOrderResponse(data: any): void {
    this.barcodeScanned = false;
    const refinedData:any = this.processPayload(data);
    localStorage.setItem(environment.step2, JSON.stringify(refinedData));
    if (refinedData) {
      this.shipstationTrakingNumber = refinedData.TrackingNumbers;
      this.currentStep = 3;
      this.signInMessage = 'SCAN_TRACKER_LABEL';
      this.errorMessage = false;
      this.displayMessage('ORDER_SCANNED_SUCCESSFUL');
      const trakingData =  this.transformData(refinedData);
      localStorage.setItem(environment.step2TrakingDetails, JSON.stringify(trakingData));
    } else {
      this.currentStep = 2;
      this.signInMessage = 'SCAN_ORDER_LABEL';
      this.errorMessage = true;
      this.displayMessage('INVALID_ORDER_ID');
      localStorage.removeItem(environment.step2TrakingDetails);
    }
  }

  processPayload(data: any): any {
    let parsedPayload;
    if (typeof data.response_payload === 'string') {
      try {
        parsedPayload = JSON.parse(data.response_payload);
        // Optionally, you can replace the string with the parsed object
        data.response_payload = parsedPayload;
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        // Handle the error or return null, depending on your requirements
        return null;
      }
    } else {
      parsedPayload = data.response_payload;
    }

    return parsedPayload;
  }

  private validateStep2(){
    const stepTwoData = JSON.parse(localStorage.getItem(environment.step2));
    if(stepTwoData){
      this.validateTrakingDetails(stepTwoData);
      this.shipstationTrakingNumber = stepTwoData.TrackingNumbers;
      this.currentStep = 3;
      this.signInMessage = 'SCAN_TRACKER_LABEL';
      this.errorMessage = false;
    }else{
      this.currentStep = 2;
      this.signInMessage = 'SCAN_ORDER_LABEL';
    }
  }



  private validateTrakingDetails(stepTwoData:any){
    if(!this.orderDetailsExist){
      const trakingData =  this.transformData(stepTwoData);
      localStorage.setItem(environment.step2TrakingDetails, JSON.stringify(trakingData));
      this.orderDetailsExist = true;
    }else{
      localStorage.removeItem(environment.step2TrakingDetails);
    }

  }

  transformData(oldData: any): any {
    const newData = {
        sessionId: oldData.SessionId,
        tracking_payload: {
            TrackingNumbers: oldData.TrackingNumbers.map((trackingNumber: string) => {
                return {
                    TrackingNumber: trackingNumber,
                    IsVerified: false  // Assuming you want this to always be true
                };
            })
        }
    };
    return newData;
  }

  /****************************** End Of Step-2  *********************************/


  /****************************** Start Of Step-3  *********************************/

  private verifyTrackingNumber(trackingNumber: string): void {
    this.barcodeScanned = true;
    const refinedValue = this.removeSpecialChars(trackingNumber);
    const updatedTakingDetails = this.verifyTrackingNumbers(refinedValue);

    this.shipStationService.validateTrackingDetails(updatedTakingDetails).subscribe();
    this.currentStep = 4;
    setTimeout(() => {
      this.notifyMessage = '';
      this.currentStep = 2;
      this.signInMessage = 'SCAN_ORDER_LABEL';
      localStorage.removeItem(environment.step2);
      localStorage.removeItem(environment.step2TrakingDetails);
    }, 5000);
    /*this.shipStationService.validateTrackingDetails(updatedTakingDetails).subscribe({
      next: data => this.handleTrackingResponse(data),
      error: (error:any) => {
        this.errorMessage = true;
        this.displayMessage('INVALID_TRACKING_NUMBER');
        console.error("Error:", error);
      }
    });*/
  }

  private verifyTrackingNumbers(trackingNumber){
    const trakingCacheData = JSON.parse(localStorage.getItem(environment.step2TrakingDetails));
    const trackingNumbers = trakingCacheData.tracking_payload.TrackingNumbers;
    let isUpdated = false;
    trackingNumbers.forEach((trackingItem: any) => {
      if (trackingItem.TrackingNumber === trackingNumber) {
          trackingItem.IsVerified = true;
          isUpdated = true;
      }
    });
    if (isUpdated) {
      localStorage.setItem(environment.step2TrakingDetails, JSON.stringify(trakingCacheData));
    }
    return trakingCacheData;

  }

  private handleTrackingResponse(data: any): void {
    this.barcodeScanned = false;
    if (data && data.shipments && data.shipments.length > 0) {

      if(this.shipstationTrakingNumber.length > 0){
        //this.getConfirmationFromUser();
      }

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

  /****************************** End Of Step-3  *********************************/


  getConfirmationFromUser(){
    const modalRefApprove = this.modalService.open(TrakingOrderConfirmationComponent);
    modalRefApprove.componentInstance.OutputData.subscribe((data:any) => {
      alert(data);
    });
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
