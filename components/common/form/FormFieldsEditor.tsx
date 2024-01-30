import AddIcon from '@mui/icons-material/Add';
import { Box, Stack } from '@mui/material';
import { useRef, useEffect, useState } from 'react';
import { v4 } from 'uuid';

import { useUpdateProposalFormFields } from 'charmClient/hooks/proposals';
import { useSnackbar } from 'hooks/useSnackbar';
import { emptyDocument } from 'lib/prosemirror/constants';

import { Button } from '../Button';

import { checkFormFieldErrors } from './checkFormFieldErrors';
import type { SelectOptionType } from './fields/Select/interfaces';
import { FormField } from './FormField';
import type { FormFieldInput } from './interfaces';

export function ControlledFormFieldsEditor({
  formFields,
  setFormFields,
  collapsedFieldIds,
  toggleCollapse
}: {
  formFields: FormFieldInput[];
  setFormFields: (updatedFormFields: FormFieldInput[]) => void;
  collapsedFieldIds: string[];
  toggleCollapse: (fieldId: string) => void;
}) {
  return (
    <FormFieldsEditorBase
      collapsedFieldIds={collapsedFieldIds}
      formFields={formFields}
      setFormFields={setFormFields}
      toggleCollapse={toggleCollapse}
    />
  );
}

export function FormFieldsEditor({
  proposalId,
  formFields: initialFormFields,
  readOnly,
  refreshProposal
}: {
  proposalId: string;
  formFields: FormFieldInput[];
  readOnly?: boolean;
  refreshProposal: VoidFunction;
}) {
  const [formFields, setFormFields] = useState([...initialFormFields]);
  const [collapsedFieldIds, setCollapsedFieldIds] = useState<string[]>(formFields.map((field) => field.id));
  const { trigger, isMutating } = useUpdateProposalFormFields({ proposalId });
  const { showMessage } = useSnackbar();
  const [isFormDirty, setIsFormDirty] = useState(false);

  async function saveFormFields() {
    try {
      await trigger({ formFields });
      refreshProposal?.();
      showMessage('Form fields saved successfully');
    } catch (_) {
      //
    } finally {
      setIsFormDirty(false);
    }
  }

  const saveButtonDisabledTooltip = !isFormDirty
    ? 'Please edit the form before saving'
    : checkFormFieldErrors(formFields);

  function updateFormFields(fields: FormFieldInput[]) {
    setFormFields(fields);
    setIsFormDirty(true);
  }

  return (
    <>
      <Box mb={1}>
        <FormFieldsEditorBase
          collapsedFieldIds={collapsedFieldIds}
          formFields={formFields}
          setFormFields={updateFormFields}
          toggleCollapse={(fieldId) => {
            if (collapsedFieldIds.includes(fieldId)) {
              setCollapsedFieldIds(collapsedFieldIds.filter((id) => id !== fieldId));
            } else {
              setCollapsedFieldIds([...collapsedFieldIds, fieldId]);
            }
          }}
          readOnly={readOnly}
        />
      </Box>
      {formFields.length !== 0 && !readOnly && (
        <Button
          data-test='form-fields-save-button'
          onClick={saveFormFields}
          disabledTooltip={saveButtonDisabledTooltip}
          loading={isMutating}
          disabled={!!saveButtonDisabledTooltip}
        >
          Save
        </Button>
      )}
    </>
  );
}

