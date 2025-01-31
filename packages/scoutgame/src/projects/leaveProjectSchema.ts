import * as yup from 'yup';

export const leaveProjectSchema = yup.object({
  projectId: yup.string().uuid().required('Project ID is required')
});
