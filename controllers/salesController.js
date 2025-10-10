const Sale = require('../models/salesModel');
const Product = require('../models/Productmodel');
const Inventory = require('../models/Inventorymodel');
const logActivity = require('../libs/logger');

module.exports.createSale = async (req, res) => {
  const userId = req.user._id;
  const ipAddress = req.ip;

  try {
    const {
      customer,
      items,
      tax = 0,
      discount = 0,
      paymentMethod = "cash",
      notes
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Sale items are required" 
      });
    }

    // Generate sale number first
    const saleNumber = await Sale.generateSaleNumber();

    // Calculate totals and validate products
    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      // Check inventory if needed
      const inventory = await Inventory.findOne({ product: item.product });
      if (inventory && inventory.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${inventory.quantity}`
        });
      }

      const itemTotal = item.quantity * product.Price;
      subtotal += itemTotal;

      saleItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.Price,
        total: itemTotal
      });
    }

    const total = subtotal + tax - discount;

    // Create sale with explicit saleNumber
    const sale = new Sale({
      saleNumber, // Explicitly set sale number
      customer: customer || {},
      items: saleItems,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      cashier: userId,
      notes
    });

    await sale.save();
    await sale.populate('items.product');

    // Log activity
    await logActivity({
      action: "Create Sale",
      description: `Sale ${sale.saleNumber} created with total MK ${total}`,
      entity: "sale",
      entityId: sale._id,
      userId: userId,
      ipAddress: ipAddress,
    });

    res.status(201).json({
      success: true,
      message: "Sale created successfully",
      sale
    });

  } catch (error) {
    console.error("Error creating sale:", error);
    
    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Sale number already exists",
        error: "Duplicate sale number"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating sale",
      error: error.message
    });
  }
};

// Alternative simplified version if still having issues
module.exports.createSaleSimple = async (req, res) => {
  const userId = req.user._id;
  const ipAddress = req.ip;

  try {
    const {
      customer,
      items,
      tax = 0,
      discount = 0,
      paymentMethod = "cash",
      notes
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Sale items are required" 
      });
    }

    // Simple sale number generation
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 1000);
    const saleNumber = `SALE-${timestamp}-${random}`;

    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      const inventory = await Inventory.findOne({ product: item.product });
      if (inventory && inventory.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${inventory.quantity}`
        });
      }

      const itemTotal = item.quantity * product.Price;
      subtotal += itemTotal;

      saleItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.Price,
        total: itemTotal
      });
    }

    const total = subtotal + tax - discount;

    // Create sale with simple sale number
    const sale = new Sale({
      saleNumber,
      customer: customer || {},
      items: saleItems,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      cashier: userId,
      notes
    });

    await sale.save();
    await sale.populate('items.product');

    // Update inventory
    for (const item of sale.items) {
      let inventory = await Inventory.findOne({ product: item.product });
      if (inventory) {
        inventory.quantity = Math.max(0, inventory.quantity - item.quantity);
        await inventory.save();
      }
    }

    await logActivity({
      action: "Create Sale",
      description: `Sale ${sale.saleNumber} created with total MK ${total}`,
      entity: "sale",
      entityId: sale._id,
      userId: userId,
      ipAddress: ipAddress,
    });

    res.status(201).json({
      success: true,
      message: "Sale created successfully",
      sale
    });

  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({
      success: false,
      message: "Error creating sale",
      error: error.message
    });
  }
};

// Rest of the controller methods remain the same...
module.exports.getAllSales = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      status 
    } = req.query;

    const query = {};
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (status) query.status = status;

    const sales = await Sale.find(query)
      .populate('items.product')
      .populate('cashier', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sale.countDocuments(query);

    res.status(200).json({
      success: true,
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sales",
      error: error.message
    });
  }
};

module.exports.getSale = async (req, res) => {
  try {
    const { saleId } = req.params;

    const sale = await Sale.findById(saleId)
      .populate('items.product')
      .populate('cashier', 'name email');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    res.status(200).json({
      success: true,
      sale
    });

  } catch (error) {
    console.error("Error fetching sale:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sale",
      error: error.message
    });
  }
};

module.exports.getTodaySales = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySales = await Sale.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: "completed",
      paymentStatus: "paid"
    });

    const totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = todaySales.length;

    res.status(200).json({
      success: true,
      totalSales,
      totalTransactions,
      sales: todaySales
    });

  } catch (error) {
    console.error("Error fetching today's sales:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching today's sales",
      error: error.message
    });
  }
};

module.exports.getSalesStats = async (req, res) => {
  try {
    const { period = "day" } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const sales = await Sale.find({
      createdAt: { $gte: startDate },
      status: "completed",
      paymentStatus: "paid"
    }).populate('items.product');

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = sales.length;
    
    const productSales = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productName = item.product.name;
        if (!productSales[productName]) {
          productSales[productName] = {
            quantity: 0,
            revenue: 0
          };
        }
        productSales[productName].quantity += item.quantity;
        productSales[productName].revenue += item.total;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      period,
      totalRevenue,
      totalTransactions,
      topProducts,
      salesCount: sales.length
    });

  } catch (error) {
    console.error("Error fetching sales stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sales statistics",
      error: error.message
    });
  }
};