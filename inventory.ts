export {}

enum ProductCategory {
  ELECTRONICS = "Electronics",
  CLOTHING = "Clothing",
  GROCERY = "Grocery"
}

class Product {
  constructor(
    public sku: string,
    public name: string,
    public price: number,
    public quantity: number,
    public threshold: number,
    public category: ProductCategory
  ) {}
}

class ElectronicsProduct extends Product {
  constructor(
    public sku: string,
    public name: string,
    public price: number,
    public quantity: number,
    public threshold: number,
    public brand: string,
    public warrantyPeriod: number
  ) {
        super(sku, name, price, quantity, threshold, ProductCategory.ELECTRONICS);
    }
}

class GroceryProduct extends Product {
  constructor(
    public sku: string,
    public name: string,
    public price: number,
    public quantity: number,
    public threshold: number,
    public expiryDate: string,
    public refrigerated: boolean
  ) {
        super(sku, name, price, quantity, threshold, ProductCategory.ELECTRONICS);
    }
}

class ClothingProduct extends Product {
  constructor(
    public sku: string,
    public name: string,
    public price: number,
    public quantity: number,
    public threshold: number,
    public size: string,
    public color: string,
    public material: string,
  ) {
        super(sku, name, price, quantity, threshold, ProductCategory.ELECTRONICS);
    }
}

class ProductFactory {
  public createProduct(
    sku: string,
    name: string,
    price: number,
    quantity: number,
    threshold: number,
    category: ProductCategory
  ) {
    switch (category) {
      case ProductCategory.ELECTRONICS:
        return new ElectronicsProduct(sku, name, price, quantity, threshold, 'noise', 1);
      case ProductCategory.CLOTHING:
        return new ClothingProduct(sku, name, price, quantity, threshold, 'M', 'blue', 'nylon');
      case ProductCategory.GROCERY:
        return new GroceryProduct(sku, name, price, quantity, threshold, '2025/09', false);
    }
  }
}

interface ReplenishmentStrategy {
    replenish(product: Product): void;
}

class BulkOrderStrategy implements ReplenishmentStrategy {
  replenish(product: Product): void {
    console.log(`Applying Bulk Order replenishment for ${product.name}`);
    const amountToOrder = Math.max(product.threshold * 2, 100);
    product.quantity = product.quantity + amountToOrder;
  }
}

class Warehouse {
  public products: Map<string, Product>; // SKU -> Product
  constructor(
    public id: number,
    public name: string,
  ) {
    this.products = new Map<string, Product>();
  }

  public addProduct(product: Product, quantity: number) {
    const sku = product.sku;

    if (this.products.has(sku)) {
      const existingProduct = this.products.get(sku)!;
      existingProduct.quantity = (existingProduct?.quantity ?? 0) + quantity;
      console.log(`${quantity} units of ${product.name} (SKU: ${sku}) added to ${this.name}. New quantity: ${existingProduct.quantity}`);
    } else {
      product.quantity = quantity;
      this.products.set(sku, product);
      console.log(`${quantity} units of new product ${product.name} (SKU: ${sku}) added to ${this.name}.`);
    }
  }

  public removeProduct(product: Product, quantity: number) {
    const sku = product.sku;

    if (this.products.has(sku)) {
      const existingProduct = this.products.get(sku)!;
      if (existingProduct.quantity > quantity) {
        existingProduct.quantity = existingProduct.quantity - quantity;
        console.log(`${quantity} units of ${product.name} (SKU: ${sku}) removed to ${this.name}. New quantity: ${product.name}`);
      }
    }
  }

  public getAvailableQuantity(sku: string): number {
    if (this.products.has(sku)) {
        return this.products.get(sku)!.quantity;
    }
    return 0;
  }

  public getProductBySku(sku: string): Product | undefined {
        return this.products.get(sku);
    }
}

class InventoryManager {
    // Singleton instance
    private static instance: InventoryManager | null = null;

    // System components
    private warehouses: Warehouse[];
    private productFactory: ProductFactory; // ProductFactory is instantiated within the manager
    private replenishmentStrategy: ReplenishmentStrategy;

