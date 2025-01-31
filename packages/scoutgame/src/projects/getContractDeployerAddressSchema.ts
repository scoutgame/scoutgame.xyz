import * as yup from 'yup';

export const getContractDeployerAddressSchema = yup.object({
  contractAddress: yup.string().required(),
  chainId: yup.number().required()
});
