import { Component, Inject  } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  BASE_URL = 'http://localhost:5230';
  title = 'consumerTestApp';
  
  
  constructor(private dialog: MatDialog) {}


}
