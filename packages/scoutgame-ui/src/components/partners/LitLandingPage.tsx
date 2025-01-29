import { PartnerLandingPage } from './PartnerLandingPage';

export function LitLandingPage() {
  return (
    <PartnerLandingPage
      heroSubtitle={
        <>
          Tackle Lit Protocol issues &
          <br />
          Get rewarded. 1K USDC up for grabs!
        </>
      }
      heroImage='/images/partner/lit-hero.png'
      accentColor='#FE7948'
      partnerName='Lit Protocol'
      partnerBanner='/images/promos/lit-promo-slide.png'
      partnerInfoLink='/info/partner-rewards/lit'
      partnerRewardsText='Lit Protocol is partnering with Scout Game to support developers who contribute to the ecosystem.'
      partnerUtmCampaign='lit'
    />
  );
}
