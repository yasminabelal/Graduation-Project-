const storage = {
    set(key, value) {
        try {
            const data = JSON.stringify(value);
            localStorage.setItem(key, data);
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    clear() {
        localStorage.clear();
    },

    hasSpace(neededBytes = 0) {
        try {
            const current = JSON.stringify(localStorage).length;
            return (current + neededBytes) < 5000000;
        } catch (error) {
            console.error('Error checking storage space:', error);
            return false;
        }
    },

    merge(key, newData, mergeStrategy = 'replace') {
        try {
            const existingData = this.get(key, {});
            let mergedData;

            if (mergeStrategy === 'merge' && typeof existingData === 'object' && typeof newData === 'object') {
                mergedData = {...existingData, ...newData};
            } else {
                mergedData = newData;
            }

            return this.set(key, mergedData);
        } catch (error) {
            console.error('Error merging data:', error);
            return false;
        }
    },

    pushToArray(key, item) {
        try {
            const array = this.get(key, []);
            array.push(item);
            return this.set(key, array);
        } catch (error) {
            console.error('Error pushing to array:', error);
            return false;
        }
    },

    updateInArray(key, idKey, updatedItem) {
        try {
            const array = this.get(key, []);
            const index = array.findIndex(item => item[idKey] === updatedItem[idKey]);
            
            if (index !== -1) {
                array[index] = {...array[index], ...updatedItem};
                return this.set(key, array);
            }
            
            return false;
        } catch (error) {
            console.error('Error updating array item:', error);
            return false;
        }
    },

    removeFromArray(key, idKey, itemId) {
        try {
            const array = this.get(key, []);
            const filteredArray = array.filter(item => item[idKey] !== itemId);
            return this.set(key, filteredArray);
        } catch (error) {
            console.error('Error removing from array:', error);
            return false;
        }
    },

    getCurrentUser() {
        return this.get('current_user');
    },

    setCurrentUser(user) {
        return this.set('current_user', user);
    },

    removeCurrentUser() {
        this.remove('current_user');
    },

    getCart() {
        return this.get('cart', []);
    },

    setCart(cartItems) {
        return this.set('cart', cartItems);
    },

    getProducts() {
        return this.get('products', []);
    },

    setProducts(products) {
        return this.set('products', products);
    },

    getOrders() {
        return this.get('orders', []);
    },

    setOrders(orders) {
        return this.set('orders', orders);
    }
};

export default storage;