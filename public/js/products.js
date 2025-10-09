// =================== Product Management Script ===================

// Global data holders
let allProducts = [];
let allCategories = [];

// API URLs
const PRODUCTS_URL = '/api/product/getproduct';
const CATEGORIES_URL = '/api/category/getcategory';

// Track Select2 initialization
let select2Initialized = {
    productCategory: false,
    editProductCategory: false,
    categoryFilter: false
};

// =================== Load Products and Categories ===================

async function loadProducts() {
    try {
        const [productRes, categoryRes] = await Promise.all([
            fetch(PRODUCTS_URL),
            fetch(CATEGORIES_URL)
        ]);

        const productsData = await productRes.json();
        const categoriesData = await categoryRes.json();

        console.log('Categories Response:', categoriesData);

        // ✅ Properly extract categories from API structure
        allCategories = categoriesData?.categoriesWithCount 
            || categoriesData?.categories 
            || (categoriesData?.data || []);

        // ✅ Products
        allProducts = Array.isArray(productsData) ? productsData :
            productsData.products || [];

        // Populate UI
        populateCategoryDropdowns();
        populateProductTable();
        initializeSelect2(); // Initialize Select2 after populating dropdowns

    } catch (error) {
        console.error('Error loading products or categories:', error);
        showAlert('danger', 'Failed to load products or categories. Check console for details.');
    }
}

// =================== Populate Category Dropdowns ===================

function populateCategoryDropdowns() {
    const dropdownIds = ['#productCategory', '#editProductCategory', '#categoryFilter'];
    
    dropdownIds.forEach(id => {
        const dropdown = $(id);
        dropdown.empty();
        dropdown.append('<option value="">Select Category</option>');
        
        allCategories.forEach(category => {
            dropdown.append(`<option value="${category._id}">${category.name}</option>`);
        });
    });
}

// =================== Initialize Select2 ===================

function initializeSelect2() {
    // Initialize only if not already initialized
    if (!select2Initialized.categoryFilter) {
        $('#categoryFilter').select2({
            width: '150px',
            placeholder: "All Categories",
            allowClear: true
        });
        select2Initialized.categoryFilter = true;
    }
    
    // For modal dropdowns, we'll initialize when modals open
}

// =================== Populate Product Table ===================

