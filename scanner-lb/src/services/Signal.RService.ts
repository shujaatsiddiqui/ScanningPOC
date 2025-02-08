import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ERROR_MESSAGE } from './constants/error-message';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection?: signalR.HubConnection;

  constructor() {}

  public initialize(baseUrl: string, scannerListenerEndpoint: string): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .configureLogging(signalR.LogLevel.Debug)
      .withUrl(`${baseUrl}${scannerListenerEndpoint}`, {
        skipNegotiation: true, // skipNegotiation as we specify WebSockets
        transport: signalR.HttpTransportType.WebSockets, // force WebSocket transport
      })
      .build();

    this.hubConnection.start().catch((err) => console.error(err));
  }

  public startScanning(): void {
    if (!this.hubConnection) {
      throw new Error(ERROR_MESSAGE.INITIALIZATION_ERROR);
    }
    this.hubConnection!.invoke('StartScanning')
      .then((val) => {
        console.log('scanning started');
      })
      .catch((err) => console.error(err));
  }

  public stopScanning(): void {
    if (!this.hubConnection) {
      throw new Error(ERROR_MESSAGE.INITIALIZATION_ERROR);
    }
    this.hubConnection!.invoke('StopScanning')
      .then((val) => {
        console.log('scanning stoppped');
      })
      .catch((err) => console.error(err));
  }

  public isScanning(): Promise<boolean> {
    if (!this.hubConnection) {
      throw new Error(ERROR_MESSAGE.INITIALIZATION_ERROR);
    }
    return this.hubConnection!.invoke('IsScanning');
  }

  public onReceiveMessage(callback: (message: string) => void): void {
    if (!this.hubConnection) {
      throw new Error(ERROR_MESSAGE.INITIALIZATION_ERROR);
    }
    this.hubConnection!.on('ReceiveMessage', callback);
  }

  public onAttachmentReceive(callback: (message: Array<string>) => void): void {
    if (!this.hubConnection) {
      throw new Error(ERROR_MESSAGE.INITIALIZATION_ERROR);
    }
    this.hubConnection!.on('onAttachmentReceive', callback);
  }
}
