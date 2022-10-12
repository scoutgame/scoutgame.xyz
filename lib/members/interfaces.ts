import type { MemberPropertyType, User } from '@prisma/client';

export type MemberPropertyValue = {
  id: string;
  value: string | number | string[] | null;
  // TODO - we might not need props below
  type: MemberPropertyType;
  name: string;
}

export type Member = Omit<User, 'addresses'> & {
  isAdmin: boolean;
  joinDate: string;
  hasNftAvatar?: boolean;
  properties: MemberPropertyValue[];
}
