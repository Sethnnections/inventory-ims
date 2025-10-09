const Product = require('../models/Productmodel');
const Sale = require('../models/salesModel');
const User = require('../models/Usermodel');
const Category=require('../models/ Categorymodel');
const Inventory = require('../models/Inventorymodel');
const ActivityLog = require('../models/ActivityLogmodel');


// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const { period = 'today', category = 'all' } = req.query;
        
        // Date range calculation based on period
        const getDateRange = (period) => {
            const now = new Date();
            let startDate, endDate = new Date();
            
            switch (period) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'yesterday':
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 1);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(startDate);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'week':
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(now);
                    startDate.setDate(1);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.setHours(0, 0, 0, 0));
            }
            
            return { startDate, endDate };
        };

        const { startDate, endDate } = getDateRange(period);

        // Build category filter
        const categoryFilter = category !== 'all' ? { category } : {};

        // Get sales data
        const salesFilter = {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
        };

        const sales = await Sale.find(salesFilter)
            .populate('items.product')
            .sort({ createdAt: -1 });

        // Calculate sales metrics
        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalTransactions = sales.length;
        const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;

        // Get product counts with category filter
        const productCount = await Product.countDocuments(categoryFilter);
        
        // Get inventory status
        const inventoryStats = await Inventory.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get user counts by role
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get sales by category for chart
        const salesByCategory = await Sale.aggregate([
            { $match: salesFilter },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productData'
                }
            },
            { $unwind: '$productData' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productData.Category',
                    foreignField: '_id',
                    as: 'categoryData'
                }
            },
            { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$categoryData.name' || 'Uncategorized',
                    totalSales: { $sum: '$items.total' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalSales: -1 } }
        ]);

        // Get daily sales for line chart
        const dailySales = await Sale.aggregate([
            { $match: salesFilter },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    totalSales: { $sum: '$total' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get recent activities
        const recentActivities = await ActivityLog.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get all categories for filter dropdown
        const categories = await Category.find();

        // Format response based on request type
        if (req.originalUrl.startsWith('/api/')) {
            return res.json({
                success: true,
                data: {
                    summary: {
                        totalSales,
                        totalTransactions,
                        averageSale: Math.round(averageSale * 100) / 100,
                        productCount
                    },
                    charts: {
                        salesByCategory,
                        dailySales
                    },
                    inventory: inventoryStats,
                    users: userStats,
                    recentActivities
                }
            });
        } else {
            // For web view, render the dashboard page
            res.render('dashboard', {
                title: 'Dashboard',
                user: req.user,
                stats: {
                    summary: {
                        totalSales,
                        totalTransactions,
                        averageSale: Math.round(averageSale * 100) / 100,
                        productCount
                    },
                    charts: {
                        salesByCategory: salesByCategory || [],
                        dailySales: dailySales || []
                    },
                    inventory: inventoryStats || [],
                    users: userStats || []
                },
                filters: {
                    period,
                    category
                },
                categories: categories || [],
                recentActivities: recentActivities || []
            });
        }

    } catch (error) {
        console.error('Dashboard error:', error);
        
        // Get categories even if there's an error
        const categories = await Category.find().catch(() => []);
        
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(500).json({
                success: false,
                message: 'Error fetching dashboard data'
            });
        } else {
            res.render('dashboard', {
                title: 'Dashboard',
                user: req.user,
                error: 'Failed to load dashboard data',
                filters: {
                    period: req.query.period || 'today',
                    category: req.query.category || 'all'
                },
                categories: categories || [],
                stats: {
                    summary: { totalSales: 0, totalTransactions: 0, averageSale: 0, productCount: 0 },
                    charts: { salesByCategory: [], dailySales: [] },
                    inventory: [],
                    users: []
                },
                recentActivities: []
            });
        }
    }
};

// Get real-time dashboard data (for auto-refresh)
exports.getRealTimeStats = async (req, res) => {
    try {
        const lowStockCount = await Inventory.countDocuments({ status: 'low-stock' });
        const outOfStockCount = await Inventory.countDocuments({ status: 'out-of-stock' });
        const inStockCount = await Inventory.countDocuments({ status: 'in-stock' });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaySales = await Sale.aggregate([
            {
                $match: {
                    createdAt: { $gte: today },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                lowStockCount,
                outOfStockCount,
                inStockCount,
                todaySales: todaySales[0] || { total: 0, count: 0 }
            }
        });
    } catch (error) {
        console.error('Real-time stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching real-time data'
        });
    }
};