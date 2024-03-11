import type { PaymentMethod, VoteStrategy } from '@charmverse/core/prisma';
import { VoteType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import AddCircle from '@mui/icons-material/AddCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  FormControlLabel,
  FormLabel,
  IconButton,
  ListItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { getChainById } from 'connectors/chains';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import { NumericFieldWithButtons } from 'components/common/form/fields/NumericFieldWithButtons';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import type { ProposalEvaluationInput } from 'lib/proposals/createProposal';
import { isTruthy } from 'lib/utils/types';

type CreateVoteModalProps = {
  readOnly?: boolean;
  onChange?: (vote: ProposalEvaluationInput['voteSettings']) => void;
  value: ProposalEvaluationInput['voteSettings'];
};

const StyledVoteSettings = styled.div`
  & .MuiInputBase-input {
    box-sizing: content-box;
  }
`;

const StyledAccordion = styled(Accordion)`
  & .MuiAccordionSummary-root {
    padding: 0px;
    min-height: fit-content;

    &.Mui-expanded {
      padding-bottom: ${({ theme }) => theme.spacing(1)};
      min-height: fit-content;
    }
  }

  & .MuiAccordionDetails-root {
    padding: 0px;
  }

  & .MuiAccordionSummary-content {
    margin: 0px;

    &.Mui-expanded {
      margin: 0px;
    }
  }
`;

export function VoteSettings({ readOnly, value, onChange }: CreateVoteModalProps) {
  const [passThreshold, setPassThreshold] = useState<number>(value?.threshold || 50);
  // Default values for approval type vote
  const [voteType, setVoteType] = useState<VoteType>(value?.type ?? VoteType.Approval);
  const [options, setOptions] = useState<string[]>(value?.options ?? ['Yes', 'No', 'Abstain']);
  const [maxChoices, setMaxChoices] = useState(value?.maxChoices ?? 1);
  const [durationDays, setDurationDays] = useState(value?.durationDays ?? 5);
  const [isAdvancedSectionVisible, setIsAdvancedSectionVisible] = useState(false);
  const [voteStrategy, setVoteStrategy] = useState<VoteStrategy>(value?.strategy ?? 'regular');
  const [voteToken, setVoteToken] = useState<null | {
    chainId: number;
    tokenAddress: string;
  }>(
    value?.chainId && value?.tokenAddress && value?.strategy === 'token'
      ? {
          chainId: value.chainId,
          tokenAddress: value.tokenAddress
        }
      : null
  );
  const [paymentMethods] = usePaymentMethods({
    filterDefaultPaymentMethods: true
  });
  const [availableCryptos, setAvailableCryptos] = useState<{ chainId: number; tokenAddress: string }[]>(
    paymentMethods.map((method) => {
      return {
        chainId: method.chainId,
        tokenAddress: method.contractAddress || ''
      };
    })
  );

  function refreshCryptoList(chainId: number, rewardToken?: string) {
    // Set the default chain currency
    const selectedChain = getChainById(chainId);

    if (selectedChain) {
      const nativeCurrency = selectedChain.nativeCurrency.symbol;

      const cryptosToDisplay = [nativeCurrency];

      const contractAddresses = paymentMethods
        .filter((method) => method.chainId === chainId)
        .map((method) => {
          return method.contractAddress;
        })
        .filter(isTruthy);
      cryptosToDisplay.push(...contractAddresses);

      setAvailableCryptos([
        ...availableCryptos,
        {
          chainId,
          tokenAddress: rewardToken || nativeCurrency
        }
      ]);
      setVoteToken({
        tokenAddress: rewardToken || nativeCurrency,
        chainId
      });
    }
    return selectedChain?.nativeCurrency.symbol;
  }

  async function onNewPaymentMethod(paymentMethod: PaymentMethod) {
    if (paymentMethod.contractAddress) {
      refreshCryptoList(paymentMethod.chainId, paymentMethod.contractAddress);
    }
  }

  // useEffect on the values to call onChange() doesnt seem ideal and triggers on the first load, but it works for now. TODO: use react-hook-form?
  useEffect(() => {
    async function main() {
      if (onChange) {
        const hasError =
          passThreshold > 100 ||
          (voteType === VoteType.SingleChoice && options.some((option) => option.length === 0)) ||
          new Set(options).size !== options.length;
        let blockNumber: null | number = null;
        if (voteToken) {
          const snapshot = (await import('@snapshot-labs/snapshot.js')).default;
          const provider = await snapshot.utils.getProvider(voteToken.chainId);
          blockNumber = await provider.getBlockNumber();
        }
        if (!hasError) {
          onChange({
            threshold: passThreshold,
            type: voteType,
            options,
            maxChoices: voteType === VoteType.Approval ? 1 : maxChoices,
            publishToSnapshot: voteStrategy === 'snapshot',
            durationDays,
            blockNumber,
            chainId: voteToken?.chainId ?? null,
            tokenAddress: voteToken?.tokenAddress ?? null,
            strategy: voteStrategy
          });
        }
      }
    }

    main();
  }, [voteType, options, maxChoices, durationDays, voteToken, passThreshold, voteStrategy]);

  function handleVoteTypeChange(_voteType: VoteType) {
    if (_voteType !== value?.type) {
      setVoteType(_voteType);
      if (_voteType === VoteType.Approval) {
        setOptions(['Yes', 'No', 'Abstain']);
      } else if (_voteType === VoteType.SingleChoice) {
        setOptions(['Option 1', 'Option 2', 'Abstain']);
      }
    }
  }

  return (
    <StyledVoteSettings data-test='evaluation-vote-settings'>
      <StyledAccordion
        expanded={isAdvancedSectionVisible}
        onChange={(_, expanded) => {
          setIsAdvancedSectionVisible(expanded);
        }}
        elevation={0}
      >
        <AccordionSummary>
          <Stack flexDirection='row' gap={0.5} alignItems='center'>
            {isAdvancedSectionVisible ? (
              <KeyboardArrowDownIcon fontSize='small' />
            ) : (
              <ChevronRightIcon fontSize='small' />
            )}
            <Typography>Advanced</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <RadioGroup value={voteStrategy}>
            <FormControlLabel
              disabled={readOnly}
              control={<Radio size='small' />}
              value='regular'
              label='One account one vote'
              onChange={() => {
                setVoteStrategy('regular');
                setVoteToken(null);
              }}
            />
            <FormControlLabel
              disabled={readOnly}
              control={<Radio size='small' />}
              value='token'
              label='Token voting'
              onChange={() => {
                setVoteStrategy('token');
              }}
            />
            <FormControlLabel
              disabled={readOnly}
              control={<Radio size='small' />}
              value='snapshot'
              label='Publish to Snapshot'
              onChange={() => {
                setVoteStrategy('snapshot');
                setVoteToken(null);
              }}
            />
          </RadioGroup>
          <Divider sx={{ mt: 1, mb: 2 }} />
          {voteStrategy === 'token' || voteStrategy === 'regular' ? (
            <>
              {voteStrategy === 'token' ? (
                <>
                  <Typography component='span' variant='subtitle1'>
                    Token
                  </Typography>
                  <InputSearchCrypto
                    disabled={readOnly}
                    readOnly={readOnly}
                    cryptoList={availableCryptos.map((crypto) => crypto.tokenAddress)}
                    chainId={voteToken?.chainId}
                    placeholder='Empty'
                    value={voteToken?.tokenAddress}
                    defaultValue={voteToken?.tokenAddress}
                    onChange={(crypto) => {
                      setVoteToken({
                        tokenAddress: crypto,
                        chainId: voteToken?.chainId ?? 1
                      });
                    }}
                    showChain
                    onNewPaymentMethod={onNewPaymentMethod}
                    sx={{
                      width: '100%',
                      mb: 2
                    }}
                  />
                </>
              ) : null}
              <Stack
                data-test='vote-duration'
                direction='row'
                alignItems='center'
                gap={2}
                justifyContent='space-between'
                mb={1}
              >
                <FormLabel>
                  <Typography component='span' variant='subtitle1'>
                    Duration (days)
                  </Typography>
                </FormLabel>
                <NumericFieldWithButtons
                  disabled={readOnly}
                  value={durationDays}
                  onChange={setDurationDays}
                  min={1}
                  max={100}
                />
              </Stack>

              <FormLabel>
                <Typography component='span' variant='subtitle1'>
                  Options
                </Typography>
              </FormLabel>
              <RadioGroup
                row
                defaultValue={voteType}
                value={voteType}
                onChange={(e) => {
                  handleVoteTypeChange(e.target.value as VoteType);
                }}
                sx={{ mb: 1 }}
              >
                <FormControlLabel
                  disabled={readOnly}
                  value={VoteType.Approval}
                  control={<Radio />}
                  label='Yes / No / Abstain'
                  data-test='vote-type-approval'
                />
                <FormControlLabel
                  disabled={readOnly}
                  value={VoteType.SingleChoice}
                  control={<Radio />}
                  data-test='vote-type-custom-options'
                  label='Custom Options'
                  sx={{ mr: 0 }}
                />
              </RadioGroup>
              {voteType === VoteType.SingleChoice && (
                <Stack mb={2}>
                  <InlineVoteOptions options={options} setOptions={setOptions} />
                  <Stack direction='row' alignItems='center' gap={2} mt={2} justifyContent='space-between'>
                    <FormLabel>
                      <Typography component='span' variant='subtitle1'>
                        Max choices
                      </Typography>
                    </FormLabel>
                    <NumericFieldWithButtons disabled={readOnly} value={maxChoices} onChange={setMaxChoices} min={1} />
                  </Stack>
                </Stack>
              )}

              {maxChoices === 1 && (
                <Stack
                  data-test='vote-pass-threshold'
                  direction='row'
                  alignItems='center'
                  gap={2}
                  justifyContent='space-between'
                  mb={2}
                >
                  <FormLabel>
                    <Typography component='span' variant='subtitle1'>
                      Pass Threshold (%)
                    </Typography>
                  </FormLabel>
                  <NumericFieldWithButtons
                    disabled={readOnly}
                    value={passThreshold}
                    onChange={setPassThreshold}
                    max={100}
                  />
                </Stack>
              )}
            </>
          ) : null}
        </AccordionDetails>
      </StyledAccordion>
    </StyledVoteSettings>
  );
}

interface InlineVoteOptionsProps {
  options: string[];
  setOptions: Dispatch<SetStateAction<string[]>>;
}

function InlineVoteOptions({ options, setOptions }: InlineVoteOptionsProps) {
  return (
    <div>
      {options.map((option, index) => {
        return (
          <ListItem
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            sx={{ px: 0, pt: 0, display: 'flex', gap: 0.5 }}
          >
            <TextField
              // Disable changing text for No change option
              data-test='inline-vote-option'
              fullWidth
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => {
                options[index] = e.target.value;
                setOptions([...options]);
              }}
            />
            <Tooltip arrow placement='top' title={index < 2 ? 'At least two options are required' : ''}>
              <div>
                <IconButton
                  disabled={options.length <= 2}
                  size='small'
                  data-test='delete-vote-option'
                  onClick={() => {
                    setOptions([...options.slice(0, index), ...options.slice(index + 1)]);
                  }}
                >
                  <DeleteOutlinedIcon fontSize='small' />
                </IconButton>
              </div>
            </Tooltip>
          </ListItem>
        );
      })}
      <Stack flex={1}>
        <Button
          sx={{ mr: 4 }}
          variant='outlined'
          color='secondary'
          size='small'
          data-test='add-vote-option'
          onClick={() => {
            setOptions([...options, '']);
          }}
        >
          <AddCircle fontSize='small' sx={{ mr: 1 }} />
          <Typography variant='subtitle1'>Add Option</Typography>
        </Button>
      </Stack>
    </div>
  );
}
