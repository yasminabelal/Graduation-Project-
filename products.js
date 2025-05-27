import storage from './storage.js';

const categories = {
    'electronics': 'إلكترونيات',
    'jewelery': 'اكسسوارات',
    "men's clothing": 'ملابس رجالي',
    "women's clothing": 'ملابس نسائي',
    'accessories': 'اكسسوارات'
};

const elements = {
    productsContainer: document.getElementById('productsContainer'),
    searchInput: document.getElementById('searchInput'),
    categoryFilter: document.getElementById('categoryFilter'),
    addProductBtn: document.getElementById('addProductBtn'),
    productFormModal: document.getElementById('productFormModal'),
    productDetailsModal: document.getElementById('productDetailsModal'),
    adminLink: document.getElementById('adminLink'),
    logoutBtn: document.getElementById('logoutBtn'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    productForm: document.getElementById('productForm'),
    modalTitle: document.getElementById('modalTitle'),
    productId: document.getElementById('productId'),
    productName: document.getElementById('productName'),
    productPrice: document.getElementById('productPrice'),
    productQuantity: document.getElementById('productQuantity'),
    productDesc: document.getElementById('productDesc'),
    productCategory: document.getElementById('productCategory'),
    productImage: document.getElementById('productImage'),
    imagePreview: document.getElementById('imagePreview'),
    cancelBtn: document.getElementById('cancelBtn'),
    detailsProductName: document.getElementById('detailsProductName'),
    detailsProductImage: document.getElementById('detailsProductImage'),
    detailsProductPrice: document.getElementById('detailsProductPrice'),
    detailsProductQuantity: document.getElementById('detailsProductQuantity'),
    detailsProductCategory: document.getElementById('detailsProductCategory'),
    detailsProductDesc: document.getElementById('detailsProductDesc'),
    addToCartFromDetails: document.getElementById('addToCartFromDetails'),
    cartCount: document.getElementById('cartCount'),
    cartButton: document.getElementById('cartButton'),
    searchOverlay: document.getElementById('searchOverlay'),
    searchBtn: document.querySelector('.icon-button i.fa-search').parentElement,
    closeSearch: document.getElementById('closeSearch'),
    searchResults: document.getElementById('searchResults'),
    filterToggle: document.getElementById('filterToggle'),
    filterMenu: document.getElementById('filterMenu'),
    filterOptions: document.querySelectorAll('.filter-option'),
};

let state = {
    editingProductId: null,
    currentDetailsProduct: null,
    products: []
};

const ui = {
    showLoading() {
        elements.loadingIndicator.style.display = 'flex';
    },
    hideLoading() {
        elements.loadingIndicator.style.display = 'none';
    },
    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.innerHTML = message;
        
        const existingError = document.querySelector('.error-message');
        if (existingError) existingError.remove();
        
        elements.productsContainer.prepend(errorEl);
        setTimeout(() => errorEl.remove(), 5000);
    },
    hideModals() {
        elements.productFormModal.style.display = 'none';
        elements.productDetailsModal.style.display = 'none';
    },
    renderProducts(products, containerId = 'productsContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        const isAdminUser = isAdmin();
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image || 'placeholder.jpg'}" alt="${product.name}" onerror="this.src='placeholder.jpg'">
                </div>
               
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.description?.substring(0, 100) || 'لا يوجد وصف'}...</p>
                    <div class="product-meta">
                        <span class="product-price">${product.price.toFixed(2)} جنيه</span>
                        <span class="product-quantity">المتبقي: ${product.quantity}</span>
                    </div>
                    <div class="product-actions">
                        <button class="view-details" data-id="${product.id}">تفاصيل</button>
                        <button class="add-to-cart" data-id="${product.id}">أضف إلى العربة</button>
                    </div>
                    ${isAdminUser ? `
                    <div class="admin-actions">
                        <button class="edit-product" data-id="${product.id}">تعديل</button>
                        <button class="delete-product" data-id="${product.id}">حذف</button>
                    </div>
                    ` : ''}
                </div>
            `;
            container.appendChild(productCard);
        });
      
        addDynamicEventListeners();
    }
};


const productService = {
    filter(products, searchTerm, category) {
        return products.filter(product => {
            const matchesSearch = !searchTerm || 
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
                
            const matchesCategory = !category || category === 'all' || product.category === category;
            
            return matchesSearch && matchesCategory;
        }).sort((a, b) => a.price - b.price);
    },

    async load() {
        ui.showLoading();
        try {
            let products = storage.get('products');
            if (!products || products.length === 0) {
                products = await this.fetchFromAPI();
                storage.set('products', products);
            }
            state.products = products;
            return products;
        } catch (error) {
            console.error('Error loading products:', error);
            ui.showError('حدث خطأ أثناء تحميل المنتجات');
            return [];
        } finally {
            ui.hideLoading();
        }
    },

    async fetchFromAPI() {
        try {
            const response = await fetch('https://fakestoreapi.com/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            
            const apiProducts = await response.json();
            return apiProducts.map(product => ({
                id: product.id.toString(),
                name: product.title,
                price: product.price,
                description: product.description,
                category: mapAPICategory(product.category),
                image: product.image,
                quantity: Math.floor(Math.random() * 50) + 10
            }));
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }
};

function mapAPICategory(apiCategory) {
    const categoryMap = {
        "men's clothing":  "men's clothing",
        "women's clothing":  "women's clothing",
        'electronics': 'electronics',
        'jewelery': 'jewelery',
    };
    return categoryMap[apiCategory] || 'accessories';
}

const cartService = {
    add(productId) {
        const products = storage.get('products') || [];
        const product = products.find(p => p.id === productId);
        
        if (!product) return;
        
        let cart = storage.get('cart') || [];
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            if (existingItem.quantity >= product.quantity) {
                alert('لا يوجد كمية كافية من هذا المنتج');
                return;
            }
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image
            });
        }
        
        storage.set('cart', cart);
        this.updateCount();
        alert('تمت إضافة المنتج إلى العربة');
    },

    updateCount() {
        const cart = storage.get('cart') || [];
        if (elements.cartCount) {
            elements.cartCount.textContent = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        }
    }
};

async function init() {
    if (!checkAuth()) return;
    
    if (isAdmin()) {
        document.body.classList.add('admin');
    }
    
    setupEventListeners();
    cartService.updateCount();
    renderProducts();
}

function checkAuth() {
    const currentUser = storage.get('currentUser');
    if (!currentUser) {
        storage.set('redirectAfterAuth', window.location.pathname);
        window.location.href = 'auth/auth.html';
        return false;
    }
    
    if (currentUser.isAdmin) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block';
        });
    }
    
    return true;
}

function isAdmin() {
    const currentUser = storage.get('currentUser');
    return currentUser?.isAdmin || false;
}

function navigateToCart(event) {
    if (event) event.preventDefault();
    
    const currentUser = storage.get('currentUser');
    const cart = storage.getCart() || [];
    
    if (cart.length === 0) {
        showNotification('عربة التسوق فارغة');
        return;
    }
    
    if (currentUser) {
        window.location.href = './cart/cart.html';
        return;
    }
    
    storage.set('redirectAfterAuth', './cart/cart.html');
    window.location.href = './auth/auth.html';
}

function setupEventListeners() {
    const searchListeners = {
        'searchInput': ['input', debounce(renderProducts, 300)],
        'categoryFilter': ['change', renderProducts]
    };

    const productListeners = {
        'addProductBtn': ['click', showAddProductForm],
        'cancelBtn': ['click', hideProductForm],
        'productForm': ['submit', handleProductFormSubmit],
        'productImage': ['change', handleImageUpload]
    };

    Object.entries(searchListeners).forEach(([id, [event, handler]]) => {
        elements[id]?.addEventListener(event, handler);
    });

    Object.entries(productListeners).forEach(([id, [event, handler]]) => {
        elements[id]?.addEventListener(event, handler);
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.productFormModal.style.display = 'none';
            elements.productDetailsModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === elements.productFormModal) hideProductForm();
        if (e.target === elements.productDetailsModal) hideProductDetails();
    });
    
    elements.logoutBtn.addEventListener('click', logout);
    
    document.querySelector('a[href="./cart/cart.html"]')?.addEventListener('click', (e) => {
        const currentUser = storage.get('currentUser');
        if (!currentUser) {
            e.preventDefault();
            storage.set('redirectAfterAuth', './cart/cart.html');
            window.location.href = './auth/auth.html';
        }
    });
    
    if (elements.cartButton) {
        elements.cartButton.addEventListener('click', navigateToCart);
    }
    
    elements.searchBtn.addEventListener('click', () => {
        elements.searchOverlay.classList.add('active');
        elements.searchInput.focus();
    });

    elements.closeSearch.addEventListener('click', () => {
        elements.searchOverlay.classList.remove('active');
    });

    elements.searchInput.addEventListener('input', debounce(() => {
        const query = elements.searchInput.value.trim().toLowerCase();
        if (query) {
            filterProducts(query);
        }
    }, 300));
    
    elements.filterToggle = document.getElementById('filterToggle');
    elements.filterMenu = document.getElementById('filterMenu');
    elements.filterOptions = document.querySelectorAll('.filter-option');

    elements.filterToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.filterMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!elements.filterMenu.contains(e.target) && !elements.filterToggle.contains(e.target)) {
            elements.filterMenu.classList.remove('show');
        }
    });

    elements.filterOptions.forEach(option => {
        option.addEventListener('click', () => {
            elements.filterOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            const selectedText = option.textContent.trim();
            elements.filterToggle.querySelector('span').textContent = selectedText;
            
            const selectedCategory = option.getAttribute('data-value');
            filterProducts(elements.searchInput?.value || '', selectedCategory);
            
            elements.filterMenu.classList.remove('show');
        });
    });

    const homeLink = document.querySelector('.home-link');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.welcome-section').style.display = 'block';
            document.getElementById('new-products-section').style.display = 'none';
            document.getElementById('products-section').style.display = 'block';
            renderProducts();
        });
    }

    const newProductsLink = document.querySelector('.new-products-link');
    if (newProductsLink) {
        newProductsLink.addEventListener('click', async (e) => {
            e.preventDefault();
            document.querySelector('.welcome-section').style.display = 'none';
            document.getElementById('products-section').style.display = 'none';
            document.getElementById('new-products-section').style.display = 'block';
            
            const products = await productService.load();
            const latestProducts = products.slice(-4);
            ui.renderProducts(latestProducts, 'newProductsContainer');
        });
    }
}

function logout() {
    storage.remove('currentUser');
    window.location.href = './auth/auth.html';
}

async function renderProducts() {
    try {
        const products = await productService.load();
        const searchTerm = elements.searchInput?.value?.toLowerCase() || '';
        
        const activeFilter = elements.filterMenu.querySelector('.filter-option.active');
        const category = activeFilter ? activeFilter.getAttribute('data-value') : '';
        
        const filteredProducts = productService.filter(products, searchTerm, category);
        
        if (filteredProducts.length === 0) {
            elements.productsContainer.innerHTML = '<p class="no-products">لا توجد منتجات متطابقة مع بحثك</p>';
            return;
        }
        
        ui.renderProducts(filteredProducts);
        cartService.updateCount();
    } catch (error) {
        console.error('Error rendering products:', error);
        ui.showError('حدث خطأ أثناء عرض المنتجات');
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const filterProducts = (query = '', category = '', isNew = false) => {
    const products = storage.get('products') || [];
    let filteredProducts = products.filter(product => {
        const lowerQuery = String(query).toLowerCase();
        const matchesQuery = !query || 
            (product.name && product.name.toLowerCase().includes(lowerQuery)) || 
            (product.description && product.description.toLowerCase().includes(lowerQuery));
        
        const matchesCategory = !category || category === '' || 
            (product.category && product.category === category);

        return matchesQuery && matchesCategory;
    });

    if (isNew) {
        filteredProducts = filteredProducts.slice(-4);
    }

    ui.renderProducts(filteredProducts);
};

function renderProductCards(products) {
    elements.productsContainer.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image || 'placeholder.jpg'}" alt="${product.name}" onerror="this.src='placeholder.jpg'">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description?.substring(0, 100) || 'لا يوجد وصف'}...</p>
                <div class="product-meta">
                    <span class="product-price">${product.price.toFixed(2)} جنيه</span>
                    <span class="product-quantity">المتبقي: ${product.quantity}</span>
                </div>
                <div class="product-actions">
                    <button class="view-details" data-id="${product.id}">تفاصيل</button>
                    <button class="add-to-cart" data-id="${product.id}">أضف إلى العربة</button>
                </div>
                <div class="admin-actions">
                    <button class="edit-product" data-id="${product.id}">تعديل</button>
                    <button class="delete-product" data-id="${product.id}">حذف</button>
                </div>
            </div>
        `;
        elements.productsContainer.appendChild(productCard);
    });
    
    addDynamicEventListeners();
}