    // Private constructor to prevent instantiation from outside
    private constructor(initialStrategy: ReplenishmentStrategy) {
        // Initialize collections and dependencies
        this.warehouses = [];
        this.productFactory = new ProductFactory(); // Instantiated here
        this.replenishmentStrategy = initialStrategy;
    }

    // Static method to get the singleton instance with thread safety (JS is single-threaded for execution blocks)
    public static getInstance(strategy: ReplenishmentStrategy): InventoryManager {
        if (this.instance === null) {
            this.instance = new InventoryManager(strategy);
        } else {
            // Optionally, if a strategy is passed to an existing instance, update it
            this.instance.setReplenishmentStrategy(strategy);
        }
        return this.instance;
    }

    // Strategy pattern method
    public setReplenishmentStrategy(replenishmentStrategy: ReplenishmentStrategy): void {
        this.replenishmentStrategy = replenishmentStrategy;
        console.log(`Replenishment strategy set to: ${replenishmentStrategy.constructor.name}`);
    }

    // Warehouse management
    public addWarehouse(warehouse: Warehouse): void {
        this.warehouses.push(warehouse);
        console.log(`Warehouse '${warehouse.name}' added.`);
    }

    public removeWarehouse(warehouseToRemove: Warehouse): void {
        this.warehouses = this.warehouses.filter(warehouse => warehouse !== warehouseToRemove);
        console.log(`Warehouse '${warehouseToRemove.name}' removed.`);
    }

    // Product inventory operations
    public getProductBySku(sku: string): Product | null {
        for (const warehouse of this.warehouses) {
            const product = warehouse.getProductBySku(sku);
            if (product) {
                return product;
            }
        }
        console.log(`Product with SKU ${sku} not found in any warehouse.`);
        return null;
    }

    public checkAndReplenish(sku: string): void {
        const product = this.getProductBySku(sku);
        if (product) {
            console.log(`Checking stock for ${product.name} (SKU: ${sku}). Current quantity: ${product.quantity}, Threshold: ${product.quantity}`);
            // If product is below threshold
            if (product.quantity < product.threshold) {
                console.log(`${product.name} is below threshold. Initiating replenishment.`);
                // Apply current replenishment strategy
                if (this.replenishmentStrategy) {
                    this.replenishmentStrategy.replenish(product);
                } else {
                    console.log("No replenishment strategy set.");
                }
            } else {
                console.log(`${product.name} is at or above threshold. No replenishment needed at this time.`);
            }
        }
    }

     // Method to get the ProductFactory instance if needed externally
    public getProductFactory(): ProductFactory {
        return this.productFactory;
    }
}

// Sample Driver Code
const strategy = new BulkOrderStrategy();
const inventoryManager = InventoryManager.getInstance(strategy);

// Create a warehouse
const mainWarehouse = new Warehouse(1, 'Main Warehouse');
inventoryManager.addWarehouse(mainWarehouse);

// Get the product factory
const factory = inventoryManager.getProductFactory();

// Create products
const phone = factory.createProduct('ELEC123', 'Smartphone', 699.99, 5, 10, ProductCategory.ELECTRONICS);
const jeans = factory.createProduct('CLOTH456', 'Jeans', 49.99, 15, 10, ProductCategory.CLOTHING);
const milk = factory.createProduct('GROC789', 'Milk', 2.99, 2, 5, ProductCategory.GROCERY);

// Add products to warehouse
mainWarehouse.addProduct(phone!, phone!.quantity);
mainWarehouse.addProduct(jeans!, jeans!.quantity);
mainWarehouse.addProduct(milk!, milk!.quantity);

// Simulate product usage
mainWarehouse.removeProduct(phone!, 3);
mainWarehouse.removeProduct(milk!, 1);

// Check and replenish if below threshold
inventoryManager.checkAndReplenish('ELEC123');
inventoryManager.checkAndReplenish('GROC789');
inventoryManager.checkAndReplenish('CLOTH456');

// Final state
console.log("\nFinal Inventory Snapshot:");
console.log(`Smartphone quantity: ${mainWarehouse.getAvailableQuantity('ELEC123')}`);
console.log(`Jeans quantity: ${mainWarehouse.getAvailableQuantity('CLOTH456')}`);
console.log(`Milk quantity: ${mainWarehouse.getAvailableQuantity('GROC789')}`);
