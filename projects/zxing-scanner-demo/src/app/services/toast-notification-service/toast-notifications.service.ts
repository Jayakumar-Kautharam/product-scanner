import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastNotificationsService {

  constructor(private toastr: ToastrService) { }

  // Display a success toast
  showSuccess(message: string, title?: string) {
    this.toastr.success(message, title, {
      timeOut: 3000, // Set the duration for the toast to be displayed (in milliseconds)
      positionClass: 'toast-top-right' // Position the toast at the top-right corner
    });
  }

  // Display an error toast
  showError(message: string, title?: string) {
    this.toastr.error(message, title, {
      timeOut: 3000, // Set the duration for the toast to be displayed (in milliseconds)
      positionClass: 'toast-top-right' // Position the toast at the top-right corner
    });
  }
}
