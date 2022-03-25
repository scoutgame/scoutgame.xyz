import { memo } from 'react';
import { getNonMacEmojiImage } from 'components/common/Emoji';

function Favicon ({ pageIcon }: { pageIcon?: string | null }) {
  const favicon = {
    url: '/favicon.png',
    type: 'image/png'
  };
  if (pageIcon) {
    const emojiImage = getNonMacEmojiImage(pageIcon);
    favicon.type = 'image/svg+xml';
    if (emojiImage) {
      favicon.url = emojiImage;
    }
    else {
      favicon.url = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%2210 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${pageIcon}</text></svg>`;
    }
  }
  return (
    <link rel='icon' type={favicon.type} href={favicon.url} />
  );
}

export default memo(Favicon);
