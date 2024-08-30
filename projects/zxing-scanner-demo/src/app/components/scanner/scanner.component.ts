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
    this.scannerValue.emit(resultString);

  }
}
