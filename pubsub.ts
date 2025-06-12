type Message<T> = {
  payload: T;
  messageId: string;
  timestamp: number;
};

type SubscriberCallback<T> = (message: Message<T>) => void;

class Subscriber<T> {
  constructor(
    public readonly token: string,
    public readonly callback: SubscriberCallback<T>
  ) {}
}

class Topic<T> {
  private subscribers: Subscriber<T>[] = [];

  public subscribe(callback: SubscriberCallback<T>): string {
    const token = `SubscriptionToken-${Date.now()}-${Math.random()}`;
    const subscriber = new Subscriber(token, callback);
    this.subscribers.push(subscriber);
    return token;
  }

  public unsubscribe(token: string): boolean {
    const initialLength = this.subscribers.length;
    this.subscribers = this.subscribers.filter(sub => sub.token !== token);
    return this.subscribers.length < initialLength;
  }

  public publish(payload: T) {
    const message: Message<T> = {
      payload,
      messageId: crypto.randomUUID(),
      timestamp: Date.now()
    };

    for (const subscriber of [...this.subscribers]) {
      try {
        subscriber.callback(message);
      } catch (error) {
        console.error(`Error in subscriber callback with token ${subscriber.token}`);
      }
    }
  }
}

class Publisher {
  private topics: Map<string, Topic<any>> = new Map();

  public createTopic<T>(name: string): Topic<T> {
    if (!this.topics.has(name)) {
      this.topics.set(name, new Topic<T>());
    }
    return this.topics.get(name) as Topic<T>;
  }

  public getTopic<T>(name: string): Topic<T> | undefined {
    return this.topics.get(name) as Topic<T> | undefined;
  }
}

// ** Driver Code ** //
const publisher = new Publisher();

// Create or fetch a topic
const sportsTopic = publisher.createTopic<string>('sports');

// Define subscribers
const subscriber1 = (msg: Message<string>) => console.log('[Subscriber 1]', msg);
const subscriber2 = (msg: Message<string>) => console.log('[Subscriber 2]', msg);

// Subscribe
const token1 = sportsTopic.subscribe(subscriber1);
const token2 = sportsTopic.subscribe(subscriber2);

// Publish message
sportsTopic.publish('India won the match');

// Publish again after delay
setTimeout(() => {
  sportsTopic.publish('Cricket World Cup starts tomorrow');
}, 1000);

// Try unsubscribing with a fake token
const unsubResult = sportsTopic.unsubscribe('fake-token');
console.log(`Unsubscribe (fake token) success: ${unsubResult}`);
