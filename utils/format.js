export function formatPrice(price) {
    return `${parseFloat(price).toFixed(2)} جنيه`;
}

export const coupons = {
    'WELCOME10': 10,
    'SALE20': 20,
    'SPECIAL50': 50
};

export function validateCoupon(code) {
    return coupons[code.toUpperCase()] || 0;
}

export function calculateDiscount(total, discountPercentage) {
    return (total * discountPercentage) / 100;
}