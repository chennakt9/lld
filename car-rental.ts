export {};

enum ReservationStatus {
    PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
};

enum VehicleStatus {
  AVAILABLE = "AVAILABLE",
  RESERVED = "RESERVED",
  RENTED = "RENTED",
}

enum VehicleType {
  ECONOMY = "ECONOMY",
  SUV = "SUV",
  LUXURY = "LUXURY",
}

// Factory Design pattern - Vehicle interface and EconomyVehicle, SUVVehicle, LuxuryVehicle as concrete classes and VehicleFactory
class Vehicle {
  constructor(
    public registrationNumber: string,
    public type: VehicleType,
    public status: VehicleStatus,
    public baseRentalPrice: number
  ) {}

  public calculateRentalFee(days: number) {
    let rateMultiplier = 1.0;
    let premiumFee = 0;

    switch (this.type) {
      case VehicleType.ECONOMY:
        rateMultiplier = 1.0;
        break;
      case VehicleType.SUV:
        rateMultiplier = 1.5;
        break;
      case VehicleType.LUXURY:
        rateMultiplier = 2.5;
        premiumFee = 50.0;
        break;
      default:
        console.warn('Unknown vehicle type');
    }

    return this.baseRentalPrice * days * rateMultiplier + premiumFee;
  }
}

class RentalStore {
  constructor(
    public address: string,
    public vehicles: Map<string, Vehicle>
  ) {}

  public getAvailableVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values()).filter((v) => v.status === VehicleStatus.AVAILABLE);
  }

  public addVehicle(vehicle: Vehicle): void {
    this.vehicles.set(vehicle.registrationNumber, vehicle);
  }
}

class Reservation {
  constructor(
    public id: number,
    public user: User,
    public status: ReservationStatus,
    public vehicle: Vehicle,
    public store: RentalStore,
    public startDate: Date,
    public endDate: Date
  ) {}

  public confirmReservation(): void {
    if (this.status === ReservationStatus.PENDING) {
      this.status = ReservationStatus.CONFIRMED;
      this.vehicle.status = VehicleStatus.RESERVED;
    }
  }

  public startRental(): void {
    if (this.status === ReservationStatus.CONFIRMED) {
      this.status = ReservationStatus.IN_PROGRESS;
      this.vehicle.status = VehicleStatus.RENTED;
    }
  }

  public completeRental(): void {
    if (this.status === ReservationStatus.IN_PROGRESS) {
      this.status = ReservationStatus.COMPLETED;
      this.vehicle.status = VehicleStatus.AVAILABLE;
    }
  }

  public cancelReservation(): void {
    if (
      this.status === ReservationStatus.PENDING ||
      this.status === ReservationStatus.CONFIRMED
    ) {
      this.status = ReservationStatus.CANCELED;
      this.vehicle.status = VehicleStatus.AVAILABLE;
    }
  }
}

class User {
  constructor(
    public name: string,
    public reservations: Reservation[]
  ) {}

  public addReservation(reservation: Reservation): void {
    this.reservations.push(reservation);
  }
}

class ReservationManager {
  constructor(
    private reservations: Map<number, Reservation>,
    private nextReservationId: number
  ) {
    this.nextReservationId = 1;
  }

  public createReservation(
    vehicle: Vehicle,
    user: User,
    store: RentalStore,
    startDate: Date,
    endDate: Date
  ) {
    const reservation = new Reservation(
      this.nextReservationId++,
      user,
      ReservationStatus.PENDING,
      vehicle,
      store,
      startDate,
      endDate
    );

    this.reservations.set(reservation.id, reservation);
    user.addReservation(reservation);
    return reservation;
  }

    public confirmReservation(reservationId: number): void {
    const reservation = this.reservations.get(reservationId);
    if (reservation) {
      reservation.confirmReservation();
    }
  }

  public startRental(reservationId: number): void {
    const reservation = this.reservations.get(reservationId);
    if (reservation) {
      reservation.startRental();
    }
  }

  public completeRental(reservationId: number): void {
    const reservation = this.reservations.get(reservationId);
    if (reservation) {
      reservation.completeRental();
    }
  }

  public cancelReservation(reservationId: number): void {
    const reservation = this.reservations.get(reservationId);
    if (reservation) {
      reservation.cancelReservation();
    }
  }
}

/*
  TODO : We can add payment processor and use strategy pattern in there
*/

/* Sample Driver Code */

// Create a few vehicles
const vehicle1 = new Vehicle("ABC123", VehicleType.ECONOMY, VehicleStatus.AVAILABLE, 30);
const vehicle2 = new Vehicle("XYZ789", VehicleType.SUV, VehicleStatus.AVAILABLE, 50);
const vehicle3 = new Vehicle("LUX007", VehicleType.LUXURY, VehicleStatus.AVAILABLE, 100);

// Create a rental store and add vehicles
const rentalStore = new RentalStore("123 Main Street", new Map());
rentalStore.addVehicle(vehicle1);
rentalStore.addVehicle(vehicle2);
rentalStore.addVehicle(vehicle3);

// Create a user
const user = new User("Chenna", []);

// Create the reservation manager
const reservationManager = new ReservationManager(new Map(), 1);

// Make a reservation
const startDate = new Date("2025-06-01");
const endDate = new Date("2025-06-05");

const reservation = reservationManager.createReservation(
  vehicle2, // SUV
  user,
  rentalStore,
  startDate,
  endDate
);

console.log(`Reservation created with ID: ${reservation.id}`);
console.log(`Status: ${reservation.status}, Vehicle Status: ${vehicle2.status}`);

// Confirm the reservation
reservationManager.confirmReservation(reservation.id);
console.log(`After confirmation: Reservation Status: ${reservation.status}, Vehicle Status: ${vehicle2.status}`);

// Start the rental
reservationManager.startRental(reservation.id);
console.log(`After starting rental: Reservation Status: ${reservation.status}, Vehicle Status: ${vehicle2.status}`);

// Complete the rental
reservationManager.completeRental(reservation.id);
console.log(`After completing rental: Reservation Status: ${reservation.status}, Vehicle Status: ${vehicle2.status}`);

// Calculate rental fee
const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
const totalFee = vehicle2.calculateRentalFee(rentalDays);
console.log(`Total rental fee for ${rentalDays} days: $${totalFee.toFixed(2)}`);
