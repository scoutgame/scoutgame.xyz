import type { Project } from '@charmverse/core/prisma-client';
import { Head } from '@react-email/head';
import { Html } from '@react-email/html';
import { Img } from '@react-email/img';
import { Section } from '@react-email/section';
import { baseUrl } from '@root/config/constants';
import { Link, Text } from '@root/lib/mailer/emails/templates/components';
import React from 'react';

import { lightGreyColor, primaryTextColor, secondaryTextColor } from 'theme/colors';

const baseBlue = '#0052ff';
function ProjectField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <>
      <Text
        variant='subtitle1'
        style={{
          lineHeight: 0.5
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          lineHeight: 1,
          marginBottom: 30,
          color: value ? primaryTextColor : secondaryTextColor
        }}
      >
        {value || '(not set)'}
      </Text>
    </>
  );
}

export function ProjectConfirmation({
  project
}: {
  project: Project & {
    projectMemberUsernames: string[];
  };
}) {
  const projectType = project.sunnyAwardsProjectType;
  return (
    <Html>
      <Head>
        <title>Congratulations you just entered the Sunnys</title>
      </Head>
      <Section
        style={{
          backgroundColor: lightGreyColor
        }}
      >
        <Section
          style={{
            width: 600,
            backgroundColor: '#fff'
          }}
        >
          <Img
            src='https://i.ibb.co/jgfrV0Z/Screenshot-2024-08-15-at-9-06-35-PM.png'
            // src={`${baseUrl}/images/sunnys-landscape.png`}
            style={{
              maxHeight: '100px',
              width: '100%'
            }}
          />
          <Section
            style={{
              padding: 30
            }}
          >
            <Text>
              Congratulations you just entered the Sunnys, a celebration of everything you have accomplished on the
              Superchain.
            </Text>

            <Text>
              🏆 Learn more about the Sunnys{' '}
              <Link primaryColor={baseBlue} href='https://www.thesunnyawards.fun/'>
                here
              </Link>
              .
            </Text>

            <Text>
              🛠️ You can still change your entry{' '}
              <Link primaryColor={baseBlue} href={`${baseUrl}/p/${project.path}/edit`}>
                here
              </Link>
              .
            </Text>

            <Text
              style={{
                marginBottom: 40
              }}
            >
              📋 The details of your application:
            </Text>

            <ProjectField label='Name' value={project.name} />
            <ProjectField label='Description' value={project.description} />
            {projectType === 'creator' ? (
              <ProjectField label='Minting wallet address' value={project.mintingWalletAddress} />
            ) : projectType === 'app' ? (
              <>
                <ProjectField label='Chain ID' value={project.primaryContractChainId} />
                <ProjectField label='Contract Address' value={project.primaryContractAddress} />
                <ProjectField label='Deployer Address' value={project.primaryContractDeployer} />
                <ProjectField label='Deployment Transaction Hash' value={project.primaryContractDeployTxHash} />
              </>
            ) : null}
            <ProjectField label='Websites' value={project.websites.join(', ')} />
            <ProjectField label='Category' value={project.category} />
            <ProjectField label='Farcaster profiles' value={project.farcasterValues.join(', ')} />
            <ProjectField label='X' value={project.twitter} />
            <ProjectField label='Github' value={project.github} />

            <hr />
            <Text variant='h3'>Project Members</Text>
            {project.projectMemberUsernames.map((username) => (
              <Text
                key={username}
                style={{
                  lineHeight: 1
                }}
              >
                <Link primaryColor={baseBlue} href={`https://warpcast.com/${username}`}>
                  {username}
                </Link>
              </Text>
            ))}
          </Section>
        </Section>
      </Section>
    </Html>
  );
}
