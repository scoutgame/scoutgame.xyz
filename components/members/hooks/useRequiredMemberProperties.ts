import type { UserDetails } from '@charmverse/core/dist/cjs/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import useSWRImmutable from 'swr/immutable';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { MemberPropertyValueType, Social } from 'lib/members/interfaces';

import { useMemberPropertyValues } from './useMemberPropertyValues';

export function useRequiredMemberProperties({ userId }: { userId: string }) {
  const { memberPropertyValues } = useMemberPropertyValues(userId);
  const { space: currentSpace } = useCurrentSpace();
  const { data: userDetails } = useSWRImmutable(`/current-user-details`, () => charmClient.getUserDetails());

  const {
    memberProperties,
    isBioRequired,
    isTimezoneRequired,
    requiredProperties,
    nonEmptyRequiredProperties,
    isGithubRequired,
    isLinkedinRequired,
    isTwitterRequired
  } = useMemo(() => {
    const _memberProperties = memberPropertyValues
      ?.filter((mpv) => mpv.spaceId === currentSpace?.id)
      .map((mpv) => mpv.properties)
      .flat();

    // Role and join date are non editable properties
    const _requiredProperties =
      _memberProperties?.filter((p) => p.required && !['role', 'join_date'].includes(p.type)) ?? [];
    const _isTimezoneRequired = _requiredProperties.find((p) => p.type === 'timezone');
    const _isBioRequired = _requiredProperties.find((p) => p.type === 'bio');
    const _isTwitterRequired = _requiredProperties.find((p) => p.type === 'twitter');
    const _isLinkedinRequired = _requiredProperties.find((p) => p.type === 'linked_in');
    const _isGithubRequired = _requiredProperties.find((p) => p.type === 'github');

    const userDetailsSocial = userDetails?.social as Social;

    const propertiesWithoutValue = _requiredProperties
      .filter(
        (rp) =>
          !_memberProperties?.find((mp) => mp.memberPropertyId === rp.memberPropertyId)?.value &&
          !['bio', 'timezone', 'twitter', 'linked_in', 'github'].includes(rp.type)
      )
      .map((p) => p.memberPropertyId);

    if (userDetails && _isTimezoneRequired && !userDetails.timezone) {
      propertiesWithoutValue.push('timezone');
    }

    if (userDetails && _isBioRequired && !userDetails.description) {
      propertiesWithoutValue.push('bio');
    }

    if (userDetails && _isTwitterRequired && !userDetailsSocial?.twitterURL) {
      propertiesWithoutValue.push('twitter');
    }

    if (userDetails && _isLinkedinRequired && !userDetailsSocial?.linkedinURL) {
      propertiesWithoutValue.push('linked_in');
    }

    if (userDetails && _isGithubRequired && !userDetailsSocial?.githubURL) {
      propertiesWithoutValue.push('github');
    }

    return {
      memberProperties: _memberProperties,
      requiredProperties: _requiredProperties,
      isTimezoneRequired: !!_isTimezoneRequired,
      isBioRequired: !!_isBioRequired,
      nonEmptyRequiredProperties: propertiesWithoutValue.length !== 0,
      isTwitterRequired: !!_isTwitterRequired,
      isLinkedinRequired: !!_isLinkedinRequired,
      isGithubRequired: !!_isGithubRequired
    };
  }, [userDetails, memberPropertyValues, currentSpace?.id]);

  const checkHasEmptyRequiredPropertiesFromUserDetails = useCallback(
    (_userDetails?: Partial<Omit<UserDetails, 'id'>>) => {
      if (requiredProperties.length === 0) {
        return false;
      }

      if (!_userDetails) {
        return true;
      }

      if (isTimezoneRequired && !_userDetails.timezone) {
        return true;
      }

      if (isBioRequired && !_userDetails.description) {
        return true;
      }

      const userDetailsSocial = _userDetails?.social as Social;

      if (isTwitterRequired && !userDetailsSocial?.twitterURL) {
        return true;
      }

      if (isLinkedinRequired && !userDetailsSocial?.linkedinURL) {
        return true;
      }

      if (isGithubRequired && !userDetailsSocial?.githubURL) {
        return true;
      }

      return false;
    },
    [requiredProperties, isTimezoneRequired, isBioRequired, isTwitterRequired, isLinkedinRequired, isGithubRequired]
  );

  return {
    checkHasEmptyRequiredPropertiesFromUserDetails,
    memberProperties,
    requiredProperties,
    isTimezoneRequired,
    isBioRequired,
    nonEmptyRequiredProperties,
    userDetails,
    isTwitterRequired,
    isLinkedinRequired,
    isGithubRequired
  };
}

export function useRequiredMemberPropertiesForm({ userId }: { userId: string }) {
  const { memberProperties, requiredProperties, ...rest } = useRequiredMemberProperties({ userId });

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
    ...rest
  };
}
