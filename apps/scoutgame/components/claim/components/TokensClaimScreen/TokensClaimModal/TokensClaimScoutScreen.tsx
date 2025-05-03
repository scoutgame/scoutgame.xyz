import { primaryTextColorDarkMode, secondaryText } from '@packages/scoutgame-ui/theme/colors';
import React from 'react';

export function TokensClaimScoutScreen({
  claimedTokens,
  displayName,
  developers,
  baseUrl = ''
}: {
  baseUrl?: string;
  displayName: string;
  claimedTokens: number;
  developers: { avatar: string | null; displayName: string }[];
}) {
  return (
    <div
      style={{
        transform: 'translate(-50%, -50%)',
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '75%',
        height: '75%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1,
        marginTop: '32px',
        color: primaryTextColorDarkMode
      }}
      className='scoutgame-claim-screen'
    >
      <h1
        style={{
          fontFamily: 'K2D',
          fontSize: '2.125rem',
          margin: 0
        }}
      >
        TOP SCOUT
      </h1>

      <h2
        style={{
          color: secondaryText,
          fontWeight: 600,
          fontSize: '1.25rem',
          marginTop: '16px'
        }}
      >
        {displayName}
      </h2>

      <div
        style={{
          fontSize: '1.25rem',
          textAlign: 'center'
        }}
      >
        scored {claimedTokens} DEV Tokens <br /> in
      </div>

      <div
        style={{
          fontWeight: 'bold',
          fontSize: '1.25rem',
          textAlign: 'center',
          fontFamily: 'Posterama'
        }}
      >
        SCOUT GAME!
      </div>

      {developers.length ? (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: '16px',
            paddingLeft: '32px'
          }}
        >
          <div
            style={{
              marginTop: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                margin: 0
              }}
            >
              My Top Developers:
            </h2>

            {developers.map((developer) => (
              <div
                key={developer.displayName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <img
                  src={developer.avatar ?? ''}
                  alt={developer.displayName}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%'
                  }}
                />
                <span style={{ fontWeight: 600 }}>{developer.displayName}</span>
              </div>
            ))}
          </div>

          <img src={`${baseUrl}/images/profile/builder-dog.png`} alt='Builder Dog' width={200} height={200} />
        </div>
      ) : null}
    </div>
  );
}