function FormFieldsEditorBase({
  formFields,
  setFormFields,
  collapsedFieldIds,
  toggleCollapse,
  readOnly
}: {
  formFields: FormFieldInput[];
  setFormFields: (updatedFormFields: FormFieldInput[]) => void;
  collapsedFieldIds: string[];
  toggleCollapse: (fieldId: string) => void;
  readOnly?: boolean;
}) {
  // Using a ref to keep the formFields state updated, since it becomes stale inside the functions
  const formFieldsRef = useRef(formFields);
  const lastInsertedIndexRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    formFieldsRef.current = formFields;
  }, [formFields]);

  function updateFormField(
    updatedFormField: Partial<
      FormFieldInput & {
        isOpen: boolean;
      }
    > & {
      id: string;
    }
  ) {
    const newFormFields = [...formFieldsRef.current];
    const updatedFieldIndex = newFormFields.findIndex((f) => f.id === updatedFormField.id);
    const newIndex = updatedFormField.index;
    // If the index was changed, we need to move the form field to the new index
    if (typeof newIndex === 'number') {
      newFormFields.splice(newIndex, 0, newFormFields.splice(updatedFieldIndex, 1)[0]);
    }

    // Making sure that the label field is not required
    if (updatedFormField.type === 'label') {
      updatedFormField.required = false;
    }

    setFormFields(
      newFormFields.map((formField, index) => ({
        ...formField,
        ...(index === (newIndex ?? updatedFieldIndex) ? updatedFormField : {}),
        index
      }))
    );
  }

  function addNewFormField() {
    const fieldId = v4();
    setFormFields([
      ...formFields,
      {
        type: 'short_text',
        name: '',
        description: emptyDocument,
        index: formFields.length,
        options: [],
        private: false,
        required: true,
        id: fieldId
      }
    ]);

    lastInsertedIndexRef.current = formFields.length;
  }

  useEffect(() => {
    // reset last inserted index after render
    lastInsertedIndexRef.current = undefined;
  });

  function duplicateFormField(fieldId: string) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    newFormFields.splice(index, 0, {
      ...newFormFields[index],
      id: v4(),
      index: index + 1,
      options: newFormFields[index].options?.map((option) => ({ ...option, id: v4() })) ?? []
    });

    setFormFields(
      newFormFields.map((formField, i) => ({
        ...formField,
        index: i
      }))
    );
  }

  function deleteFormField(fieldId: string) {
    const newFormFields = formFields.filter((field) => field.id !== fieldId);
    setFormFields(
      newFormFields.map((formField, i) => ({
        ...formField,
        index: i
      }))
    );
  }

  function onCreateOption(fieldId: string, option: SelectOptionType) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    const options = newFormFields[index].options ?? [];
    options.push(option);
    setFormFields(newFormFields);
  }

  function onDeleteOption(fieldId: string, option: SelectOptionType) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    const options = newFormFields[index].options ?? [];
    const newOptions = options.filter((o) => o.id !== option.id);
    newFormFields[index].options = newOptions;
    setFormFields(newFormFields);
  }

  function onUpdateOption(fieldId: string, option: SelectOptionType) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    const options = newFormFields[index].options ?? [];
    const newOptions = options.map((o) => {
      if (o.id === option.id) {
        return option;
      }
      return o;
    });
    newFormFields[index].options = newOptions;
    setFormFields(newFormFields);
  }

  return (
    <Stack gap={1}>
      {formFields.map((formField) => (
        <FormField
          readOnly={readOnly}
          toggleOpen={() => {
            toggleCollapse(formField.id);
          }}
          isOpen={!collapsedFieldIds.includes(formField.id)}
          formField={formField}
          updateFormField={(updatedFormField) => {
            updateFormField(updatedFormField);
          }}
          key={formField.id}
          onDuplicate={() => duplicateFormField(formField.id)}
          onDelete={() => deleteFormField(formField.id)}
          onCreateOption={(option) => {
            onCreateOption(formField.id, option);
          }}
          onDeleteOption={(option) => {
            onDeleteOption(formField.id, option);
          }}
          onUpdateOption={(option) => {
            onUpdateOption(formField.id, option);
          }}
          forceFocus={lastInsertedIndexRef.current === formField.index}
        />
      ))}
      {!readOnly && (
        <Button
          sx={{
            width: 'fit-content'
          }}
          startIcon={<AddIcon fontSize='small' />}
          variant='text'
          size='small'
          color='secondary'
          data-test='add-new-form-field-button'
          onClick={addNewFormField}
        >
          Add an input
        </Button>
      )}
    </Stack>
  );
}
