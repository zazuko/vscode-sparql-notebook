import { useEffect, useRef } from 'react';
import {
  VSCodeButton,
  VSCodeTextField,
  VSCodeDropdown,
  VSCodeOption,
  VSCodeCheckbox,
} from '@vscode/webview-ui-toolkit/react';

import './new-connection-form.css';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const NewConnectionForm: React.FC<{ handleSubmit: (form: HTMLFormElement) => void }> = ({
  handleSubmit,
}) => {

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    window.addEventListener('message', (event) => {
      const { data } = event;
      switch (data.type) {
        case 'clear_form':
          formRef.current?.reset();
      }
    });
  }, []);

  return (
    <form ref={formRef}>
      <VSCodeTextField name="displayName" type="text"></VSCodeTextField>
      <VSCodeTextField name="url" type="text"></VSCodeTextField>
      <VSCodeTextField name="password" type="text"></VSCodeTextField>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <VSCodeButton
          appearance="secondary"
          onClick={() => {
            formRef.current?.reset();
          }}
        >
          Clear
        </VSCodeButton>
        <VSCodeButton onClick={() => handleSubmit(formRef.current!)}>
          Create
        </VSCodeButton>
      </div>
    </form>
  );
};
