enum CashType {
  BILL_100 = 100,
  BILL_50 = 50,
  BILL_20 = 20,
  BILL_10 = 10,
  BILL_5 = 5,
  BILL_1 = 1,
}

enum TransactionType {
  WITHDRAW_CASH,
  CHECK_BALANCE,
}

class Card {
  constructor(
    public cardNumber: string,
    public pin: number,
    public balance: number
  ) {}

  validatePin(enteredPin: number): boolean {
    return this.pin === enteredPin;
  }

  withdraw(amount: number): boolean {
    if (amount <= this.balance) {
      this.balance -= amount;
      return true;
    }
    return false;
  }
}

class ATMInventory {
  public cashInventory = new Map<CashType, number>();

  constructor() {
    this.initializeInventory();
  }

  private initializeInventory(): void {
    this.cashInventory.set(CashType.BILL_100, 10);
    this.cashInventory.set(CashType.BILL_50, 10);
    this.cashInventory.set(CashType.BILL_20, 20);
    this.cashInventory.set(CashType.BILL_10, 30);
    this.cashInventory.set(CashType.BILL_5, 20);
    this.cashInventory.set(CashType.BILL_1, 50);
  }

  getTotalCash(): number {
    let total = 0;
    for (let [cashType, count] of this.cashInventory) {
      total += count * cashType;
    }
    return total;
  }

  hasSufficientCash(amount: number): boolean {
    return this.getTotalCash() >= amount;
  }

  dispenseCash(amount: number): Map<CashType, number> | null {
    if (!this.hasSufficientCash(amount)) return null;

    const dispensed = new Map<CashType, number>();
    const cashTypes = [...this.cashInventory.keys()].sort((a, b) => b - a);
    let remaining = amount;

    for (let type of cashTypes) {
      const available = this.cashInventory.get(type) ?? 0;
      const needed = Math.min(Math.floor(remaining / type), available);

      if (needed > 0) {
        dispensed.set(type, needed);
        remaining -= needed * type;
        this.cashInventory.set(type, available - needed);
      }
    }

    if (remaining > 0) {
      // Rollback
      for (let [type, count] of dispensed) {
        this.cashInventory.set(type, (this.cashInventory.get(type) ?? 0) + count);
      }
      return null;
    }

    return dispensed;
  }
}

interface ATMState {
  getStateName(): string;
  next(context: ATMMachineContext): ATMState;
}

class IdleState implements ATMState {
  constructor() {
    console.log('ATM is in Idle State - Insert card');
  }

  getStateName(): string {
    return 'IdleState';
  }

  next(context: ATMMachineContext): ATMState {
    return context.currentCard
      ? context.stateFactory.create('HasCardState')
      : this;
  }
}

class HasCardState implements ATMState {
  constructor() {
    console.log('Card detected - Enter PIN');
  }

  getStateName(): string {
    return 'HasCardState';
  }

  next(context: ATMMachineContext): ATMState {
    return context.currentCard
      ? context.stateFactory.create('SelectOperationState')
      : context.stateFactory.create('IdleState');
  }
}

class SelectOperationState implements ATMState {
  constructor() {
    console.log('Select operation:\n1. Withdraw\n2. Check Balance');
  }

  getStateName(): string {
    return 'SelectOperationState';
  }

  next(context: ATMMachineContext): ATMState {
    return context.selectedOperation !== null
      ? context.stateFactory.create('TransactionState')
      : this;
  }
}

class TransactionState implements ATMState {
  getStateName(): string {
    return 'TransactionState';
  }

  next(context: ATMMachineContext): ATMState {
    return context.stateFactory.create('SelectOperationState');
  }
}

class ATMStateFactory {
  private static instance: ATMStateFactory;
  private stateMap: Map<string, () => ATMState>;

  private constructor() {
    this.stateMap = new Map([
      ['IdleState', () => new IdleState()],
      ['HasCardState', () => new HasCardState()],
      ['SelectOperationState', () => new SelectOperationState()],
      ['TransactionState', () => new TransactionState()],
    ]);
  }

  static getInstance(): ATMStateFactory {
    if (!this.instance) {
      this.instance = new ATMStateFactory();
    }
    return this.instance;
  }

  create(stateName: string): ATMState {
    const stateCreator = this.stateMap.get(stateName);
    if (!stateCreator) throw new Error(`Unknown state: ${stateName}`);
    return stateCreator();
  }
}

class ATMMachineContext {
  public stateFactory = ATMStateFactory.getInstance();
  public currentState: ATMState = this.stateFactory.create('IdleState');
  public atmInventory = new ATMInventory();
  public currentCard: Card | null = null;
  public selectedOperation: TransactionType | null = null;

  constructor() {
    console.log('ATM initialized in: ' + this.currentState.getStateName());
  }

  advanceState() {
    this.currentState = this.currentState.next(this);
    console.log('Current state: ' + this.currentState.getStateName());
  }

  insertCard(card: Card) {
    if (this.currentState.getStateName() === 'IdleState') {
      this.currentCard = card;
      console.log('Card inserted.');
      this.advanceState();
    }
  }

  enterPin(pin: number) {
    if (this.currentState.getStateName() === 'HasCardState') {
      if (this.currentCard?.validatePin(pin)) {
        console.log('PIN is correct!');
        this.advanceState();
      } else {
        console.log('Wrong PIN!');
      }
    }
  }

  selectOperation(op: TransactionType) {
    if (this.currentState.getStateName() === 'SelectOperationState') {
      this.selectedOperation = op;
      console.log('Selected: ' + TransactionType[op]);
      this.advanceState();
    }
  }

  performTransaction(amount: number) {
    if (this.currentState.getStateName() !== 'TransactionState') return;

    try {
      if (!this.currentCard) throw new Error('No card found');

      switch (this.selectedOperation) {
        case TransactionType.WITHDRAW_CASH:
          if (!this.currentCard.withdraw(amount)) throw new Error('Insufficient card balance');
          const dispensed = this.atmInventory.dispenseCash(amount);
          if (!dispensed) throw new Error('ATM cannot dispense exact amount');

          console.log(`Dispensed ₹${amount}:`);
          dispensed.forEach((c, t) => console.log(`${c} x ₹${t}`));
          break;

        case TransactionType.CHECK_BALANCE:
          console.log(`Your balance is ₹${this.currentCard.balance}`);
          break;

        default:
          console.log('Invalid operation selected.');
      }

      this.currentState = this.stateFactory.create('SelectOperationState');
      this.selectedOperation = null;
    } catch (e: any) {
      console.log('Transaction failed:', e.message);
      this.currentState = this.stateFactory.create('SelectOperationState');
    }
  }

  returnCard() {
    if (this.currentCard) {
      console.log('Card returned');
      this.currentCard = null;
      this.selectedOperation = null;
      this.currentState = this.stateFactory.create('IdleState');
    }
  }
}

// ---------- Driver Code ----------
const atm = new ATMMachineContext();

const card = new Card('9999-1111-2222', 1234, 300);

atm.insertCard(card);
atm.enterPin(1234);

atm.selectOperation(TransactionType.CHECK_BALANCE);
atm.performTransaction(0);

atm.selectOperation(TransactionType.WITHDRAW_CASH);
atm.performTransaction(120);

atm.selectOperation(TransactionType.CHECK_BALANCE);
atm.performTransaction(0);

atm.returnCard();
