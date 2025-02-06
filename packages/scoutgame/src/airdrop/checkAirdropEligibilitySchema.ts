import * as yup from 'yup';

export const checkAirdropEligibilitySchema = yup.object({
  payoutId: yup.string().required().uuid()
});
