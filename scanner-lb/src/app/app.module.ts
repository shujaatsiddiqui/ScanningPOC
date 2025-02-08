import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { LottieComponent, provideLottieOptions } from 'ngx-lottie';
// import { ScannerModule } from './components/cropper/scanner.module';

import {ScannerModule} from "scanner"

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgIf,
    LottieComponent,
    ScannerModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
