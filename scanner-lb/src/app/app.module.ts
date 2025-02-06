import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ImageCropperComponent as CropperComponent } from 'ngx-image-cropper';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ImageCropperComponent } from './components/cropper/cropper.component';
import { FormsModule } from '@angular/forms';
import { AngularCropperjsModule } from 'angular-cropperjs';
import { NgIf } from '@angular/common';
import { LottieComponent, provideLottieOptions } from 'ngx-lottie';

@NgModule({
  declarations: [
    AppComponent,
    ImageCropperComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularCropperjsModule,
    NgIf,
    CropperComponent,
    LottieComponent,
  ],
  providers: [
    provideLottieOptions({
      player: () => import('lottie-web'),
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
