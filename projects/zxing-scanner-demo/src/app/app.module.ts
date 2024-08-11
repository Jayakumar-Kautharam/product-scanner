import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { AppInfoDialogComponent } from './app-info-dialog/app-info-dialog.component';
import { AppInfoComponent } from './app-info/app-info.component';
import { AppUiModule } from './app-ui.module';
import { AppComponent } from './app.component';
import { FormatsDialogComponent } from './formats-dialog/formats-dialog.component';
import { HttpClientModule } from '@angular/common/http';
import { MultiStepTabsComponent } from './components/multi-step-tabs/multi-step-tabs.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ScannerComponent } from './components/scanner/scanner.component';


@NgModule({
    imports: [
        // Angular
        BrowserModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
        // Local
        AppUiModule,
        HttpClientModule,
        ReactiveFormsModule,
    ],
    declarations: [AppComponent, FormatsDialogComponent, AppInfoComponent, AppInfoDialogComponent, MultiStepTabsComponent, ScannerComponent],
    bootstrap: [AppComponent]
})
export class AppModule { }
