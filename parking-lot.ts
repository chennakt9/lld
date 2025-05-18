export {}

// Strategy start (optional)
interface ParkingStrategy {
  findSpot(vehicle: Vehicle, spots: ParkingSpot[]): ParkingSpot | undefined;
}

class FirstAvailableStrategy implements ParkingStrategy {
  findSpot(vehicle: Vehicle, spots: ParkingSpot[]) {
    return spots.find(spot => spot.isEmpty() && spot.canFit(vehicle));
  }
}

class NearestBikeStrategy implements ParkingStrategy {
  findSpot(vehicle: Vehicle, spots: ParkingSpot[]) {
    if (vehicle.vehicleType !== VehicleType.BIKE) return undefined;
    return spots.find(s => s.isEmpty() && s.canFit(vehicle));
  }
}

class FarthestCarStrategy implements ParkingStrategy {
  findSpot(vehicle: Vehicle, spots: ParkingSpot[]) {
    if (vehicle.vehicleType !== VehicleType.CAR) return undefined;
    return [...spots].reverse().find(s => s.isEmpty() && s.canFit(vehicle));
  }
}

// Strategy stop (optional)

enum VehicleType {
  CAR,
  BIKE,
}

class Vehicle {
  licensePlate: string;
  vehicleType: VehicleType;

  constructor(licensePlate: string, vehicleType: VehicleType) {
    this.licensePlate = licensePlate;
    this.vehicleType = vehicleType;
  }
}

class ParkingSpot {
  private _spotNumber: string;
  private forVehicleType: VehicleType;
  private _parkedVehicle: Vehicle | null = null;

  constructor(spotNumber: string, forVehicleType: VehicleType) {
    this.forVehicleType = forVehicleType;
    this._spotNumber = spotNumber;
  }

  get parkedVehicle() {
    return this._parkedVehicle;
  }

  get spotNumber() {
    return this._spotNumber;
  }

  assignVehicle(vehicle: Vehicle) {
    this._parkedVehicle = vehicle;
  }

  removeVehicle() {
    this._parkedVehicle = null;
  }

  isEmpty() {
    return this.parkedVehicle === null;
  }

  canFit(vehicle: Vehicle) {
    return vehicle.vehicleType === this.forVehicleType;
  }
}

class ParkingLot {
  private spots: ParkingSpot[] = [];
  private strategy: ParkingStrategy;

  constructor(capacity: number, strategy: ParkingStrategy) {
    this.strategy = strategy;

    const carSpots = Math.floor(capacity / 2);

    for (let i = 0; i < carSpots; i++) {
      this.spots.push(new ParkingSpot(`P${i + 1}`, VehicleType.CAR));
    }

    for (let i = carSpots; i < capacity; i++) {
      this.spots.push(new ParkingSpot(`P${i + 1}`, VehicleType.BIKE));
    }
  }

  parkVehicle(vehicle: Vehicle) {
    const spot = this.strategy.findSpot(vehicle, this.spots);

    if (!spot) {
      console.log('Parking lot full!');
      return false;
    }

    console.log(`${vehicle.licensePlate} parked at ${spot.spotNumber}`);
    spot.assignVehicle(vehicle);

    return true;
  }

  removeVehicle(licensePlate: string) {
    const spot = this.spots.find((s) => s.parkedVehicle?.licensePlate === licensePlate);

    if (!spot) {
      console.log(`${licensePlate} not found..`);
      return false;
    }

    spot.removeVehicle();
    console.log(`Removed vehicle ${licensePlate} from ${spot.spotNumber}`);
    return true;
  }
}

// Driver
const strategy = new FirstAvailableStrategy(); //instead of hardcoding like this, use GetStrategyFactory()...
const lot = new ParkingLot(5, strategy);
const car1 = new Vehicle("ABC-123", VehicleType.CAR);
const bike1 = new Vehicle("DEF-456", VehicleType.BIKE);

lot.parkVehicle(car1);
lot.parkVehicle(bike1);
lot.parkVehicle(new Vehicle("GHI-789", VehicleType.CAR));
lot.parkVehicle(new Vehicle("JKL-012", VehicleType.BIKE));
lot.parkVehicle(new Vehicle("MNO-345", VehicleType.CAR));

lot.removeVehicle("ABC-123");
lot.parkVehicle(new Vehicle("PQR-678", VehicleType.BIKE));
