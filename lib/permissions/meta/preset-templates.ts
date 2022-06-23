import { SpaceOperation, SpacePermissionConfigurationMode } from '@prisma/client';
import { SpaceConfigurationPreset, SpacePermissionTemplate } from './interfaces';
import { spaceOperationLabels } from '../spaces/mapping';

const readOnly: SpacePermissionTemplate = {
  spaceOperations: {
    createBounty: false,
    createPage: false
  },
  pagePermissionDefaults: {
    defaultPagePermissionGroup: 'view',
    defaultPublicPages: false
  }
};

const collaborative: SpacePermissionTemplate = {
  spaceOperations: {
    createPage: true,
    createBounty: true
  },
  pagePermissionDefaults: {
    defaultPagePermissionGroup: 'full_access',
    defaultPublicPages: false
  }
};

const open: SpacePermissionTemplate = {
  spaceOperations: {
    createPage: true,
    createBounty: true
  },
  pagePermissionDefaults: {
    defaultPagePermissionGroup: 'full_access',
    defaultPublicPages: true
  }
};

export const permissionTemplates: Record<SpaceConfigurationPreset, SpacePermissionTemplate> = {
  readOnly,
  collaborative,
  open
};

export const configurationModeName: Record<SpacePermissionConfigurationMode, string> = {
  custom: 'Custom settings',
  readOnly: 'Read-only workspace',
  collaborative: 'Collaborative workspace',
  open: 'Public workspace'
};

export const configurationModeDescription: Record<SpacePermissionConfigurationMode, string> = {
  custom: 'Manage settings individually.',
  readOnly: 'Contributors can only read existing content.',
  collaborative: 'Contributors can create and edit content.',
  open: 'Content created by contributors is available to the public by default.'
};

/**
 * Returns a tuple with what the user can and cannot do as a list of strings
 */
export function getTemplateExplanation (template: SpacePermissionConfigurationMode): [string[], string[]] {
  const canAndCannot: [string[], string[]] = [[], []];

  if (template === 'custom') {
    return canAndCannot;
  }

  const templateData = permissionTemplates[template];

  // Handle space operations
  for (const [operation, can] of Object.entries(templateData.spaceOperations) as Array<[SpaceOperation, boolean]>) {

    const qualifier = can ? 'can' : 'cannot';

    const sentence = `Workspace members ${qualifier} ${spaceOperationLabels[operation].toLowerCase()}.`;

    if (can) {
      canAndCannot[0].push(sentence);
    }
    else {
      canAndCannot[1].push(sentence);
    }
  }

  const { defaultPagePermissionGroup } = templateData.pagePermissionDefaults;

  // Handle page permission defaults
  if (defaultPagePermissionGroup === 'full_access') {
    canAndCannot[0].push('Workspace members can view, edit, comment on, share and delete new top-level pages by default.');
  }
  else if (defaultPagePermissionGroup === 'editor') {
    canAndCannot[0].push('Workspace members can view, edit and comment on new top-level pages by default.');
    canAndCannot[1].push('Workspace members cannot share or delete new top-level pages by default.');

  }
  else if (defaultPagePermissionGroup === 'view_comment') {
    canAndCannot[0].push('Workspace members can view and comment on new top-level pages by default.');
    canAndCannot[1].push('Workspace members cannot edit, share or delete new top-level pages by default.');
  }
  else if (templateData.pagePermissionDefaults.defaultPagePermissionGroup === 'view') {
    canAndCannot[0].push('Workspace members can view new top-level pages by default.');
    canAndCannot[1].push('Workspace members cannot comment on, edit, share or delete new top-level pages by default.');
  }

  const { defaultPublicPages } = templateData.pagePermissionDefaults;

  if (defaultPublicPages) {
    canAndCannot[0].push('Anyone can see new top-level pages by default.');
  }
  else {
    canAndCannot[1].push('Anyone outside the space cannot see new top-level pages by default.');
  }

  return canAndCannot;
}
