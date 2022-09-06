
import { Page, Prisma } from '@prisma/client';
import { prisma } from 'db';
import log from 'lib/log';
import { IEventToLog, postToDiscord } from 'lib/log/userEvents';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { IPageWithPermissions } from 'lib/pages/server';
import { setupPermissionsAfterPageCreated } from 'lib/permissions/pages';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { createProposal } from 'lib/proposal/createProposal';
import { syncProposalPermissions } from 'lib/proposal/syncProposalPermissions';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createPage);

async function createPage (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {
  const data = req.body as Page;

  const spaceId = data.spaceId;

  if (!spaceId) {
    throw new InvalidInputError('A space id is required to create a page');
  }

  const { id: userId } = req.session.user;

  const permissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: spaceId,
    userId
  });

  if (!permissions.createPage) {
    throw new UnauthorisedActionError('You do not have permissions to create a page.');
  }

  // Remove parent ID and pass it to the creation input
  // This became necessary after adding a formal parentPage relation related to page.parentId
  // We now need to specify this as a ParentPage.connect prisma argument instead of a raw string
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdBy, spaceId: droppedSpaceId, ...pageCreationData } = data;
  const typedPageCreationData = pageCreationData as any as Prisma.PageCreateInput;

  typedPageCreationData.author = {
    connect: {
      id: userId
    }
  };

  typedPageCreationData.space = {
    connect: {
      id: spaceId
    }
  };

  let page: Page;

  if (typedPageCreationData.type === 'proposal') {
    page = await createProposal({
      pageCreateInput: typedPageCreationData,
      spaceId,
      userId
    });
  }
  else {
    page = await prisma.page.create({ data: typedPageCreationData });
  }

  try {

    const pageWithPermissions = await (page.type === 'proposal' ? syncProposalPermissions({ proposalId: page.proposalId as string }) : setupPermissionsAfterPageCreated(page.id));

    logFirstWorkspacePageCreation(page);
    logFirstUserPageCreation(page);

    res.status(201).json(pageWithPermissions);
  }
  catch (error) {

    log.warn('Deleting page because page permissions failed. TODO: create permissions with page in one transaction', { error });
    await prisma.page.delete({ where: { id: page.id } });

    throw error;
  }
}

export default withSessionRoute(handler);

/**
 * Assumes that a first page will be created by the system
 * Should be called after a page is created
 * @param page
 */
async function logFirstWorkspacePageCreation (page: Page) {
  const workspaceCreatedPages = await prisma.page.count({
    where: {
      spaceId: page.spaceId,
      autoGenerated: {
        not: true
      }
    }
  });

  // Default page plus the just created page
  if (workspaceCreatedPages === 1) {

    const space = await prisma.space.findUnique({
      where: {
        id: page.spaceId!
      }
    });

    const eventLog: IEventToLog = {
      eventType: 'first_workspace_create_page',
      funnelStage: 'activation',
      message: `First page created in ${space!.domain} workspace`
    };

    postToDiscord(eventLog);
  }
}

/**
 * Assumes that a first page will be created by the system
 * Should be called after a page is created
 * @param page
 */
async function logFirstUserPageCreation (page: Page) {
  const userCreatedPages = await prisma.page.count({
    where: {
      createdBy: page.createdBy,
      autoGenerated: {
        not: true
      }
    }
  });

  // Default page plus the just created page
  if (userCreatedPages === 1) {

    const space = await prisma.space.findUnique({
      where: {
        id: page.spaceId!
      }
    });

    const eventLog: IEventToLog = {
      eventType: 'first_user_create_page',
      funnelStage: 'activation',
      message: `A user just created their first page. This happened in the ${space!.domain} workspace`
    };

    postToDiscord(eventLog);
  }
}
