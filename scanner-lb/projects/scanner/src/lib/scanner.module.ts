import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScannerComponent } from './cropper.component';
import { LottieComponent, provideLottieOptions } from 'ngx-lottie';
import { ImageCropperComponent } from 'ngx-image-cropper';

@NgModule({
  declarations: [ScannerComponent],
  imports: [
    CommonModule,
    FormsModule,
    LottieComponent,
    ImageCropperComponent
  ],
  exports: [ScannerComponent],
  providers: [
      provideLottieOptions({
        player: () => import('lottie-web'),
      })
    ]
})
export class ScannerModule { }
