import storage from '../storage.js';


function hashPassword(password) {
    return window.btoa(encodeURIComponent(password + 'SALT_STRING')); // SALT بسيط
}

function generateToken(user) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { 
        userId: user.id,
        isAdmin: user.isAdmin,
        exp: Date.now() + 3600000 
    };
    
    const encodedHeader = window.btoa(JSON.stringify(header));
    const encodedPayload = window.btoa(JSON.stringify(payload));
    const signature = window.btoa(`${encodedHeader}.${encodedPayload}.SECRET_KEY`);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyToken(token) {
    try {
        const [encodedHeader, encodedPayload, signature] = token.split('.');
        const expectedSignature = window.btoa(`${encodedHeader}.${encodedPayload}.SECRET_KEY`);
        
        if (signature !== expectedSignature) return null;
        
        const payload = JSON.parse(window.atob(encodedPayload));
        if (payload.exp < Date.now()) return null;
        
        return payload;
    } catch (e) {
        return null;
    }
}

const UserModel = {
    getAll() {
        return storage.get('users') || [];
    },
    
    getById(id) {
        return this.getAll().find(user => user.id === id);
    },
    
    getByEmail(email) {
        return this.getAll().find(user => user.email === email);
    },
    
    create(userData) {
        const users = this.getAll();
        if (this.getByEmail(userData.email)) {
            throw new Error('البريد الإلكتروني مسجل بالفعل');
        }
        
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            password: hashPassword(userData.password), 
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        storage.set('users', users);
        return newUser;
    },
    
    update(id, updates) {
        const users = this.getAll();
        const index = users.findIndex(user => user.id === id);
        if (index === -1) return null;
        
        if (updates.password) {
            updates.password = hashPassword(updates.password);
        }
        
        users[index] = { ...users[index], ...updates };
        storage.set('users', users);
        return users[index];
    }
};

function setCurrentUser(user) {
    const token = generateToken(user);
    storage.set('auth_token', token);
    storage.set('current_user', {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
    });
    return token;
}

function getCurrentUser() {
    return storage.get('currentUser');
}

async function login(email, password) {
    try {
        const users = UserModel.getAll();
        const hashedPassword = hashPassword(password);
        const user = users.find(u => u.email === email);
        
        if (!user) {
            document.getElementById('loginEmailError').textContent = 'البريد الإلكتروني غير مسجل';
            return false;
        }

        if (user.password !== hashedPassword) {
            document.getElementById('loginPasswordError').textContent = 'كلمة المرور غير صحيحة';
            return false;
        }
        
        const userData = {
            id: user.id,
            email: user.email,
            username: user.username,
            isAdmin: Boolean(user.isAdmin),
            token: generateToken(user)
        };
        
        storage.set('currentUser', userData);

        if (userData.isAdmin) {
            window.location.href = '../admin/admin.html';
        } else {
            const redirectPath = storage.get('redirectAfterAuth');
            if (redirectPath) {
                storage.remove('redirectAfterAuth');
                window.location.href = redirectPath;
            } else {                window.location.href = '../index.html';
            }
        }
        return true;
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('loginPasswordError').textContent = 'حدث خطأ أثناء تسجيل الدخول';
        return false;
    }
}

function initializeUsers() {
    if (!storage.get('users')) {
        UserModel.create({
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123',
            isAdmin: true
        });
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function handleLoginForm(e) {
    e.preventDefault();
    
   
    document.querySelectorAll('#loginForm .error-message').forEach(el => {
        el.textContent = '';
    });
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    let isValid = true;
    
    if (!validateEmail(email)) {
        document.getElementById('loginEmailError').textContent = 'بريد إلكتروني غير صالح';
        isValid = false;
    }
    
    if (password.length < 6) {
        document.getElementById('loginPasswordError').textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        isValid = false;
    }
    
    if (isValid) {
       
        const submitButton = document.querySelector('#loginForm button[type="submit"]');
        submitButton.disabled = true;
        
        login(email, password).finally(() => {
          
            submitButton.disabled = false;
        });
    }
}

function register(username, email, password, isAdmin) {
    try {
        const newUser = UserModel.create({
            username,
            email,
            password,
            isAdmin: Boolean(isAdmin)
        });
        
        setCurrentUser(newUser);
        return newUser;
    } catch (error) {
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeUsers();
    
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginForm);
    }
    
    const loginContainer = document.getElementById('loginContainer');
    const registerContainer = document.getElementById('registerContainer');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
      const currentUser = getCurrentUser();
    if (currentUser) {
        window.location.href = currentUser.isAdmin ? '../admin/admin.html' : '../index.html';
        return;
    }
    
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    });
    
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });
    document.getElementById('loginForm').addEventListener('submit', handleLoginForm);
    
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        document.querySelectorAll('#registerForm .error-message').forEach(el => {
            el.textContent = '';
        });
        
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const isAdmin = document.getElementById('registerIsAdmin').checked;
        let isValid = true;
        
        if (username.length < 3) {
            document.getElementById('registerUsernameError').textContent = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
            isValid = false;
        }
        
        if (!validateEmail(email)) {
            document.getElementById('registerEmailError').textContent = 'بريد إلكتروني غير صالح';
            isValid = false;
        }
        
        if (password.length < 6) {
            document.getElementById('registerPasswordError').textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
            isValid = false;
        }
        
        if (password !== confirmPassword) {
            document.getElementById('registerConfirmPasswordError').textContent = 'كلمة المرور غير متطابقة';
            isValid = false;
        }
        
        if (isValid) {            try {
                register(username, email, password, isAdmin);
                alert('تم إنشاء الحساب بنجاح! سيتم توجيهك إلى صفحة تسجيل الدخول');
                registerContainer.style.display = 'none';
                loginContainer.style.display = 'block';
                document.getElementById('loginEmail').value = email;
            } catch (error) {
                document.getElementById('registerEmailError').textContent = error.message;
            }
        }
    });
});