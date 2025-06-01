// DOM Elements
const productGrid = document.querySelector('.product-grid');
const featuredProducts = document.querySelector('.featured-products');
const filterButtons = document.querySelectorAll('.filter-btn');
const cartIcon = document.querySelector('.cart-icon');
const cartCount = document.querySelector('.cart-count');
const cartModal = document.querySelector('.cart-modal');
const closeCart = document.querySelector('.close-cart');
const cartItemsContainer = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total span');
const checkoutBtn = document.querySelector('.checkout-btn');
const contactForm = document.getElementById('contact-form');

// Auth Elements
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const closeAuthBtns = document.querySelectorAll('.close-auth');
const switchToSignup = document.querySelectorAll('.switch-to-signup');
const switchToLogin = document.querySelectorAll('.switch-to-login');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authButtons = document.querySelector('.auth-buttons');

// Data
const users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialize the application
function init() {
    // Load products
    fetchProducts();
    
    // Initialize cart
    updateCart();
    
    // Initialize authentication
    updateAuthUI();
    setupAuthEventListeners();
    
    // Setup other event listeners
    setupEventListeners();
}

// Fetch products
function fetchProducts() {
    fetch('products.json')
        .then(response => response.json())
        .then(products => {
            displayProducts(products);
            displayFeaturedProducts(products);
            setupFilterButtons(products);
        })
        .catch(error => console.error('Error loading products:', error));
}

// Product Display Functions
function displayProducts(products) {
    productGrid.innerHTML = '';
    products.forEach(product => {
        productGrid.appendChild(createProductCard(product));
    });
}

function displayFeaturedProducts(products) {
    featuredProducts.innerHTML = '';
    products.filter(product => product.featured)
            .forEach(product => {
                featuredProducts.appendChild(createProductCard(product));
            });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.category = product.category;
    
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-rating">
                ${'★'.repeat(product.rating)}${'☆'.repeat(5 - product.rating)}
            </div>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <button class="add-to-cart" data-id="${product.id}">
                ${currentUser ? 'Add to Cart' : 'Login to Shop'}
            </button>
        </div>
    `;
    
    return card;
}

// Filter Functions
function setupFilterButtons(products) {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterProducts(products, button.dataset.category);
        });
    });
}

function filterProducts(products, category) {
    displayProducts(category === 'all' ? products : products.filter(p => p.category === category));
}

// Cart Functions
function addToCart(productId) {
    if (!currentUser) {
        openAuthModal('login');
        showNotification('Please login to add items to cart', 'error');
        return;
    }

    fetch('products.json')
        .then(response => response.json())
        .then(products => {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            const existingItem = cart.find(item => item.id === productId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            
            updateCart();
            showNotification('Item added to cart!', 'success');
        });
}

function updateCart() {
    saveToLocalStorage('cart', cart);
    updateCartCount();
    renderCartItems();
}

function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function updateCartCount() {
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
}

function renderCartItems() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty</p>';
        cartTotal.textContent = '0.00';
        return;
    }
    
    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <div class="cart-item-quantity">
                <button class="decrease-quantity" data-id="${item.id}">-</button>
                <span>${item.quantity}</span>
                <button class="increase-quantity" data-id="${item.id}">+</button>
            </div>
            <i class="fas fa-trash remove-item" data-id="${item.id}"></i>
        `;
        cartItemsContainer.appendChild(cartItem);
        total += item.price * item.quantity;
    });
    
    cartTotal.textContent = total.toFixed(2);
}

// Authentication Functions
function updateAuthUI() {
    if (currentUser) {
        authButtons.innerHTML = `
            <div class="user-greeting">
                <span>Welcome, ${currentUser.name.split(' ')[0]}</span>
                <button class="logout-btn">Logout</button>
            </div>
        `;
    } else {
        authButtons.innerHTML = `
            <button id="open-login" class="btn login-btn">Login</button>
            <button id="open-signup" class="btn signup-btn">Sign Up</button>
        `;
    }
}

