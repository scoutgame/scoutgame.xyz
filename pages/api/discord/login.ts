import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import Cookies from 'cookies';

const discordClientId = process.env.DISCORD_OAUTH_CLIENT_ID as string;
const discordUrl = `https://discord.com/api/oauth2/authorize?prompt=consent&client_id=${discordClientId}&response_type=code`;

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).get(login);

async function login (req: NextApiRequest, res: NextApiResponse) {
  const cookies = new Cookies(req, res);
  const query = req.query as {
    redirect: string,
    type: 'connect' | 'roles'
  };
  const nonce = `${crypto.randomBytes(16).toString('base64')}+++`;
  const state = encodeURIComponent(JSON.stringify({
    redirect: query.redirect,
    userId: req.session.user.id,
    nonce
  }));

  cookies.set('oauth_secret', nonce);
  const callback = query.type === 'connect' ? 'connect' : 'roles';

  const oauthUrl = `${discordUrl}&${query.type === 'connect' ? '&scope=identify' : '&scope=guilds'}&state=${state}&redirect_uri=${encodeURIComponent(req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/discord/callback/${callback}` : `https://app.charmverse.io/api/discord/callback/${callback}`)}`;
  res.send({ redirectUrl: oauthUrl });
}

export default withSessionRoute(handler);
