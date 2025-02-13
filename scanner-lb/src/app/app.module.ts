import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
// import { ScannerModule } from './components/scanner/scanner.module';

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
    ScannerModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
