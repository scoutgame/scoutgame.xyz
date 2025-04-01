import { Typography } from '@mui/material';
import type { Repo } from '@packages/scoutgame/repos/getRepos';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';

import { InfoPageContainer } from '../components/InfoPageContainer';
import { SearchRepos } from '../components/SearchRepos/SearchRepos';

export function RepositoriesPage({ popularRepos }: { popularRepos: Repo[] }) {
  return (
    <InfoPageContainer
      data-test='contribution-guide-page'
      image='/images/info/info_banner.png'
      title='Scout Game Approved Repositories'
    >
      <Document popularRepos={popularRepos} />
    </InfoPageContainer>
  );
}

function Document({ popularRepos }: { popularRepos: Repo[] }) {
  return (
    <InfoCard>
      <SearchRepos popularRepos={popularRepos} />
    </InfoCard>
  );
}
