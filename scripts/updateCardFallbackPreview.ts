import { prisma } from 'db';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { extractPreviewImage } from 'lib/prosemirror/extractPreviewImage';
import type { PageContent } from 'lib/prosemirror/interfaces';

async function updatePageGalleryUrl () {
  const pages = await prisma.page.findMany({
    where: {
      type: 'card'
    },
    select: {
      id: true,
      content: true
    }
  });

  const pagesWithContent = pages.filter(p => !checkIsContentEmpty(p.content as PageContent))
  const cardsWithFallbackImage = pagesWithContent.map(p => ({ id: p.id, galleryImage: extractPreviewImage(p.content as PageContent) }) )
    .filter(p => !!p.galleryImage)

  console.log('🔥 Count of cards with gallery url:', cardsWithFallbackImage.length);

  await prisma.$transaction(cardsWithFallbackImage.map(({ id, galleryImage }) => prisma.page.update({
    where: { id },
    data: { galleryImage }
  })))

  console.log('🔥 Updated galleryUrl for all cards with image in content.');
}


updatePageGalleryUrl();
