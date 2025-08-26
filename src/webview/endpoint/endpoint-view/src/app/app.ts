import { Component, inject, signal, computed } from '@angular/core';

import { Connection, EndpointConfigurationV1 } from './service/connection';
import { JsonPipe } from '@angular/common';
import { ConfigEdit } from "./config-edit/config-edit";

@Component({
  selector: 'app-root',
  imports: [JsonPipe, ConfigEdit],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('endpoint-view');
  connectionService = inject(Connection);

  showEditForm = signal(false);
  formName = signal('');
  formEndpointURL = signal('');
  formUser = signal('');
  formPasswordKey = signal('');

  openEditForm() {
    this.showEditForm.set(true);
  };

  closeEditForm = () => {
    this.showEditForm.set(false);
  };

  saveEditForm(event: Partial<EndpointConfigurationV1>) {
    this.showEditForm.set(false);
    this.connectionService.updateConnection(event);
  };
}
