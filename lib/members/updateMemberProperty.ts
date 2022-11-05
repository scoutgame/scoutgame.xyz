import type { MemberProperty, Prisma, PrismaPromise } from '@prisma/client';

import { prisma } from 'db';
import type { ExistingSelectOption } from 'lib/forms/Interfaces';
import { InvalidInputError } from 'lib/utilities/errors';

type UpdatePropertyInput = {
  data: Prisma.MemberPropertyUpdateInput;
  id: string;
  userId: string;
  spaceId: string;
}

export async function updateMemberProperty ({ data, id, spaceId }: UpdatePropertyInput) {
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
    }) as MemberProperty;

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

  return prisma.$transaction(transactions);
}
