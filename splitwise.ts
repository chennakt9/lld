export {}
class User {
  constructor(
    public id: string,
    public name: string,
    public email: string
  ) {}

  equals(o: User): boolean {
    return this.id === o.id;
  }
}

class Transaction {
  constructor(
    public from: User,
    public to: User,
    public amount: number
  ) {}
}

class Expense {
  constructor(
    public id: string,
    public description: string,
    public amount: number,
    public payer: User,
    public shares: Map<User, number>
  ) {}
}

interface Split {
  calculateSplit(amount: number, participants: User[], splitDetails: Map<string, any>): Map<User, number>;
}

class EqualSplit implements Split {
  calculateSplit(amount: number, participants: User[], splitDetails: Map<string, any>): Map<User, number> {
    const amountPerPerson = amount / participants.length;
    const splits = new Map<User, number>();

    for (let participant of participants) {
      splits.set(participant, amountPerPerson);
    }

    return splits;
  }
}

class SplitFactory {
  static createSplit(splitType: string): Split {
    switch (splitType) {
      case "EQUAL":
        return new EqualSplit();
      default:
        throw new Error(`Unknown split type: ${splitType}`);
    }
  }
}

interface ExpenseSubscriber {
  onExpenseAdded(expense: Expense): void;
}

interface ExpensePublisher {
  addSubscriber(observer: ExpenseSubscriber): void;
  removeSubscriber(observer: ExpenseSubscriber): void;
  notifyExpenseAdded(expense: Expense): void;
}

class ExpenseManager implements ExpensePublisher {
  private observers: ExpenseSubscriber[] = [];

  addSubscriber(observer: ExpenseSubscriber): void {
    this.observers.push(observer);
  }

  removeSubscriber(observer: ExpenseSubscriber): void {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  notifyExpenseAdded(expense: Expense): void {
    this.observers.forEach((obs) => obs.onExpenseAdded(expense));
  }
}

interface SettlementStrategy {
  computeMinimumTransactions(netBalances: number[]): number;
}

interface SettlementDetailStrategy {
  computeDetailedTransactions(net: Map<User, number>): Transaction[];
}

class SimplifiedSettlementStrategy implements SettlementDetailStrategy {
  computeDetailedTransactions(net: Map<User, number>): Transaction[] {
    const debtors: [User, number][] = [];
    const creditors: [User, number][] = [];

    for (let [user, amount] of net) {
      if (amount < -0.001) {
        debtors.push([user, amount]);
      } else if (amount > 0.001) {
        creditors.push([user, amount]);
      }
    }

    const transactions: Transaction[] = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const [debtor, dbal] = debtors[i];
      const [creditor, cbal] = creditors[j];

      const amt = Math.min(Math.abs(dbal), cbal);
      transactions.push(new Transaction(debtor, creditor, amt));

      debtors[i][1] += amt;
      creditors[j][1] -= amt;

      if (Math.abs(debtors[i][1]) < 0.001) i++;
      if (Math.abs(creditors[j][1]) < 0.001) j++;
    }

    return transactions;
  }
}

class SubOptimalSettlementStrategy implements SettlementStrategy {
  computeMinimumTransactions(netBalances: number[]): number {
    return this.dfs(0, netBalances);
  }

  private dfs(index: number, creditList: number[]): number {
    if (Math.abs(creditList[index]) < 0.001) {
      return this.dfs(index + 1, creditList);
    }

    if (index === creditList.length) return 0;

    let min = Number.MAX_SAFE_INTEGER;

    for (let i = index + 1; i < creditList.length; i++) {
      if (creditList[index] * creditList[i] < 0) {
        creditList[i] += creditList[index];
        min = Math.min(min, 1 + this.dfs(index + 1, creditList));
        creditList[i] -= creditList[index]; // backtrack
      }
    }

    return min;
  }
}

class BalanceSheet implements ExpenseSubscriber {
  private allExpenses: Expense[] = [];

  onExpenseAdded(expense: Expense): void {
    this.allExpenses.push(expense);
  }

  public calculateMinTransactions(strategy: SettlementStrategy): number {
    const net = this.getNetBalances();
    return strategy.computeMinimumTransactions([...net.values()]);
  }

  public getNetBalances(): Map<User, number> {
    const net = new Map<User, number>();

    for (let expense of this.allExpenses) {
      const payer = expense.payer;
      const shares = expense.shares;

      for (let [participant, amount] of shares) {
        if (!net.has(participant)) net.set(participant, 0);
        if (!net.has(payer)) net.set(payer, 0);

        if (!participant.equals(payer)) {
          net.set(participant, net.get(participant)! - amount);
          net.set(payer, net.get(payer)! + amount);
        }
      }
    }

    return net;
  }
}

// ------------------ DRIVER CODE ------------------

// Create Users
const alice = new User("1", "Alice", "alice@example.com");
const bob = new User("2", "Bob", "bob@example.com");
const charlie = new User("3", "Charlie", "charlie@example.com");
const dave = new User("4", "Dave", "dave@example.com");
const emma = new User("5", "Emma", "emma@example.com");

const allUsers = [alice, bob, charlie, dave, emma];

// Create Split Strategy
const splitStrategy = SplitFactory.createSplit("EQUAL");
const splitDetails = new Map<string, any>();

// Expense 1: Alice paid ₹500 for dinner (for all 5 people)
const shares1 = splitStrategy.calculateSplit(500, allUsers, splitDetails);
const expense1 = new Expense("exp1", "Dinner", 500, alice, shares1);

// Expense 2: Charlie paid ₹300 for movie (only for Alice, Bob, and Charlie)
const movieGroup = [alice, bob, charlie];
const shares2 = splitStrategy.calculateSplit(300, movieGroup, splitDetails);
const expense2 = new Expense("exp2", "Movie", 300, charlie, shares2);

// Set up Expense Manager and Balance Sheet
const manager = new ExpenseManager();
const sheet = new BalanceSheet();
manager.addSubscriber(sheet);

// Add Expenses
manager.notifyExpenseAdded(expense1);
manager.notifyExpenseAdded(expense2);

// Minimum transaction count using DFS strategy
const minTxnCount = sheet.calculateMinTransactions(new SubOptimalSettlementStrategy());
console.log(`Minimum number of transactions: ${minTxnCount}`);

// Compute and print detailed transactions using simplified strategy
const simplifiedStrategy = new SimplifiedSettlementStrategy();
const netBalances = sheet.getNetBalances();
const txns = simplifiedStrategy.computeDetailedTransactions(netBalances);

console.log("Transactions:");
for (let txn of txns) {
  console.log(`${txn.from.name} pays ${txn.to.name}: ₹${txn.amount.toFixed(2)}`);
}

/*
  Design patterns used:
  1. Factory pattern
  2. Observer pattern
*/