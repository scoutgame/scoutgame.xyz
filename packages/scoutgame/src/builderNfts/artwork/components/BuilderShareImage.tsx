import { baseUrl } from '@packages/utils/constants';
import { getRelativeTime } from '@packages/utils/dates';
// It is a MUST to import React
import { capitalize } from '@packages/utils/strings';
import React from 'react';
import type { CSSProperties } from 'react';

import type { BuilderScouts } from '../../../builders/getBuilderScouts';
import type { BuilderStats } from '../../../builders/getBuilderStats';
import type { BuilderActivity } from '../../../builders/getDeveloperActivities';
import type { ScoutPartnerInfo } from '../../../scoutPartners/getScoutPartnersInfo';

export function BuilderShareImage({
  nftImageUrl,
  activities = [],
  builderScouts,
  stats,
  builderPrice,
  size = 550,
  scoutPartners
}: {
  nftImageUrl: string;
  activities: BuilderActivity[];
  builderScouts: BuilderScouts;
  stats: BuilderStats;
  builderPrice: string;
  size?: number;
  scoutPartners: ScoutPartnerInfo[];
}) {
  const domain = baseUrl || process.env.IMAGE_HOSTING_DOMAIN;
  const overlays = [
    { name: 'red', src: `/images/profile/builder/red-sky.jpg`, color: '#661933' },
    { name: 'purple', src: '/images/profile/builder/purple-sky.jpg', color: '#190D4D' },
    { name: 'black', src: '/images/profile/builder/black-sky.jpg', color: '#1B1B1B' },
    { name: 'blue', src: '/images/profile/builder/blue-sky.jpg', color: '#02143C' }
  ];

  const random = randomInt(0, 3);

  const { rank = 0, seasonTokens = 0, gemsCollected = 0 } = stats;

  const { totalScouts = 0, totalNftsSold = 0 } = builderScouts;

  const randomOverlay = overlays[random] || overlays[0];

  const box: CSSProperties = {
    backgroundColor: randomOverlay.color,
    borderRadius: 3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    minWidth: 120
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: 'black',
        color: '#D8E1FF',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 12
      }}
    >
      <div
        style={{
          width: '100%',
          padding: 10,
          backgroundImage: `url(${domain}${randomOverlay.src})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          display: 'flex',
          justifyContent: 'space-around',
          gap: 10
        }}
      >
        {/* Profile Card - Centered at the top */}
        <img
          src={nftImageUrl}
          alt='NFT Artwork'
          width={200}
          height={250}
          style={{
            objectFit: 'contain'
          }}
        />
        <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div
            style={{
              ...box,
              gap: 10,
              flexDirection: 'row',
              textAlign: 'center',
              justifyContent: 'center',
              minHeight: 65
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h6 style={{ fontSize: '14px', color: '#69DDFF', margin: 0 }}>COLLECTED</h6>
              <p
                style={{
                  margin: 0,
                  alignItems: 'center',
                  gap: 3,
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
              >
                {gemsCollected}
                <img width={15} height={15} src={`${domain}/images/icons/gem.svg`} alt='gem' />
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h6 style={{ fontSize: '14px', color: '#69DDFF', margin: 0 }}>RANK</h6>
              <p style={{ margin: 0 }}>{rank}</p>
            </div>
          </div>
          <div
            style={{
              ...box,
              minHeight: 120,
              textAlign: 'center'
            }}
          >
            <h6 style={{ fontSize: '14px', color: '#69DDFF', margin: 0 }}>THIS SEASON</h6>
            <div style={{ margin: 0, alignItems: 'center', gap: 3, display: 'flex', flexDirection: 'row' }}>
              <span>{seasonTokens}</span>
              <img width={20} height={20} src={`${domain}/images/dev-token-logo.png`} alt='DEV Token' />
            </div>
            <p style={{ margin: 0 }}>{totalScouts} Scouts</p>
            <p style={{ margin: 0, alignItems: 'center', gap: 3, display: 'flex', flexDirection: 'row' }}>
              <span>{totalNftsSold}</span>
              <img width={13} height={13} src={`${domain}/images/profile/icons/card.svg`} alt='card' />
              <span>sold</span>
            </p>
          </div>
          <div
            style={{
              ...box,
              textAlign: 'center',
              minHeight: 65
            }}
          >
            <h6 style={{ fontSize: '14px', color: '#69DDFF', margin: 0 }}>CURRENT PRICE</h6>
            <p style={{ margin: 0, alignItems: 'center', gap: 3, display: 'flex', flexDirection: 'row' }}>
              <span>{Number(builderPrice)}</span>
              <img width={20} height={20} src={`${domain}/images/dev-token-logo.png`} alt='DEV Token' />
            </p>
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          marginTop: 4,
          width: '100%'
        }}
      >
        <div
          style={{
            ...box,
            alignItems: 'flex-start',
            width: '100%'
          }}
        >
          <h6 style={{ fontSize: '14px', color: '#69DDFF', margin: 0, textAlign: 'left' }}>Recent Activity</h6>
        </div>
        {activities
          .filter((_, i) => i < 3)
          .map((activity) => {
            const scoutPartner = scoutPartners.find((partner) => partner.id === activity.scoutPartnerId);
            return (
              <div
                key={activity.id}
                style={{
                  ...box,
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  width: '100%',
                  minHeight: '60px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p style={{ margin: 0 }}>{getActivityLabel(activity)}</p>
                    <p style={{ margin: 0 }}>{getActivityDetail(activity)}</p>
                  </div>
                  <div
                    style={{
                      margin: 0,
                      gap: 3,
                      display: 'flex',
                      alignItems: 'center',
                      flexDirection: 'row',
                      height: '30px'
                    }}
                  >
                    {activity.type === 'github_event' ? (
                      <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'flex-start', gap: 3 }}>
                        <span>+{activity.gems}</span>
                        <img
                          style={{ margin: 0 }}
                          width={15}
                          height={15}
                          src={`${domain}/images/icons/gem.svg`}
                          alt='gem'
                        />
                      </div>
                    ) : null}
                    {activity.type === 'github_event' && scoutPartner ? (
                      <img width={20} height={20} src={scoutPartner.image} alt={scoutPartner.text} />
                    ) : null}
                  </div>
                  <p style={{ textAlign: 'right', margin: 0 }}>{getRelativeTime(activity.createdAt)}</p>
                </div>
              </div>
            );
          })}
        {activities.length === 0 ? (
          <div
            style={{
              ...box,
              flexDirection: 'row',
              gap: 8,
              width: '100%'
            }}
          >
            <p style={{ margin: 0 }}>No recent activity by this developer.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function getActivityLabel(activity: BuilderActivity) {
  if (activity.type === 'onchain_achievement') {
    return `${capitalize(activity.tier)} Tier!`;
  }
  return activity.type === 'github_event'
    ? activity.contributionType === 'first_pr'
      ? 'First contribution!'
      : activity.contributionType === 'regular_pr'
        ? 'Contribution accepted!'
        : activity.contributionType === 'third_pr_in_streak'
          ? 'Contribution streak!'
          : activity.contributionType === 'daily_commit'
            ? 'Daily commit!'
            : null
    : activity.type === 'nft_purchase'
      ? 'Scouted by'
      : null;
}

export function getActivityDetail(activity: BuilderActivity): string | null {
  if (activity.type === 'onchain_achievement') {
    return activity.project.name;
  }
  return activity.type === 'nft_purchase'
    ? activity.scout.displayName
    : activity.type === 'github_event'
      ? activity.repo
      : null;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
