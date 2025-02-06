import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';



const BASE_URL = 'http://localhost:5230';
const scanner_listener_endpoint = '/scannerhub';


@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection;

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder().configureLogging(signalR.LogLevel.Debug)
      .withUrl(`${BASE_URL}${scanner_listener_endpoint}`, {
        skipNegotiation: true,  // skipNegotiation as we specify WebSockets
        transport: signalR.HttpTransportType.WebSockets  // force WebSocket transport
      })
      .build();

    this.hubConnection.start().catch(err => console.error({heheheh:err}));
  }

  public startScanning(): void {
    this.hubConnection.invoke('StartScanning').then((val=>{
      console.log("scanning started")
    }))
      .catch(err => console.error(err));
  }

  public stopScanning(): void {
    this.hubConnection.invoke('StopScanning').then((val=>{
      console.log("scanning stoppped")
    }))
      .catch(err => console.error(err));
  }

  public isScanning(): Promise<boolean> {
    return this.hubConnection.invoke('IsScanning');
  }

  public onReceiveMessage(callback: (message: string) => void): void {
    this.hubConnection.on('ReceiveMessage', callback);
  }

  public onAttachmentReceive(callback: (message: Array<string>) => void): void {
    this.hubConnection.on('onAttachmentReceive', callback);
  }
}