function setupAuthEventListeners() {
    // Use event delegation for dynamic elements
    document.addEventListener('click', function(e) {
        // Handle login button
        if (e.target && e.target.id === 'open-login') {
            openAuthModal('login');
        }
        
        // Handle signup button
        if (e.target && e.target.id === 'open-signup') {
            openAuthModal('signup');
        }
        
        // Handle logout button
        if (e.target && e.target.classList.contains('logout-btn')) {
            logout();
        }
    });
    
    // Close modals
    closeAuthBtns.forEach(btn => btn.addEventListener('click', closeAuthModal));
    
    // Switch between forms
    switchToSignup.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'none';
            signupModal.style.display = 'flex';
        });
    });
    
    switchToLogin.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.style.display = 'none';
            loginModal.style.display = 'flex';
        });
    });
    
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
}

function openAuthModal(type) {
    if (type === 'login') {
        loginModal.style.display = 'flex';
        document.getElementById('login-email').focus();
    } else {
        signupModal.style.display = 'flex';
        document.getElementById('signup-name').focus();
    }
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    loginModal.style.display = 'none';
    signupModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        saveToLocalStorage('currentUser', user);
        closeAuthModal();
        updateAuthUI();
        fetchProducts(); // Refresh products to update add-to-cart buttons
        showNotification('Login successful!', 'success');
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (users.some(u => u.email === email)) {
        showNotification('Email already registered', 'error');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        joined: new Date().toISOString()
    };
    
    users.push(newUser);
    saveToLocalStorage('users', users);
    currentUser = newUser;
    saveToLocalStorage('currentUser', newUser);
    
    closeAuthModal();
    updateAuthUI();
    fetchProducts(); // Refresh products to update add-to-cart buttons
    showNotification('Account created successfully!', 'success');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    fetchProducts(); // Refresh products to update add-to-cart buttons
    showNotification('Logged out successfully', 'success');
    
    // Close all modals
    closeAuthModal();
    cartModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Utility Functions
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Event Listeners
function setupEventListeners() {
    // Cart events
    cartIcon.addEventListener('click', () => {
        cartModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
    
    closeCart.addEventListener('click', () => {
        cartModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === cartModal || e.target.classList.contains('auth-modal')) {
            cartModal.style.display = 'none';
            document.querySelectorAll('.auth-modal').forEach(m => m.style.display = 'none');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Cart item interactions
    cartItemsContainer.addEventListener('click', (e) => {
        const productId = parseInt(e.target.dataset.id);
        const item = cart.find(item => item.id === productId);
        
        if (!item) return;
        
        if (e.target.classList.contains('increase-quantity')) {
            item.quantity += 1;
        } else if (e.target.classList.contains('decrease-quantity')) {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== productId);
            }
        } else if (e.target.classList.contains('remove-item')) {
            cart = cart.filter(i => i.id !== productId);
        }
        
        updateCart();
    });
    
    // Checkout
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return;
        
        if (!currentUser) {
            openAuthModal('login');
            showNotification('Please login to checkout', 'error');
            return;
        }
        
        alert(`Thank you for your purchase, ${currentUser.name.split(' ')[0]}! Your order total is $${cartTotal.textContent}`);
        cart = [];
        updateCart();
        cartModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Contact form
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
        };
        
        if (!formData.name || !formData.email || !formData.message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        console.log('Form submitted:', formData);
        contactForm.reset();
        showNotification('Thank you for your message! We will get back to you soon.', 'success');
    });
    
    // Add to cart button events (delegated)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            addToCart(parseInt(e.target.dataset.id));
        }
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 3000;
        color: white;
    }
    
    .notification.show {
        transform: translateY(0);
        opacity: 1;
    }
    
    .notification.success {
        background-color: var(--success-color);
    }
    
    .notification.error {
        background-color: var(--danger-color);
    }
    
    .user-greeting {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .logout-btn {
        background-color: var(--danger-color);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
    }
    
    .logout-btn:hover {
        background-color: #c0392b;
    }
`;
document.head.appendChild(style);