/* eslint-disable class-methods-use-this */

import { Space, Prisma, Page, User } from '@prisma/client';
import * as http from 'adapters/http';
import { gettingStartedPageContent } from 'seedData';
import { Contributor, LoggedInUser } from 'models';

//
// CharmClient is the client interface to the server APIs
//
class CharmClient {

  async login (address: string) {
    const user = await http.POST<LoggedInUser>('/api/session/login', {
      address
    });
    return user;
  }

  async logout () {
    await http.POST('/api/session/logout');
  }

  getUser () {
    return http.GET<LoggedInUser>('/api/session/profile');
  }

  createUser ({ address }: { address: string }) {
    return http.POST<LoggedInUser>('/api/session/profile', {
      address
    });
  }

  async createSpace (spaceOpts: Prisma.SpaceCreateInput) {
    spaceOpts.pages = {
      // add a first page to the space
      create: [{
        author: spaceOpts.author,
        content: gettingStartedPageContent(),
        contentText: '',
        isPublic: false,
        path: 'getting-started',
        title: 'Getting Started',
        type: 'page',
        updatedAt: new Date(),
        updatedBy: spaceOpts.author.connect!.id!
      }]
    };
    const space = await http.POST<Space>('/api/spaces', spaceOpts);
    return space;
  }

  getSpaces () {
    return http.GET<Space[]>('/api/spaces');
  }

  getContributors (spaceId: string) {
    return http.GET<Contributor[]>(`/api/spaces/${spaceId}/contributors`);
  }

  createPage (pageOpts: Prisma.PageCreateInput) {
    return http.POST<Page>('/api/pages', pageOpts);
  }

}

const charmClient = new CharmClient();

export default charmClient;
