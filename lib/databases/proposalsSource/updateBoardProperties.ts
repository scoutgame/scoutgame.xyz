import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { IPropertyTemplate, BoardFields } from 'lib/databases/board';
import type { FormFieldInput } from 'lib/forms/interfaces';
import { InvalidStateError } from 'lib/middleware/errors';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/proposals/blocks/constants';
import { prettyPrint } from 'lib/utils/strings';

import { getBoardProperties } from './getBoardProperties';

export async function updateBoardProperties({ boardId }: { boardId: string }): Promise<Block> {
  const boardBlock = await prisma.block.findUniqueOrThrow({
    where: {
      id: boardId
    }
  });

  const [proposalBoardBlock, evaluationSteps, forms] = await Promise.all([
    prisma.proposalBlock.findUnique({
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId: boardBlock.spaceId
        }
      },
      select: {
        fields: true
      }
    }) as Promise<null | { fields: BoardFields }>,
    prisma.proposalEvaluation.findMany({
      where: {
        proposal: {
          spaceId: boardBlock.spaceId
        }
      },
      select: {
        type: true,
        title: true,
        rubricCriteria: {
          select: {
            title: true,
            answers: {
              select: {
                response: true
              }
            }
          }
        }
      },
      orderBy: {
        index: 'asc'
      }
    }),
    prisma.form.findMany({
      where: {
        proposal: {
          some: {
            page: {
              type: 'proposal'
            },
            spaceId: boardBlock.spaceId
          }
        }
      },
      select: {
        proposal: {
          orderBy: {
            page: {
              createdAt: 'asc'
            }
          },
          select: {
            page: {
              select: {
                createdAt: true
              }
            }
          }
        },
        id: true,
        formFields: {
          orderBy: {
            index: 'asc'
          }
        }
      }
    })
  ]);

  const boardFields = boardBlock.fields as unknown as BoardFields;
  if (boardFields.sourceType !== 'proposals') {
    throw new InvalidStateError(`Cannot add proposal cards to a database which does not have proposals as its source`);
  }

  const formFields: FormFieldInput[] = forms
    .sort((a, b) => (a.proposal[0]?.page?.createdAt.getTime() ?? 0) - (b.proposal[0]?.page?.createdAt.getTime() ?? 0))
    .flatMap((p) => p.formFields.map((field) => ({ ...field, options: field.options as FormFieldInput['options'] })));

  const proposalCustomProperties = (proposalBoardBlock?.fields.cardProperties ?? []) as IPropertyTemplate[];
  const boardProperties = getBoardProperties({
    evaluationSteps,
    formFields,
    proposalCustomProperties,
    currentCardProperties: boardFields.cardProperties
  });

  return prisma.block.update({
    where: {
      id: boardBlock.id
    },
    data: {
      fields: {
        ...(boardBlock.fields as any),
        cardProperties: boardProperties
      }
    }
  });
}
