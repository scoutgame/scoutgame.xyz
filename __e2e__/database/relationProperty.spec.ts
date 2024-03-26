import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { test as base, expect } from '@playwright/test';
import { DatabasePage } from '__e2e__/po/databasePage.po';
import { DocumentPage } from '__e2e__/po/document.po';
import { PagesSidebarPage } from '__e2e__/po/pagesSiderbar.po';

import type { IPropertyTemplate } from 'lib/databases/board';
import { Constants } from 'lib/databases/constants';
import { generateBoard } from 'testing/setupDatabase';

import { loginBrowserUser } from '../utils/mocks';

type Fixtures = {
  pagesSidebar: PagesSidebarPage;
  document: DocumentPage;
  databasePage: DatabasePage;
};

const test = base.extend<Fixtures>({
  pagesSidebar: ({ page }, use) => use(new PagesSidebarPage(page)),
  document: ({ page }, use) => use(new DocumentPage(page)),
  databasePage: ({ page }, use) => use(new DatabasePage(page))
});

// Will be set by the first test
let spaceUser: User;
let space: Space;

test.beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  spaceUser = generated.user;
  space = generated.space;
});

test('create and edit relation property values', async ({ page, document, databasePage }) => {
  // Arrange ------------------
  const sourceBoardPage = await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    customProps: {
      cardPropertyValues: [
        {
          [Constants.titleColumnId]: 'Source Card 1'
        },
        {
          [Constants.titleColumnId]: 'Source Card 2'
        }
      ]
    }
  });

  const sourceBoardCards = await prisma.block.findMany({
    where: {
      parentId: sourceBoardPage.id,
      type: 'card'
    },
    select: {
      id: true,
      page: {
        select: {
          icon: true,
          title: true
        }
      }
    },
    orderBy: {
      page: {
        title: 'asc'
      }
    }
  });

  const targetBoardPage = await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    boardTitle: 'Connected Board',
    customProps: {
      cardPropertyValues: [
        {
          [Constants.titleColumnId]: 'Connected Card 1'
        },
        {
          [Constants.titleColumnId]: 'Connected Card 2'
        }
      ]
    }
  });

  const targetBoardCards = await prisma.block.findMany({
    where: {
      parentId: targetBoardPage.id,
      type: 'card'
    },
    select: {
      id: true,
      page: {
        select: {
          icon: true,
          title: true
        }
      }
    },
    orderBy: {
      page: {
        title: 'asc'
      }
    }
  });

  await generateBoard({
    createdBy: spaceUser.id,
    spaceId: space.id,
    boardTitle: 'Test Board'
  });

  await loginBrowserUser({
    browserPage: page,
    userId: spaceUser.id
  });

  await document.goToPage({
    domain: space.domain,
    path: sourceBoardPage.path
  });

  await databasePage.addTablePropButton().click();
  const relationPropertyType = databasePage.getPropertyTypeOptionLocator({ type: 'relation' });
  expect(relationPropertyType).toBeVisible();
  await relationPropertyType.click();
  await databasePage.page.keyboard.type('Connected Board');
  await databasePage.linkedDatabaseOption({ sourceBoardId: targetBoardPage.id }).click();
  await databasePage.getShowOnRelatedBoardButton().click();
  await databasePage.getAddRelationButton().click();

  await databasePage.page.waitForTimeout(1000);

  const sourceBoard = await prisma.block.findUniqueOrThrow({
    where: {
      id: sourceBoardPage.id
    },
    select: {
      id: true,
      fields: true
    }
  });

  const sourceRelationProperty = (sourceBoard.fields as any).cardProperties.find(
    (field: IPropertyTemplate) => field.type === 'relation'
  );

  const tableCell = databasePage.getDatabaseTableCell({
    cardId: sourceBoardCards[0].id,
    templateId: sourceRelationProperty.id
  });
  await tableCell.click();

  await databasePage.page.locator(`data-test=page-option-${targetBoardCards[0].id}`).click();
  await tableCell.click(); // the menu hides for some reason, altho this doesnt happen in dev mode
  await databasePage.page.locator(`data-test=page-option-${targetBoardCards[1].id}`).click();

  await databasePage.page.locator("div[role='presentation']").click();
  await databasePage
    .getDatabaseTableCell({
      cardId: sourceBoardCards[1].id,
      templateId: sourceRelationProperty.id
    })
    .click();

  await databasePage.page.locator(`data-test=page-option-${targetBoardCards[0].id}`).click();

  const targetBoard = await prisma.block.findUniqueOrThrow({
    where: {
      id: targetBoardPage.id
    },
    select: {
      id: true,
      fields: true
    }
  });

  const connectedRelationProperty = (targetBoard.fields as any).cardProperties.find(
    (field: IPropertyTemplate) => field.type === 'relation'
  );

  const targetBoardView = await prisma.block.findFirstOrThrow({
    where: {
      parentId: targetBoardPage.id,
      type: 'view'
    },
    select: {
      fields: true,
      id: true
    }
  });

  await prisma.block.update({
    where: {
      id: targetBoardView.id
    },
    data: {
      fields: {
        ...(targetBoardView.fields as any),
        visiblePropertyIds: [...(targetBoardView.fields as any).visiblePropertyIds, connectedRelationProperty.id]
      }
    }
  });

  await prisma.block.update({
    where: {
      id: targetBoardView.id
    },
    data: {
      fields: {
        ...(targetBoardView.fields as any),
        visiblePropertyIds: [...(targetBoardView.fields as any).visiblePropertyIds, connectedRelationProperty.id]
      }
    }
  });

  await document.goToPage({
    domain: space.domain,
    path: targetBoardPage.path
  });

  const targetBoardCard1RelationPropertyCell = databasePage.getDatabaseTableCell({
    cardId: targetBoardCards[0].id,
    templateId: connectedRelationProperty.id
  });

  const targetBoardCard2RelationPropertyCell = databasePage.getDatabaseTableCell({
    cardId: targetBoardCards[1].id,
    templateId: connectedRelationProperty.id
  });

  expect(await targetBoardCard1RelationPropertyCell.textContent()).toContain(_getTitle(sourceBoardCards[0]));
  expect(await targetBoardCard1RelationPropertyCell.textContent()).toContain(_getTitle(sourceBoardCards[1]));
  expect(await targetBoardCard2RelationPropertyCell.textContent()).toBe(_getTitle(sourceBoardCards[0]));

  await databasePage
    .getDatabaseTableCell({
      cardId: targetBoardCards[0].id,
      templateId: connectedRelationProperty.id
    })
    .click();

  await databasePage.page.locator(`data-test=page-option-${sourceBoardCards[0].id}`).getByTestId('RemoveIcon').click();

  await document.goToPage({
    domain: space.domain,
    path: sourceBoardPage.path
  });

  const sourceBoardCard1RelationPropertyCell = databasePage.getDatabaseTableCell({
    cardId: sourceBoardCards[0].id,
    templateId: sourceRelationProperty.id
  });

  const sourceBoardCard2RelationPropertyCell = databasePage.getDatabaseTableCell({
    cardId: sourceBoardCards[1].id,
    templateId: sourceRelationProperty.id
  });

  expect(await sourceBoardCard1RelationPropertyCell.textContent()).toBe(_getTitle(targetBoardCards[1]));
  expect(await sourceBoardCard2RelationPropertyCell.textContent()).toBe(_getTitle(targetBoardCards[0]));
});

function _getTitle({ page }: { page: { icon: string | null; title: string } | null }) {
  const { icon, title } = page || { title: '', icon: '' };
  return `${icon}${title}`;
}
