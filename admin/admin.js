import storage from '../storage.js';

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = storage.get('currentUser');
    
    if (!currentUser || !currentUser.isAdmin) {
        window.location.href = '../auth/auth.html';
        return;
    }

    document.getElementById('adminName').textContent = `مرحباً، ${currentUser.username}`;
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        storage.remove('currentUser');
        window.location.href = '../auth/auth.html';
    });

    const navLinks = document.querySelectorAll('.admin-nav a');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            
            link.classList.add('active');
            
            contentSections.forEach(section => section.classList.remove('active'));
            
            const targetSection = document.querySelector(link.getAttribute('href'));
            targetSection.classList.add('active');
        });
    });

    function loadDashboardStats() {
        const products = storage.get('products') || [];
        const orders = storage.get('orders') || [];
        const users = storage.get('users') || [];
        
        document.getElementById('productsCount').textContent = products.length;
        document.getElementById('ordersCount').textContent = orders.length;
        
        const totalSales = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
        document.getElementById('totalSales').textContent = `${totalSales.toFixed(2)} جنيه`;
        
        document.getElementById('activeUsers').textContent = users.length;
        
        const recentOrdersTable = document.querySelector('#recentOrdersTable tbody');
        recentOrdersTable.innerHTML = '';
        
        const recentOrders = orders.slice(0, 5).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        recentOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customerName}</td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>${(Number(order.total) || 0).toFixed(2)} جنيه</td>
                <td>${getOrderStatusBadge(order.status)}</td>
            `;
            recentOrdersTable.appendChild(row);
        });
    }
    
    function getOrderStatusBadge(status) {
        const statusMap = {
            'pending': 'قيد الانتظار',
            'processing': 'قيد المعالجة',
            'shipped': 'تم الشحن',
            'delivered': 'تم التسليم'
        };
        
        const colorMap = {
            'pending': 'orange',
            'processing': 'blue',
            'shipped': 'purple',
            'delivered': 'green'
        };
        
        return `<span style="color: ${colorMap[status]}">${statusMap[status]}</span>`;
    }

    function loadProducts() {
        const products = storage.get('products') || [];
        const productsTable = document.querySelector('#productsTable tbody');
        productsTable.innerHTML = '';
        
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${product.image || '../images/default-product.png'}" alt="${product.name}" width="50"></td>
                <td>${product.name}</td>
                <td>${product.price.toFixed(2)} جنيه</td>
                <td>${product.category}</td>
                <td>${product.quantity}</td>
                <td>
                    <button class="btn btn-primary edit-product" data-id="${product.id}">تعديل</button>
                    <button class="btn btn-danger delete-product" data-id="${product.id}">حذف</button>
                </td>
            `;
            productsTable.appendChild(row);
        });
        
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id');
                editProduct(productId);
            });
        });
        
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id');
                deleteProduct(productId);
            });
        });
    }
    
    function editProduct(productId) {
        const products = storage.get('products') || [];
        const product = products.find(p => p.id === productId);
        
        if (!product) return;
        
        document.getElementById('modalTitle').textContent = 'تعديل المنتج';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productDescription').value = product.description;
        
        document.getElementById('productModal').style.display = 'block';
    }
    
    function deleteProduct(productId) {
        if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            const products = storage.get('products') || [];
            const updatedProducts = products.filter(p => p.id !== productId);
            storage.set('products', updatedProducts);
            loadProducts();
            loadDashboardStats(); 
        }
    }
    
    document.getElementById('addProductBtn').addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'إضافة منتج جديد';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('productModal').style.display = 'block';
    });
    
    document.getElementById('productForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const productId = document.getElementById('productId').value;
        const products = storage.get('products') || [];
        
        const productData = {
            id: productId || Date.now().toString(),
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            category: document.getElementById('productCategory').value,
            quantity: parseInt(document.getElementById('productQuantity').value),
            description: document.getElementById('productDescription').value,
            image: '../images/default-product.png' 
        };
        
        if (productId) {
            const index = products.findIndex(p => p.id === productId);
            products[index] = productData;
        } else {
            products.push(productData);
        }
        
        storage.set('products', products);
        document.getElementById('productModal').style.display = 'none';
        loadProducts();
        loadDashboardStats(); 
    });
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('productModal').style.display = 'none';
            document.getElementById('orderDetailsModal').style.display = 'none';
        });
    });
    
    document.getElementById('searchProductBtn').addEventListener('click', () => {
        const searchTerm = document.getElementById('productSearch').value.toLowerCase();
        const products = storage.get('products') || [];
        
        if (!searchTerm) {
            loadProducts();
            return;
        }
        
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            product.category.toLowerCase().includes(searchTerm)
        );
        
        const productsTable = document.querySelector('#productsTable tbody');
        productsTable.innerHTML = '';
        
        filteredProducts.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${product.image || '../images/default-product.png'}" alt="${product.name}" width="50"></td>
                <td>${product.name}</td>
                <td>${product.price.toFixed(2)} جنيه</td>
                <td>${product.category}</td>
                <td>${product.quantity}</td>
                <td>
                    <button class="btn btn-primary edit-product" data-id="${product.id}">تعديل</button>
                    <button class="btn btn-danger delete-product" data-id="${product.id}">حذف</button>
                </td>
            `;
            productsTable.appendChild(row);
        });
    });

    function loadOrders() {
        const orders = storage.get('orders') || [];
        const statusFilter = document.getElementById('orderStatusFilter').value;
        const ordersTable = document.querySelector('#ordersTable tbody');
        ordersTable.innerHTML = '';
        
        const filteredOrders = statusFilter === 'all' 
            ? orders 
            : orders.filter(order => order.status === statusFilter);
        
        filteredOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customerName}</td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>${(Number(order.total) || 0).toFixed(2)} جنيه</td>
                <td>${getOrderStatusBadge(order.status)}</td>
                <td>
                    <button class="btn btn-primary view-order" data-id="${order.id}">عرض</button>
                </td>
            `;
            ordersTable.appendChild(row);
        });
        
        document.querySelectorAll('.view-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-id');
                showOrderDetails(orderId);
            });
        });
    }
    
    function showOrderDetails(orderId) {
        const orders = storage.get('orders') || [];
        const order = orders.find(o => o.id === orderId);
        
        if (!order) return;
        
        document.getElementById('orderNumber').textContent = order.id;
        document.getElementById('customerName').textContent = order.customerName;
        document.getElementById('customerEmail').textContent = order.customerEmail;
        document.getElementById('shippingAddress').textContent = order.shippingAddress;
        document.getElementById('orderTotal').textContent = `${(Number(order.total) || 0).toFixed(2)} جنيه`;
        document.getElementById('updateOrderStatus').value = order.status;
        
        const orderItemsTable = document.querySelector('#orderItemsTable tbody');
        orderItemsTable.innerHTML = '';
        
        order.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.price.toFixed(2)} جنيه</td>
                <td>${item.quantity}</td>
                <td>${(item.price * item.quantity).toFixed(2)} جنيه</td>
            `;
            orderItemsTable.appendChild(row);
        });
        
        document.getElementById('orderDetailsModal').style.display = 'block';
    }
    
    document.getElementById('orderStatusFilter').addEventListener('change', loadOrders);
    
    document.getElementById('saveOrderStatus').addEventListener('click', () => {
        const orderId = document.getElementById('orderNumber').textContent;
        const newStatus = document.getElementById('updateOrderStatus').value;
        
        const orders = storage.get('orders') || [];
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            storage.set('orders', orders);
            loadOrders();
            loadDashboardStats(); 
            document.getElementById('orderDetailsModal').style.display = 'none';
        }
    });

    function loadUsers() {
        const users = storage.get('users') || [];
        const usersTable = document.querySelector('#usersTable tbody');
        usersTable.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>${user.isAdmin ? 'مسؤول' : 'مستخدم'}</td>
                <td>
                    ${!user.isAdmin ? `<button class="btn btn-primary make-admin" data-id="${user.id}">تعيين كمسؤول</button>` : ''}
                </td>
            `;
            usersTable.appendChild(row);
        });
        
        document.querySelectorAll('.make-admin').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.getAttribute('data-id');
                makeUserAdmin(userId);
            });
        });
    }
    
    function makeUserAdmin(userId) {
        if (confirm('هل أنت متأكد من تعيين هذا المستخدم كمسؤول؟')) {
            const users = storage.get('users') || [];
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex !== -1) {
                users[userIndex].isAdmin = true;
                storage.set('users', users);
                loadUsers();
            }
        }
    }

    loadDashboardStats();
    loadProducts();
    loadOrders();
    loadUsers();
});