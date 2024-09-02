import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-traking-order-confirmation',
  templateUrl: './traking-order-confirmation.component.html',
  styleUrls: ['./traking-order-confirmation.component.css']
})
export class TrakingOrderConfirmationComponent {

  @Output() OutputData: EventEmitter<Boolean> = new EventEmitter();

  constructor(
    private translate: TranslateService,
    public modal: NgbActiveModal,
  ) {
      this.translate.setDefaultLang('en'); // Set the default language
  }
    public continueWithNextTrackingNumber(result:boolean): void {
      this.OutputData.emit(result);
      this.modal.close();
    }

}
