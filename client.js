
import { SubscriptionClient } from 'subscriptions-transport-ws';
import gql from 'graphql-tag';
import WebSocket from 'ws';

const wsClient = new SubscriptionClient('ws://localhost:4000/graphql', {
  reconnect: true, // Enable auto-reconnect
  connectionParams: {
    // Pass any arguments you want for initialization
  },
}, WebSocket);

wsClient.onConnected(() => {
  console.log('Connected to WebSocket server');
});

wsClient.onError(error => {
  console.error('WebSocket error:', error);
});

// Define your subscription query
const subscriptionQuery = gql`
  subscription {
    postCreated {
      id
      title
      content
    }
  }
`;

// Subscribe to the subscription query
const subscription = wsClient.request({ query: subscriptionQuery });

// Handle subscription events
subscription.subscribe({
  next(data) {
    console.log('Received:', data);
  },
  error(error) {
    console.error('Subscription error:', error);
  },
});
