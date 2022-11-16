import type { MemberProperty, PrismaPromise } from '@prisma/client';

import { prisma } from 'db';
import type { ExistingSelectOption } from 'lib/forms/Interfaces';
import { NotFoundError } from 'lib/middleware';
import { InvalidInputError } from 'lib/utilities/errors';

type UpdatePropertyInput = {
  data: Partial<MemberProperty>;
  id: string;
  userId: string;
  spaceId: string;
}

export async function updateMemberProperty ({ data, id, userId, spaceId }: UpdatePropertyInput): Promise<MemberProperty> {
  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });

  if (!spaceRole) {
    throw new InvalidInputError('Invalid workspace data.');
  }

  let updateData = data;
  if (!spaceRole.isAdmin) {
    // non-admin users can only update property options
    if (!updateData.options) {
      throw new InvalidInputError('Invalid property data.');
    }

    updateData = { options: data.options };
  }

  const transactions: PrismaPromise<any>[] = [];
  const newIndex = data.index;
  const updateOptions = data.options as ExistingSelectOption[] || [];
  const hasDuplicatedOptions = updateOptions
    .some((option, index, options) => options.findIndex(o => o.name.toLowerCase() === option.name.toLowerCase()) !== index);

  if (hasDuplicatedOptions) {
    throw new InvalidInputError('Duplicated option names are not allowed.');
  }

  if (newIndex !== null && newIndex !== undefined) {
    const memberProperty = await prisma.memberProperty.findUnique({
      where: {
        id
      },
      select: {
        index: true
      }
    });

    if (!memberProperty) {
      throw new NotFoundError('member property not found');
    }

    const currentIndex = memberProperty.index;

    transactions.push(prisma.memberProperty.updateMany({
      where: {
        spaceId,
        index: currentIndex < newIndex ? {
          gt: currentIndex,
          lte: newIndex as number
        } : {
          lt: currentIndex,
          gte: newIndex as number
        }
      },
      data: {
        index: currentIndex < newIndex ? {
          decrement: 1
        } : {
          increment: 1
        }
      }
    }));
  }

  transactions.push(prisma.memberProperty.update({
    where: {
      id
    },
    data: { ...data, options: data.options ?? undefined, updatedBy: userId, id }
  }));

  const result = await prisma.$transaction(transactions);

  return result[result.length - 1] as MemberProperty;
}
