import { Stack } from '@mui/material';
import { type DeveloperInfo } from '@packages/scoutgame/builders/getDeveloperInfo';

import { DeveloperInfoCardPrice } from '../DeveloperInfo/DeveloperInfoCardPrice';
import { DeveloperInfoGithubActivities } from '../DeveloperInfo/DeveloperInfoGithubActivities';
import { DeveloperInfoProfile } from '../DeveloperInfo/DeveloperInfoProfile';
import { DeveloperInfoRanksGraph } from '../DeveloperInfo/DeveloperInfoRanksGraph';
import { DeveloperInfoSeasonStats } from '../DeveloperInfo/DeveloperInfoSeasonStats';
import { DeveloperInfoWeekStats } from '../DeveloperInfo/DeveloperInfoWeeklyStats';

export function DeveloperInfoCard({ onClose, developer }: { onClose: () => void; developer: DeveloperInfo }) {
  return (
    <Stack gap={2}>
      <DeveloperInfoProfile
        firstContributionDate={developer.firstContributionDate}
        githubConnectedAt={developer.githubConnectedAt}
        displayName={developer.displayName}
        path={developer.path}
        avatar={developer.avatar}
        githubLogin={developer.githubLogin}
        farcasterUsername={developer.farcasterUsername}
        onClose={onClose}
        level={developer.level}
      />
      <Stack gap={0.5}>
        <Stack direction='row' gap={0.5}>
          <DeveloperInfoWeekStats rank={developer.rank} gemsCollected={developer.gemsCollected} />
          <DeveloperInfoRanksGraph ranks={developer.last14DaysRank} label='14D Rank' />
          <DeveloperInfoSeasonStats
            seasonTokens={developer.seasonTokens}
            scoutedBy={developer.scoutedBy}
            cardsSold={developer.cardsSold}
          />
        </Stack>
        <DeveloperInfoGithubActivities githubActivities={developer.githubActivities} />
        <DeveloperInfoCardPrice developer={developer} onClose={onClose} />
      </Stack>
    </Stack>
  );
}
