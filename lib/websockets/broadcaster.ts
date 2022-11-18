import { createAdapter } from '@socket.io/redis-adapter';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';

import { redisClient } from 'adapters/redis/redisClient';
import { prisma } from 'db';
import { SpaceMembershipRequiredError } from 'lib/permissions/errors';

import type { ServerMessage } from './interfaces';

export class WebsocketBroadcaster {

  sockets: Record<string, Socket> = {};

  // Server will be set after the first request
  private io: Server = new Server();

  // Only called once in the app lifecycle once the server is initialised
  async bindServer (io: Server): Promise<void> {

    this.io = io;

    if (redisClient) {
      const pubClient = redisClient;
      const subClient = pubClient.duplicate();

      await Promise.all([
        pubClient.connect(),
        subClient.connect()
      ]);

      io.adapter(createAdapter(pubClient, subClient));
    }

    // Function for debugging amount of connections
    // setInterval(() => {
    //   this.io.sockets.allSockets().then(sockets => {
    //     // eslint-disable-next-line no-console
    //     console.log('Connected socket amount', sockets.size);
    //   });
    // });

    // }, 1000);

  }

  broadcastToAll (message: ServerMessage): void {
    this.io.emit('message', message);
  }

  broadcast (message: ServerMessage, roomId: string): void {
    this.io.to(roomId).emit('message', message);
  }

  broadcastToOthers (message: ServerMessage, roomId: string, userId: string): void {
    const socket = this.sockets[userId];
    if (socket) {
      socket.broadcast.to(roomId).emit('message', message);
    }
  }

  leaveRoom (socket: Socket, roomId: string): void {
    socket.leave(roomId);
  }

  /**
   * Subscribe a user to all events for themselves and a specific room
   * Unsubscribes user from all other rooms
   */
  async registerWorkspaceSubscriber ({ userId, socket, roomId }: { userId: string, socket: Socket, roomId: string }) {

    const spaceRole = await prisma.spaceRole.findFirst({
      where: {
        userId,
        spaceId: roomId
      }
    });

    if (!spaceRole) {
      socket.send(new SpaceMembershipRequiredError(`User ${userId} does not have access to ${roomId}`));
      return;
    }

    Object.keys(socket.rooms).forEach(room => {
      socket.leave(room);
    });

    socket.join([roomId]);

    this.sockets[userId] = socket;
  }

}

