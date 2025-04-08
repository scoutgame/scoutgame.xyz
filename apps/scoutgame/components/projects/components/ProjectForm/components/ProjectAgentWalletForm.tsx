'use client';

import { log } from '@charmverse/core/log';
import { stringUtils } from '@charmverse/core/utilities';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
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
import { AGENT_WALLET_SIGN_MESSAGE, CONTRACT_LIMIT } from '@packages/scoutgame/projects/constants';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { Dialog } from '@packages/scoutgame-ui/components/common/Dialog';
import { FormErrors } from '@packages/scoutgame-ui/components/common/FormErrors';
import { WalletAddress } from '@packages/scoutgame-ui/components/common/WalletAddress';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import { useFieldArray, type Control } from 'react-hook-form';
import { verifyMessage } from 'viem';
import { useSignMessage } from 'wagmi';

import { chainRecords } from '../../../constants';
import type { TemporaryAddress } from '../ProjectForm';

export type Deployer = { address: string; verified: boolean; signature: string | null };

export function ProjectAgentWalletForm({ control }: { control: Control<CreateScoutProjectFormValues> }) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<`0x${string}` | null>(null);
  const [isVerifyingWallet, setIsVerifyingWallet] = useState(false);
  const { signMessageAsync } = useSignMessage();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const trackEvent = useTrackEvent();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [agentWallet, setAgentWallet] = useState<TemporaryAddress | null>(null);

  const {
    fields: wallets,
    append,
    remove,
    update
  } = useFieldArray({
    control,
    name: 'wallets'
  });

  const limitReached = wallets.length >= CONTRACT_LIMIT;

  const verifyWalletOwnership = useCallback(
    async (walletAddress: `0x${string}`) => {
      setIsVerifyingWallet(true);
      try {
        const signature = await signMessageAsync({
          message: AGENT_WALLET_SIGN_MESSAGE
        });

        const isValid = await verifyMessage({
          message: AGENT_WALLET_SIGN_MESSAGE,
          signature,
          address: walletAddress
        });

        return { signature, isValid };
      } catch (error) {
        setErrorMessage('Error verifying wallet ownership');
        log.info('Error verifying wallet ownership', { error });
        return { signature: null, isValid: false };
      } finally {
        setIsVerifyingWallet(false);
      }
    },
    [signMessageAsync]
  );

  const onCancel = useCallback(() => {
    setErrorMessage(null);
    setAgentWallet(null);
    setIsFormOpen(false);
  }, [setErrorMessage, setAgentWallet, setIsFormOpen]);

  const onVerify = useCallback(async () => {
    if (agentWallet) {
      const { signature, isValid } = await verifyWalletOwnership(agentWallet.address as `0x${string}`);

      if (!isValid || !signature) {
        setErrorMessage('Wallet is not verified');
        return;
      }

      append({
        address: agentWallet.address,
        chainId: agentWallet.chainId,
        verified: true,
        signature
      });

      setAgentWallet(null);
      setIsFormOpen(false);
    }
  }, [append, agentWallet, verifyWalletOwnership, setIsFormOpen]);

  const signWithWalletAddress = useCallback(
    async (walletAddress: `0x${string}`) => {
      const walletIndex = wallets.findIndex((f) => f.address === walletAddress);
      if (walletIndex !== -1) {
        const wallet = wallets[walletIndex];
        if (wallet.verified) {
          return;
        }
        const { signature, isValid } = await verifyWalletOwnership(walletAddress);
        if (isValid && signature) {
          update(walletIndex, {
            ...wallet,
            verified: true,
            signature
          });
          setErrorMessage(null);
          setIsFormOpen(false);
        } else {
          setErrorMessage('Deployer address is not verified');
        }
      }
    },
    [wallets, update, setErrorMessage, verifyWalletOwnership, trackEvent, setIsFormOpen]
  );

  const removeWallet = useCallback(
    (walletAddress: `0x${string}`) => {
      const walletIndex = wallets.findIndex((f) => f.address === walletAddress);
      if (walletIndex !== -1) {
        setErrorMessage(null);
        remove(walletIndex);
      }
    },
    [wallets, remove, setErrorMessage]
  );

  const { verifiedWallets, unverifiedWallets } = useMemo(() => {
    const _verifiedWallets = wallets.filter((wallet) => wallet.verified);
    const _unverifiedWallets = wallets.filter((wallet) => !wallet.verified);
    return { verifiedWallets: _verifiedWallets, unverifiedWallets: _unverifiedWallets };
  }, [wallets]);

  const totalWallets = verifiedWallets.length + unverifiedWallets.length;

  return (
    <Stack gap={1}>
      <Typography color='secondary' fontWeight={600}>
        Agent Wallets
      </Typography>

      {totalWallets || isFormOpen ? (
        unverifiedWallets.length ? (
          <Stack gap={1}>
            {unverifiedWallets.map((wallet) => (
              <Stack gap={1} key={wallet.address}>
                <Stack flexDirection='row' alignItems='center' gap={1} justifyContent='space-between'>
                  <Stack flexDirection='row' alignItems='center' gap={1}>
                    <Typography color='secondary'>Wallet Address: {stringUtils.shortenHex(wallet.address)}</Typography>
                  </Stack>
                  <Button
                    variant='contained'
                    color='primary'
                    size='small'
                    disabled={isVerifyingWallet}
                    onClick={() => signWithWalletAddress(wallet.address as `0x${string}`)}
                  >
                    Sign
                  </Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Stack gap={1}>
            {verifiedWallets.map((wallet) => (
              <Stack
                key={wallet.address}
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
                  <Stack gap={2} flex={0.75} flexDirection='row' alignItems='center'>
                    <Image
                      src={chainRecords[wallet.chainId].image}
                      width={36}
                      height={36}
                      alt={chainRecords[wallet.chainId].name}
                      style={{ borderRadius: '50%' }}
                    />
                    <WalletAddress
                      address={wallet.address}
                      chainId={wallet.chainId}
                      color={wallet.verified ? undefined : 'error'}
                    />
                  </Stack>
                  {!wallet.verified && <Typography color='error'>Must sign with Wallet Address</Typography>}
                </Stack>
                <IconButton
                  color='error'
                  size='small'
                  onClick={() => {
                    setSelectedWallet(wallet.address as `0x${string}`);
                    setIsConfirmModalOpen(true);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )
      ) : (
        <Paper sx={{ p: 1.5 }}>
          <Typography color='grey' textAlign='center'>
            No agent wallets added to the project
          </Typography>
        </Paper>
      )}

      {isFormOpen ? (
        <>
          <Stack flexDirection='row' alignItems='center' gap={2}>
            <Stack flex={0.75}>
              <FormLabel>Agent Wallet Address</FormLabel>
              <TextField
                autoFocus
                disabled={isVerifyingWallet}
                value={agentWallet?.address}
                onChange={(e) => setAgentWallet(agentWallet ? { ...agentWallet, address: e.target.value } : null)}
                placeholder='0x0000000...'
              />
            </Stack>
            <Stack flex={0.25}>
              <FormLabel>Select chain</FormLabel>
              <Stack flexDirection='row' alignItems='center' gap={1} flex={1}>
                <Select
                  value={agentWallet?.chainId}
                  onChange={(e) =>
                    setAgentWallet(agentWallet ? { ...agentWallet, chainId: e.target.value as number } : null)
                  }
                  disabled={isVerifyingWallet}
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
            justifyContent={isVerifyingWallet || errorMessage ? 'space-between' : 'flex-end'}
          >
            {isVerifyingWallet && (
              <Stack flexDirection='row' alignItems='center' gap={1}>
                <CircularProgress size={20} />
                <Typography>Verifying wallet ownership...</Typography>
              </Stack>
            )}
            {errorMessage && !isVerifyingWallet && (
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
                disabled={isVerifyingWallet}
              >
                Cancel
              </Button>
              <Button
                variant='contained'
                color='primary'
                sx={{ width: 'fit-content' }}
                onClick={onVerify}
                disabled={!agentWallet || !agentWallet.address || !agentWallet.chainId || isVerifyingWallet}
              >
                Verify
              </Button>
            </Stack>
          </Stack>
        </>
      ) : (
        <Stack flexDirection='row' alignItems='center' gap={1}>
          <Button
            variant='outlined'
            color='secondary'
            sx={{ width: 'fit-content' }}
            disabled={limitReached}
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => {
              setAgentWallet({
                address: '',
                chainId: 1
              });
              setIsFormOpen(true);
            }}
          >
            Add wallet
          </Button>
          {limitReached && (
            <Typography variant='caption' color='grey'>
              You have reached the limit
            </Typography>
          )}
        </Stack>
      )}
      <Dialog title='Remove Wallet' open={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        <Typography>Are you sure you want to remove this wallet from the project?</Typography>
        <Stack flexDirection='row' alignItems='center' gap={1} mt={2}>
          <Button color='primary' variant='outlined' onClick={() => setIsConfirmModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedWallet) {
                removeWallet(selectedWallet);
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
