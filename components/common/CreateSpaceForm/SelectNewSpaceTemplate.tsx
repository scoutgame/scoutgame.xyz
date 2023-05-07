import styled from '@emotion/styled';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import { Divider, Typography, SvgIcon } from '@mui/material';
import Grid from '@mui/material/Grid';
import { MdOutlineBuild } from 'react-icons/md';
import { SiHackthebox, SiNotion } from 'react-icons/si';
import { SlBadge, SlTrophy } from 'react-icons/sl';

import { spaceInternalTemplateMapping, spaceTemplateLabelMapping } from 'lib/spaces/config';
import type { SpaceCreateTemplate, SpaceTemplateType } from 'lib/spaces/config';
import { typedKeys } from 'lib/utilities/objects';
import NounsIcon from 'public/images/logos/noggles/noggles.svg';

import { TemplateOption } from './TemplateOption';

type SelectNewSpaceTemplateProps = {
  onSelect: (value: SpaceCreateTemplate) => void;
};

const fontSize = 24;

const ScrollContainer = styled.div`
  overflow: auto;
  max-height: 40vh;

  // account for padding from the scrollbar
  padding: 0 32px;
  margin: 0 -32px;
`;

const templateIcon: Record<SpaceTemplateType, React.ReactNode> = {
  creator: <EmojiObjectsIcon htmlColor='var(--primary-color)' sx={{ fontSize }} />,
  nft_community: <SlBadge color='var(--primary-color)' size={fontSize} />,
  hackathon: <SlTrophy color='var(--primary-color)' size={fontSize} />,
  nounish_dao: <SvgIcon component={NounsIcon} sx={{ color: 'var(--primary-color)' }} inheritViewBox />,
  impact_community: <SiHackthebox color='var(--primary-color)' size={fontSize} />
};

export function SelectNewSpaceTemplate({ onSelect }: SelectNewSpaceTemplateProps) {
  return (
    <ScrollContainer className='space-templates-container'>
      <Grid container spacing={2} flexDirection='column'>
        <Grid item>
          <TemplateOption
            onClick={() => onSelect('default')}
            label='Create my own'
            data-test='space-template-default'
            icon={<MdOutlineBuild color='var(--primary-color)' size={fontSize} />}
          />
        </Grid>
        <Grid item>
          <Typography variant='caption' color='secondary' textTransform='uppercase' fontWeight='bold'>
            Start from a template
          </Typography>
        </Grid>

        {typedKeys(spaceInternalTemplateMapping).map((template) => (
          <Grid item key={template}>
            <TemplateOption
              data-test={`space-template-${template}`}
              onClick={() => onSelect(template)}
              label={spaceTemplateLabelMapping[spaceInternalTemplateMapping[template]]}
              icon={templateIcon[template]}
            />
          </Grid>
        ))}
        <Grid item>
          <Divider flexItem sx={{ mb: 2 }} />
          <Typography variant='caption' color='secondary' textTransform='uppercase' fontWeight='bold'>
            Transfer from another platform
          </Typography>
        </Grid>
        <Grid item>
          <TemplateOption
            data-test='space-template-importNotion'
            onClick={() => onSelect('importNotion')}
            label='Import from Notion'
            icon={<SiNotion color='var(--primary-color)' size={fontSize} />}
          />
        </Grid>

        <Grid item>
          <TemplateOption
            data-test='space-template-importMarkdown'
            onClick={() => onSelect('importMarkdown')}
            label='Import from Markdown'
            icon={<DriveFolderUploadIcon color='primary' sx={{ fontSize }} />}
          />
        </Grid>
      </Grid>
    </ScrollContainer>
  );
}
