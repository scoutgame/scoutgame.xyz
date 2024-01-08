import { useState } from 'react';

import { TextInput } from 'components/common/BoardEditor/components/properties/TextInput';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';

import mutator from '../../../mutator';
import { validatePropertyValue } from '../../propertyValueElement';

import { PropertyMenu } from './PropertyMenu';

export function TextPropertyTemplateMenu({
  cards,
  propertyTemplate,
  onChange
}: {
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onChange?: VoidFunction;
}) {
  const propertyValue = cards[0].fields.properties[propertyTemplate.id] || '';
  const [value, setValue] = useState(propertyValue);

  return (
    <PropertyMenu cards={cards} propertyTemplate={propertyTemplate}>
      {({ closeMenu }) => {
        return (
          <TextInput
            className='octo-propertyvalue'
            placeholderText='Empty'
            value={value.toString()}
            autoExpand={true}
            onChange={setValue}
            displayType='details'
            onSave={async () => {
              await mutator.changePropertyValues(cards, propertyTemplate.id, value);
              onChange?.();
              closeMenu();
            }}
            onCancel={() => setValue(propertyValue || '')}
            validator={(newValue: string) => validatePropertyValue(propertyTemplate.type, newValue)}
            spellCheck={propertyTemplate.type === 'text'}
          />
        );
      }}
    </PropertyMenu>
  );
}
