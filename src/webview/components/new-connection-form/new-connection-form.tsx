import { useEffect, useRef } from 'react';
import {
  VSCodeButton,
  VSCodeTextField,
  VSCodeDropdown,
  VSCodeOption,
  VSCodeCheckbox,
} from '@vscode/webview-ui-toolkit/react';
import { vscode } from '../../main';
import './new-connection-form.css';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const NewConnectionForm: React.FC<{ handleSubmit: (form: HTMLFormElement) => void }> = ({
  handleSubmit,
}) => {


  function handleFileChange(e: any) {
    console.log(e.target.files[0]);
  }
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
      <VSCodeTextField name="displayName" type="text">Name</VSCodeTextField>
      <VSCodeTextField name="url" type="text">Endpoint URL</VSCodeTextField>
      <VSCodeTextField name="user" type="text">Username</VSCodeTextField>
      <VSCodeTextField name="password" type="password">Password</VSCodeTextField>
      <VSCodeTextField name="password2" type="password">Password</VSCodeTextField>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <input type="file" accept=".nq" onChange={handleFileChange} />
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
