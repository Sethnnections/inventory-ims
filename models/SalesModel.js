const mongoose = require("mongoose");

const SaleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const SaleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    unique: true
  },
  customer: {
    name: String,
    phone: String,
    email: String
  },
  items: [SaleItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card", "mobile", "bank"],
    default: "cash"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded", "cancelled"],
    default: "paid"
  },
  status: {
    type: String,
    enum: ["completed", "pending", "cancelled"],
    default: "completed"
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  notes: String
}, {
  timestamps: true
});

// Generate sale number before saving - FIXED VERSION
SaleSchema.pre("save", async function (next) {
  if (!this.saleNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Find the latest sale for today
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const latestSale = await this.constructor.findOne({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ createdAt: -1 });
      
      let sequence = 1;
      if (latestSale && latestSale.saleNumber) {
        const match = latestSale.saleNumber.match(/\d+$/);
        if (match) {
          sequence = parseInt(match[0]) + 1;
        }
      }
      
      this.saleNumber = `SALE-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
    } catch (error) {
      console.error("Error generating sale number:", error);
      // Fallback sale number
      this.saleNumber = `SALE-${Date.now()}`;
    }
  }
  next();
});

// Alternative: Generate sale number in controller (more reliable)
SaleSchema.statics.generateSaleNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  const todaySalesCount = await this.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });
  
  const sequence = todaySalesCount + 1;
  return `SALE-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
};

// Update inventory after sale
SaleSchema.post("save", async function (doc) {
  if (doc.status === "completed" && doc.paymentStatus === "paid") {
    try {
      const Inventory = require("./Inventorymodel");
      
      for (const item of doc.items) {
        // Find and update inventory
        let inventory = await Inventory.findOne({ product: item.product });
        
        if (inventory) {
          inventory.quantity = Math.max(0, inventory.quantity - item.quantity);
          await inventory.save();
        } else {
          // Create inventory record if it doesn't exist
          inventory = new Inventory({
            product: item.product,
            quantity: -item.quantity
          });
          await inventory.save();
        }
      }
    } catch (error) {
      console.error("Error updating inventory after sale:", error);
    }
  }
});

module.exports = mongoose.model("Sale", SaleSchema);