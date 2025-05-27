document.addEventListener('DOMContentLoaded', () => {
    const orderData = JSON.parse(localStorage.getItem('pendingOrder'));
    
    if (!orderData) {
        window.location.href = 'cart.html';
        return;
    }

    const elements = {
        orderId: document.getElementById('orderId'),
        orderDate: document.getElementById('orderDate'),
        itemsList: document.getElementById('itemsList'),
        subtotal: document.getElementById('subtotal'),
        tax: document.getElementById('tax'),
        total: document.getElementById('total'),
        creditCardRadio: document.getElementById('creditCard'),
        cardDetails: document.getElementById('cardDetails'),
        confirmOrderBtn: document.getElementById('confirmOrderBtn')
    };

    if (validateElements(elements)) {
        displayOrderDetails(orderData, elements);
        setupEventListeners(elements);
    }
});

function validateElements(elements) {
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Element not found: ${key}`);
            return false;
        }
    }
    return true;
}

function displayOrderDetails(orderData, elements) {
    elements.orderId.textContent = `ORD-${Date.now()}`;
    elements.orderDate.textContent = new Date().toLocaleDateString('ar-EG');

    elements.itemsList.innerHTML = orderData.items.map(item => `
        <div class="item-card">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p>السعر: ${item.price} جنيه</p>
                <p>الكمية: ${item.quantity}</p>
                <p>الإجمالي: ${(item.price * item.quantity).toFixed(2)} جنيه</p>
            </div>
        </div>
    `).join('');

    const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.14;
    const total = subtotal + tax;

    elements.subtotal.textContent = `${subtotal.toFixed(2)} جنيه`;
    elements.tax.textContent = `${tax.toFixed(2)} جنيه`;
    elements.total.textContent = `${total.toFixed(2)} جنيه`;
}

function setupEventListeners(elements) {
    elements.creditCardRadio.addEventListener('change', (e) => {
        elements.cardDetails.style.display = e.target.checked ? 'block' : 'none';
    });

    elements.confirmOrderBtn.addEventListener('click', () => {
        if (elements.creditCardRadio.checked) {
            if (!validateCardDetails()) {
                alert('الرجاء إدخال بيانات البطاقة بشكل صحيح');
                return;
            }
        }
        saveOrder();
        window.location.href = '../orders/orders.html';
    });
}

function validateCardDetails() {
    const cardNumber = document.getElementById('cardNumber')?.value;
    const cardExpiry = document.getElementById('cardExpiry')?.value;
    const cardCvc = document.getElementById('cardCvc')?.value;
    
    return cardNumber && cardExpiry && cardCvc;
}

function saveOrder() {
    const orderData = JSON.parse(localStorage.getItem('pendingOrder'));
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = '../auth/auth.html';
        return;
    }
      const newOrder = {
        id: `ORD-${Date.now()}`,
        date: new Date().toISOString(),
        items: orderData.items,
        total: orderData.total,
        status: 'pending',
        userId: currentUser.id
    };
    
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.removeItem('pendingOrder');
    localStorage.removeItem('cart');
}