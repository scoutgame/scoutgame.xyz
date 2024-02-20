import { Typography } from '@mui/material';

import { AddAPropertyButton } from 'components/common/BoardEditor/components/properties/AddAProperty';
import { Button } from 'components/common/Button';
import type { NewPageValues } from 'components/common/PageDialog/hooks/useNewPage';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

export function AttachRewardButton({
  createNewReward,
  variant = 'card_property'
}: {
  createNewReward: VoidFunction;
  variant?: 'solid_button' | 'card_property';
}) {
  const { getFeatureTitle } = useSpaceFeatures();
  if (variant === 'card_property') {
    return (
      <AddAPropertyButton style={{ marginTop: 0 }} dataTest='add-reward' onClick={createNewReward}>
        + Add a {getFeatureTitle('reward')}
      </AddAPropertyButton>
    );
  } else {
    return (
      <Button size='small' onClick={createNewReward}>
        <Typography fontWeight={700} variant='subtitle1'>
          New
        </Typography>
      </Button>
    );
  }
}
