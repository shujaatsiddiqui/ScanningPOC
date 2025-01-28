import { Component, ViewChild } from '@angular/core';
import { SignalRService } from '../services/Signal.RService';
import { ImageCropperComponent } from './components/cropper/cropper.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'my-app';

  isScanning: boolean = false;
  messages: string[] = [];
  imageSrc: string | null = null;
  outputImage: string | null = null;

  @ViewChild(ImageCropperComponent) cropperComponent!: ImageCropperComponent;
  constructor(private signalRService: SignalRService) { }

  ngOnInit(): void {
    this.signalRService.onReceiveMessage((message: string) => {
      this.messages.push(message);
    });

    this.signalRService.onAttachmentReceive((attachment: string) => {
      console.log({ attachment });
      this.imageSrc = `data:image/jpeg;base64,${attachment}`;
      this.openCropperModal()
    });
  }

  ScanPDF(): void {
    this.signalRService.ScanPDF();
  }

  // stopScanning(): void {
  //   this.signalRService.stopScanning();
  // }

  // checkIsScanning(): void {
  //   this.signalRService.isScanning().then(isScanning => {
  //     this.isScanning = isScanning;
  //   });
  // }


  openCropperModal(): void {
    this.cropperComponent.openModal();
  }

  onOutputImageChange(newOutputImage: string | null) {
    this.outputImage = newOutputImage;
  }
}
