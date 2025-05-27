document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        window.location.href = 'orders.html';
        return;
    }

    loadOrderDetails(orderId);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

function loadOrderDetails(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        alert('الطلب غير موجود');
        window.location.href = 'orders.html';
        return;
    }

    document.getElementById('orderId').textContent = order.id;
    document.getElementById('orderDate').textContent = new Date(order.date).toLocaleDateString('ar-EG');
    document.getElementById('orderStatus').textContent = getStatusText(order.status);

    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = order.items.map(item => `
        <div class="order-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-info">
                <h3>${item.name}</h3>
                <p>السعر: ${item.price} جنيه</p>
                <p>الكمية: ${item.quantity}</p>
                <p>الإجمالي: ${(item.price * item.quantity).toFixed(2)} جنيه</p>
            </div>
        </div>
    `).join('');

    const subtotal = order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.14; 
    const total = subtotal + tax;

    document.getElementById('subtotal').textContent = `${subtotal.toFixed(2)} جنيه`;
    document.getElementById('tax').textContent = `${tax.toFixed(2)} جنيه`;
    document.getElementById('total').textContent = `${total.toFixed(2)} جنيه`;
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

function handleLogout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    
    window.location.href = '../auth/auth.html';
}