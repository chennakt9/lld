export {}

enum Direction {
  Up = "Up",
  Down = "Down",
  Idle = "Idle"
}

type ExternalRequest = {
  type: "external";
  fromFloor: number;
  direction: Direction;
};

type InternalRequest = {
  type: "internal";
  elevatorId: number;
  toFloor: number;
};

type Request = ExternalRequest | InternalRequest;

interface ElevatorSelectionStrategy {
  select(elevators: Elevator[], request: ExternalRequest): Elevator;
}

class NearestElevatorStrategy implements ElevatorSelectionStrategy {
  select(elevators: Elevator[], request: ExternalRequest): Elevator {
    let closest = elevators[0];
    let closestDistance = Math.abs(closest.currentFloor - request.fromFloor);

    for (let i = 1; i < elevators.length; i++) {
      const current = elevators[i];
      const currentDistance = Math.abs(current.currentFloor - request.fromFloor);

      if (currentDistance < closestDistance) {
        closest = current;
        closestDistance = currentDistance;
      }
    }

    return closest;
  }
}

class Elevator {
  targetFloors: Set<number> = new Set();
  direction: Direction = Direction.Idle;
  currentFloor: number = 0;
  constructor(public id: number, public maxFloor: number) {}

  addRequest(floor: number) {
    if (floor < 0 || floor > this.maxFloor) {
      console.log(`Invalid floor ${floor}`);
    }
    this.targetFloors.add(floor);
  }

  updateDirection() {
    if (this.targetFloors.size === 0) {
      this.direction = Direction.Idle;
      return;
    }

    const max = Math.max(...this.targetFloors);
    const min = Math.min(...this.targetFloors);

    if (this.currentFloor < min) {
      this.direction = Direction.Up;
    } else if (this.currentFloor > max) {
      this.direction = Direction.Down;
    } else if (this.direction = Direction.Up) {
      this.direction = Direction.Up;
    } else if (this.direction = Direction.Down) {
      this.direction = Direction.Down;
    } else {
      this.direction = Direction.Up;
    }

    return this.direction;
  }

  step() {
    this.updateDirection();

    if (this.direction === Direction.Up) {
      this.currentFloor++;
    } else if (this.direction === Direction.Down) {
      this.currentFloor--;
    }

    console.log(`Elevator ${this.id} moved to ${this.currentFloor}`);

    if (this.targetFloors.has(this.currentFloor)) {
      console.log(`Elevator ${this.id} stopping at floor ${this.currentFloor}`);
      this.targetFloors.delete(this.currentFloor);
    }

    this.updateDirection();
  }

  status() {
    return `Elevator ${this.id} | Floor: ${this.currentFloor} | Direction: ${this.direction}`;
  }
}

class ElevatorSystem {
  elevators: Elevator[] = [];
  constructor(public count: number, public maxFloor: number, public strategy: ElevatorSelectionStrategy) {
    for (let i = 0; i < count; i++) {
      this.elevators.push(new Elevator(i, maxFloor));
    }
  }

  handleRequest(request: Request) {
    if (request.type === 'external') {
      const elevator = this.strategy.select(this.elevators, request);
      console.log(`External request at floor ${request.fromFloor} assigned to Elevator ${elevator.id}`);
      elevator.addRequest(request.fromFloor);
    } else if (request.type === 'internal') {
      const elevator = this.elevators.find(e => e.id === request.elevatorId);
      if (!elevator) {
        console.log(`Elevator ${request.elevatorId} not found`);
        return;
      }

      console.log(`Internal request inside Elevator ${elevator.id} to floor ${request.toFloor}`);
      elevator.addRequest(request.toFloor);
    }
  }

  step() {
    this.elevators.forEach((e) => e.step());
  }

  status() {
    console.log('Elevator status: ');
    this.elevators.forEach((e) => console.log(e.status()));
  }
}

const strategy = new NearestElevatorStrategy();
const system = new ElevatorSystem(2, 10, strategy);

function simulateSteps(steps: number) {
  for (let i = 0; i < steps; i++) {
    console.log(`\n🔁 Step ${i + 1}`);
    system.step();
    system.status();
  }
}

system.handleRequest({ type: "external", fromFloor: 9, direction: Direction.Down });
system.handleRequest({ type: "internal", elevatorId: 0, toFloor: 8 });

simulateSteps(10);

system.handleRequest({ type: "external", fromFloor: 1, direction: Direction.Up });
system.handleRequest({ type: "internal", elevatorId: 1, toFloor: 2 });

simulateSteps(10);

