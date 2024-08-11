import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BarcodeFormat } from '@zxing/library';
import { FormatsDialogComponent } from '../../formats-dialog/formats-dialog.component';
import { AppInfoDialogComponent } from '../../app-info-dialog/app-info-dialog.component';
import { environment } from 'projects/zxing-scanner-demo/src/environments/environment';
import { ShipstationService } from '../../services/shipstation.service';
import { BehaviorSubject, of } from 'rxjs';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.css']
})
export class ScannerComponent {


  @Output() scannerValue = new EventEmitter<any>();

  availableDevices: MediaDeviceInfo[];
  deviceCurrent: MediaDeviceInfo;
  deviceSelected: string;

  formatsEnabled: BarcodeFormat[] = [
    BarcodeFormat.CODE_128,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.EAN_13,
    BarcodeFormat.QR_CODE,
  ];
  step:number = 1;

  hasDevices: boolean;
  hasPermission: boolean;
  openScan:boolean;
  userAuthenticated:boolean=false;
  authenticatedmessage:string = '';

  qrResultString: string;

  torchEnabled = false;
  torchAvailable$ = new BehaviorSubject<boolean>(false);
  tryHarder = false;
  shipstationTrakingNumber:number = 0;
  message:string = '';
  trakingVerificationFailed:boolean=true;

  constructor(
    private readonly _dialog: MatDialog,
    public shipStationService:ShipstationService,
  ) { }




  clearResult(): void {
    this.qrResultString = null;
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
  }

  onCodeResult(resultString: string) {
    this.scannerValue.emit(resultString);
    /*if(this.step == 1){
      this.stepOneMethod(resultString);
    }else if(this.step == 2){
      this.stepTwoMethod(resultString);
    }else if(this.step == 3){
      this.stepThreeMethod(resultString);
    }
    this.openScan = false;

    var context = new AudioContext();
    var oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 1000;
    oscillator.connect(context.destination);
    oscillator.start();
    // Beep for 500 milliseconds
    setTimeout(function () {
        oscillator.stop();
    }, 1000);
    */

    //this.qrResultString = resultString;
  }

  stepOneMethod(number){
    this.authenticatedmessage = "User Authenticated";
      this.userAuthenticated = true;
      this.step = 2;
      localStorage.setItem(environment.userDetails, number);
      localStorage.setItem(`${environment.userDetails}_timestamp`, String(Date.now()));
    /*if(number == '8905000002103'){


    }else{
      this.authenticatedmessage = "User not Authenticated, Please Scan Valid Barcode";
      this.userAuthenticated = false;
    }
    setTimeout(() => {
      this.authenticatedmessage = '';
    }, 3000);
    */
  }



  getTheShipStationTrakingNumber(data:any){
    if(data.shipments.length > 0){
      this.shipstationTrakingNumber = Number(data.shipments[0].trackingNumber);
      this.step = 3;
    }
  }

  stepThreeMethod(trakingNumber){
     trakingNumber = '802643821990232660';
    this.shipStationService.getShisatationDataByTrakingNumber(trakingNumber).subscribe({
      next:(data:any)=>{
        //this.getTheShipStationTrakingNumber(data);
        console.log('getShisatationDataByTrakingNumber,',data);
        this.verifyShipStationTrakingNumber(data);
      },
      error:(error)=>{
        console.log("This the error:", error);
      }
    });
  }

  verifyShipStationTrakingNumber(data){
    if(data.shipments.length > 0){
      const receivedTrakingNumber = Number(data.shipments[0].trackingNumber);
      console.log('receivedTrakingNumber', receivedTrakingNumber);
      if(receivedTrakingNumber == this.shipstationTrakingNumber){
        this.message = "Traking Number Verified";
        this.trakingVerificationFailed = true;
        this.step = 2;
      }else{
        this.message = "Traking Number Verification Failed";
        this.trakingVerificationFailed = false;
      }
      //this.step = 3;
    }else{
      this.message = "Traking Number Verification Failed";
        this.trakingVerificationFailed = false;
    }

    setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  continueStep3(){
    this.openScan = true;
  }

  onDeviceSelectChange(selected: string) {
    const selectedStr = selected || '';
    if (this.deviceSelected === selectedStr) { return; }
    this.deviceSelected = selectedStr;
    const device = this.availableDevices.find(x => x.deviceId === selected);
    this.deviceCurrent = device || undefined;
  }

  onDeviceChange(device: MediaDeviceInfo) {
    const selectedStr = device?.deviceId || '';
    if (this.deviceSelected === selectedStr) { return; }
    this.deviceSelected = selectedStr;
    this.deviceCurrent = device || undefined;
  }

  openFormatsDialog() {
    const data = {
      formatsEnabled: this.formatsEnabled,
    };

    this._dialog
      .open(FormatsDialogComponent, { data })
      .afterClosed()
      .subscribe(x => {
        if (x) {
          this.formatsEnabled = x;
        }
      });
  }

  onHasPermission(has: boolean) {
    this.hasPermission = has;
  }

  openInfoDialog() {
    const data = {
      hasDevices: this.hasDevices,
      hasPermission: this.hasPermission,
    };

    this._dialog.open(AppInfoDialogComponent, { data });
  }

  onTorchCompatible(isCompatible: boolean): void {
    this.torchAvailable$.next(isCompatible || false);
  }

  toggleTorch(): void {
    this.torchEnabled = !this.torchEnabled;
  }

  toggleTryHarder(): void {
    this.tryHarder = !this.tryHarder;
  }

  scanUser(){
    this.openScan = true;
  }

}
