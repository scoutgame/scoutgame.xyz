import { Stack } from '@mui/material';
import type { DraftDeveloperInfo } from '@packages/scoutgame/builders/getDraftDeveloperInfo';

import { DeveloperInfoGithubActivities } from '../DeveloperInfo/DeveloperInfoGithubActivities';
import { DeveloperInfoProfile } from '../DeveloperInfo/DeveloperInfoProfile';
import { DeveloperInfoRanksGraph } from '../DeveloperInfo/DeveloperInfoRanksGraph';
import { DeveloperInfoSeasonStats } from '../DeveloperInfo/DeveloperInfoSeasonStats';

export function DraftDeveloperInfoCard({ onClose, developer }: { onClose: () => void; developer: DraftDeveloperInfo }) {
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
          <DeveloperInfoRanksGraph ranks={developer.weeklyRanks} />
          <DeveloperInfoSeasonStats
            seasonPoints={developer.seasonPoints}
            scoutedBy={developer.scoutedBy}
            cardsSold={developer.cardsSold}
          />
        </Stack>
        <DeveloperInfoGithubActivities githubActivities={developer.githubActivities} />
      </Stack>
    </Stack>
  );
}