function populateProductTable() {
    const tbody = $('#productsTableBody');
    tbody.empty();

    if (!allProducts.length) {
        tbody.append(`<tr><td colspan="8" class="text-center">No products found</td></tr>`);
        return;
    }

    allProducts.forEach((product, index) => {
        const category = allCategories.find(c => c._id === product.category)?.name || 'N/A';

        tbody.append(`
            <tr>
                <td>${index + 1}</td>
                <td>
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;">` : 
                        '<div class="text-muted">No Image</div>'
                    }
                </td>
                <td>${product.name || product.productName || '-'}</td>
                <td>${category}</td>
                <td>${product.price ? 'MWK ' + product.price.toLocaleString() : '-'}</td>
                <td>${product.quantity || 0}</td>
                <td>${product.description || product.Desciption || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2" onclick="openEditProduct('${product._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${product._id}', '${product.name || product.productName}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    });
}

// =================== Create Product ===================

async function createProduct() {
    const productData = {
        name: $('#productName').val().trim(),
        Category: $('#productCategory').val(),
        Price: parseFloat($('#productPrice').val()),
        quantity: parseInt($('#productQuantity').val()),
        Desciption: $('#productDescription').val().trim()
    };

    // Validation
    if (!productData.name || !productData.Category || !productData.Price || !productData.quantity) {
        showAlert('warning', 'Please fill in all required fields.');
        return;
    }

    try {
        const response = await fetch('/api/product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        const result = await response.json();
        if (response.ok) {
            showAlert('success', 'Product created successfully!');
            $('#createProductModal').modal('hide');
            $('#createProductForm')[0].reset();
            $('#productCategory').val('').trigger('change');
            loadProducts();
        } else {
            showAlert('danger', result.message || 'Failed to create product.');
        }
    } catch (error) {
        console.error('Error creating product:', error);
        showAlert('danger', 'Error creating product.');
    }
}

// =================== Edit Product ===================

function openEditProduct(id) {
    const product = allProducts.find(p => p._id === id);
    if (!product) return;

    // Populate form fields
    $('#editProductId').val(product._id);
    $('#editProductName').val(product.name || product.productName);
    $('#editProductPrice').val(product.price);
    $('#editProductQuantity').val(product.quantity);
    $('#editProductDescription').val(product.description || product.Desciption);
    
    // Set category and trigger Select2 update
    $('#editProductCategory').val(product.category).trigger('change');

    $('#editProductModal').modal('show');
}

async function saveProductChanges() {
    const id = $('#editProductId').val();
    const updatedData = {
        name: $('#editProductName').val().trim(),
        Category: $('#editProductCategory').val(),
        Price: parseFloat($('#editProductPrice').val()),
        quantity: parseInt($('#editProductQuantity').val()),
        Desciption: $('#editProductDescription').val().trim()
    };

    try {
        const response = await fetch(`/api/product/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();
        if (response.ok) {
            showAlert('success', 'Product updated successfully!');
            $('#editProductModal').modal('hide');
            loadProducts();
        } else {
            showAlert('danger', result.message || 'Failed to update product.');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        showAlert('danger', 'Error updating product.');
    }
}

// =================== Delete Product ===================

let productToDelete = null;

function openDeleteModal(id, productName) {
    productToDelete = id;
    $('#deleteProductName').text(productName);
    $('#deleteProductModal').modal('show');
}

async function confirmDeleteProduct() {
    if (!productToDelete) return;

    const deleteBtn = $('#confirmDeleteBtn');
    const spinner = deleteBtn.find('.spinner-border');
    
    try {
        spinner.removeClass('d-none');
        deleteBtn.prop('disabled', true);

        const response = await fetch(`/api/product/${productToDelete}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showAlert('success', 'Product deleted successfully!');
            $('#deleteProductModal').modal('hide');
            loadProducts();
        } else {
            showAlert('danger', 'Failed to delete product.');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showAlert('danger', 'Error deleting product.');
    } finally {
        spinner.addClass('d-none');
        deleteBtn.prop('disabled', false);
        productToDelete = null;
    }
}

// =================== Filter and Search ===================

function filterProducts() {
    const searchTerm = $('#searchProducts').val().toLowerCase();
    const categoryId = $('#categoryFilter').val();
    
    let filtered = allProducts;
    
    // Apply category filter
    if (categoryId) {
        filtered = filtered.filter(p => p.category === categoryId);
    }
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(p => 
            (p.name || p.productName || '').toLowerCase().includes(searchTerm) ||
            (p.description || p.Desciption || '').toLowerCase().includes(searchTerm)
        );
    }
    
    // Update table
    const tbody = $('#productsTableBody');
    tbody.empty();
    
    if (!filtered.length) {
        tbody.append(`<tr><td colspan="8" class="text-center">No products found</td></tr>`);
        return;
    }
    
    filtered.forEach((product, index) => {
        const category = allCategories.find(c => c._id === product.category)?.name || 'N/A';
        
        tbody.append(`
            <tr>
                <td>${index + 1}</td>
                <td>${product.image ? `<img src="${product.image}" style="width: 50px; height: 50px; object-fit: cover;">` : 'No Image'}</td>
                <td>${product.name || product.productName || '-'}</td>
                <td>${category}</td>
                <td>${product.price ? 'MWK ' + product.price.toLocaleString() : '-'}</td>
                <td>${product.quantity || 0}</td>
                <td>${product.description || product.Desciption || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2" onclick="openEditProduct('${product._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${product._id}', '${product.name || product.productName}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    });
}

function refreshProducts() {
    loadProducts();
    $('#searchProducts').val('');
    $('#categoryFilter').val('').trigger('change');
}

// =================== Alert Message ===================

function showAlert(type, message) {
    const alertBox = $(`
        <div class="alert alert-${type} alert-dismissible fade show mt-2" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    $('#alertContainer').html(alertBox);
    setTimeout(() => alertBox.alert('close'), 5000);
}

// =================== Safe Select2 Destruction ===================

function safeDestroySelect2(selector) {
    try {
        const element = $(selector);
        if (element.length && element.hasClass('select2-hidden-accessible')) {
            element.select2('destroy');
        }
    } catch (error) {
        console.log(`Select2 already destroyed for: ${selector}`);
    }
}

// =================== Initialize ===================

$(document).ready(function () {
    loadProducts();
    
    // Event listeners
    $('#searchProducts').on('input', filterProducts);
    $('#categoryFilter').on('change', filterProducts);
    $('#createProductBtn').on('click', createProduct);
    $('#updateProductBtn').on('click', saveProductChanges);
    
    // Initialize modal dropdowns when modals are shown
    $('#createProductModal').on('shown.bs.modal', function () {
        if (!select2Initialized.productCategory) {
            $('#productCategory').select2({
                width: '100%',
                dropdownParent: $('#createProductModal'),
                placeholder: "Select or search category",
                allowClear: true
            });
            select2Initialized.productCategory = true;
        }
    });
    
    $('#editProductModal').on('shown.bs.modal', function () {
        if (!select2Initialized.editProductCategory) {
            $('#editProductCategory').select2({
                width: '100%',
                dropdownParent: $('#editProductModal'),
                placeholder: "Select or search category",
                allowClear: true
            });
            select2Initialized.editProductCategory = true;
        }
    });
    
    // Clean up Select2 when modals are hidden (optional - only if you need to)
    $('#createProductModal').on('hidden.bs.modal', function () {
        // Only destroy if you're having issues with multiple instances
        // safeDestroySelect2('#productCategory');
        // select2Initialized.productCategory = false;
    });
    
    $('#editProductModal').on('hidden.bs.modal', function () {
        // Only destroy if you're having issues with multiple instances
        // safeDestroySelect2('#editProductCategory');
        // select2Initialized.editProductCategory = false;
    });
});