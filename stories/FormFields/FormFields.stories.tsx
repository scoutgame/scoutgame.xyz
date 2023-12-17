import { capitalize } from 'lodash';
import { GlobalContext } from 'stories/lib/GlobalContext';
import { v4 } from 'uuid';

import { formFieldTypes } from 'components/common/form/constants';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { FormFieldInputs as CustomFormFieldInputs } from 'components/common/form/FormFieldInputs';
import { FormFieldsEditor as CustomFormFieldsEditor } from 'components/common/form/FormFieldsEditor';
import { brandColorNames } from 'theme/colors';

export function FormFieldsEditor() {
  return (
    <GlobalContext>
      <CustomFormFieldsEditor
        formFields={[
          {
            description: 'This is a description',
            index: 0,
            name: 'Title',
            options: [],
            private: false,
            required: true,
            type: 'text'
          }
        ]}
      />
    </GlobalContext>
  );
}

export function FormFieldsInputs() {
  return (
    <GlobalContext>
      <CustomFormFieldInputs
        onSave={() => {}}
        formFields={formFieldTypes.map((formFieldType, index) => {
          const options: SelectOptionType[] = [];
          if (formFieldType.match(/select|multiselect/)) {
            // Random number between 3 and 5
            const totalOptions = Math.floor(Math.random() * (5 - 3 + 1) + 3);
            for (let i = 0; i < totalOptions; i++) {
              options.push({
                id: v4(),
                name: `Option ${i + 1}`,
                color: brandColorNames[Math.floor(Math.random() * brandColorNames.length)]
              });
            }
          }
          const label = capitalize(formFieldType.replaceAll(/_/g, ' '));
          return {
            description: `This is a description for ${label.toLocaleLowerCase()}`,
            name: `${label} title`,
            options,
            private: false,
            required: index % 2 === 0,
            type: formFieldType,
            id: v4(),
            value: ''
          };
        })}
      />
    </GlobalContext>
  );
}

export function FormFieldsInputsDisplay() {
  return (
    <GlobalContext>
      <CustomFormFieldInputs
        formFields={formFieldTypes.map((formFieldType, index) => {
          const options: SelectOptionType[] = [];
          if (formFieldType.match(/select|multiselect/)) {
            // Random number between 3 and 5
            const totalOptions = Math.floor(Math.random() * (5 - 3 + 1) + 3);
            for (let i = 0; i < totalOptions; i++) {
              options.push({
                id: v4(),
                name: `Option ${i + 1}`,
                color: brandColorNames[Math.floor(Math.random() * brandColorNames.length)]
              });
            }
          }
          const label = capitalize(formFieldType.replaceAll(/_/g, ' '));
          let value: string | string[] = '';
          switch (formFieldType) {
            case 'phone': {
              value = '+1 123 456 7890';
              break;
            }
            case 'label': {
              value = 'Label';
              break;
            }
            case 'text_multiline': {
              value = 'This is a multiline text';
              break;
            }
            case 'wallet': {
              value = '0x36d3515d5818f672168a595f68bae614ee6b91ee';
              break;
            }
            case 'date': {
              value = new Date('2021-10-10').toString();
              break;
            }
            case 'email': {
              value = 'johndoe@gmail.com';
              break;
            }
            case 'multiselect': {
              value = options.map((option) => option.id);
              break;
            }
            case 'number': {
              value = '123';
              break;
            }
            case 'select': {
              value = options[0].id;
              break;
            }
            case 'text': {
              value = 'This is a text';
              break;
            }
            case 'url': {
              value = 'https://google.com';
              break;
            }
            case 'person': {
              value = 'John Doe';
              break;
            }
            default: {
              value = '';
              break;
            }
          }
          return {
            description: `This is a description for ${label.toLocaleLowerCase()}`,
            name: `${label} title`,
            options,
            private: false,
            required: index % 2 === 0,
            type: formFieldType,
            id: v4(),
            value
          };
        })}
      />
    </GlobalContext>
  );
}

export default {
  title: 'FormFields',
  component: FormFieldsEditor
};
