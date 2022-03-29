import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import { getInviteLink } from 'lib/invites';
import InviteLinkPage from 'components/invite/InviteLinkPage';

export const getServerSideProps: GetServerSideProps = async (context) => {

  const inviteCode = context.query.inviteCode as string;
  const { invite, expired } = await getInviteLink(inviteCode);

  if (!invite) {
    return {
      props: {
        error: 'Invitation not found'
      }
    };
  }
  if (expired) {
    return {
      props: {
        error: 'This link has expired'
      }
    };
  }

  return {
    props: {
      invite
    }
  };
};

export default function InvitationPage ({ error, invite }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <InviteLinkPage error={error} invite={invite} />;
}

InvitationPage.getLayout = getBaseLayout;
