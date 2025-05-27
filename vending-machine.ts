export {}

enum Coin {
  ONE = 1,
  TWO = 2,
  FIVE = 5,
  TEN = 10
}

class Item {
  constructor(
    public readonly code: string,
    public name: string,
    public price: number,
    public quantity: number = 0
  ) {}
}

class Inventory {
  private stock: Map<string, Item> = new Map();

  addItem(item: Item) {
    const existingItem = this.stock.get(item.code);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.stock.set(item.code, item);
    }
  }

  reduceItem(code: string): boolean {
    const item = this.stock.get(code);

    if (item && item.quantity > 0) {
      item.quantity--;
      return true;
    }

    return false;
  }

  getItem(code: string): Item | null {
    const item = this.stock.get(code);
    return item && item.quantity > 0 ? item : null;
  }

  listItems(): Item[] {
    return Array.from(this.stock.values());
  }
}

class CashRegister {
  private coins: Map<Coin, number> = new Map();

  insertCoin(coin: Coin) {
    const existing = this.coins.get(coin) ?? 0;
    this.coins.set(coin, existing + 1);
  }

  getTotal() {
    let total = 0;
    for (let [coin, count] of this.coins) {
      total += coin * count
    }

    return total;
  }

  dispenseChange(amount: number): Coin[] {
    const change: Coin[] = [];
    const denominations = Array.from(this.coins.keys())
      .sort((a, b) => b - a);
    
    // console.log('denominations: ', denominations, this.coins);
    for (let coin of denominations) {
      while (amount >= coin && (this.coins.get(coin) ?? 0) > 0) {
        amount -= coin;
        this.coins.set(coin, (this.coins.get(coin) ?? 0) - 1);
        change.push(coin);
      }
    }

    if (amount > 0) throw new Error('Insufficient change');

    return change;
  }
}

class VendingMachineContext {
  public selectedItemCode: string | null = null;

  constructor(
    public readonly inventory: Inventory,
    public readonly cashRegister: CashRegister
  ) {}
}

interface VendingMachineState {
  getStateName(): string;
  next(context: VendingMachineContext): VendingMachineState;
}

class IdleState implements VendingMachineState {
  getStateName(): string {
    return 'Idle';
  }

  next(context: VendingMachineContext): VendingMachineState {
    const total = context.cashRegister.getTotal();
    return total > 0 ? new HasMoneyState() : this;
  }
}

class HasMoneyState implements VendingMachineState {
  getStateName(): string {
    return 'HasMoney';
  }

  next(context: VendingMachineContext): VendingMachineState {
    if (!context.selectedItemCode) {
      console.log('Please select an item.');
      return this;
    }

    const item = context.inventory.getItem(context.selectedItemCode);
    if (!item) {
      console.log('Item not available or out of stock.');
      return this;
    }

    const total = context.cashRegister.getTotal();
    if (total < item.price) {
      console.log(`Not enough balance. ${item.name} costs ₹${item.price}`);
      return this;
    }

    if (!context.inventory.reduceItem(context.selectedItemCode)) {
      console.log("Couldn't dispense. Out of stock.");
      return this;
    }

    return new DispensingState(item);
  }
}

class DispensingState implements VendingMachineState {
  constructor(private item: Item) {}

  getStateName(): string {
    return 'Dispensing';
  }

  next(context: VendingMachineContext): VendingMachineState {
    const total = context.cashRegister.getTotal();
    const changeAmount = total - this.item.price;

    console.log(`Dispensing: ${this.item.name}`);

    try {
      if (changeAmount > 0) {
        // console.log('changeAmount: ', changeAmount);
        const change = context.cashRegister.dispenseChange(changeAmount);
        console.log(`Returning change: ₹${change.join(', ₹')}`);
      }
    } catch (err) {
      console.log('Error dispensing change:', (err as Error).message);
    }

    return new IdleState();
  }
}

class VendingMachine {
  private state: VendingMachineState;
  private context: VendingMachineContext;

  constructor() {
    const inventory = new Inventory();
    const cashRegister = new CashRegister();
    this.context = new VendingMachineContext(inventory, cashRegister);
    this.state = new IdleState();
  }

  insertCoin(coin: Coin): void {
    this.context.cashRegister.insertCoin(coin);
  }



  selectItem(code: string): void {
    this.context.selectedItemCode = code;
  }

  transition(): void {
    const nextState = this.state.next(this.context);

    if (this.state !== nextState) {
      console.log(`State changed: ${this.state.getStateName()} → ${nextState.getStateName()}`);
      this.state = nextState;
    }

    if (this.state instanceof DispensingState) {
      this.transition();
    }
  }

  refillItem(item: Item): void {
    this.context.inventory.addItem(item);
  }

  displayItems() {
    console.log('Available Items:');
    for (let item of this.context.inventory.listItems()) {
      console.log(`${item.code}: ${item.name} - ₹${item.price} (${item.quantity} left)`);
    }
  }
}

// === Driver code ===
const vm = new VendingMachine();
vm.refillItem(new Item('A1', 'Coke', 15, 3));
vm.refillItem(new Item('B1', 'Chips', 10, 5));
vm.refillItem(new Item('C1', 'Samosa', 12, 2));

vm.displayItems();

vm.insertCoin(Coin.TEN);
vm.insertCoin(Coin.TEN);
vm.insertCoin(Coin.FIVE);

vm.transition();

vm.selectItem('A1');

vm.transition();
