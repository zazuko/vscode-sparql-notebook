import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EndpointConfigurationV1, EndpointConfigurationV1WithPassword } from '../service/connection';
import { JsonPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-config-edit',
  imports: [ReactiveFormsModule, JsonPipe],
  templateUrl: './config-edit.html',
  styleUrl: './config-edit.scss'
})
export class ConfigEdit {
  config = input.required<EndpointConfigurationV1>();
  onCancel = output<void>();
  onSave = output<Partial<EndpointConfigurationV1WithPassword>>();
  readonly #fb = inject(NonNullableFormBuilder);

  hasUpdateEndpoint = computed<boolean>(() => {
    const config = this.config();
    return config.updateEndpointURL !== undefined && config.updateEndpointURL !== '';
  });

  addEndpoint = signal<boolean>(false);
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
    });


  }

  addWriteEndpoint() {
    if (this.isQLever()) {
      this.updateFormValidatorsAndValues('QleverUpdateEndpoint', true);
    } else {
      this.updateFormValidatorsAndValues('DefaultUpdateEndpoint', true);
    }
    this.addEndpoint.set(true);
    this.form.markAsTouched();
  }

  removeWriteEndpoint() {
    this.updateFormValidatorsAndValues('NoUpdateEndpoint', false);
    this.addEndpoint.set(false);
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
      console.log('touched', touched);
      const newConfig = { ...config, ...touched };
      this.onSave.emit(newConfig);
    }
  }


  updateFormValidatorsAndValues(validatorMode: 'NoUpdateEndpoint' | 'QleverUpdateEndpoint' | 'DefaultUpdateEndpoint', addEndpoint: boolean): void {
    if (validatorMode === 'QleverUpdateEndpoint') {
      this.form.controls.qleverUpdateToken.setValidators([Validators.required]);
      this.form.controls.updateEndpointURL.setValidators([Validators.required]);
      this.form.controls.updateUser.clearValidators();
      this.form.controls.updatePassword.clearValidators();
      if (addEndpoint) {
        this.form.patchValue({
          updateEndpointURL: this.config().endpointURL,
          updateUser: '',
          updatePassword: '',
          qleverUpdateToken: ''
        });
        this.form.controls['updateEndpointURL'].markAsTouched();
      }
    } else if (validatorMode === 'DefaultUpdateEndpoint') {
      this.form.controls.qleverUpdateToken.clearValidators();
      this.form.controls.updateEndpointURL.setValidators([Validators.required]);
      this.form.controls.updateUser.setValidators([Validators.required]);
      this.form.controls.updatePassword.setValidators([Validators.required]);
      if (addEndpoint) {
        this.form.patchValue({
          updateEndpointURL: this.config().endpointURL,
          updateUser: this.config().user ?? '',
          updatePassword: '',
          qleverUpdateToken: ''
        });
        this.form.controls['updateEndpointURL'].markAsTouched();
        this.form.controls['updateUser'].markAsTouched();
      }
    } else if (validatorMode === 'NoUpdateEndpoint') {
      this.form.controls.qleverUpdateToken.clearValidators();
      this.form.controls.updateEndpointURL.clearValidators();
      this.form.controls.updateUser.clearValidators();
      this.form.controls.updatePassword.clearValidators();
      if (!addEndpoint) {
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

  getFormValidationErrors() {
    const errors: { control: string; error: string }[] = [];

    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);

      if (control && control.errors) {
        Object.keys(control.errors).forEach(errorKey => {
          let message = '';

          switch (errorKey) {
            case 'required':
              message = `${key} is required`;
              break;
            default:
              message = `${key} has error: ${errorKey}`;
          }

          errors.push({ control: key, error: message });
        });
      }
    });

    return errors;
  }
}
