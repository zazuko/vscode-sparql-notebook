import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  linkedSignal
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EndpointConfigurationV1, EndpointConfigurationV1WithPassword } from '../service/connection';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-config-edit',
  imports: [ReactiveFormsModule],
  templateUrl: './config-edit.html',
  styleUrl: './config-edit.scss'
})
export class ConfigEdit {
  config = input.required<EndpointConfigurationV1>();
  onCancel = output<void>();
  onSave = output<Partial<EndpointConfigurationV1WithPassword>>();
  readonly #fb = inject(NonNullableFormBuilder);

  hasUpdateEndpoint = signal<boolean>(false);

  showPasswordInput = signal<boolean>(false);
  showUpdatePassword = signal<boolean>(false);
  showQleverUpdateToken = signal<boolean>(false);

  readonly form = this.#fb.group({
    name: this.#fb.control('', { validators: [Validators.required] }),
    endpointURL: this.#fb.control('', { validators: [Validators.required] }),
    user: this.#fb.control('', { validators: [] }),
    password: this.#fb.control('', { validators: [] }),
    isQLever: this.#fb.control(false),
    updateEndpointURL: this.#fb.control('', { validators: [] }),
    updateUser: this.#fb.control('', { validators: [] }),
    updatePassword: this.#fb.control('', { validators: [] }),
    qleverUpdateToken: this.#fb.control('', { validators: [] }),
  });


  // Local state as signals
  readonly isQLever = toSignal(this.form.controls.isQLever.valueChanges);

  constructor() {
    effect(() => {
      const config = this.config();
      this.form.patchValue(config);
      const updateEndpointURL = config.updateEndpointURL;
      if (updateEndpointURL) {
        this.hasUpdateEndpoint.set(true);
      }
    });


    effect(() => {
      const isQLever = this.isQLever() ?? false;
      const hasUpdateEndpoint = this.hasUpdateEndpoint();

      if (isQLever && hasUpdateEndpoint) {
        this.updateFormValidatorsAndValues('QleverUpdateEndpoint');
        return;
      }

      if (hasUpdateEndpoint) {
        this.updateFormValidatorsAndValues("DefaultUpdateEndpoint");
        return;
      }

      this.updateFormValidatorsAndValues('NoUpdateEndpoint');


    });


  }

  addWriteEndpoint() {
    this.hasUpdateEndpoint.set(true);
  }

  removeWriteEndpoint() {
    this.hasUpdateEndpoint.set(false);
  }

  cancelEdit() {
    this.onCancel.emit();
  }

  saveConfig() {
    if (this.form.valid) {
      const config = this.config();
      // Only include touched fields from the form
      const touched: Record<string, any> = {};
      Object.entries(this.form.controls).forEach(([key, control]) => {
        if (control.touched) {
          touched[key] = control.value;
        }
      });
      const newConfig = { ...config, ...touched };
      this.onSave.emit(newConfig);
    }
  }


  updateFormValidatorsAndValues(validatorMode: 'NoUpdateEndpoint' | 'QleverUpdateEndpoint' | 'DefaultUpdateEndpoint'): void {
    if (validatorMode === 'QleverUpdateEndpoint') {
      this.form.controls.qleverUpdateToken.clearValidators();
      this.form.controls.updateEndpointURL.setValidators([Validators.required]);
      this.form.controls.updateUser.clearValidators();
      this.form.controls.updatePassword.clearValidators();

      this.form.patchValue({
        updateEndpointURL: this.config().updateEndpointURL,
        updateUser: '',
        updatePassword: '',
        qleverUpdateToken: ''
      });
      this.form.controls['updateEndpointURL'].markAsTouched();

    } else if (validatorMode === 'DefaultUpdateEndpoint') {
      this.form.controls.qleverUpdateToken.clearValidators();
      this.form.controls.updateEndpointURL.setValidators([Validators.required]);
      this.form.controls.updateUser.clearValidators();
      this.form.controls.updatePassword.clearValidators();

      this.form.patchValue({
        updateEndpointURL: this.config().updateEndpointURL ?? '',
        updateUser: this.config().updateUser ?? '',
        updatePassword: '',
        qleverUpdateToken: ''
      });
      this.form.controls['updateEndpointURL'].markAsTouched();
      this.form.controls['updateUser'].markAsTouched();

    } else if (validatorMode === 'NoUpdateEndpoint') {
      this.form.controls.qleverUpdateToken.clearValidators();
      this.form.controls.updateEndpointURL.clearValidators();
      this.form.controls.updateUser.clearValidators();
      this.form.controls.updatePassword.clearValidators();

      this.form.patchValue({
        updateEndpointURL: '',
        updateUser: '',
        updatePassword: '',
        qleverUpdateToken: ''
      });
      this.form.controls['qleverUpdateToken'].markAsTouched();
      this.form.controls['updateEndpointURL'].markAsTouched();
      this.form.controls['updateUser'].markAsTouched();
    }

  }

}
