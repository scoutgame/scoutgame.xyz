'use client';

import { log } from '@charmverse/core/log';
import { stringUtils } from '@charmverse/core/utilities';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { Button, CircularProgress, FormLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { getContractDeployerAddressAction } from '@packages/scoutgame/projects/getContractDeployerAddressAction';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useMemo, useState } from 'react';
import { useFieldArray, type Control } from 'react-hook-form';
import { verifyMessage } from 'viem';
import { useSignMessage } from 'wagmi';

import { chainRecords } from '../../projects/constants';

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
  const { executeAsync: getContractDeployerAddress, isExecuting } = useAction(getContractDeployerAddressAction);
  const [open, setOpen] = useState(false);
  const { signMessageAsync } = useSignMessage();
  const {
    fields: contracts,
    append,
    remove,
    update
  } = useFieldArray({
    control,
    name: 'contracts'
  });
  const [tempContract, setTempContract] = useState<{ address: string; chainId: number } | null>(null);

  const MESSAGE_TO_SIGN = 'I am the deployer of this contract';

  const verifyDeployerOwnership = useCallback(
    async (deployerAddress: `0x${string}`, contractAddress: `0x${string}`) => {
      try {
        const signature = await signMessageAsync({
          message: MESSAGE_TO_SIGN
        });

        const isValid = await verifyMessage({
          message: MESSAGE_TO_SIGN,
          signature,
          address: deployerAddress
        });

        if (isValid) {
          const contractIndex = contracts.findIndex((f) => f.address === contractAddress);
          const contract = contracts[contractIndex];
          if (contractIndex !== -1) {
            update(contractIndex, {
              ...contract,
              deployerAddress
            });
          }
          return true;
        }
        return false;
      } catch (error) {
        log.info('Error verifying deployer ownership', { error });
        return false;
      }
    },
    [signMessageAsync, contracts, update]
  );

  const onCancel = useCallback(() => {
    setTempContract(null);
    setOpen(false);
  }, [setTempContract, setOpen]);

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

      setDeployers((prev) => [...prev, { address: deployerAddress, verified: false, signature: null }]);

      append({
        ...tempContract,
        deployerAddress
      });
      setTempContract(null);
      setOpen(false);
    }
  }, [append, tempContract, getContractDeployerAddress, setTempContract, setOpen, setDeployers]);

  const onCreate = useCallback(() => {
    setTempContract({
      address: '',
      chainId: 167000
    });
    setOpen(true);
  }, [setTempContract, setOpen]);

  const groupedContracts = useMemo(() => {
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

  return (
    <Stack gap={2}>
      {Object.values(groupedContracts).map((deployer) => (
        <Stack gap={1} key={deployer.address}>
          <Stack flexDirection='row' alignItems='center' gap={1} justifyContent='space-between'>
            <Typography color='secondary'>Deployer Address: {stringUtils.shortenHex(deployer.address)}</Typography>
            {deployer.verified ? null : (
              <Button
                variant='contained'
                color='primary'
                size='small'
                disabled={isExecuting}
                onClick={() => verifyDeployerOwnership(deployer.address, deployer.contracts[0].address)}
              >
                Sign
              </Button>
            )}
          </Stack>
          <Stack gap={1}>
            {deployer.contracts.map((contract, index) => (
              <Stack
                key={contract.address}
                justifyContent='space-between'
                flexDirection='row'
                alignItems='center'
                flex={1}
                bgcolor='background.paper'
                p={1}
                borderRadius={1}
              >
                <Stack gap={1} flex={0.75} flexDirection='row'>
                  <Image
                    src={chainRecords[contract.chainId].image}
                    width={25}
                    height={25}
                    alt={chainRecords[contract.chainId].name}
                    style={{ borderRadius: '50%' }}
                  />
                  <Typography color={deployer.verified ? undefined : 'error'}>
                    {stringUtils.shortenHex(contract.address)}
                  </Typography>
                </Stack>
                <Stack alignItems='center' gap={1} flexDirection='row'>
                  {!deployer.verified && <Typography color='error'>Must sign with Deployer Address</Typography>}
                  <DeleteIcon
                    fontSize='small'
                    onClick={() => !isExecuting && remove(index)}
                    color={isExecuting ? 'disabled' : 'error'}
                    sx={{ cursor: 'pointer' }}
                  />
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Stack>
      ))}

      {open && (
        <Stack flexDirection='row' alignItems='center' gap={2}>
          <Stack flex={0.75}>
            <FormLabel>Contract Address</FormLabel>
            <TextField
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
                    <Image width={25} height={25} src={chain.image} alt={chain.name} style={{ borderRadius: '50%' }} />
                    <Typography>{chain.name}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>
        </Stack>
      )}
      {!open ? (
        <Button
          variant='outlined'
          color='secondary'
          sx={{ width: 'fit-content' }}
          startIcon={<AddCircleOutlineIcon />}
          onClick={onCreate}
        >
          Contract Address
        </Button>
      ) : (
        <Stack flexDirection='row' alignItems='center' justifyContent={isExecuting ? 'space-between' : 'flex-end'}>
          {isExecuting && (
            <Stack flexDirection='row' alignItems='center' gap={1}>
              <CircularProgress size={20} />
              <Typography>Fetching deployer address...</Typography>
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
      )}
    </Stack>
  );
}
