import { Application } from '@prisma/client';
import { prisma } from 'db';

const CONCURRENT = 3;

/**
 * Port the status for existing assignees of a bounty
 */
export async function updateExistingAssigneeApplicationStatuses () {
  const bountiesWithAssignee = await prisma.bounty.findMany({
    where: {
      assignee: {
        not: null
      }
    }
  });

  for (let i = 0; i < bountiesWithAssignee.length; i += CONCURRENT) {
    const sliced = bountiesWithAssignee.slice(i, i + CONCURRENT);

    await Promise.all(sliced.map(bounty => {
      return new Promise<void>(resolve => {

        prisma.application.findFirst({
          where: {
            createdBy: bounty.assignee as string,
            bountyId: bounty.id
          }
        }).then(foundApp => {

          if (!foundApp) {
            resolve();
            return;
          }

          let newStatus = foundApp.status;

          switch (bounty.status) {
            case 'assigned':
              newStatus = 'inProgress';
              break;

            case 'review':
              newStatus = 'review';
              break;

            case 'complete':
              newStatus = 'complete';
              break;

            case 'paid':
              newStatus = 'paid';
              break;

            default:
              break;
          }

          if (newStatus !== foundApp.status) {
            prisma.application.update({
              where: {
                id: foundApp.id
              },
              data: {
                status: newStatus
              }
            }).then(() => resolve());
          }
          else {
            resolve();
          }

        });

      });
    }));
  }

  return true;
}

export async function setApplicationSpaceIds () {
  const foundApplications = await prisma.application.findMany({
    include: {
      bounty: true
    }
  });

  for (const app of foundApplications) {
    await prisma.application.update({
      where: {
        id: app.id
      },
      data: {
        spaceId: app.bounty.spaceId
      }
    });
  }

  return true;
}

export async function eliminateDuplicateApplications () {
  const applications = await prisma.application.findMany({});

  const rollup = applications.reduce((summary: Record<string, Application[]>, app) => {

    const userIdBountyId = `${app.bountyId}-${app.createdBy}`;

    if (summary[userIdBountyId] === undefined) {
      summary[userIdBountyId] = [app];
    }

    summary[userIdBountyId].push(app);

    return summary;
  }, {});

  const duplicates = (Object.values(rollup) as Array<Application[]>).filter(appList => {
    return appList.length >= 2;
  });

  const toDelete = duplicates.reduce((idList: string[], appLists) => {

    const idsToTarget = appLists.slice(1).map(app => app.id);
    idList.push(...idsToTarget);

    return idList;
  }, []);

  console.log('Found duplicates ', toDelete.length);

  await prisma.application.deleteMany({
    where: {
      OR: toDelete.map(id => {
        return {
          id
        };
      })
    }
  });

  return true;
}
