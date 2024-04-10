import type { FormField, FormFieldAnswer } from '@charmverse/core/prisma-client';

import type { FormFieldValue } from 'components/common/form/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { IPropertyTemplate } from '../board';

import { excludedFieldTypes } from './getBoardProperties';

export type FormFieldData = Pick<FormField, 'id' | 'type' | 'private'>;
export type FormAnswerData = Pick<FormFieldAnswer, 'value' | 'fieldId'>;

type PropertiesMap = Record<string, FormFieldValue>;

export function getCardPropertiesFromForm({
  formAnswers,
  formFields,
  cardProperties
}: {
  cardProperties: IPropertyTemplate[];
  formAnswers: FormAnswerData[];
  formFields: FormFieldData[];
}): PropertiesMap {
  const properties: PropertiesMap = {};

  for (const formField of formFields) {
    const cardProperty = cardProperties.find((p) => p.formFieldId === formField.id);
    const answerValue = formAnswers.find((ans) => ans.fieldId === formField.id)?.value as FormFieldValue;
    // exclude some field types
    if (!excludedFieldTypes.includes(formField.type) && cardProperty) {
      if (formField.type === 'long_text') {
        properties[cardProperty.id] =
          (
            answerValue as {
              content: PageContent;
              contentText: string;
            }
          )?.contentText ?? '';
      } else {
        properties[cardProperty.id] = answerValue ?? '';
      }
    }
  }

  return properties;
}
