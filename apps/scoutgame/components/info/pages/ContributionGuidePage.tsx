import { Divider, ListItemText, List, ListItem, Typography, Link, Stack } from '@mui/material';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function ContributionGuidePage() {
  return (
    <InfoPageContainer
      data-test='contribution-guide-page'
      image='/images/info/info_banner.png'
      title='Contribution Guide'
    >
      <Document />
    </InfoPageContainer>
  );
}

function CustomList({ children, listStyleType }: { children: React.ReactNode; listStyleType: 'decimal' | 'disc' }) {
  return (
    <List
      sx={{
        listStyleType,
        pl: 2,
        pt: 0,
        '& .MuiListItem-root': { py: 0.25, px: 0.5, display: 'list-item' },
        '& .MuiListItemText-primary': { fontWeight: 500, fontSize: '1.15rem' },
        '& .MuiListItemText-secondary': { color: 'text.primary', fontSize: '1rem', lineHeight: '1.75rem', my: 0.5 }
      }}
    >
      {children}
    </List>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography variant='h6' color='secondary'>
        Table of Contents
      </Typography>
      <Stack spacing={1} mb={1}>
        <Link href='#leveling-up-your-first-issue'>
          <Typography variant='body1' color='primary'>
            Leveling Up: Your First Issue
          </Typography>
        </Link>
        <Link href='#submitting-an-issue'>
          <Typography variant='body1' color='primary'>
            Submitting an Issue
          </Typography>
        </Link>
      </Stack>
      <Typography>
        Before diving in, make sure to check with the repo's contribution guide (if they have one) it's like the OG
        roadmap for how to make an impact. This is your shot to connect with the team and even get some senior devs to
        notice your work.
      </Typography>
      <Typography>
        <b>Pro tip:</b> many contributors land gigs just by being active and bringing their A-game. 🛠️
      </Typography>
      <Typography variant='h5' color='secondary' mt={2} id='leveling-up-your-first-issue'>
        Leveling Up: Your First Issue
      </Typography>
      <Typography>
        This is a general guide for working on your first issue in a repo, in case the repo doesn't have a guide of its
        own. Following these guidelines will help ensure that your pull request (PR) gets approved.
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        Find the Work
      </Typography>
      <CustomList listStyleType='decimal'>
        <ListItem>
          <ListItemText
            primary='Get the Lay of the Land'
            secondary="Understand the repo's architecture and what it's all about. For example, if it's about EIPs, make sure you've cracked the structure of EIPs before jumping in."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Hunt your Issue'
            secondary={
              <>
                Scope out the repo's existing issues and zero in on the tags or labels. Keep an eye out for gems like:
                <br />
                🚀 Scout Game
                <br />
                🏷️ good first issue
                <br />
                🙋‍♂️ help wanted
                <br />
                Find an open issue that matches your skill set and proceed. If the project does not use issues or you
                can not find an appropriate issue, we have compiled best practices for submitting your own issue in the
                following section.
              </>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Decode the Issue'
            secondary="Read the reported issue and be crystal clear on what's being asked."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Get the Green Light'
            secondary={
              <>
                Reach out to the repository maintainer to assign the issue to you.
                <br />
                - Add a comment outlining your plan and timeline.
                <br />
                - If someone is already assigned, check with the repo maintainer to make sure they are still working the
                issue.
                <br />
                - Ensure no duplicate issues exist for the work you're planning.
                <br />
                Once the issue is yours to solve, you are ready to dive in!
              </>
            }
          />
        </ListItem>
      </CustomList>
      <Typography variant='h6' color='secondary' mt={2}>
        Do the Work
      </Typography>
      <CustomList listStyleType='disc'>
        <ListItem>
          <ListItemText
            primary='Fork It, Clone It, Own It'
            secondary="Fork the repo and clone your version locally. No write access to the main repo? No worries—that's what forks are for."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Recreate the Issue'
            secondary="Run the code and replicate the behavior mentioned in the issue. Now you're ready to troubleshoot."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Ask Smart Questions'
            secondary="Dive deep into the repo before pinging anyone, but don't waste hours going in circles. Most of the time, just phrasing your question unlocks the answer."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Brush Up on the Code'
            secondary='If the language feels foreign, take a crash course. No shame in leveling up your toolkit.'
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Test-Driven FTW'
            secondary="Try writing a test first to confirm the bug exists. Once that's locked in, go ahead and implement your fix."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Wrap It Up'
            secondary={
              <>
                - Add tests (if you haven't already).
                <br />- Write clean, concise documentation that vibes with the repo's style.
              </>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText primary='Submit a PR' secondary='Link the issue, and explain your solution like a pro.' />
        </ListItem>
      </CustomList>
      <Typography>Stay consistent, and who knows—your next big gig might just slide into your DMs. 🚀</Typography>

      <Divider sx={{ backgroundColor: 'secondary.main', my: 1, mx: 'auto', width: '100%' }} />

      <Typography variant='h5' mt={1} color='secondary' id='submitting-an-issue'>
        Submitting an Issue
      </Typography>
      <Typography mt={2}>
        Some projects don't use issues to manage contributions. In this case you may want to submit your own issue
        before beginning your work. By submitting an issue, you can can feedback from the core maintainer to make sure
        your contribution is needed and impactful.
      </Typography>
      <Typography variant='h6' mt={1}>
        Before Submitting an Issue
      </Typography>
      <Typography>Confirm it's legit.</Typography>
      <CustomList listStyleType='disc'>
        <ListItem>
          <ListItemText secondary='Reproduce the problem using the latest version of the software.' />
        </ListItem>
        <ListItem>
          <ListItemText secondary='Check the documentation—you might uncover the root cause and fix it yourself.' />
        </ListItem>
        <ListItem>
          <ListItemText secondary="Search existing issues in the project. If it's already reported and still open, drop your insights in the comments instead of creating a new issue." />
        </ListItem>
      </CustomList>
      <Typography variant='h6' mt={1}>
        How to Submit a Solid Issue
      </Typography>
      <Typography>
        Issues are how bugs get tracked, so be detailed to help maintainers troubleshoot faster. Here's the playbook:{' '}
      </Typography>
      <CustomList listStyleType='decimal'>
        <ListItem>
          <ListItemText
            primary='Nail the Basics'
            secondary={
              <>
                - Write a clear, descriptive title that sums up the problem.
                <br />- Lay out the exact steps to reproduce the issue. Include all the gritty details—commands,
                processes, or whatever triggered it.
              </>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Show the Work'
            secondary={
              <>
                - Provide specific examples: links, code snippets (formatted with ```), or anything that shows the
                problem in action.
                <br />- Share screenshots or recordings that clearly demonstrate what's happening.
              </>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Describe the Situation'
            secondary={
              <>
                - What happened? What's the issue with that behavior?
                <br />- What should have happened instead?
              </>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Provide Context'
            secondary={
              <>
                - Did this issue pop up recently (e.g., after an update), or has it always been there?
                <br />- Can you replicate it in an older version? If so, what's the last version where it worked fine?
                <br />- How often does the issue occur? Under what conditions?
              </>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Include Environment Details'
            secondary={
              <>
                - Software Version: Which version are you using?
                <br />- Operating System: Include the OS and version.
                <br />- Virtualization: Are you in a VM? If yes, which software and versions for the host and guest?
                <br />- Docker: If applicable, what's your Docker version?
                <br />- Cloud: Running on the cloud? Drop the provider and VM details (type/size).
                <br />- Java Version: Share your Java version if it's relevant.
              </>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText primary='Label It' secondary={<>Add relevant labels to categorize the issue.</>} />
        </ListItem>
      </CustomList>
      <Typography>
        By following this guide, you'll make it easier for maintainers to solve the problem faster. 💡
      </Typography>
    </InfoCard>
  );
}
