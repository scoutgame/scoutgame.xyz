import { AvailablePagePermissions } from '@charmverse/core/permissions/flags';
import { render } from '@testing-library/react';
import { v4 as uuid, v4 } from 'uuid';

// Import hooks to mock
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePages } from 'hooks/usePages';
// import { usePages } from 'hooks/usePages';
import { useProposal } from 'hooks/useProposal';
import { mockCurrentSpaceContext } from 'testing/mocks/useCurrentSpace';

import ShareToWeb from '../ShareToWeb';

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    query: {},
    route: '/',
    pathname: '',
    path: '',
    asPath: ''
  }))
}));
jest.mock('hooks/useProposal', () => ({
  useProposal: jest.fn(() => ({
    proposal: null
  }))
}));
jest.mock('charmClient');
jest.mock('hooks/useCurrentSpace');
jest.mock('hooks/usePagePermissions');
jest.mock('hooks/usePages', () => ({
  usePages: jest.fn(() => ({
    pages: {}
  }))
}));
jest.mock('hooks/useCurrentSpace', () => ({
  useCurrentSpace: jest.fn(() => mockCurrentSpaceContext())
}));

afterAll(() => {
  jest.resetModules();
});

describe('shareToWeb', () => {
  it('should render the toggle as checked if no public permission exists or as unchecked if a public permission exists', async () => {
    const pageId = uuid();

    (usePagePermissions as jest.Mock<ReturnType<typeof usePagePermissions>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions().full
    });

    const resultWithPermissions = render(
      <ShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    let toggle = resultWithPermissions.getByTestId('toggle-public-page', {}).children.item(0);
    expect(toggle?.getAttribute('type')).toBe('checkbox');

    // Important part of the test
    expect(toggle).not.toBeChecked();
    expect(toggle).not.toBeDisabled();

    (usePagePermissions as jest.Mock<ReturnType<typeof usePagePermissions>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions().full
    });

    // Re-render this with a public permission
    resultWithPermissions.rerender(
      <ShareToWeb
        pageId={pageId}
        pagePermissions={[
          {
            id: v4(),
            pageId,
            permissionLevel: 'view',
            assignee: { group: 'public' }
          }
        ]}
        refreshPermissions={jest.fn()}
      />
    );

    toggle = resultWithPermissions.getByTestId('toggle-public-page', {}).children.item(0);
    expect(toggle?.getAttribute('type')).toBe('checkbox');

    // Important part of the test
    expect(toggle).toBeChecked();
    expect(toggle).not.toBeDisabled();
  });

  it('should render an enabled public toggle only if a user has permissions to toggle the public status of the page', async () => {
    const pageId = uuid();

    (usePagePermissions as jest.Mock<ReturnType<typeof usePagePermissions>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions().full
    });

    const resultWithPermissions = render(
      <ShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    const toggle = resultWithPermissions.getByTestId('toggle-public-page', {}).children.item(0);
    expect(toggle?.getAttribute('type')).toBe('checkbox');

    // Important part of the test
    expect(toggle).not.toBeDisabled();
  });

  it('should render a disabled public toggle if a user does not have permissions to toggle the public status of the page', async () => {
    const pageId = uuid();

    (usePagePermissions as jest.Mock<ReturnType<typeof usePagePermissions>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions().empty
    });

    const resultWithPermissions = render(
      <ShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    const toggle = resultWithPermissions.getByTestId('toggle-public-page', {}).children.item(0);
    expect(toggle?.getAttribute('type')).toBe('checkbox');

    // Important part of the test
    expect(toggle).toBeDisabled();
  });

  it('should render a disabled unchecked public toggle if the space has activated public proposals, the page is a proposal page and proposal status is draft', async () => {
    const pageId = uuid();

    (usePagePermissions as jest.Mock<ReturnType<typeof usePagePermissions>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions().full
    });
    (useProposal as jest.Mock<ReturnType<typeof useProposal>>).mockReturnValueOnce({
      proposal: {
        status: 'draft'
      } as any
    });

    (usePages as jest.Mock).mockReturnValueOnce({
      pages: {
        [pageId]: {
          type: 'proposal'
        }
      }
    });

    (useCurrentSpace as jest.Mock<ReturnType<typeof useCurrentSpace>>).mockReturnValueOnce(
      mockCurrentSpaceContext({
        publicProposals: true
      })
    );

    const resultWithPermissions = render(
      <ShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    const toggle = resultWithPermissions.getByTestId('toggle-public-page', {}).children.item(0);
    expect(toggle?.getAttribute('type')).toBe('checkbox');

    // Important part of the test
    expect(toggle).not.toBeChecked();
    expect(toggle).toBeDisabled();
  });

  it('should render a disabled checked public toggle if the space has activated public proposals, the page is a proposal page and proposal status is discussion or beyond', async () => {
    const pageId = uuid();

    (usePagePermissions as jest.Mock<ReturnType<typeof usePagePermissions>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions().full
    });
    (useProposal as jest.Mock<ReturnType<typeof useProposal>>).mockReturnValueOnce({
      proposal: {
        status: 'discussion'
      } as any
    });

    (usePages as jest.Mock).mockReturnValueOnce({
      pages: {
        [pageId]: {
          type: 'proposal'
        }
      }
    });

    (useCurrentSpace as jest.Mock<ReturnType<typeof useCurrentSpace>>).mockReturnValueOnce(
      mockCurrentSpaceContext({
        publicProposals: true
      })
    );

    const resultWithPermissions = render(
      <ShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    const toggle = resultWithPermissions.getByTestId('toggle-public-page', {}).children.item(0);
    expect(toggle?.getAttribute('type')).toBe('checkbox');

    // Important part of the test
    expect(toggle).toBeChecked();
    expect(toggle).toBeDisabled();
  });

  it('should render an enabled public toggle if the space has activated public proposals, user has permissions to toggle public status, and the page is not of type proposal', async () => {
    const pageId = uuid();

    (usePagePermissions as jest.Mock<ReturnType<typeof usePagePermissions>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions().full
    });

    (usePages as jest.Mock).mockReturnValueOnce({
      pages: {
        [pageId]: {
          type: 'page'
        }
      }
    });

    (useCurrentSpace as jest.Mock<ReturnType<typeof useCurrentSpace>>).mockReturnValueOnce(
      mockCurrentSpaceContext({
        publicProposals: true
      })
    );

    const resultWithPermissions = render(
      <ShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    const toggle = resultWithPermissions.getByTestId('toggle-public-page', {}).children.item(0);
    expect(toggle?.getAttribute('type')).toBe('checkbox');

    // Important part of the test
    expect(toggle).not.toBeDisabled();
  });
});
