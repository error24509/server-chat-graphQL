import express from 'express';
import { PubSub } from 'graphql-subscriptions';
import { createSchema, createYoga } from 'graphql-yoga';

// Create an instance of PubSub
const pubsub = new PubSub();
const rooms = []; // Store rooms
const messages = [{}]; // Store messages
let nextRoomId = 1; // Room ID counter
const subscribers = [];
const onMessagesUpdates = (fn) => subscribers.push(fn);

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      rooms: [Room!]
      GetById(id: ID!): Room
    }

    type Room {
      id: ID!
      name: String!
      messages: [Message!]
    }

    type Message {
      id: ID!
      content: String!
      user: String!
    }

    type Mutation {
      postMessage(roomId: ID!, content: String!, user: String!): Message!
      createRoom(name: String!): Room!
    }

    type Subscription {
      messages(roomId: ID!): [Message!]
    }
  `,
  resolvers: {
    Query: {
      rooms: () => rooms,
      GetById: (_, { id }) => rooms.find(room => room.id === id),
    },
    Mutation: {
      postMessage: (_, { roomId, content, user }) => {
        const room = rooms.find(room => room.id === roomId);
        if (!room) {
          throw new Error('Room not found');
        }
        const messageId = String(messages.length + 1);
        const message = { id: messageId, content, user, roomId };
        messages.push(message);
        room.messages.push(message);
        subscribers.forEach((fn) => fn());
        return message;
      },
      createRoom: (_, { name }) => {
        const room = { id: String(nextRoomId++), name, messages: [] };
        rooms.push(room);
        return room;
      },
    },
    Subscription: {
      messages: {
        subscribe: (_, { roomId }, { pubsub }) => {
          const channel = `MESSAGE_ADDED_${roomId}`;
          onMessagesUpdates(() => pubsub.publish(channel, { messages: messages.filter(message => message.roomId === roomId) }));
          setTimeout(() => {
            pubsub.publish(channel, { messages: messages.filter(message => message.roomId === roomId) });
          }, 0);
          return pubsub.asyncIterator(channel);
        },
      },
    },
  },
});


const app = express();

const yoga = createYoga({
  schema,
  context: { pubsub },
});

app.use('/graphql', yoga);

app.listen(4000, () => {
  console.log('Server started on http://localhost:4000/graphql');
});