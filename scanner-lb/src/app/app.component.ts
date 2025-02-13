import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  BASE_URL = 'http://localhost:5230';
  title = 'my-app';

  constructor() {}
}
