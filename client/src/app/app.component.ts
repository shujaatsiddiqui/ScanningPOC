import { Component } from '@angular/core';
import { SignalRService } from '../services/Signal.RService';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'my-app';

   isScanning: boolean = false;
    messages: string[] = [];
    imageSrc: string | null = null;

    constructor(private signalRService: SignalRService) {}
  
    ngOnInit(): void {
      this.signalRService.onReceiveMessage((message: string) => {
        this.messages.push(message);
      });

      this.signalRService.onAttachmentReceive((attachment: string) => {
        console.log({attachment});
        this.imageSrc = `data:image/jpeg;base64,${attachment}`;
      });
    }
  
    startScanning(): void {
      this.signalRService.startScanning();
    }
  
    stopScanning(): void {
      this.signalRService.stopScanning();
    }
  
    checkIsScanning(): void {
      this.signalRService.isScanning().then(isScanning => {
        this.isScanning = isScanning;
      });
    }
}
