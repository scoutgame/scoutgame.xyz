import { log } from '@charmverse/core/log';

import { octokit } from '@packages/github/client';

type GithubUser = {
  login: string;
  name?: string;
  email?: string;
  twitter?: string;
  location?: string;
  isHireable?: boolean;
};

export const bots = [
  'github-actions',
  'etc-contribunator',
  'homarr-renovate',
  'playground-manager',
  'feisar-bot',
  'spicerabot',
  'simplificator-renovate',
  'phillip-ground',
  'danmharris-renovate',
  'rosey-the-renovator-bot',
  'renovate-bot-github-app',
  'nix-flake-updater-sandhose',
  'octo-sts',
  'anaconda-renovate',
  'leather-bot',
  '404-bot',
  'renovate-bot-github-app',
  'repo-jeeves',
  'ibis-squawk-bot',
  'tyriis-automation',
  'doug-piranha-bot',
  'shipwasher',
  'aisling-bot',
  'codewarden-bot',
  'budimanjojo-bot',
  'smurf-bot',
  'glad-os-bot',
  'gabe565-renovate',
  'self-hosted-test',
  'dextek-bot',
  'robodexo2000',
  'bot-akira',
  'unhesitatingeffectivebot',
  'hoschi-bot',
  'mchesterbot',
  'ishioni-bot',
  'k3s-home-gha-bot',
  'fld-01',
  'home-gitops-renovate',
  'release-please-for-lemonade',
  'mend-bolt-for-github',
  'dependabot[bot]',
  'nero-alpha',
  'app-token-issuer-functions',
  'allcontributors',
  'novasama-bot',
  'nips-ja-sync',
  'layerone-renovate',
  'depfu',
  'duwenjieG',
  'hercules-ci',
  'core-repository-dispatch-app',
  'pr-action',
  'moonpay-github-security',
  'renovate',
  'app-token-issuer-infra-releng',
  'app-token-issuer-releng-renovate',
  'ellipsis-dev',
  'term-finance-publisher',
  'transifex-integration',
  'aaronyuai',
  'api3-ecosystem-pr-bot',
  'sweep-ai',
  'stack-file',
  'devin-ai-integration',
  'cybersecurity-github-actions-ci',
  'pre-commit-ci',
  'runway-github',
  'akeyless-target-app',
  'finschia-auto-pr',
  'bitgo-renovate-bot',
  'sui-merge-bot',
  'stainless-app',
  'ipfs-shipyard-mgmt-read-write',
  'azure-pipelines',
  'penify-dev',
  'term-finance-publisher',
  'live-github-bot',
  'paritytech-subxt-pr-maker',
  'smartdeploy-deployer',
  'dependabot-preview',
  'petr-hanzl',
  'paritytech-polkadotsdk-templatebot',
  'snyk-io',
  'galoybot-app',
  'figure-renovate',
  'corda-jenkins-ci02',
  'dependabot',
  'ipfs-mgmt-read-write',
  'codefactor-io',
  'libp2p-mgmt-read-write',
  'deepsource-autofix',
  'graphops-renovate',
  'filplus-github-bot-read-write',
  'imgbot',
  'paritytech-substrate-connect-pr',
  'tokenlistform',
  'pyca-boringbot',
  'pull'
];

export async function getGithubUsers({ logins: unfilteredLogins }: { logins: string[] }): Promise<GithubUser[]> {
  const logins = unfilteredLogins.filter((login) => !bots.includes(login));

  const total = logins.length;

  const perQuery = 100;

  const maxQueriedRepos = total;

  log.info(`Total users to query: ${total}`);

  const allData: GithubUser[] = [];

  for (let i = 0; i <= maxQueriedRepos; i += perQuery) {
    const list = logins.slice(i, i + perQuery);

    if (list.length === 0) {
      break;
    }
    const results = await octokit
      .graphql<{ data: any }>({
        query: `
          query {
            ${list
              .map(
                (login, index) => `user${index}: user(login: "${login}") {
              ...UserFragment
            }`
              )
              .join('\n')}
          }

          fragment UserFragment on User {
            login
            location
            twitterUsername
            email
            isHireable
            name
          }
        `
      })
      .then((data) => {
        return Object.values(data).map((edge) => ({
          login: edge.login,
          name: edge.name || undefined,
          email: edge.email || undefined,
          twitter: edge.twitterUsername || undefined,
          location: edge.location || undefined,
          isHireable: edge.isHireable
        }));
      })
      .catch((error) => {
        log.error('Could not resolve users', { logins, error });
        return [];
      });

    allData.push(...results);

    log.info(`Queried users ${i + 1}-${i + Math.min(list.length, perQuery)} / ${maxQueriedRepos}`);
  }
  return allData;
}
