import styled from '@emotion/styled';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Chip, Stack, Typography } from '@mui/material';

import WorkspaceAvatar from 'components/common/PageLayout/components/Sidebar/WorkspaceAvatar';
import type { PropertyOption } from 'components/members/components/MemberDirectoryProperties/MemberPropertySelectInput';
import type { PropertyValueWithDetails } from 'lib/members/interfaces';

type Props = {
  spaceId: string;
  spaceName: string;
  memberId: string;
  properties: PropertyValueWithDetails[];
  spaceImage: string | null;
};

const StyledAccordion = styled(Accordion)`
  &.MuiPaper-root {
    margin-top: 0;
    background: none;
  }
`;

export function SpaceDetailsAccordion ({ spaceId, spaceName, memberId, properties, spaceImage }: Props) {

  return (
    <StyledAccordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}><WorkspaceAvatar
        name={spaceName}
        image={spaceImage}
      /> <Typography ml={2} variant='h5' fontWeight='bold'>{spaceName}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack gap={2}>
          {properties.map(property => {
            switch (property.type) {
              case 'text':
              case 'phone':
              case 'url':
              case 'email':
              case 'number': {
                return (
                  <Stack key={property.memberPropertyId}>
                    <Typography fontWeight='bold' variant='h6'>{property.name}</Typography>
                    <Typography variant='body2'>{property.value ?? 'N/A'}</Typography>
                  </Stack>
                );
              }
              case 'multiselect': {
                const values = (property.value ?? [])as PropertyOption[];
                return (
                  <Stack gap={0.5} key={property.memberPropertyId}>
                    <Typography fontWeight='bold' variant='h6'>{property.name}</Typography>
                    <Stack gap={1} flexDirection='row'>
                      {values.length !== 0 ? values.map(propertyValue => <Chip label={propertyValue.name} color={propertyValue.color} key={propertyValue.name} size='small' variant='outlined' />) : 'N/A'}
                    </Stack>
                  </Stack>
                );
              }
              case 'select': {
                const propertyValue = property.value as PropertyOption;
                return (
                  <Stack gap={0.5} key={property.memberPropertyId}>
                    <Typography fontWeight='bold' variant='h6'>{property.name}</Typography>
                    {propertyValue ? (
                      <Stack gap={1} flexDirection='row'>
                        <Chip label={propertyValue.name} key={propertyValue.name?.toString() ?? ''} color={propertyValue.color} size='small' variant='outlined' />
                      </Stack>
                    ) : <Typography variant='body2'>N/A</Typography>}
                  </Stack>
                );
              }
              default: {
                return null;
              }
            }
          })}
        </Stack>
      </AccordionDetails>
    </StyledAccordion>
  );
}
