import { PartnerLandingPage } from '@packages/scoutgame-ui/components/partners/PartnerLandingPage';

export default function LandingPage() {
  return (
    <PartnerLandingPage
      heroSubtitle={
        <>
          Contribute to the Game 7 ecosystem &
          <br />
          Get rewarded. 5K USD prize pool!
        </>
      }
      heroImage='/images/partner/game7-hero.png'
      accentColor='#FE2C2F'
      partnerName='Game 7'
      partnerBanner='/images/promos/game7-promo-slide.png'
      partnerInfoLink='/info/partner-rewards/game7'
      partnerRewardsText='Game7 is partnering with Scout Game to support builders who contribute to the ecosystem.'
    />
  );
}