function addDynamicEventListeners() {
    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            showProductDetails(e.target.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            cartService.add(e.target.getAttribute('data-id'));
        });
    });
    
    // Only add edit/delete event listeners if user is admin
    document.querySelectorAll('.edit-product, .delete-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!isAdmin()) {
                alert('عذراً، هذه العملية متاحة فقط للمشرفين');
                return;
            }
            
            if (btn.classList.contains('edit-product')) {
                editProduct(e.target.getAttribute('data-id'));
            } else {
                deleteProduct(e.target.getAttribute('data-id'));
            }
        });
    });
}

function showAddProductForm() {
    state.editingProductId = null;
    elements.modalTitle.textContent = 'إضافة منتج جديد';
    elements.productForm.reset();
    elements.imagePreview.innerHTML = '';
    elements.productFormModal.style.display = 'block';
}

function editProduct(productId) {
    const products = storage.get('products') || [];
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    state.editingProductId = productId;
    elements.modalTitle.textContent = 'تعديل المنتج';
    elements.productId.value = product.id;
    elements.productName.value = product.name;
    elements.productPrice.value = product.price;
    elements.productQuantity.value = product.quantity;
    elements.productDesc.value = product.description || '';
    elements.productCategory.value = product.category;
    
    if (product.image) {
        elements.imagePreview.innerHTML = `<img src="${product.image}" alt="صورة المنتج">`;
    }
    
    elements.productFormModal.style.display = 'block';
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        elements.imagePreview.innerHTML = `<img src="${event.target.result}" alt="معاينة الصورة">`;
    };
    reader.readAsDataURL(file);
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    
    const validationErrors = validateProductForm();
    if (validationErrors.length > 0) {
        ui.showError(validationErrors.join('<br>'));
        return;
    }
    
    try {
        const productData = prepareProductData();
        await saveProduct(productData);
        
        hideProductForm();
        await renderProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        ui.showError('حدث خطأ أثناء حفظ المنتج');
    }
}

