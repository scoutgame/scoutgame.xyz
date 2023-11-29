import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import useSWRImmutable from 'swr/immutable';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { MemberPropertyValueType } from 'lib/members/interfaces';

import { useMemberPropertyValues } from './useMemberPropertyValues';

export function useRequiredMemberProperties({ userId }: { userId: string }) {
  const { memberPropertyValues = [], isLoading } = useMemberPropertyValues(userId);
  const { space: currentSpace } = useCurrentSpace();
  const { data: userDetails } = useSWRImmutable(`/current-user-details`, () => charmClient.getUserDetails());

  const memberProperties = useMemo(
    () =>
      memberPropertyValues
        .filter((mpv) => mpv.spaceId === currentSpace?.id)
        .map((mpv) => mpv.properties)
        .flat(),
    [memberPropertyValues, currentSpace?.id]
  );

  const requiredProperties = useMemo(
    () => memberProperties.filter((p) => p.required && !['role', 'join_date'].includes(p.type)) ?? [],
    [memberProperties]
  );

  const requiredPropertiesWithoutValue = useMemo(() => {
    let propertiesWithoutValue = requiredProperties
      .filter(
        (rp) =>
          !memberProperties.find((mp) => mp.memberPropertyId === rp.memberPropertyId)?.value &&
          !['bio', 'timezone'].includes(rp.type)
      )
      .map((p) => p.memberPropertyId);

    const isTimezoneRequired = requiredProperties.find((p) => p.type === 'timezone')?.required;
    const isBioRequired = requiredProperties.find((p) => p.type === 'bio')?.required;
    const isNameRequired = requiredProperties.find((p) => p.type === 'name')?.required;

    if (isTimezoneRequired && !userDetails?.timezone && !isLoading) {
      propertiesWithoutValue = [...propertiesWithoutValue, 'timezone'];
    }

    if (isBioRequired && !userDetails?.description && !isLoading) {
      propertiesWithoutValue = [...propertiesWithoutValue, 'bio'];
    }

    if (isNameRequired && !userDetails?.name && !isLoading) {
      propertiesWithoutValue = [...propertiesWithoutValue, 'name'];
    }

    return propertiesWithoutValue;
  }, [requiredProperties, memberProperties, userDetails, isLoading]);

  return {
    memberProperties,
    requiredProperties,
    requiredPropertiesWithoutValue,
    userDetails
  };
}

export function useRequiredMemberPropertiesForm({ userId }: { userId: string }) {
  const { memberProperties, userDetails, requiredProperties, requiredPropertiesWithoutValue } =
    useRequiredMemberProperties({ userId });

  const editableRequiredProperties = requiredProperties.filter(
    (p) =>
      ![
        // Handled by oauth
        'linked_in',
        'github',
        'discord',
        'twitter',
        'profile_pic',
        // Handled separately from space member properties
        'bio',
        'timezone'
      ].includes(p.type)
  );

  const {
    control,
    formState: { isValid, errors },
    reset,
    getValues
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(
      yup.object(
        Object.values(editableRequiredProperties).reduce((acc, prop) => {
          if (prop.type === 'multiselect') {
            acc[prop.memberPropertyId] = yup.array().of(yup.string()).required();
            return acc;
          }
          acc[prop.memberPropertyId] = prop.type === 'number' ? yup.number().required() : yup.string().required();
          return acc;
        }, {} as Record<string, any>)
      )
    )
  });

  const values = getValues();

  useEffect(() => {
    if (!memberProperties) {
      return;
    }
    const defaultValues = memberProperties.reduce<Record<string, MemberPropertyValueType>>((acc, prop) => {
      acc[prop.memberPropertyId] = prop.value;
      return acc;
    }, {});

    reset(defaultValues);
  }, [memberProperties, reset]);

  return {
    values,
    control,
    isValid,
    errors,
    memberProperties,
    requiredProperties,
    userDetails,
    requiredPropertiesWithoutValue
  };
}
