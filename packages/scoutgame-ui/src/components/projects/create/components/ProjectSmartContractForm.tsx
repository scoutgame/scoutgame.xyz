'use client';

import { log } from '@charmverse/core/log';
import { stringUtils } from '@charmverse/core/utilities';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import {
  Button,
  CircularProgress,
  FormLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { CONTRACT_DEPLOYER_SIGN_MESSAGE } from '@packages/scoutgame/projects/constants';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { getContractDeployerAddressAction } from '@packages/scoutgame/projects/getContractDeployerAddressAction';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useMemo, useState } from 'react';
import { useFieldArray, type Control } from 'react-hook-form';
import { verifyMessage } from 'viem';
import { useSignMessage } from 'wagmi';

import { useTrackEvent } from '../../../../hooks/useTrackEvent';
import { Dialog } from '../../../common/Dialog';
import { FormErrors } from '../../../common/FormErrors';
import { WalletAddress } from '../../../common/WalletAddress';
import { chainRecords } from '../../../projects/constants';
import type { TemporaryAddress } from '../../components/ProjectForm/ProjectForm';

export type Deployer = { address: string; verified: boolean; signature: string | null };
export function ProjectSmartContractForm({
  control,
  deployers,
  setDeployers
}: {
  control: Control<CreateScoutProjectFormValues>;
  deployers: Deployer[];
  setDeployers: React.Dispatch<React.SetStateAction<Deployer[]>>;
}) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<`0x${string}` | null>(null);
  const [tempContract, setTempContract] = useState<TemporaryAddress | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { signMessageAsync } = useSignMessage();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const trackEvent = useTrackEvent();
  const { executeAsync: getContractDeployerAddress, isExecuting } = useAction(getContractDeployerAddressAction, {
    onError: ({ error }) => {
      setErrorMessage(error.serverError?.message ?? 'Error adding contract');
    }
  });

  const {
    fields: contracts,
    append,
    remove,
    update
  } = useFieldArray({
    control,
    name: 'contracts'
  });

  const verifyDeployerOwnership = useCallback(
    async (deployerAddress: `0x${string}`) => {
      try {
        const signature = await signMessageAsync({
          message: CONTRACT_DEPLOYER_SIGN_MESSAGE
        });

        const isValid = await verifyMessage({
          message: CONTRACT_DEPLOYER_SIGN_MESSAGE,
          signature,
          address: deployerAddress
        });

        return { signature, isValid };
      } catch (error) {
        setErrorMessage('Error verifying deployer ownership');
        log.info('Error verifying deployer ownership', { error });
        return { signature: null, isValid: false };
      }
    },
    [signMessageAsync]
  );

  const onCancel = useCallback(() => {
    setErrorMessage(null);
    setTempContract(null);
    setIsFormOpen(false);
  }, [setTempContract, setIsFormOpen, setErrorMessage]);

  const onSave = useCallback(async () => {
    if (tempContract) {
      const getContractDeployerAddressResult = await getContractDeployerAddress({
        chainId: Number(tempContract.chainId),
        contractAddress: tempContract.address
      });

      const deployerAddress = getContractDeployerAddressResult?.data;

      if (!deployerAddress) {
        return;
      }

      const existingDeployer = deployers.find((d) => d.address === deployerAddress);
      if (!existingDeployer) {
        setDeployers((prev) => [...prev, { address: deployerAddress, verified: false, signature: null }]);
      }

      append({
        ...tempContract,
        deployerAddress
      });

      setTempContract(null);
      setIsFormOpen(false);
    }
  }, [append, tempContract, getContractDeployerAddress, setTempContract, setDeployers, deployers]);

  const _groupedContracts = useMemo(() => {
    return contracts.reduce(
      (acc, contract) => {
        const deployer = deployers.find((d) => d.address === contract.deployerAddress);
        if (deployer) {
          if (!acc[deployer.address]) {
            acc[deployer.address] = {
              verified: deployer.verified,
              address: deployer.address as `0x${string}`,
              contracts: []
            };
          }
          acc[deployer.address].contracts.push({
            address: contract.address as `0x${string}`,
            chainId: contract.chainId
          });
        }
        return acc;
      },
      {} as Record<
        string,
        { verified: boolean; address: `0x${string}`; contracts: { address: `0x${string}`; chainId: number }[] }
      >
    );
  }, [contracts, deployers]);

  const signWithDeployerAddress = useCallback(
    async (deployerAddress: `0x${string}`, contractAddress: `0x${string}`) => {
      trackEvent('project_deployer_address_sign', {
        deployerAddress,
        contractAddress
      });
      const { signature, isValid } = await verifyDeployerOwnership(deployerAddress);
      if (isValid) {
        const contractIndex = contracts.findIndex((f) => f.address === contractAddress);
        const contract = contracts[contractIndex];
        if (contractIndex !== -1) {
          update(contractIndex, {
            ...contract,
            deployerAddress
          });
          setErrorMessage(null);
          setDeployers((_deployers) =>
            _deployers.map((deployer) =>
              deployer.address === deployerAddress ? { ...deployer, verified: true, signature } : deployer
            )
          );
        }
      } else {
        setErrorMessage('Deployer address is not verified');
      }
    },
    [contracts, update, setErrorMessage, verifyDeployerOwnership, setDeployers, trackEvent]
  );

  const removeContract = useCallback(
    (contractAddress: `0x${string}`) => {
      const contractIndex = contracts.findIndex((f) => f.address === contractAddress);
      if (contractIndex !== -1) {
        setErrorMessage(null);
        remove(contractIndex);
      }
    },
    [contracts, remove, setErrorMessage]
  );

  const groupedContracts = Object.values(_groupedContracts);

  return (
    <Stack gap={1}>
      <Typography color='secondary' fontWeight={600}>
        dApps
      </Typography>
      {!groupedContracts.length && !isFormOpen ? (
        <Paper sx={{ p: 1.5 }}>
          <Typography color='grey' textAlign='center'>
            No dApps added to the project
          </Typography>
        </Paper>
      ) : (
        groupedContracts.map((deployer) => (
          <Stack gap={1} key={deployer.address}>
            <Stack flexDirection='row' alignItems='center' gap={1} justifyContent='space-between'>
              <Stack flexDirection='row' alignItems='center' gap={1}>
                <Typography color='secondary'>Deployer Address: {stringUtils.shortenHex(deployer.address)}</Typography>
                {deployer.verified && <CheckCircleIcon color='secondary' fontSize='small' />}
              </Stack>
              {deployer.verified ? null : (
                <Button
                  variant='contained'
                  color='primary'
                  size='small'
                  disabled={isExecuting}
                  // Sending the first contract address as contract is grouped by deployer address
                  onClick={() => signWithDeployerAddress(deployer.address, deployer.contracts[0].address)}
                >
                  Sign
                </Button>
              )}
            </Stack>
            <Stack gap={1}>
              {deployer.contracts.map((contract) => (
                <Stack
                  key={contract.address}
                  gap={1}
                  justifyContent='space-between'
                  flexDirection='row'
                  alignItems='center'
                >
                  <Stack
                    flexDirection='row'
                    p={1}
                    borderRadius={1}
                    bgcolor='background.paper'
                    alignItems='center'
                    justifyContent='space-between'
                    flex={1}
                  >
                    <Stack gap={1} flex={0.75} flexDirection='row'>
                      <Image
                        src={chainRecords[contract.chainId].image}
                        width={36}
                        height={36}
                        alt={chainRecords[contract.chainId].name}
                        style={{ borderRadius: '50%' }}
                      />

                      <WalletAddress
                        address={contract.address}
                        chainId={contract.chainId}
                        color={deployer.verified ? undefined : 'error'}
                      />
                    </Stack>
                    {!deployer.verified && <Typography color='error'>Must sign with Deployer Address</Typography>}
                  </Stack>
                  <IconButton
                    size='small'
                    onClick={() => {
                      setSelectedContract(contract.address);
                      setIsConfirmModalOpen(true);
                    }}
                    color={isExecuting ? 'disabled' : 'error'}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Stack>
        ))
      )}

      {isFormOpen ? (
        <>
          <Stack flexDirection='row' alignItems='center' gap={2}>
            <Stack flex={0.75}>
              <FormLabel>dApp Contract Address</FormLabel>
              <TextField
                autoFocus
                disabled={isExecuting}
                value={tempContract?.address}
                onChange={(e) => setTempContract(tempContract ? { ...tempContract, address: e.target.value } : null)}
                placeholder='0x0000000...'
              />
            </Stack>
            <Stack flex={0.25}>
              <FormLabel>Select chain</FormLabel>
              <Stack flexDirection='row' alignItems='center' gap={1} flex={1}>
                <Select
                  value={tempContract?.chainId}
                  onChange={(e) =>
                    setTempContract(tempContract ? { ...tempContract, chainId: e.target.value as number } : null)
                  }
                  disabled={isExecuting}
                  fullWidth
                  displayEmpty
                  renderValue={(chainId) =>
                    chainId ? (
                      <Stack flexDirection='row' alignItems='center' gap={1}>
                        <Image
                          width={25}
                          height={25}
                          src={chainRecords[chainId].image}
                          alt={chainRecords[chainId].name}
                          style={{ borderRadius: '50%' }}
                        />
                        <Typography>{chainRecords[chainId].name}</Typography>
                      </Stack>
                    ) : (
                      <Typography>No options selected</Typography>
                    )
                  }
                >
                  {Object.entries(chainRecords).map(([chainId, chain]) => (
                    <MenuItem key={chainId} value={chainId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image
                        width={25}
                        height={25}
                        src={chain.image}
                        alt={chain.name}
                        style={{ borderRadius: '50%' }}
                      />
                      <Typography>{chain.name}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Stack>
          </Stack>
          <Stack
            flexDirection='row'
            alignItems='center'
            width='100%'
            justifyContent={isExecuting || errorMessage ? 'space-between' : 'flex-end'}
          >
            {isExecuting && (
              <Stack flexDirection='row' alignItems='center' gap={1}>
                <CircularProgress size={20} />
                <Typography>Fetching deployer address...</Typography>
              </Stack>
            )}
            {errorMessage && !isExecuting && (
              <Stack flexDirection='row' alignItems='center'>
                <FormErrors errors={[errorMessage]} />
              </Stack>
            )}
            <Stack flexDirection='row' alignItems='center' gap={1}>
              <Button
                variant='outlined'
                color='primary'
                sx={{ width: 'fit-content' }}
                onClick={onCancel}
                disabled={isExecuting}
              >
                Cancel
              </Button>
              <Button
                variant='contained'
                color='primary'
                sx={{ width: 'fit-content' }}
                onClick={onSave}
                disabled={!tempContract || !tempContract.address || !tempContract.chainId || isExecuting}
              >
                Save
              </Button>
            </Stack>
          </Stack>
        </>
      ) : (
        <Button
          variant='outlined'
          color='secondary'
          sx={{ width: 'fit-content' }}
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => {
            setTempContract({
              address: '',
              chainId: 167000
            });
            setIsFormOpen(true);
          }}
        >
          Add dapp
        </Button>
      )}
      <Dialog title='Remove Contract' open={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        <Typography>Are you sure you want to remove this contract from the project?</Typography>
        <Stack flexDirection='row' alignItems='center' gap={1} mt={2}>
          <Button color='primary' variant='outlined' onClick={() => setIsConfirmModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedContract) {
                removeContract(selectedContract);
              }
              setIsConfirmModalOpen(false);
            }}
            color='error'
          >
            Remove
          </Button>
        </Stack>
      </Dialog>
    </Stack>
  );
}
