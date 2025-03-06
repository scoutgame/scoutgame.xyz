'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getUserScoutProjects';
import { updateScoutProjectAction } from '@packages/scoutgame/projects/updateScoutProjectAction';
import { updateScoutProjectSchema } from '@packages/scoutgame/projects/updateScoutProjectSchema';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { ProjectForm } from '../../../components/ProjectForm/ProjectForm';
import type { Deployer } from '../../../create/components/ProjectSmartContractForm';

export function EditProjectForm({ project }: { project: ScoutProjectDetailed }) {
  const [deployers, setDeployers] = useState<Deployer[]>(
    project.deployers.map((deployer) => ({
      address: deployer.address,
      verified: true,
      signature: ''
    }))
  );

  const [errors, setErrors] = useState<string[] | null>(null);
  const {
    control,
    formState: { isDirty },
    handleSubmit
  } = useForm({
    resolver: yupResolver(updateScoutProjectSchema),
    mode: 'onChange',
    defaultValues: {
      projectId: project.id,
      avatar: project.avatar,
      name: project.name,
      description: project.description,
      website: project.website,
      github: project.github,
      teamMembers: project.teamMembers.map((member) => ({
        ...member,
        scoutId: member.id
      })),
      contracts: project.contracts.map((contract) => ({
        address: contract.address,
        chainId: contract.chainId,
        deployerAddress: project.deployers.find((deployer) => deployer.id === contract.deployerId)?.address
      })),
      deployers: deployers.map((deployer) => ({
        address: deployer.address,
        verified: deployer.verified
      })),
      solanaWallets: project.wallets
        .filter((w) => w.chainType === 'solana')
        .map((wallet) => ({
          address: wallet.address,
          verified: true
        })),
      wallets: project.wallets
        .filter((w) => w.chainType === 'evm')
        .map((wallet) => ({
          address: wallet.address,
          chainId: wallet.chainId!,
          verified: true
        }))
    }
  });

  const router = useRouter();

  const { execute: updateProject, isExecuting } = useAction(updateScoutProjectAction, {
    onSuccess: (data) => {
      if (data.data) {
        router.push(`/p/${data.data.path}`);
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
    handleSubmit(updateProject, onInvalid)();
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
      cancelLink={`/p/${project.path}`}
      showRemoveMemberConfirmation
    />
  );
}
