import { Component, ViewChild } from '@angular/core';
import { SignalRService } from '../services/Signal.RService';
import { ImageCropperComponent } from './components/cropper/cropper.component';
import DummyImages from '../dummy_images.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private BASE_URL = 'http://localhost:5230';
  private scanner_listener_endpoint = '/scannerhub';
  title = 'my-app';
  scaningOptions: {
    scanner: string;
    kind: string;
    resolution: string;
    size: string;
  } = {
    scanner: '',
    kind: '',
    resolution: '',
    size: '',
  };
  isScanning: boolean = false;
  messages: string[] = [];
  imageSrc: string[] = [];
  isLoading: boolean = false;
  outputImage: string | null = null;
  scanners = [
    { name: 'HP ScanJet Pro 2500', id: 'HP2500' },
    { name: 'Epson WorkForce ES-400', id: 'ES400' },
    { name: 'Canon imageFormula R40', id: 'R40' },
    { name: 'Fujitsu ScanSnap iX1600', id: 'IX1600' },
    { name: 'Brother ADS-2700W', id: 'ADS2700' },
  ];

  @ViewChild(ImageCropperComponent) cropperComponent!: ImageCropperComponent;
  constructor(private signalRService: SignalRService) {
    this.signalRService.initialize(
      this.BASE_URL,
      this.scanner_listener_endpoint
    ); //important for connecting to hub service
  }

  ngOnInit(): void {
    this.signalRService.onReceiveMessage((message: string) => {
      this.messages.push(message);
    });

    this.signalRService.onAttachmentReceive((attachment: Array<string>) => {
      try {
        this.isLoading = false;
        if (Array.isArray(attachment)) {
          this.imageSrc = attachment;
        } else {
          const image = `data:image/jpeg;base64,${attachment}`;
          this.imageSrc.push(image);
        }
      } catch (error) {
        console.error('error occured while receiving attachment', error);
        console.log('using dummy images');
        this.imageSrc = DummyImages;
      }
    });
  }

  startScanning(options: any): void {
    this.scaningOptions = options;
    this.isLoading = true;
    setTimeout(() => {
      this.imageSrc = DummyImages;
      this.isLoading = false;
    }, 2000);
    this.signalRService.startScanning();
  }

  resetScanner(event: any) {
    this.imageSrc = [];
  }

  stopScanning(): void {
    this.signalRService.stopScanning();
  }

  checkIsScanning(): void {
    this.signalRService.isScanning().then((isScanning) => {
      this.isScanning = isScanning;
    });
  }
}
