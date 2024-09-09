import { Options } from './ProductionStack';

const charmverseCert = 'arn:aws:acm:us-east-1:310849459438:certificate/b960ff5c-ed3e-4e65-b2c4-ecc64e696902';
const scoutgameCert = 'arn:aws:acm:us-east-1:310849459438:certificate/b901f27e-5a33-4dea-b4fb-39308a580423';
const sunnyCert = 'arn:aws:acm:us-east-1:310849459438:certificate/4618b240-08da-4d91-98c1-ac12362be229';

export const apps: { [key: string]: { stg?: Options; prd?: Options } } = {
  ceramic: {
    prd: {
      healthCheck: {
        path: '/graphql',
        port: 5001
      }
    },
    stg: {
      healthCheck: {
        path: '/graphql',
        port: 5001
      }
    }
  },
  cron: {
    prd: {
      environmentType: 'SingleInstance'
    },
    stg: {
      environmentType: 'SingleInstance'
    }
  },
  farcaster: {
    prd: {
      sslCert: charmverseCert
    }
  },
  sunnyawards: {
    prd: {
      sslCert: sunnyCert
    }
  },
  comingsoon: {
    prd: {
      sslCert: scoutgameCert
    }
  },
  scoutgame: {
    prd: {
      sslCert: scoutgameCert
    }
  },
  waitlist: {
    prd: {
      sslCert: scoutgameCert
    }
  },
  webapp: {
    prd: {
      sslCert: charmverseCert
    }
  },
  websockets: {
    prd: {
      sslCert: charmverseCert
    },
    stg: {
      environmentType: 'SingleInstance'
    }
  }
};
