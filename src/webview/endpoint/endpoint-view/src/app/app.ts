import { Component, inject, signal } from '@angular/core';

import { Connection } from './service/connection';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [JsonPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('endpoint-view');
  connectionService = inject(Connection);
}
