
import * as client from './collablandClient';

interface DiscordRoleSubject extends client.DiscordRoleSubject {
  discordRoles: {
    id: string; // '-IflGlzZF95dnzRy8Ljsm:994305887286083705',
    name: string; // 'SUPER-0'
  }[];
  expiresAt: string | null;
}

export interface VerifiedCredential<T> {
  id: string;
  createdAt: string;
  type: 'VerifiableCredential' | 'GuestPass'[];
  subject: T;
}

function isBountyEventCredential (cred: client.AnyCredentialType['verifiableCredential']): cred is client.CollablandBountyEvent['verifiableCredential'] {
  return cred.credentialSubject.hasOwnProperty('bountyId');
}

export interface CredentialsResult {
  bountyEvents: VerifiedCredential<client.BountyEventSubject>[];
  discordRoles: VerifiedCredential<DiscordRoleSubject>[];
}

export async function getCredentials ({ aeToken }: { aeToken: string }): Promise<CredentialsResult> {

  const res = await client.getCredentials({ aeToken });

  const bountyEvents: CredentialsResult['bountyEvents'] = [];
  const discordRoles: CredentialsResult['discordRoles'] = [];

  res.forEach(({ verifiableCredential }) => {
    if (isBountyEventCredential(verifiableCredential)) {
      bountyEvents.push({
        id: verifiableCredential.id,
        createdAt: verifiableCredential.issuanceDate,
        type: verifiableCredential.type,
        subject: verifiableCredential.credentialSubject
      });
    }
    else {
      discordRoles.push({
        id: verifiableCredential.id,
        createdAt: verifiableCredential.issuanceDate,
        type: verifiableCredential.type,
        subject: {
          ...verifiableCredential.credentialSubject,
          discordRoles: [],
          expiresAt: verifiableCredential.credentialSubject.exp ? new Date(verifiableCredential.credentialSubject.exp).toISOString() : null
        }
      });
    }
  });

  bountyEvents
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  discordRoles
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // group Discord VCs by role
  const discordRolesGrouped = discordRoles.reduce<CredentialsResult['discordRoles']>((newList, curr) => {
    const last = newList[newList.length - 1];
    // if previous VC was the same server and <24 hours, just append the roles
    const lastIsSameServer = last && last.subject.discordGuildId === curr.subject.discordGuildId;
    const lastIsRecent = last && new Date(last.createdAt).getTime() > new Date(curr.createdAt).getTime() - (24 * 60 * 60 * 1000);
    if (lastIsSameServer && lastIsRecent) {
      last.subject.discordRoles.push({
        id: curr.subject.discordRoleId,
        name: curr.subject.discordRoleName
      });
    }
    else {
      newList.push(curr);
    }
    return newList;
  }, []);

  return {
    bountyEvents,
    discordRoles: discordRolesGrouped
  };
}
