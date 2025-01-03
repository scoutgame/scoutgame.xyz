import { PartnerLandingPage } from './PartnerLandingPage';

export function TalentLandingPage() {
  return (
    <PartnerLandingPage
      heroSubtitle={
        <>
          Contribute to open-source projects with Talent &
          <br />
          Compete for 1.5K $TALENT!
        </>
      }
      heroImage='/images/partner/talent-hero.png'
      accentColor='#A18BDE'
      partnerName='Talent Protocol'
      partnerBanner='/images/promos/talent-promo-slide.png'
      partnerInfoLink='/info/partner-rewards/talent-protocol'
      partnerRewardsText='Talent Protocol is partnering with Scout Game to reward Talented Builders.'
    />
  );
}
