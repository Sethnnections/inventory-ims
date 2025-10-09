const Product = require('../models/Productmodel')
const logActivity = require('../libs/logger')

module.exports.Addproduct = async (req, res) => {
    const userId = req.user._id;
    const ipAddress = req.ip;

    try {
        // Accept either correct "Description" or the misspelled "Desciption" from client payload
        const { name, Description, Desciption, Category, Price, quantity, supplier, imageData } = req.body;
        const normalizedDescription = Description || Desciption || '';
        const priceValue = Price !== undefined ? parseFloat(Price) : NaN;
        const quantityValue = quantity !== undefined ? parseInt(quantity, 10) : NaN;

        // Validate required fields and numeric conversions
        if (!name || !Category || !normalizedDescription || isNaN(priceValue) || isNaN(quantityValue)) {
            console.warn(`[Addproduct] Validation failed - missing or invalid required fields. user=${userId} ip=${ipAddress}`);
            // Log failed attempt
            await logActivity({
                action: "Add Product Failed",
                description: `Failed to add product. Missing/invalid fields. Payload: ${JSON.stringify({ name, Description: normalizedDescription, Category, Price: Price, quantity: quantity })}`,
                entity: "product",
                userId: userId,
                ipAddress: ipAddress,
            }).catch(err => console.error('[Addproduct] logActivity error (validation):', err));

            return res.status(400).json({ error: "Please provide valid product details (name, category, description, price, quantity)." });
        }

        const createdProduct = new Product({
            name,
            Description: normalizedDescription,
            Category,
            Price: priceValue,
            quantity: quantityValue,
            supplier: supplier || null,
            imageData: imageData || null,
        });

        await createdProduct.save();

        await logActivity({
            action: "Add Product",
            description: `Product ${name} was added`,
            entity: "product",
            entityId: createdProduct._id,
            userId: userId,
            ipAddress: ipAddress,
        }).catch(err => console.error('[Addproduct] logActivity error (success):', err));

        console.info(`[Addproduct] Product created successfully id=${createdProduct._id} user=${userId}`);

        res.status(201).json({ message: "Product created successfully", product: createdProduct });

    } catch (error) {
        console.error(`[Addproduct] Error in creating product: ${error.message}`, error);

        await logActivity({
            action: "Add Product Error",
            description: `Error creating product: ${error.message}`,
            entity: "product",
            userId: req.user ? req.user._id : null,
            ipAddress: ipAddress,
        }).catch(err => console.error('[Addproduct] logActivity error (exception):', err));

        res.status(500).json({ message: "Error in creating product", error: error.message });
    }
}

module.exports.getProduct = async (req, res) => {
    try {
        // Fetch all products and populate referenced Category and supplier documents
        // .populate() replaces the stored ObjectId references with the actual documents
        const Products = await Product.find({})
            .populate('Category') // include Category document instead of ID
            //.populate('supplier');  include supplier document instead of ID
        const totalProduct = await Product.countDocuments({})

         // console.info(`[getProduct] Retrieved ${Products.length} products`);

        if (!Products || Products.length === 0) {
            return res.status(404).json({ message: "Products not found" });
        }

        res.status(200).json({ Products, totalProduct });
    } catch (error) {
        res.status(500).json({ message: "Error getting products", error: error.message });
    }
};

module.exports.RemoveProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;
        const ipAddress = req.ip

        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found!" });
        }

        await logActivity({
            action: "Delete Product",
            description: `Product ${deletedProduct.name} was deleted.`,
            entity: "product",
            entityId: deletedProduct._id,
            userId: userId,
            ipAddress: ipAddress,
        });

        res.status(200).json({ message: "Product deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
};

module.exports.EditProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updatedData = req.body;
        const userId = req.user._id;
        const ipAddress = req.ip;

        if (!updatedData || typeof updatedData !== 'object') {
            return res.status(400).json({ message: "Invalid update data provided." });
        }

        // Handle empty supplier string
        if (updatedData.supplier !== undefined) {
            updatedData.supplier = updatedData.supplier && updatedData.supplier.trim() !== '' ? updatedData.supplier : null;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updatedData,
            { new: true, runValidators: true }
        ).populate('Category').populate('supplier');

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found." });
        }

        await logActivity({
            action: "Update Product",
            description: `Product "${updatedProduct.name}" was updated.`,
            entity: "product",
            entityId: updatedProduct._id,
            userId: userId,
            ipAddress: ipAddress,
        });

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
};

module.exports.SearchProduct = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: "Query parameter is required" });
        }

        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { Description: { $regex: query, $options: "i" } }, // Fixed: Desciption to Description
            ],
        }).populate('Category');

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error finding product", error: error.message });
    }
};

module.exports.getTopProductsByQuantity = async (req, res) => {
    try {
        const topProducts = await Product.find({})
            .sort({ quantity: -1 })
            .limit(10)
            .populate('Category')
            .populate('supplier');

        if (!topProducts || topProducts.length === 0) {
            return res.status(404).json({ message: "No products found" });
        }

        res.status(200).json({ success: true, topProducts });
    } catch (error) {
        res.status(500).json({ message: "Error fetching products for chart", error: error.message });
    }
};

// New function to get product by ID
module.exports.getProductById = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const product = await Product.findById(productId)
            .populate('Category')
            .populate('supplier');

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: "Error getting product", error: error.message });
    }
};

// New function to update product quantity with stock transactions
module.exports.updateProductQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity, type, description } = req.body;
        const userId = req.user._id;
        const ipAddress = req.ip;

        if (!quantity || !type) {
            return res.status(400).json({ message: "Quantity and type are required" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Update quantity based on type
        if (type === 'in') {
            product.quantity += parseInt(quantity);
        } else if (type === 'out') {
            if (product.quantity < quantity) {
                return res.status(400).json({ message: "Insufficient stock" });
            }
            product.quantity -= parseInt(quantity);
        } else {
            return res.status(400).json({ message: "Invalid type. Use 'in' or 'out'" });
        }

        await product.save();

        await logActivity({
            action: "Update Product Quantity",
            description: `Product "${product.name}" quantity updated: ${type === 'in' ? '+' : '-'}${quantity}`,
            entity: "product",
            entityId: product._id,
            userId: userId,
            ipAddress: ipAddress,
        });

        res.status(200).json(product);

    } catch (error) {
        res.status(500).json({ message: "Error updating product quantity", error: error.message });
    }
};