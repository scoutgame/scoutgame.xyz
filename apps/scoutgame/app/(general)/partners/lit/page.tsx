import { PartnerLandingPage } from '@packages/scoutgame-ui/components/partners/PartnerLandingPage';

export default function LandingPage() {
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
      partnerRewardsText='Lit Protocol is partnering with Scout Game to support builders who contribute to the ecosystem.'
    />
  );
}
