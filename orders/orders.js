import storage from '../storage.js';

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = storage.get('currentUser');
    
    if (!currentUser) {
        window.location.href = '../auth/auth.html';
        return;
    }

    initPage(currentUser);
});

function initPage(currentUser) {
    toggleAdminLink(currentUser);
    
    displayUserOrders(currentUser);
    
    addEventListeners();
}

function toggleAdminLink(user) {
    const adminLink = document.getElementById('adminLink');
    if (adminLink) {
        adminLink.style.display = user?.isAdmin ? 'inline' : 'none';
    }
}

function displayUserOrders(user) {
    const orders = getFilteredOrders(user);
    renderOrders(orders);
}

function getFilteredOrders(user) {
    const allOrders = storage.get('orders') || [];
    
    if (allOrders.length === 0) {
        return [];
    }
    
    return user?.isAdmin 
        ? allOrders 
        : allOrders.filter(order => order.userId === user?.id);
}

function renderOrders(orders) {
    const container = document.getElementById('ordersContainer');
    
    if (!container) return;
    
    if (!Array.isArray(orders) || orders.length === 0) {
        container.innerHTML = '<p class="no-orders">لا توجد طلبات سابقة</p>';
        return;
    }
    
    const validOrders = orders.filter(validateOrder);
    container.innerHTML = validOrders.map(order => createOrderCard(order)).join('');
}

function createOrderCard(order) {
    return `
        <div class="order-card">
            <div class="order-header">
                <h3>طلب #${order.id}</h3>
                <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-details">
                <p>
                    <span>التاريخ:</span>
                    <strong>${formatDate(order.date)}</strong>
                </p>
                <p>
                    <span>عدد المنتجات:</span>
                    <strong>${calculateTotalItems(order.items)}</strong>
                </p>
                <p>
                    <span>الإجمالي:</span>
                    <strong>${formatPrice(order.total)}</strong>
                </p>
            </div>
            <button class="view-order-btn" data-id="${order.id}">
                <i class="fas fa-eye"></i>
                عرض التفاصيل
            </button>
        </div>
    `;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ar-EG');
}

function calculateTotalItems(items) {
    return items.reduce((total, item) => total + item.quantity, 0);
}

function formatPrice(price) {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0.00 جنيه' : `${numPrice.toFixed(2)} جنيه`;
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'قيد الانتظار',
        'processing': 'قيد التجهيز',
        'shipped': 'تم الشحن',
        'delivered': 'تم التسليم',
        'cancelled': 'ملغى'
    };
    return statusMap[status] || status;
}

function addEventListeners() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-order-btn')) {
            const orderId = e.target.getAttribute('data-id');
            viewOrderDetails(orderId);
        }
    });
}

function viewOrderDetails(orderId) {
    window.location.href = `order-details.html?id=${orderId}`;
}

function validateOrder(order) {
    return order && 
           order.id && 
           order.date && 
           order.items && 
           Array.isArray(order.items) && 
           (typeof order.total === 'number' || typeof order.total === 'string');
}