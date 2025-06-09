import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getStartOfMatchup } from '@packages/matchup/getMatchupDetails';
import { getRelativeTime } from '@packages/utils/dates';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';

import { getTransferSingleWithBatchMerged } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleWithBatchMerged';
import { Address } from 'viem';

async function query() {}
query();
