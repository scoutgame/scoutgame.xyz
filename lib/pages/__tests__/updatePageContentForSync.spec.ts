import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { builders as _ } from 'testing/prosemirror/builders';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { updatePageContentForSync } from '../updatePageContentForSync';

describe('updatePageContentForSync', () => {
  it(`Should update page content by converting linked page nodes and adding nested pages`, async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);
    const childPage1Id = v4();
    const childPage1Path = `page-${v4()}`;
    const linkedPage1 = await testUtilsPages.generatePage({
      spaceId: space.id,
      createdBy: user.id
    });

    const linkedPage2 = await testUtilsPages.generatePage({
      spaceId: space.id,
      createdBy: user.id
    });

    const pageContent = _.doc(
      _.paragraph('Paragraph 1'),
      _.page({
        id: childPage1Id,
        type: 'page',
        path: childPage1Path
      }),
      _.paragraph('Paragraph 2'),
      _.page({
        id: linkedPage1.id,
        type: 'page',
        path: linkedPage1.path
      }),
      _.paragraph('Paragraph 3'),
      _.linkedPage({
        id: linkedPage2.id,
        type: 'page',
        path: linkedPage2.path
      }),
      _.paragraph('Paragraph 4')
    ).toJSON();

    const parentPage = await testUtilsPages.generatePage({
      spaceId: space.id,
      createdBy: user.id,
      content: pageContent
    });

    const childPage1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id,
      id: childPage1Id
    });

    const childPage2 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    const childPage3 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    await updatePageContentForSync();

    const updatedParentPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true,
        diffs: {
          select: {
            data: true,
            pageId: true,
            version: true
          }
        },
        version: true
      }
    });

    const pageDiffs = updatedParentPage.diffs;

    expect(updatedParentPage.content).toEqual(
      _.doc(
        _.p('Paragraph 1'),
        _.page({
          id: childPage1.id,
          path: childPage1Path,
          type: childPage1.type
        }),
        _.paragraph('Paragraph 2'),
        _.linkedPage({
          id: linkedPage1.id,
          path: linkedPage1.path,
          type: linkedPage1.type
        }),
        _.paragraph('Paragraph 3'),
        _.linkedPage({
          id: linkedPage2.id,
          path: linkedPage2.path,
          type: linkedPage2.type
        }),
        _.paragraph('Paragraph 4'),
        _.page({
          id: childPage2.id,
          path: childPage2.path,
          type: childPage2.type
        }),
        _.page({
          id: childPage3.id,
          path: childPage3.path,
          type: childPage3.type
        })
      ).toJSON()
    );

    expect(updatedParentPage.version).toEqual(3);

    expect(pageDiffs).toStrictEqual([
      {
        data: {
          v: 1,
          ds: [
            {
              to: 28,
              from: 27,
              slice: {
                content: [
                  {
                    type: 'linkedPage',
                    attrs: {
                      id: linkedPage1.id,
                      path: linkedPage1.path,
                      type: 'page',
                      track: []
                    }
                  }
                ]
              },
              stepType: 'replace'
            }
          ],
          cid: 0,
          rid: 0,
          type: 'diff'
        },
        pageId: parentPage.id,
        version: 1
      },
      {
        data: {
          v: 2,
          ds: [
            {
              to: 55,
              from: 55,
              slice: {
                content: [childPage2, childPage3]
                  .sort((page1, page2) => (page1.id > page2.id ? 1 : -1))
                  .map((childPage) => ({
                    type: 'page',
                    attrs: {
                      id: childPage.id,
                      path: childPage.path,
                      type: 'page',
                      track: []
                    }
                  }))
              },
              stepType: 'replace'
            }
          ],
          cid: 0,
          rid: 0,
          type: 'diff'
        },
        pageId: parentPage.id,
        version: 2
      }
    ]);
  });
});
