import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockBuilder, mockScoutProject } from '@packages/testing/database';
import { v4 } from 'uuid';

const mockVerifyMessage = jest.fn();
const viem = await import('viem');

// Only mock verifyMessage, let other imports be real
jest.unstable_mockModule('viem', async () => ({
  ...viem,
  verifyMessage: mockVerifyMessage
}));

const mockGetContractDeployerAddress = jest.fn();
jest.unstable_mockModule('@packages/blockchain/getContractDeployerAddress', async () => ({
  getContractDeployerAddress: mockGetContractDeployerAddress
}));

jest.unstable_mockModule('../backfillAnalytics', async () => ({
  backfillAnalytics: () => Promise.resolve()
}));

const { updateScoutProject } = await import('../updateScoutProject');

describe('updateScoutProject', () => {
  beforeEach(async () => {
    await prisma.scoutProjectWallet.deleteMany();
    await prisma.scoutProjectContract.deleteMany();
    await prisma.scoutProject.deleteMany();
    jest.clearAllMocks();
  });

  it('should throw an error if user is not the project owner', async () => {
    const owner = await mockBuilder();
    const nonOwner = await mockBuilder();
    const project = await mockScoutProject({ userId: owner.id });

    await expect(
      updateScoutProject(
        {
          projectId: project.id,
          name: 'Updated Project',
          teamMembers: [],
          contracts: [],
          deployers: [],
          wallets: [],
          solanaWallets: []
        },
        nonOwner.id
      )
    ).rejects.toThrow('You are not authorized to update this project');
  });

  it('should throw an error if the payload has no owner', async () => {
    const owner = await mockBuilder();
    const project = await mockScoutProject({ userId: owner.id });

    await expect(
      updateScoutProject(
        {
          projectId: project.id,
          name: 'Updated Project',
          teamMembers: [],
          contracts: [],
          deployers: [],
          wallets: [],
          solanaWallets: []
        },
        owner.id
      )
    ).rejects.toThrow('Project must have at least one owner');
  });

  it('should throw an error if the payload has multiple owners', async () => {
    const owner = await mockBuilder();
    const owner2 = await mockBuilder();
    const project = await mockScoutProject({ userId: owner.id });

    await expect(
      updateScoutProject(
        {
          projectId: project.id,
          name: 'Updated Project',
          teamMembers: [
            { displayName: 'Owner 1', scoutId: owner.id, role: 'owner' },
            { displayName: 'Owner 2', scoutId: owner2.id, role: 'owner' }
          ],
          contracts: [],
          deployers: [],
          wallets: [],
          solanaWallets: []
        },
        owner.id
      )
    ).rejects.toThrow('Project can only have one owner');
  });

  it('should throw an error if new deployer signature is invalid', async () => {
    const owner = await mockBuilder();
    const project = await mockScoutProject({ userId: owner.id });
    const walletAddress = '0x123';

    mockVerifyMessage.mockResolvedValue(false as never);

    await expect(
      updateScoutProject(
        {
          projectId: project.id,
          teamMembers: [{ displayName: 'Owner', scoutId: owner.id, role: 'owner' }],
          contracts: [],
          deployers: [
            {
              address: walletAddress,
              signature: '0x123',
              verified: true
            }
          ],
          wallets: [],
          solanaWallets: []
        },
        owner.id
      )
    ).rejects.toThrow(`Invalid signature for deployer ${walletAddress}`);
  });

  it('should throw an error if new contract deployer address does not match', async () => {
    const owner = await mockBuilder();
    const project = await mockScoutProject({ userId: owner.id });
    const contractAddress = `0x${v4()}`;
    const deployerAddress = `0x${v4()}`;

    mockGetContractDeployerAddress.mockResolvedValue({
      block: {
        number: '123',
        timestamp: '123'
      },
      transaction: {
        hash: '0x123',
        from: deployerAddress
      }
    } as never);

    await expect(
      updateScoutProject(
        {
          projectId: project.id,
          teamMembers: [{ displayName: 'Owner', scoutId: owner.id, role: 'owner' }],
          contracts: [
            {
              address: contractAddress,
              chainId: 1,
              deployerAddress: '0x12345'
            }
          ],
          deployers: [],
          wallets: [],
          solanaWallets: []
        },
        owner.id
      )
    ).rejects.toThrow(
      `Contract ${contractAddress.toLowerCase()} was not deployed by the provided deployer. Actual deployer: ${deployerAddress.toLowerCase()}`
    );
  });

  it('should successfully change project owner', async () => {
    const owner = await mockBuilder();
    const newOwner = await mockBuilder();
    const project = await mockScoutProject({ userId: owner.id });

    await updateScoutProject(
      {
        projectId: project.id,
        teamMembers: [
          { displayName: 'New Owner', scoutId: newOwner.id, role: 'owner' },
          { displayName: 'Old Owner', scoutId: owner.id, role: 'member' }
        ],
        contracts: [],
        deployers: [],
        wallets: [],
        solanaWallets: []
      },
      owner.id
    );

    const projectMembers = await prisma.scoutProjectMember.findMany({
      where: { projectId: project.id }
    });

    const projectOwner = projectMembers.find((m) => m.role === 'owner' && m.userId === newOwner.id)!;
    const projectOldOwner = projectMembers.find((m) => m.userId === owner.id && m.role === 'member')!;
    expect(projectOwner).toBeTruthy();
    expect(projectOldOwner).toBeTruthy();
  });

  it('should successfully update project with new members, contracts, agent wallets and deployers', async () => {
    const owner = await mockBuilder();
    const member2 = await mockBuilder();
    const contractAddress = `0x${'1'.repeat(40)}`;
    const builder = await mockBuilder();
    const deployerAddress = `0x${'2'.repeat(40)}`;
    const agentWalletAddress = `0x${'3'.repeat(40)}`;

    const project = await mockScoutProject({
      userId: owner.id,
      deployerAddress,
      contracts: [contractAddress],
      memberIds: [member2.id],
      wallets: [agentWalletAddress]
    });

    const deployer2Address = `0x${'4'.repeat(40)}`;
    const contract2Address = `0x${'5'.repeat(40)}`;
    const agentWallet2Address = `0x${'6'.repeat(40)}`;

    mockVerifyMessage.mockResolvedValue(true as never);

    mockGetContractDeployerAddress.mockResolvedValueOnce({
      block: {
        number: 123,
        timestamp: '123'
      },
      transaction: {
        hash: '0x123',
        from: deployer2Address
      }
    } as never);

    const updatedProject = await updateScoutProject(
      {
        projectId: project.id,
        name: 'Updated Project',
        teamMembers: [
          { displayName: 'Owner', scoutId: owner.id, role: 'owner' },
          { displayName: 'Builder', scoutId: builder.id, role: 'member' }
        ],
        deployers: [
          {
            address: deployerAddress,
            signature: '0x123',
            verified: true
          },
          {
            address: deployer2Address,
            signature: '0x123',
            verified: true
          }
        ],
        contracts: [
          {
            address: contract2Address,
            chainId: 1,
            deployerAddress: deployer2Address
          }
        ],
        wallets: [
          {
            address: agentWallet2Address,
            chainId: 1,
            signature: '0x123',
            verified: true
          }
        ],
        solanaWallets: []
      },
      owner.id
    );

    const updatedProjectData = await prisma.scoutProject.findUniqueOrThrow({
      where: { id: updatedProject.id },
      select: {
        name: true,
        description: true,
        contracts: true,
        deployers: true,
        members: true,
        wallets: true
      }
    });

    expect(updatedProjectData.name).toBe('Updated Project');
    expect(updatedProjectData.description).toBe(project.description);

    const projectDeployers = updatedProjectData.deployers;
    expect(projectDeployers).toHaveLength(2);
    expect(projectDeployers[0].address).toBe(deployerAddress);
    expect(projectDeployers[1].address).toBe(deployer2Address);

    const projectMembers = updatedProjectData.members;
    const deletedProjectMember = projectMembers.find((m) => m.deletedAt);
    expect(deletedProjectMember?.userId).toBe(member2.id);
    const builderMember = projectMembers.find((m) => m.userId === builder.id);
    expect(builderMember).toBeDefined();

    const projectContracts = updatedProjectData.contracts;
    expect(projectContracts).toHaveLength(2);
    const deletedContract = projectContracts.find((c) => c.deletedAt);
    expect(deletedContract?.address).toBe(contractAddress);

    const projectWallets = updatedProjectData.wallets;
    expect(projectWallets).toHaveLength(2);
    const deletedWallet = projectWallets.find((w) => w.deletedAt);
    expect(deletedWallet?.address).toBe(agentWalletAddress);
  });
});
