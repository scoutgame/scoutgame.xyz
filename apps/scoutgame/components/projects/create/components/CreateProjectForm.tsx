'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import type { SessionUser } from '@packages/nextjs/session/interfaces';
import { createScoutProjectAction } from '@packages/scoutgame/projects/createScoutProjectAction';
import { createScoutProjectSchema } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { ProjectForm } from '../../components/ProjectForm/ProjectForm';
import type { Deployer } from '../components/ProjectForm/components/ProjectSmartContractForm';

export function CreateProjectForm({ user }: { user: SessionUser }) {
  const [errors, setErrors] = useState<string[] | null>(null);
  const [deployers, setDeployers] = useState<Deployer[]>([]);

  const {
    control,
    formState: { isDirty },
    handleSubmit,
    setValue
  } = useForm({
    resolver: yupResolver(createScoutProjectSchema),
    mode: 'onChange',
    defaultValues: {
      avatar: '',
      name: '',
      description: '',
      website: '',
      github: '',
      teamMembers: [{ scoutId: user.id, role: 'owner', avatar: user.avatar ?? '', displayName: user.displayName }],
      contracts: [],
      deployers: [],
      wallets: []
    }
  });

  const router = useRouter();

  const { execute: createProject, isExecuting } = useAction(createScoutProjectAction, {
    onSuccess: (data) => {
      if (data?.data) {
        router.push(`/p/${data?.data.path}`);
      }
    },
    onError: (error) => {
      log.error('Error creating project', { error });
      setErrors([error.error.serverError?.message ?? 'Failed to create project']);
    }
  });

  function onInvalid(fieldErrors: FieldErrors) {
    setErrors([
      `The form is invalid. ${Object.values(fieldErrors)
        .map((error) => error?.message)
        .join(', ')}`
    ]);
    log.warn('Invalid form submission', { fieldErrors });
  }

  const onSubmit = () => {
    // Need to set the deployers from state first before submitting
    setValue(
      'deployers',
      deployers.map((deployer) => ({
        address: deployer.address,
        signature: deployer.signature as `0x${string}`,
        verified: deployer.verified
      }))
    );
    handleSubmit(createProject, onInvalid)();
  };

  return (
    <ProjectForm
      control={control}
      isDirty={isDirty}
      onSave={onSubmit}
      errors={errors}
      isExecuting={isExecuting}
      deployers={deployers}
      setDeployers={setDeployers}
      cancelLink='/profile/projects'
      showRemoveMemberConfirmation={false}
    />
  );
}
