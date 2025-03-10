import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockBuilder, mockScout } from '@packages/testing/database';
import { randomIntFromInterval } from '@packages/testing/generators';
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

const { createScoutProject } = await import('../createScoutProject');

describe('createScoutProject', () => {
  it('should throw an error if the payload does not have a single owner', async () => {
    const scout = await mockScout();
    await expect(
      createScoutProject({ name: 'Test Project', teamMembers: [], deployers: [] }, scout.id)
    ).rejects.toThrow('At least one owner is required');
  });

  it('should throw an error if the payload have multiple owners', async () => {
    const owner1 = await mockScout();
    const owner2 = await mockScout();
    await expect(
      createScoutProject(
        {
          name: 'Test Project',
          teamMembers: [
            {
              displayName: 'Owner 1',
              scoutId: owner1.id,
              role: 'owner'
            },
            {
              displayName: 'Owner 2',
              scoutId: owner2.id,
              role: 'owner'
            }
          ],
          deployers: []
        },
        owner1.id
      )
    ).rejects.toThrow('Only one owner is allowed per project');
  });

  it('should throw an error if the deployer signature is invalid', async () => {
    const owner = await mockScout();
    const walletAddress = '0x123';

    mockVerifyMessage.mockResolvedValue(false as never);

    await expect(
      createScoutProject(
        {
          name: 'Test Project',
          teamMembers: [
            {
              displayName: 'Owner 1',
              scoutId: owner.id,
              role: 'owner'
            }
          ],
          deployers: [
            {
              address: walletAddress,
              signature: '0x123',
              verified: true
            }
          ]
        },
        owner.id
      )
    ).rejects.toThrow(`Invalid signature for deployer ${walletAddress}`);
  });

  it('should throw an error if the wallet signature is invalid', async () => {
    const owner = await mockScout();
    const walletAddress = '0x123';

    mockVerifyMessage.mockResolvedValue(false as never);

    await expect(
      createScoutProject(
        {
          name: 'Test Project',
          teamMembers: [{ displayName: 'Owner 1', scoutId: owner.id, role: 'owner' }],
          wallets: [{ address: walletAddress, chainId: 1, signature: '0x123', verified: true }]
        },
        owner.id
      )
    ).rejects.toThrow(`Invalid signature for wallet ${walletAddress}`);
  });

  it('should throw an error if the contract deployer address is not the same as the deployer address', async () => {
    const owner = await mockScout();
    const contractAddress = '0x123';
    const deployerAddress = '0x1234';

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
      createScoutProject(
        {
          name: 'Test Project',
          teamMembers: [
            {
              displayName: 'Owner 1',
              scoutId: owner.id,
              role: 'owner'
            }
          ],
          deployers: [],
          contracts: [
            {
              address: contractAddress,
              chainId: 1,
              // Different deployer address
              deployerAddress: '0x12345'
            }
          ]
        },
        owner.id
      )
    ).rejects.toThrow(
      `Contract ${contractAddress.toLowerCase()} was not deployed by the provided deployer. Actual deployer: ${deployerAddress.toLowerCase()}`
    );
  });

  // it('should throw an error if all the team members are not builders', async () => {
  //   const owner = await mockScout();
  //   const builder = await mockBuilder();
  //   const bannedBuilder = await mockBuilder({
  //     builderStatus: 'banned'
  //   });

  //   await expect(
  //     createScoutProject(
  //       {
  //         name: 'Test Project',
  //         teamMembers: [
  //           {
  //             displayName: 'Owner 1',
  //             scoutId: owner.id,
  //             role: 'owner'
  //           },
  //           {
  //             displayName: 'Builder 1',
  //             scoutId: builder.id,
  //             role: 'member'
  //           },
  //           {
  //             displayName: 'Banned Builder',
  //             scoutId: bannedBuilder.id,
  //             role: 'member'
  //           }
  //         ],
  //         deployers: []
  //       },
  //       owner.id
  //     )
  //   ).rejects.toThrow('All project members must be approved builders');
  // });

  it('should create project with members, contracts and deployers', async () => {
    const owner = await mockBuilder();
    const builder = await mockBuilder();
    const deployerAddress = `0x${v4()}`;
    const deployer2Address = `0x${v4()}`;
    const contractAddress = `0x${v4()}`;
    const contract2Address = `0x${v4()}`;
    const contract1TxHash = v4();
    const contract2TxHash = v4();
    const contract1BlockNumber = randomIntFromInterval(1, 1000);
    const contract2BlockNumber = randomIntFromInterval(1, 1000);
    mockVerifyMessage.mockResolvedValue(true as never);

    mockGetContractDeployerAddress.mockResolvedValueOnce({
      block: {
        number: contract1BlockNumber,
        timestamp: '123'
      },
      transaction: {
        hash: contract1TxHash,
        from: deployerAddress
      }
    } as never);

    mockGetContractDeployerAddress.mockResolvedValueOnce({
      block: {
        number: contract2BlockNumber,
        timestamp: '123'
      },
      transaction: {
        hash: contract2TxHash,
        from: deployer2Address
      }
    } as never);

    const { id: projectId } = await createScoutProject(
      {
        name: 'Test Project',
        teamMembers: [
          { displayName: 'Owner 1', scoutId: owner.id, role: 'owner' },
          { displayName: 'Builder 1', scoutId: builder.id, role: 'member' }
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
            address: contractAddress,
            chainId: 1,
            deployerAddress
          },
          {
            address: contract2Address,
            chainId: 1,
            deployerAddress: deployer2Address
          }
        ]
      },
      owner.id
    );

    const project = await prisma.scoutProject.findUniqueOrThrow({
      where: {
        id: projectId
      },
      select: {
        id: true,
        members: {
          select: {
            role: true,
            userId: true
          }
        },
        contracts: {
          select: {
            address: true,
            deployerId: true,
            deployTxHash: true
          }
        },
        deployers: {
          select: {
            id: true,
            address: true
          }
        }
      }
    });

    expect(project).toBeDefined();
    const projectMembers = project.members;
    expect(projectMembers).toHaveLength(2);

    const projectOwner = projectMembers.find((member) => member.role === 'owner');
    expect(projectOwner?.userId).toBe(owner.id);

    const projectMember = projectMembers.find((member) => member.role === 'member');
    expect(projectMember?.userId).toBe(builder.id);

    const projectContracts = project.contracts;
    expect(projectContracts).toHaveLength(2);

    expect(projectContracts[0].address).toBe(contractAddress);
    expect(projectContracts[0].deployerId).toBe(project.deployers[0].id);
    expect(projectContracts[0].deployTxHash).toBe(contract1TxHash);

    expect(projectContracts[1].address).toBe(contract2Address);
    expect(projectContracts[1].deployerId).toBe(project.deployers[1].id);
    expect(projectContracts[1].deployTxHash).toBe(contract2TxHash);
  });
});
