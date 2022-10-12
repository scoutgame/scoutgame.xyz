import { expect, test as base } from '@playwright/test';
import { TokenGatePage } from '__e2e__/po/tokenGate.po';
import { login } from '__e2e__/utils/session';
import { mockWeb3 } from '__e2e__/utils/web3';
import { v4 } from 'uuid';

import { baseUrl } from 'config/constants';
import { prisma } from 'db';

import { generateTokenGate, generateUserAndSpace } from '../../utils/mocks';

type Fixtures = {
  tokenGatePage: TokenGatePage;
};

const test = base.extend<Fixtures>({
  tokenGatePage: ({ page }, use) => use(new TokenGatePage(page))
});

test('joinWorkspace - search for a workspace and join a token gated workspace after meeting conditions', async ({ page, tokenGatePage }) => {
  const { space, page: pageDoc, user: spaceUser } = await generateUserAndSpace({ spaceName: v4() });
  const { user, address, privateKey } = await generateUserAndSpace();

  const tokenGate = await generateTokenGate({
    spaceId: space.id,
    userId: spaceUser.id
  });

  await mockWeb3({
    page: tokenGatePage.page,
    context: { privateKey, address },
    init: ({ Web3Mock, context }) => {
      Web3Mock.mock({
        blockchain: 'ethereum',
        accounts: {
          return: [context.address]
        }
      });
    }
  });

  await login({ userId: user.id, page });

  await page.route('**/api/token-gates', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([tokenGate])
    });
  });

  await page.route('**/api/token-gates/evaluate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        userId: user.id,
        space,
        walletAddress: address,
        canJoinSpace: true,
        gateTokens: [{ tokenGate, signedToken: '' }],
        roles: []
      })
    });
  });

  await page.route('**/api/token-gates/verify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true
      })
    });
  });

  // go to a page to which we don't have access
  await page.goto(`${baseUrl}/join`);

  // wait for token gate page to open for the workspace
  await tokenGatePage.waitForJoinURL();
  await expect(tokenGatePage.joinWorkspaceTextField).toBeVisible();
  await tokenGatePage.joinWorkspaceTextField.fill(space.name);
  await tokenGatePage.page.locator(`[data-test=join-workspace-autocomplete-${space.domain}]`).click();

  await expect(tokenGatePage.tokenGateForm).toBeVisible();
  await tokenGatePage.verifyWalletButton.click();
  await expect(tokenGatePage.joinWorkspaceButton).toBeVisible();
  await tokenGatePage.joinWorkspaceButton.click();
  // Joining a workspace creates a spaceRole
  await prisma.spaceRole.create({
    data: {
      isAdmin: false,
      spaceId: space.id,
      userId: user.id
    }
  });
  await page.goto(`${baseUrl}/${space.domain}`);
  await page.locator(`text=${pageDoc.title}`).first().waitFor({ state: 'visible' });
});
