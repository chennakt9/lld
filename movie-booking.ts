import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const LOCK_TIMEOUT = 3000;

class DummyRedis {
  private store = new Map<string, {value: string, expiresAt: number}>();

  async set(key: string, value: string) {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing.expiresAt > now) {
      return false;
    }

    this.store.set(key, {value, expiresAt: now + LOCK_TIMEOUT});

    return true;
  }

  async get(key: string, value: string) {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      return null;
    }

    return entry.value;
  }

  async del(key: string) {
    this.store.delete(key);
  }
}

const redisClient = new DummyRedis();

async function acquireLock(key: string, value: string): Promise<boolean> {
  const result = await redisClient.set(key, value);
  return result === true;
}

async function releaseLock(key: string) {
  await redisClient.del(key);
}

enum SeatStatus {
  AVAILABLE,
  BOOKED,
}

enum BookingStatus {
  PENDING,
  CONFIRMED,
  CANCELLED,
}

class User {
  constructor(public id: string, public name: string, public email: string) {}
}

class Movie {
  constructor(
    public id: string,
    public title: string,
  ) {}
}

class Seat {
  constructor(
    public id: string,
    public seatNumber: string,
    public status: SeatStatus = SeatStatus.AVAILABLE
  ) {}

  book() {
    if (this.status === SeatStatus.BOOKED) {
      throw new Error('Seat is already booked');
    }
    this.status = SeatStatus.BOOKED;
  }

  release() {
    this.status = SeatStatus.AVAILABLE;
  }
}

class Screen {
  constructor(public id: string, public name: string, public seats: Seat[]) {}
}

class Theater {
  constructor(public id: string, public name: string, public screens: Screen[]) {}
}

class Show {
  constructor(
    public id: string,
    public movie: Movie,
    public screen: Screen,
    public pricePerSeat: number
  ) {}

  getAvailableSeats(): Seat[] {
    return this.screen.seats.filter((seat) => seat.status === SeatStatus.AVAILABLE);
  }
}

class Booking {
  public status: BookingStatus = BookingStatus.PENDING;

  constructor(
    public id: string,
    public user: User,
    public show: Show,
    public seats: Seat[],
    public totalPrice: number
  ) {}

  confirm() {
    this.status = BookingStatus.CONFIRMED;
  }

  cancel() {
    this.status = BookingStatus.CANCELLED;
    this.seats.forEach((s) => s.release());
  }
}

class BookingSystem {
  private static instance: BookingSystem;
  private bookings: Booking[] = [];

  private constructor() {}

  public static getInstance() {
    if (!BookingSystem.instance) {
      BookingSystem.instance = new BookingSystem();
    }
    return BookingSystem.instance;
  }

  async bookSeats(user: User, show: Show, seatIds: string[]) {
    const selectedSeats = show.screen.seats.filter((seat) => seatIds.includes(seat.id));
    const lockToken = uuidv4();

    for (let seat of selectedSeats) {
      const lockKey = `seat_lock:${show.id}:${seat.id}`;
      const locked = await acquireLock(lockKey, lockToken);

      if (!locked) {
        // Unlock seats
        for (const s of selectedSeats) {
          await releaseLock(`seat_lock:${show.id}:${s.id}`);
        }

        throw new Error(`Seat ${seat.seatNumber} is currently being booked by someone else.`);
      }
    }

    try {
      if (selectedSeats.some((seat) => seat.status !== SeatStatus.AVAILABLE)) {
        throw new Error('One or more seats already booked.');
      }

      selectedSeats.forEach(seat => seat.book());

      const totalPrice = selectedSeats.length * show.pricePerSeat;
      const booking = new Booking(
        crypto.randomUUID(),
        user,
        show,
        selectedSeats,
        totalPrice
      );

      booking.confirm();
      this.bookings.push(booking);
      return booking;
    } finally {
      for (const seat of selectedSeats) {
        await releaseLock(`seat_lock:${seat.id}`);
      }
    }
  }

  getBookings(): Booking[] {
    return this.bookings;
  }
}

(async () => {
  const system = BookingSystem.getInstance();

  // Create test data
  const user1 = new User('u1', 'Chenna', 'chenna@example.com');
  const user2 = new User('u2', 'ZestyZilla', 'zilla@example.com');

  const movie = new Movie('m1', 'Fast & Curious: Lock Drift');

  const seats = [
    new Seat('s1', 'A1'),
    new Seat('s2', 'A2'),
    new Seat('s3', 'A3'),
  ];

  const screen = new Screen('screen1', 'IMAX', seats);
  const theater = new Theater('t1', 'Lockbuster Cinemas', [screen]);

  const show = new Show('show1', movie, screen, 300);

  try {
    console.log('User1 trying to book A1, A2...');
    const booking1 = await system.bookSeats(user1, show, ['s1', 's2']);
    console.log('User1 Booking Confirmed:', booking1);

    console.log('\nUser2 trying to book A2, A3...');
    const booking2 = await system.bookSeats(user2, show, ['s2', 's3']);
    console.log('User2 Booking Confirmed:', booking2);
  } catch (err) {
    console.error('Booking Failed:', (err as Error).message);
  }

  console.log('\nFinal Bookings:');
  for (const booking of system.getBookings()) {
    console.log({
      bookingId: booking.id,
      user: booking.user.name,
      seats: booking.seats.map((s) => s.seatNumber),
      status: BookingStatus[booking.status],
      price: booking.totalPrice,
    });
  }

  console.log('\nSeat Status:');
  for (const seat of show.screen.seats) {
    console.log(`Seat ${seat.seatNumber}: ${SeatStatus[seat.status]}`);
  }
})();
