import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';
import { DocumentPageContainer } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/DocumentPageContainer';

import { InfoPageContainer } from '../components/InfoPageContainer';

import { TermsPageContent } from './TermsPageContent';

import './TermsPage.css';

export function TermsPage() {
  return (
    <InfoPageContainer data-test='terms-page' title='Terms'>
      <DocumentPageContainer>
        <InfoCard>
          <TermsPageContent />
        </InfoCard>
      </DocumentPageContainer>
    </InfoPageContainer>
  );
}
