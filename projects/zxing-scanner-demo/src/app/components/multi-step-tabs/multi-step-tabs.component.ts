import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, NgZone, ApplicationRef  } from '@angular/core';
import { interval, Subscription, of } from 'rxjs';
import { environment } from 'projects/zxing-scanner-demo/src/environments/environment';
import { UserInterface } from '../../interface/UserInterface';
import { ShipstationService } from '../../services/shipstation.service';
import { Item } from '../../models/item.model';
import { TranslateService } from '@ngx-translate/core';
import { NgbCarouselConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TrakingOrderConfirmationComponent } from '../../model-popups/traking-order-confirmation/traking-order-confirmation.component';
import { ChangeDetectorRef } from '@angular/core';
import { ToastNotificationsService } from '../../services/toast-notification-service/toast-notifications.service';

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
  userConfirmation:boolean = false;
  orderId:string='';
  trackingData:string = '';

  constructor(
    private shipStationService: ShipstationService,
    private translate: TranslateService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    public toastService: ToastNotificationsService,
    private zone: NgZone,
    private appRef: ApplicationRef
    ) {
      this.translate.setDefaultLang(this.selectedLanguage); // Set the default language

      //this.signInMessage = 'SIGN_IN_MESSAGE';
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
      //this.currentStep = 2;
      this.errorMessage = false;
      //this.displayMessage('USER_AUTHENTICATED');
      const stepTwoData = JSON.parse(localStorage.getItem(environment.step2));
      if(!stepTwoData){
        this.continueSecondStep();
      }
      setTimeout(() => {
        //this.signInMessage = 'SCAN_ORDER_LABEL';
      }, 3000);
    }
    this.sessionSubscription = interval(this.sessionCheckInterval).subscribe(() => this.validateSession());
    this.validateSession();
    this.validateStep2();
    this.getOrderId();
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
    this.signInMessage = '';
    localStorage.removeItem(environment.userDetails);
    localStorage.removeItem(environment.step2);
    localStorage.removeItem(environment.step2TrakingDetails);
    localStorage.clear();
    //this.validateSession();
    this.scannedValue = '';
    this.cdr.detectChanges();
    this.getOrderId();

    this.initializeSessionCheck();
  }

  getScannedValue(scannedValue: string): void {
    //this.getConfirmationFromUser();
    this.scannedValue = scannedValue;
    this.cdr.detectChanges();
    if (!this.barcodeScanned && this.currentStep === 1) {
      this.startUserSession(scannedValue);
    } else if (!this.barcodeScanned && this.currentStep === 2) {
      this.processOrderNumber(scannedValue);
    } else if (!this.barcodeScanned && this.currentStep === 3) {
      this.verifyTrackingNumber(scannedValue);
    }

  }

  getOrderId(){
    const storedData = localStorage.getItem(environment.step2);
    if (storedData) {
      const refinedData = JSON.parse(storedData);
      this.orderId = `OrderID: ${refinedData.OrderId}`;
    }else{
      this.orderId = "";
    }
    this.cdr.detectChanges();
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
      next:(data)=>{

        this.handleUserSession(data, scannedValue);
        this.signInMessage = "SCAN_ORDER_LABEL";
      },
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

      //this.displayMessage('USER_AUTHENTICATED');
      this.userDeatils = { Authentication: true, UserData: UserData };
      this.userConfirmation = true;
      localStorage.setItem(environment.userDetails, JSON.stringify(UserData));
      this.signInMessage = 'SCAN_ORDER_LABEL';
      this.cdr.detectChanges();
      //this.currentStep = 2;
      this.errorMessage = false;
      this.continueSecondStep();
    }else{
      this.errorMessage = true;
      const messageData = {
        Title: 'User login',
        TitleTextClass: 'text-white',
        Icon:'icon fa fa-ban',
        Message: 'User Authentication Failed. Click OK to Continue',
        MessageTextClass: 'text-white',
        ModelBackground:'bg-danger',
        ButtonOKClass:'btn-block btn-outline-light',
        ButtonCancelClass:'btn-block btn-outline-info'
      }
      this.messagePopup(messageData);
      //this.displayMessage('AUTHENTICATION_FAILED');
      this.userDeatils = { Authentication: true, UserData: null };
      this.currentStep = 1;
    }
  }

  private messagePopup(popupData:any){
    const modalRefApprove = this.modalService.open(TrakingOrderConfirmationComponent, {
      backdrop: 'static', // Prevent closing on outside click
      keyboard: false     // Prevent closing on pressing the Escape key (optional)
    });
    const inputData:any = {
      'CARD_BG_CLASS':popupData.ModelBackground,
      'TITLE':popupData.Title,
      'CLASS_ICON':popupData.Icon,
      'TITLE_TEXT_CLASS':popupData.TitleTextClass,
      'MESSAGE': popupData.Message,
      'MESSAGE_TEXT_CLASS':popupData.MessageTextClass,
      'BUTTON_ACCEPT_MESSAGE': "OK",
      'BUTTON_ACCEPT_VALUE': true,
      'BUTTON_ACCEPT_STATUS':true,
      'BUTTON_ACCEPT_CLASS': popupData.ButtonOKClass,
      'CANCEL_BUTTON_MESSAGE':"",
      'CANCEL_BUTTON_VALUE': false,
      'CANCEL_BUTTON_STATUS':false,
      'CANCEL_BUTTON_CLASS':''
    };
    (<TrakingOrderConfirmationComponent>modalRefApprove.componentInstance).inputData = inputData;
    modalRefApprove.componentInstance.OutputData.subscribe();
  }


  private continueSecondStep(){
    const modalRefApprove = this.modalService.open(TrakingOrderConfirmationComponent, {
      backdrop: 'static', // Prevent closing on outside click
      keyboard: false     // Prevent closing on pressing the Escape key (optional)
    });
    const inputData:any = {
      'TITLE':'AUTHENTICATION',
      'CLASS_ICON':'icon fa fa-check',
      'CARD_BG_CLASS': 'bg-success',
      'MESSAGE': "Authentication successful. Click OK to start scanning orders.",
      'MESSAGE_TEXT_CLASS':'',
      'BUTTON_ACCEPT_MESSAGE': "OK",
      'BUTTON_ACCEPT_CLASS': "btn-block btn-outline-light",
      'BUTTON_ACCEPT_VALUE': true,
      'BUTTON_ACCEPT_STATUS':true,
      'CANCEL_BUTTON_MESSAGE':"",
      'CANCEL_BUTTON_VALUE': false,
      'CANCEL_BUTTON_STATUS':false,
      'CANCEL_BUTTON_CLASS': "btn-outline-dark"
    };
    (<TrakingOrderConfirmationComponent>modalRefApprove.componentInstance).inputData = inputData;
    modalRefApprove.componentInstance.OutputData.subscribe((data:any) => {
      if(data){
        this.currentStep = 2;
        this.userConfirmation = false;
      }else{
        this.currentStep = 1;
      }
    });
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
    let userDetails:any = JSON.parse(localStorage.getItem(environment.userDetails));
    userDetails.OrderId = Number(sanitizedHex);
    if(userDetails.OrderId){
      await this.shipStationService.orderScan(userDetails).subscribe({
        next: data => this.handleOrderResponse(data),
        error: (error:any) => {
          this.errorMessage = true;
          this.barcodeScanned = false;
          //this.displayMessage('INVALID_ORDER_ID');

          const messageData = {
            Title: 'Order Scan',
            TitleTextClass: 'text-white',
            Icon:'icon fa fa-ban',
            Message: 'Scan Failed! Invalid  OrderID.',
            MessageTextClass: 'text-white',
            ModelBackground:'bg-danger',
            ButtonOKClass:'btn-block btn-outline-light',
            ButtonCancelClass:'btn-block btn-outline-info'
          }
          this.messagePopup(messageData);
          console.error("Error:", error);
        }
      });
    }else{
      this.barcodeScanned = false;
      this.errorMessage = true;
      this.signInMessage = 'SCAN_ORDER_LABEL';

      const messageData = {
        Title: 'Order Scan',
        TitleTextClass: 'text-white',
        Icon:'icon fa fa-ban',
        Message: 'Scan Failed! Invalid  OrderID.',
        MessageTextClass: 'text-white',
        ModelBackground:'bg-danger',
        ButtonOKClass:'btn-block btn-outline-light',
        ButtonCancelClass:'btn-block btn-outline-info'
      }
      this.messagePopup(messageData);
      //this.displayMessage('INVALID_ORDER_ID');
      this.currentStep = 2;
    }
  }


  removeSpecialChars(orderNumber):string{
    return orderNumber.replace(/[^\w]/g, '');
  }


  private handleOrderResponse(data: any): void {
    this.barcodeScanned = false;
    const refinedData:any = this.processPayload(data);
    localStorage.setItem(environment.step2, JSON.stringify(refinedData));
    this.getOrderId();
    if (refinedData) {
      this.shipstationTrakingNumber = refinedData.TrackingNumbers;
      this.currentStep = 3;
      this.signInMessage ='';
      this.zone.run(() => {
        this.signInMessage = 'SCAN TRACKER LABEL';
        console.log('this.signInMessage', this.signInMessage);
      });
      //console.log('this.signInMessage', this.signInMessage);
      this.cdr.detectChanges();
      this.appRef.tick();
      this.errorMessage = false;

      const messageData = {
        Title: 'Order Scan',
        TitleTextClass: 'text-white',
        Icon:'icon fa fa-check',
        Message: 'Order label scanned successfully. Proceed to the next step.',
        MessageTextClass: 'text-white',
        ModelBackground:'bg-success',
        ButtonOKClass:'btn-block btn-outline-light',
        ButtonCancelClass:'btn-block btn-outline-info'
      }
      this.messagePopup(messageData);
      //this.displayMessage('ORDER_SCANNED_SUCCESSFUL');
      //const trakingData =  this.transformData(refinedData);
      //localStorage.setItem(environment.step2TrakingDetails, JSON.stringify(trakingData));
    } else {
      this.currentStep = 2;
      this.signInMessage = 'SCAN_ORDER_LABEL';
      this.errorMessage = true;
      const messageData = {
        Title: 'Order',
        TitleTextClass: 'text-white',
        Icon:'icon fa fa-ban',
        Message: 'Scan Failed! Invalid  OrderID.',
        MessageTextClass: 'text-white',
        ModelBackground:'bg-danger',
        ButtonOKClass:'btn-block btn-outline-light',
        ButtonCancelClass:'btn-block btn-outline-info'
      }

      this.messagePopup(messageData);
      //this.displayMessage('INVALID_ORDER_ID');
      localStorage.removeItem(environment.step2TrakingDetails);
    }
    console.log('this.signInMessage last', this.signInMessage);
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
    const stepOneData = JSON.parse(localStorage.getItem(environment.userDetails));
    if(stepTwoData){
      this.validateTrakingDetails(stepTwoData);
      this.shipstationTrakingNumber = stepTwoData.TrackingNumbers;
      this.currentStep = 3;
      this.signInMessage = 'SCAN_TRACKER_LABEL';
      this.errorMessage = false;
    }else if(stepOneData){
      this.currentStep = 2;
      this.signInMessage = 'SCAN_ORDER_LABEL';
    }else{
      this.currentStep = 1;
      //this.signInMessage = 'SIGN_IN_MESSAGE';
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

  previousStep(): void {
    this.signInMessage = '';
    this.signInMessage = 'SCAN_ORDER_LABEL';
    this.cdr.detectChanges();
      this.appRef.tick();
    if (this.currentStep > 1) {
      this.currentStep--;
      localStorage.removeItem(environment.step2);
      localStorage.removeItem(environment.step2TrakingDetails);
      this.getOrderId();
    }
  }

  /****************************** End Of Step-2  *********************************/


  /****************************** Start Of Step-3  *********************************/

  private verifyTrackingNumber(trackingNumber: string): void {
    this.barcodeScanned = true;
    const refinedValue = this.removeSpecialChars(trackingNumber);
    const stepTwoData = JSON.parse(localStorage.getItem(environment.step2));
    console.log('stepTwoData', stepTwoData);
    this.verifyAndUpdateTrackingNumbers(refinedValue, stepTwoData);


    /*this.shipStationService.validateTrackingDetails(updatedTakingDetails).subscribe({
      next: data => this.handleTrackingResponse(data),
      error: (error:any) => {
        this.errorMessage = true;
        this.displayMessage('INVALID_TRACKING_NUMBER');
        console.error("Error:", error);
      }
    });*/

    const modalRefApprove = this.modalService.open(TrakingOrderConfirmationComponent, {
      backdrop: 'static', // Prevent closing on outside click
      keyboard: false     // Prevent closing on pressing the Escape key (optional)
    });

    const inputData:any = {
      'TITLE':'CONFIRMATION',
      'CLASS_ICON':'icon fa fa-info',
      'CARD_BG_CLASS': 'bg-primary',
      'TITLE_TEXT_CLASS':'text-white',
      'MESSAGE': "Would you like to continue, or submit the scan now?",
      'MESSAGE_TEXT_CLASS':'text-white',
      'BUTTON_ACCEPT_MESSAGE': "CONTINUE",
      'BUTTON_ACCEPT_CLASS': "btn-block btn-outline-light",
      'BUTTON_ACCEPT_VALUE': true,
      'BUTTON_ACCEPT_STATUS':true,
      'CANCEL_BUTTON_MESSAGE':"SUBMIT",
      'CANCEL_BUTTON_VALUE': false,
      'CANCEL_BUTTON_STATUS':true,
      'CANCEL_BUTTON_CLASS': "btn-outline-light"
    };
    (<TrakingOrderConfirmationComponent>modalRefApprove.componentInstance).inputData = inputData;
    modalRefApprove.componentInstance.OutputData.subscribe((data:any) => {
      if(!data){
        this.verifySubmit();
        //const updatedTakingDetails = JSON.parse(localStorage.getItem(environment.step2TrakingDetails));
        //this.submitTrakingData(updatedTakingDetails);
      }else{
        this.barcodeScanned = false;
      }
    });
  }

  getTrackingList() {
    let trackingList: string[] = [];
    const updatedTrackingDetails = JSON.parse(localStorage.getItem(environment.step2TrakingDetails));

    if (updatedTrackingDetails) {
      trackingList = updatedTrackingDetails.TrackingNumbers.map(item => item.TrackingNumber);
    }

    //this.trackingData = `Tracking Count: ${trackingList.length}`
    console.log('this.trackingData', this.trackingData);
  }


  verifySubmit(){
    const modalRefApprove = this.modalService.open(TrakingOrderConfirmationComponent, {
      backdrop: 'static', // Prevent closing on outside click
      keyboard: false     // Prevent closing on pressing the Escape key (optional)
    });

    const inputData:any = {
      'TITLE':'CONFIRMATION',
      'CLASS_ICON':'icon fa fa-info',
      'CARD_BG_CLASS': 'bg-primary',
      'TITLE_TEXT_CLASS':'text-white',
      'MESSAGE': "Are you sure to submit?",
      'MESSAGE_TEXT_CLASS':'text-white',
      'BUTTON_ACCEPT_MESSAGE': "Cancel",
      'BUTTON_ACCEPT_CLASS': "btn-block btn-outline-light",
      'BUTTON_ACCEPT_VALUE': true,
      'BUTTON_ACCEPT_STATUS':true,
      'CANCEL_BUTTON_MESSAGE':"SUBMIT",
      'CANCEL_BUTTON_VALUE': false,
      'CANCEL_BUTTON_STATUS':true,
      'CANCEL_BUTTON_CLASS': "btn-outline-light"
    };
    (<TrakingOrderConfirmationComponent>modalRefApprove.componentInstance).inputData = inputData;
    modalRefApprove.componentInstance.OutputData.subscribe((data:any) => {
      if(!data){

        const updatedTakingDetails = JSON.parse(localStorage.getItem(environment.step2TrakingDetails));
        this.submitTrakingData(updatedTakingDetails);
      }else{
        this.barcodeScanned = false;
      }
    });
  }



  submitTrakingData(updatedTakingDetails:any){
    this.barcodeScanned = false;
    this.shipStationService.validateTrackingDetails(updatedTakingDetails).subscribe();
    this.currentStep = 4;
    //this.toastService.showSuccess('Success!', 'Tracking Data Inserted Successfully.');
    const messageData = {
      Title: 'Success',
      TitleTextClass: 'text-white',
      Icon:'icon fa fa-check',
      Message: "Tracking ID's saved successfully. Proceed with the next scan",
      MessageTextClass: 'text-white',
      ModelBackground:'bg-success',
      ButtonOKClass:'btn-block btn-outline-light',
      ButtonCancelClass:'btn-block btn-outline-info'
    }
    this.messagePopup(messageData);
    this.barcodeScanned = false;
      this.notifyMessage = '';
      this.currentStep = 2;
      this.signInMessage = 'SCAN_ORDER_LABEL';
      localStorage.removeItem(environment.step2);
      localStorage.removeItem(environment.step2TrakingDetails);
      this.getOrderId();
      this.trackingData = "";
    /*
    setTimeout(() => {
      this.barcodeScanned = false;
      this.notifyMessage = '';
      this.currentStep = 2;
      this.signInMessage = 'SCAN_ORDER_LABEL';
      localStorage.removeItem(environment.step2);
      localStorage.removeItem(environment.step2TrakingDetails);
      this.getOrderId();
    }, 1000);*/
  }



  private verifyAndUpdateTrackingNumbers(scannedTrackingNumber: string, data: any) {
    // Check if localStorage already has the cache data
    const cachedData = localStorage.getItem(environment.step2TrakingDetails);
    let trackingCacheData: any;

    if (cachedData) {
      // If cache data exists, parse it
      trackingCacheData = JSON.parse(cachedData);
    } else {
      // If cache data does not exist, initialize with the current sessionId and an empty tracking payload
      trackingCacheData = {
        "sessionId": data.SessionId,
        "TrackingNumbers": []
      };
    }

    // Ensure TrackingNumbers is always defined
    if (!Array.isArray(trackingCacheData.TrackingNumbers)) {
      trackingCacheData.TrackingNumbers = [];
    }

    // Check if scannedTrackingNumber exists in the data.TrackingNumbers
    const isScannedTrackingInData = data.TrackingNumbers.includes(scannedTrackingNumber);

    // Check if scannedTrackingNumber already exists in the cache
    const existingTracking = trackingCacheData.TrackingNumbers.find(
      (track: any) => track.TrackingNumber === scannedTrackingNumber
    );

    if (existingTracking) {
      // Update existing entry with new IsVerified status
      existingTracking.IsVerified = isScannedTrackingInData;
    } else {
      // Add new tracking number with IsVerified status
      trackingCacheData.TrackingNumbers.push({
        "TrackingNumber": scannedTrackingNumber,
        "IsVerified": isScannedTrackingInData
      });
    }

    // Remove duplicates from TrackingNumbers
    trackingCacheData.TrackingNumbers = Array.from(
      new Map(
        trackingCacheData.TrackingNumbers.map(item => [item.TrackingNumber, item])
      ).values()
    );

    // Ensure the format is consistent with the required structure
    const outputData = {
      "sessionId": trackingCacheData.sessionId,
      "TrackingNumbers": trackingCacheData.TrackingNumbers
    };
    //this.trackingData = '';

    //this.trackingData = `Tracking Count: ${trackingCacheData.TrackingNumbers.length}`;
    //alert(trackingCacheData.TrackingNumbers.length);
    //this.cdr.detectChanges();
    //this.appRef.tick();
    //console.log('trackingCacheData', outputData);
    //console.log('this.trackingData', this.trackingData);

    // Update the localStorage with the modified trackingCacheData
    localStorage.setItem(environment.step2TrakingDetails, JSON.stringify(outputData));
  }



  /****************************** End Of Step-3  *********************************/


  getConfirmationFromUser(){
    const modalRefApprove = this.modalService.open(TrakingOrderConfirmationComponent);
    modalRefApprove.componentInstance.OutputData.subscribe((data:any) => {
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
