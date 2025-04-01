import { PartnerLandingPage } from './PartnerLandingPage';

export function CeloLandingPage() {
  return (
    <PartnerLandingPage
      heroSubtitle={
        <>
          Contribute to Celo qualified projects &
          <br />
          Get rewarded. 5K cUSD prize pool!
        </>
      }
      heroImage='/images/partner/celo-hero.png'
      accentColor='#FCFF52'
      partnerName='Celo'
      partnerBanner='/images/promos/celo-promo-slide.png'
      partnerInfoLink='/info/partner-rewards/celo'
      partnerRewardsText='Celo is partnering with Scout Game to support developers who contribute to the ecosystem.'
      partnerUtmCampaign='celo'
    />
  );
}
