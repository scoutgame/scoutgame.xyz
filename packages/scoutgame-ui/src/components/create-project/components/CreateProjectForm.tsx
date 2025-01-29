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

import { ProjectForm } from '../../projects/components/ProjectForm/ProjectForm';

import type { Deployer } from './ProjectSmartContractForm';

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
      deployers: []
    }
  });

  const router = useRouter();

  const { execute: createProject, isExecuting } = useAction(createScoutProjectAction, {
    onSuccess: (data) => {
      if (data?.data) {
        router.push(`/projects/${data?.data.path}`);
      }
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
    setValue(
      'deployers',
      deployers.map((deployer) => ({
        address: deployer.address,
        signature: deployer.signature as `0x${string}`,
        verified: deployer.verified
      }))
    );
    handleSubmit((data) => {
      return createProject(data);
    }, onInvalid)();
  };

  return (
    <ProjectForm
      control={control}
      isDirty={isDirty}
      onSave={onSubmit}
      errors={errors}
      isDisabled={isExecuting}
      deployers={deployers}
      setDeployers={setDeployers}
      cancelLink='/projects'
    />
  );
}
