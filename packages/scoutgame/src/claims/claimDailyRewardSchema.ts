import * as yup from 'yup';

import { getServerDate } from '../utils/getServerDate';

export const claimDailyRewardSchema = yup.object({
  isBonus: yup.boolean(),
  dayOfWeek: yup
    .number()
    .required()
    .min(1)
    .max(7)
    .test('valid-today', 'Invalid day.', (value) => getServerDate().weekday === value)
});
