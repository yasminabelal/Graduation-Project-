import { formatPrice, validateCoupon, calculateDiscount } from '../utils/format.js';

let cartItems = [];

const elements = {
    cartItems: document.getElementById('cartItems'),
    emptyCartMsg: document.getElementById('emptyCartMsg'),
    subtotal: document.getElementById('subtotal'),
    totalAmount: document.getElementById('totalAmount'),
    tax: document.getElementById('tax'),
    checkoutBtn: document.getElementById('checkoutBtn')
};

function getCartItems() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCartItems(items) {
    localStorage.setItem('cart', JSON.stringify(items));
}

function toggleEmptyCartMessage() {
    if (elements.emptyCartMsg) {  
        elements.emptyCartMsg.style.display = cartItems.length === 0 ? 'block' : 'none';
    }
}

function updateCartTotals() {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    if (elements.subtotal) {
        elements.subtotal.textContent = `${subtotal.toFixed(2)} جنيه`;
    }
    if (elements.totalAmount) {
        elements.totalAmount.textContent = `${subtotal.toFixed(2)} جنيه`;
    }
}

function loadCart() {
    cartItems = getCartItems();
    renderCartItems();
    updateCartTotals();
    toggleEmptyCartMessage();
}

function renderCartItems() {
    if (!elements.cartItems) return;
    
    elements.cartItems.innerHTML = cartItems.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p class="price">${item.price} جنيه</p>
                <div class="quantity-controls">
                    <button class="decrease-qty">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="increase-qty">+</button>
                </div>
            </div>
            <button class="remove-item">×</button>
        </div>
    `).join('');
}

function init() {
    loadCart();
    
    if (elements.cartItems) {
        elements.cartItems.addEventListener('click', handleCartActions);
    }
    
    if (elements.checkoutBtn) {
        elements.checkoutBtn.addEventListener('click', function() {
            const cartData = {
                items: getCartItems(),
                total: elements.totalAmount.textContent,
                subtotal: elements.subtotal.textContent
            };
            localStorage.setItem('pendingOrder', JSON.stringify(cartData));
            window.location.href = 'order-confirmation.html';
        });
    }
}

function handleCartActions(event) {
    const cartItem = event.target.closest('.cart-item');
    if (!cartItem) return;

    const itemId = cartItem.dataset.id;
    const item = cartItems.find(item => item.id == itemId);

    if (event.target.classList.contains('increase-qty')) {
        item.quantity++;
        saveCartItems(cartItems);
        loadCart();
    } 
    else if (event.target.classList.contains('decrease-qty')) {
        if (item.quantity > 1) {
            item.quantity--;
            saveCartItems(cartItems);
            loadCart();
        }
    } 
    else if (event.target.classList.contains('remove-item')) {
        cartItems = cartItems.filter(item => item.id != itemId);
        saveCartItems(cartItems);
        loadCart();
    }
}

function initializeCouponSystem() {
    const couponBtn = document.getElementById('applyCoupon');
    const couponInput = document.getElementById('couponCode');
    const discountRow = document.getElementById('discountRow');
    const discountSpan = document.getElementById('discount');
    
    couponBtn.addEventListener('click', () => {
        const code = couponInput.value.trim();
        const discountPercentage = validateCoupon(code);
        
        if (discountPercentage > 0) {
            const subtotalValue = parseFloat(elements.subtotal.textContent);
            const discountAmount = calculateDiscount(subtotalValue, discountPercentage);
            
            discountRow.style.display = 'flex';
            discountSpan.textContent = formatPrice(discountAmount);
            
            updateTotalWithDiscount(discountAmount);
            
            localStorage.setItem('appliedCoupon', code);
            
            alert(`تم تطبيق الخصم بنجاح! (${discountPercentage}%)`);
        } else {
            alert('كود الخصم غير صالح');
            discountRow.style.display = 'none';
            localStorage.removeItem('appliedCoupon');
        }
    });
}

function updateTotalWithDiscount(discountAmount) {
    const subtotal = parseFloat(elements.subtotal.textContent);
    const tax = parseFloat(elements.tax.textContent);
    const total = subtotal + tax - discountAmount;
    elements.totalAmount.textContent = formatPrice(total);
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    initializeCouponSystem();
});

document.addEventListener('DOMContentLoaded', init);

export { getCartItems, saveCartItems };

const styles = `
    .remove-btn {
        background: none;
        border: none;
        color: #e74c3c;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        margin-right: 1rem;
        transition: color 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .remove-btn:hover {
        color: #c0392b;
    }

    .cart-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        margin-bottom: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .item-image {
        width: 100px;
        margin-left: 1rem;
    }

    .item-image img {
        width: 100%;
        height: auto;
        border-radius: 4px;
    }

    .item-details {
        flex: 1;
    }

    .quantity-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 0.5rem;
    }

    .quantity-btn {
        width: 30px;
        height: 30px;
        border: 1px solid #ddd;
        background: white;er
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        transition: all 0.3s;
    }

    .quantity-btn:hover {
        background: #f8f9fa;
        border-color: #adb5bd;
    }

    .quantity {
        min-width: 40px;
        text-align: center;
    }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);