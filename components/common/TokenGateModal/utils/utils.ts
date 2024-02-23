export const collectableOptions = [
  { id: 'ERC721', name: 'ERC-721 NFT' },
  { id: 'ERC1155', name: 'ERC-1155 NFT' },
  { id: 'POAP', name: 'POAPS' },
  { id: 'UNLOCK', name: 'Unlock Protocol' },
  { id: 'HYPERSUB', name: 'Hypersub' }
] as const;

export const poapTypes = [
  { id: 'id', name: 'By Poap Id' },
  { id: 'name', name: 'By Poap Name' }
] as const;

export const poapNameMatch = [
  { id: 'exact', name: 'Contains POAP Name' },
  { id: 'contains', name: 'Equals POAP Name exactly' }
] as const;

export const tokenCheck = [
  { id: 'token', name: 'Check Balance' },
  { id: 'customToken', name: 'Custom token' }
] as const;

export const nftCheck = [
  { id: 'group', name: 'Any NFT in this collection' },
  { id: 'individual', name: 'A specific token id' }
] as const;

export const daoCheck = [
  { id: 'moloch', name: 'MolochDAOv2.1' },
  { id: 'builder', name: 'Builder Protocol' },
  { id: 'guild', name: 'Guild xyz' }
] as const;

export const gitcoinPassportCheck = [
  { id: 'exists', name: 'Gitcoin Passport Owner' },
  { id: 'score', name: 'Gitcoin Passport Score' }
] as const;
