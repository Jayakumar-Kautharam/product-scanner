import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { AppInfoDialogComponent } from './app-info-dialog/app-info-dialog.component';
import { AppInfoComponent } from './app-info/app-info.component';
import { AppUiModule } from './app-ui.module';
import { AppComponent } from './app.component';
import { FormatsDialogComponent } from './formats-dialog/formats-dialog.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { MultiStepTabsComponent } from './components/multi-step-tabs/multi-step-tabs.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ScannerComponent } from './components/scanner/scanner.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SwitchToggleComponent } from './components/switch-toggle/switch-toggle.component';
import { BootstrapSwitchDirective } from './directives/bootstrap-switch.directive';
import { NgToggleModule } from 'ng-toggle-button';
import { ToastrModule } from 'ngx-toastr';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TrakingOrderConfirmationComponent } from './model-popups/traking-order-confirmation/traking-order-confirmation.component';
import { LoaderComponent } from './components/loader/loader.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './../assets/i18n/', '.json');
}

@NgModule({
    imports: [
        // Angular
        BrowserModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
        // Local
        NgbModule,
        AppUiModule,
        HttpClientModule,
        ReactiveFormsModule,
        MatSlideToggleModule,
        NgToggleModule.forRoot(),
        ToastrModule.forRoot(),
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient],
          },
        }),
    ],
    declarations: [
      AppComponent,
      FormatsDialogComponent,
      AppInfoComponent,
      AppInfoDialogComponent,
      MultiStepTabsComponent,
      ScannerComponent,
      SwitchToggleComponent,
      BootstrapSwitchDirective,
      TrakingOrderConfirmationComponent,
      LoaderComponent,
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