function validateProductForm() {
    const errors = [];
    const name = elements.productName.value.trim();
    const price = parseFloat(elements.productPrice.value);
    const quantity = parseInt(elements.productQuantity.value);
    
    if (!name) errors.push('اسم المنتج مطلوب');
    if (isNaN(price)) errors.push('السعر يجب أن يكون رقماً'); 
    if (price <= 0) errors.push('السعر يجب أن يكون موجباً');
    if (isNaN(quantity)) errors.push('الكمية يجب أن تكون رقماً');
    if (quantity < 0) errors.push('الكمية لا يمكن أن تكون سالبة');
    
    return errors;
}

function prepareProductData() {
    const productData = {
        id: state.editingProductId || Date.now().toString(),
        name: elements.productName.value.trim(),
        price: parseFloat(elements.productPrice.value),
        quantity: parseInt(elements.productQuantity.value),
        description: elements.productDesc.value.trim(),
        category: elements.productCategory.value,
        image: 'placeholder.jpg'
    };
    
    const previewImg = elements.imagePreview.querySelector('img');
    if (previewImg && previewImg.src.startsWith('data:')) {
        productData.image = previewImg.src;
    }
    
    return productData;
}

async function saveProduct(productData) {
    const products = storage.get('products') || [];
    
    if (state.editingProductId) {
        const index = products.findIndex(p => p.id === state.editingProductId);
        if (index !== -1) {
            products[index] = productData;
        }
    } else {
        products.push(productData);
    }
    
    storage.set('products', products);
}

function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    const products = storage.get('products') || [];
    const updatedProducts = products.filter(p => p.id !== productId);
    storage.set('products', updatedProducts);
    renderProducts();
}

function showProductDetails(productId) {
    const products = storage.get('products') || [];
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    state.currentDetailsProduct = product;
    
    elements.detailsProductName.textContent = product.name;
    elements.detailsProductImage.src = product.image || 'placeholder.jpg';
    elements.detailsProductPrice.textContent = product.price.toFixed(2);
    elements.detailsProductQuantity.textContent = product.quantity;
    elements.detailsProductCategory.textContent = getCategoryName(product.category);
    elements.detailsProductDesc.textContent = product.description || 'لا يوجد وصف';
    
    elements.addToCartFromDetails.onclick = () => cartService.add(product.id);
    
    elements.productDetailsModal.style.display = 'block';
}

function hideProductForm() {
    elements.productFormModal.style.display = 'none';
}

function hideProductDetails() {
    elements.productDetailsModal.style.display = 'none';
}

function getCategoryName(category) {
    return categories[category] || category;
}

document.addEventListener('DOMContentLoaded', init);