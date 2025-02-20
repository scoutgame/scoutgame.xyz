import { getServerDate } from '@packages/utils/dates';
import * as yup from 'yup';

export const claimDailyRewardSchema = yup.object({
  isBonus: yup.boolean(),
  dayOfWeek: yup
    .number()
    .required()
    .min(1)
    .max(7)
    .test('valid-today', 'Invalid day.', (value) => getServerDate().weekday === value)
});
