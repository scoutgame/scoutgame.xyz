import { PartnerLandingPage } from './PartnerLandingPage';

export function OctantLandingPage() {
  return (
    <PartnerLandingPage
      heroSubtitle={
        <>
          Contribute to Octant & Base aligned projects &
          <br />
          Get rewarded. 5 ETH prize pool!
        </>
      }
      heroImage='/images/partner/octant-hero.png'
      accentColor='#FFFFFF'
      partnerName='Octant'
      partnerBanner='/images/promos/octant-promo-slide.png'
      partnerInfoLink='/info/partner-rewards/octant'
      partnerRewardsText='Octant & Base are partnering with Scout Game to reward developers who contribute to the ecosystem.'
      partnerUtmCampaign='octant'
    />
  );
}
