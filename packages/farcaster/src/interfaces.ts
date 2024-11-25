export type FarcasterUser = {
  username: string;
  fid: number;
  display_name: string;
  follower_count: number;
  following_count: number;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
    };
  };
  verifications: string[];
};
