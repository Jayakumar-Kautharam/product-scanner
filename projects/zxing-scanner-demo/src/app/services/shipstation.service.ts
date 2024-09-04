import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShipstationService {

  private apiEndpoint = 'https://ssapi.shipstation.com/';
  private apiKey = '4c5f4c557c624ee5a65aba9a1e6f61de';
  private apiSecret = '8a5dda46cbbb4a08863c493587b4a90c';

  apiString:string = '4c5f4c557c624ee5a65aba9a1e6f61de:8a5dda46cbbb4a08863c493587b4a90c';

  constructor(private httpClient: HttpClient) { }

  headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json');
  //headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');


  // User Authentication
  userUthentication(barcode:any){
    return this.httpClient.post(`${environment.RediesURL}agent-auth`, barcode, { headers: this.headers });
  }

  // Step - 2 Scan
  orderScan(orderData:any){
    return this.httpClient.post(`${environment.RediesURL}validate-order-scan`, orderData, { headers: this.headers });
  }
  // Step - 2 Scan
  validateTrackingDetails(trackingData:any){
    return this.httpClient.post<any>(`${environment.RediesURL}validate-tracking-details`, trackingData, { headers: this.headers });
  }

  getShisatationData(Order:string): Observable<any> {
    /*&const headers = new HttpHeaders()
      .set('Authorization', 'Basic ' + btoa(`${this.apiKey}:${this.apiSecret}`));
    return this.httpClient.get(`${this.apiEndpoint}shipments?orderId=${Order}`, { headers: headers });*/
    return this.httpClient.get(`${environment.feedbackTrackerUrl}agent-auth?orderId=${Order}`);
  }


  getShisatationDataByTrakingNumber(trakingNumber): Observable<any> {
    /*const headers = new HttpHeaders()
      .set('Authorization', 'Basic ' + btoa(`${this.apiKey}:${this.apiSecret}`));
    return this.httpClient.get(`${this.apiEndpoint}shipments?trackingNumber=${trakingNumber}`, { headers: headers });*/
    return this.httpClient.get(`${environment.feedbackTrackerUrl}getShipstationShipmentDetails?trackingNumber=${trakingNumber}`);
  }




}
