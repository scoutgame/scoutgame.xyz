import { Options } from './ProductionStack';

const scoutgameCert = 'arn:aws:acm:us-east-1:310849459438:certificate/b901f27e-5a33-4dea-b4fb-39308a580423';

export const apps: { [key: string]: { stg?: Options; prd?: Options } } = {
  scoutgameadmin: {
    prd: {
      sslCert: scoutgameCert
    }
  },
  scoutgame: {
    prd: {
      sslCert: scoutgameCert
    }
  },
  scoutgamecron: {
    prd: {
      environmentTier: 'Worker'
    },
    stg: {
      environmentTier: 'Worker'
    }
  },
  scoutgametelegram: {
    prd: {
      sslCert: scoutgameCert
    }
  },
  "preprd-cron": {
    prd: {
      environmentTier: 'Worker'
    },
    stg: {
      environmentTier: 'Worker'
    }
  }
};
