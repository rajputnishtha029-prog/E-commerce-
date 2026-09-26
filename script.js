// 🔑 Apni Razorpay Test Key Yahan Paste Karein:
const RAZORPAY_KEY = 'rzp_test_TcJyzmy4acf9Bz'; 

let products = [];
let filteredProducts = [];
let cart = [];

// Fetch Products from Database
// Fetch Products from Database
async function fetchProductsFromDB() {
  try {
 const response = await fetch('https://e-commerce-1-in9j.onrender.com/api/products');
    const data = await response.json();
    
    products = data.map(p => ({ ...p, quantity: 1 }));
    filteredProducts = [...products];

    // Smooth render setup
    renderProducts(filteredProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    document.getElementById('product-list').innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>Server connection failed!</p>";
  }
}

function renderProducts(itemsToRender) {
  const productList = document.getElementById('product-list');
  if (!productList) return;

  if (!itemsToRender || itemsToRender.length === 0) {
    productList.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">No products found!</p>`;
    return;
  }

  const productsHTML = itemsToRender.map(product => {
    const id = product._id || product.id;
    const imageUrl = product.image ? product.image.trim() : '';
    const isLiked = typeof wishlist !== 'undefined' && wishlist.includes(id);
    const qty = product.quantity || 1;

    return `
      <div class="product-card" style="position: relative;">
        <button onclick="toggleWishlist('${id}')" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.8); border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2;">
          ${isLiked ? '❤️' : '🤍'}
        </button>
        
        <img src="${imageUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/200'" onclick="openProductModal('${id}')" style="cursor: pointer;">
        
        <div class="product-info">
          <h3>${product.name}</h3>
          <p class="price">₹${product.price}</p>
          
          <!-- Reference Image Quantity Selector -->
          <div class="quantity-selector-container">
            <button class="quantity-btn decrement" onclick="updateCardQty('${id}', -1)">-</button>
            <span class="quantity-number">${qty}</span>
            <button class="quantity-btn increment" onclick="updateCardQty('${id}', 1)">+</button>
          </div>

          <div class="card-actions" style="display: flex; gap: 8px; margin-top: 10px;">
            <button class="btn btn-primary" style="flex: 1; padding: 8px;" onclick="addToCart('${id}')">Add to Cart</button>
            <button class="btn btn-success" style="flex: 1; padding: 8px; background: #16a34a; color: #fff; border: none; border-radius: 6px; cursor: pointer;" onclick="buyNow('${id}')">Buy Now</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  productList.innerHTML = productsHTML;
}
                  
// Search Filter
function filterProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    filteredProducts = products.filter(p => p.name.toLowerCase().includes(query));
    renderProducts(filteredProducts);
}

// Category Filter
function filterCategory(category, evt) {
    if (evt && evt.target) {
        document.querySelectorAll('.pill').forEach(btn => btn.classList.remove('active'));
        evt.target.classList.add('active');
    }

    const selectedCategory = category.toLowerCase();

    if (selectedCategory === 'all') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(p => {
            const name = (p.name || '').toLowerCase();
            
            if (selectedCategory === 'ring') {
                return name.includes('ring') && !name.includes('earring');
            } else if (selectedCategory === 'chain') {
                return name.includes('chain') || name.includes('necklace');
            } else if (selectedCategory === 'bracelet') {
                return name.includes('bracelet') || name.includes('braclet');
            } else if (selectedCategory === 'earring') {
                return name.includes('earring');
            } else if (selectedCategory === 'pendant') {
                return name.includes('pendant');
            } else if (selectedCategory === 'set') {
                return name.includes('set') || name.includes('combo');
            }
            return name.includes(selectedCategory);
        });
    }

    renderProducts(filteredProducts);
}


// 1. Plus / Minus Quantity Buttons Handler
function updateCardQty(productId, change) {
  const prod = products.find(p => (p._id || p.id) === productId);
  if (prod) {
    const newQty = (prod.quantity || 1) + change;
    prod.quantity = Math.max(1, newQty);
    renderProducts(filteredProducts);
  }
}

// 2. Selected Quantity ke sath Cart me Add karne ka Logic
// Add to Cart Function with LocalStorage and UI Sync
function addToCart(id) {
  const product = products.find(p => (p._id || p.id) === id);
  if (product) {
    const selectedQty = product.quantity || 1;
    const existingItem = cart.find(item => (item._id || item.id) === id);

    if (existingItem) {
      existingItem.quantity += selectedQty;
    } else {
      cart.push({ ...product, quantity: selectedQty });
    }

    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Reset product card quantity back to 1
    product.quantity = 1;

    // Refresh UI components
    if (typeof updateCartUI === 'function') updateCartUI();
    if (typeof renderCart === 'function') renderCart();
    if (typeof updateCartBadge === 'function') updateCartBadge();
    
    if (typeof showToast === 'function') {
      showToast(`${selectedQty} ${product.name} added to cart!`);
    }

    renderProducts(filteredProducts);
  }
}

async function buyNow(id) {
    const product = products.find(p => p._id === id);
    if (!product) return;

    try {
   const response = await fetch('https://e-commerce-1-in9j.onrender.com/api/payment/razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: product.price })
        });

        const rzpOrder = await response.json();

        if (!response.ok || !rzpOrder.id) {
            alert("Order Error: " + (rzpOrder.error || "Order ID missing"));
            return;
        }

      const options = {
    "key": 'rzp_test_TcJyzmy4acf9Bz',
    "amount": rzpOrder.amount,
    "currency": "INR",
    "name": "MyStore Jewelry",
    "description": "Jewelry Purchase",
    "order_id": rzpOrder.id,
    "handler": function (res) {
    alert("🎉 Payment Success! ID: " + res.razorpay_payment_id);
    
    // Cart clear aur modal close
    cart = [];
    if (typeof updateCartUI === "function") updateCartUI();
    const cartModal = document.getElementById("cartModal");
    if (cartModal) cartModal.style.display = "none";
},
   "prefill": {
    "name": "Test Customer",
    "email": "customer@gmail.com",
    "contact": "9876543210"
},
    "readonly": {
        "contact": true,
        "email": true
    },
    "theme": { "color": "#2563eb" }
};

        const rzp = new Razorpay(options);
        rzp.open();
    } catch (err) {
        console.error("Payment trigger error:", err);
        alert("Server network error!");
    }
}

// Change Quantity in Modal
function changeCartQuantity(id, change) {
    const item = cart.find(i => i._id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) cart = cart.filter(i => i._id !== id);
        updateCartUI();
    }
}

// Update Cart UI
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').innerText = totalItems;

    const cartItems = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        cartItems.innerHTML = "<p style='text-align:center; color:#94a3b8; padding:20px;'>Your cart is empty!</p>";
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item-row">
                <span>${item.name}</span>
                <div style="display:flex; gap:6px; align-items:center;">
                    <button class="qty-btn" onclick="changeCartQuantity('${item._id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="changeCartQuantity('${item._id}', 1)">+</button>
                </div>
                <strong style="color:#059669;">₹${item.price * item.quantity}</strong>
            </div>
        `).join('');
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cart-total').innerText = total;
}

function toggleCart() {
    document.getElementById('cart-modal').classList.toggle('hidden');
}

// Checkout
function checkout() {
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalAmount === 0) return alert("Cart is empty!");

    var options = {
        "key": 'rzp_test_TcJyzmy4acf9Bz',
        "amount": totalAmount * 100,
        "currency": "INR",
        "name": "MyStore",
        "description": "E-Commerce Order Payment",
        "handler": function (response) {
            alert("🎉 Payment Successful!\nPayment ID: " + response.razorpay_payment_id);
            cart = [];
            updateCartUI();
            toggleCart();
        },
        "prefill": {
            "name": "Test User",
            "email": "testuser@gmail.com",
            "contact": "9876512345"
        },
        "theme": { "color": "#16a34a" }
    };

    var rzp = new Razorpay(options);
    rzp.open();
}

fetchProductsFromDB();


// Auth Modal Toggles
function toggleAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.toggle('hidden');
        if (modal.classList.contains('hidden')) {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'flex';
        }
    }
}

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

function switchAuth(type) {
    if (type === 'signup') {
        document.getElementById('login-box').classList.add('hidden');
        document.getElementById('signup-box').classList.remove('hidden');
    } else {
        document.getElementById('signup-box').classList.add('hidden');
        document.getElementById('login-box').classList.remove('hidden');
    }
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    
    // User info local storage me save karna zaruri hai
    const username = email.split('@')[0];
    localStorage.setItem('token', 'user-logged-in-token');
    localStorage.setItem('user', JSON.stringify({ name: username }));

    alert(`Welcome back, ${email}!`);
    
    // Button text always 'Login'
    document.getElementById('user-btn').innerText = "Login";
    
    toggleAuthModal();
    updateAuthUI(); // UI update trigger
}

// Handle Signup
function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    
    // New User info local storage me save karna
    localStorage.setItem('token', 'user-logged-in-token');
    localStorage.setItem('user', JSON.stringify({ name: name }));

    alert(`Account created successfully for ${name}!`);
    
    // Button text always 'Login'
    document.getElementById('user-btn').innerText = "Login";
    
    toggleAuthModal();
    updateAuthUI(); // UI update trigger
}

// REAL BACKEND SIGNUP
async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
     const response = await fetch('https://e-commerce-1-in9j.onrender.com/api/payment/razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.user.name);
            updateUserUI(data.user.name);
            toggleAuthModal();
            alert('Account created successfully!');
        } else {
            alert(data.message || 'Signup failed');
        }
    } catch (err) {
        alert('Backend connection error!');
    }
}

// REAL BACKEND LOGIN
async function handleLogin(e) {
    if (e) e.preventDefault();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    if (!emailInput || !passwordInput) return;

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
       const response = await fetch('https://e-commerce-1-in9j.onrender.com/api/payment/razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // Token save karein
            localStorage.setItem('token', data.token || 'dummy-token');
            
            // Name extract karein: Pehle backend data, varna email se name nikalein
            const userName = (data.user && data.user.name) ? data.user.name : email.split('@')[0];
            localStorage.setItem('user', JSON.stringify({ name: userName, email: email }));

            // Form inputs reset/clear karein
            const loginForm = document.querySelector('#login-box form');
            if (loginForm) loginForm.reset();

            // Modal hide aur UI update
            closeAuthModal();
            updateAuthUI();

            if (typeof showToast === 'function') {
                showToast(`Welcome back, ${userName}!`, 'success');
            }
        } else {
            alert(data.message || 'Login failed!');
        }
    } catch (err) {
        console.error('Backend connection error:', err);
        // Fallback testing logic
        const fallbackName = email.split('@')[0];
        localStorage.setItem('token', 'temp-test-token');
        localStorage.setItem('user', JSON.stringify({ name: fallbackName, email: email }));
        
        closeAuthModal();
        updateAuthUI();
        if (typeof showToast === 'function') {
            showToast(`Logged in as ${fallbackName}`, 'success');
        }
    }
}

function updateAuthUI() {
    const authBtn = document.getElementById('user-btn');
    const welcomeText = document.getElementById('user-welcome');
    const token = localStorage.getItem('token');
    
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        user = null;
    }

    // Name extracted from user object or localstorage
    const name = (user && user.name) ? user.name : localStorage.getItem('userName');

    if ((token || user) && name) {
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        
        if (welcomeText) {
            welcomeText.innerText = `Welcome, ${formattedName}`;
            welcomeText.style.display = 'inline-block';
        }
        if (authBtn) {
            authBtn.innerText = 'Logout';
            authBtn.onclick = logoutUser;
        }
    } else {
        if (welcomeText) {
            welcomeText.innerText = '';
            welcomeText.style.display = 'none';
        }
        if (authBtn) {
            authBtn.innerText = 'Login';
            authBtn.onclick = openAuthModal;
        }
    }
}
// Login Submit Handler
function handleLogin(e) {
    if (e) e.preventDefault();
    
    // ... aapka purana login processing/token save logic ...

    // Form inputs clear karein
    const loginForm = document.querySelector('#login-box form');
    if (loginForm) loginForm.reset();

    // Modal close & UI update
    closeAuthModal();
    updateAuthUI();
    
    if (typeof showToast === 'function') {
        showToast('Login successful!', 'success');
    }
}

// Sign Up / Register Submit Handler
function handleSignup(e) {
    if (e) e.preventDefault();

    // ... aapka purana signup processing/user save logic ...

    // Sign Up form inputs clear karein
    const signupForm = document.querySelector('#signup-box form') || e.target;
    if (signupForm && typeof signupForm.reset === 'function') {
        signupForm.reset();
    }

    // Modal close & UI update
    closeAuthModal();
    updateAuthUI();

    if (typeof showToast === 'function') {
        showToast('Account created successfully!', 'success');
    }
}

// Handle Signup Form
function handleSignup(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById('signup-name');
    const name = nameInput ? nameInput.value : 'User';

    localStorage.setItem('token', 'active-session-token');
    localStorage.setItem('user', JSON.stringify({ name: name }));

    alert(`Account created successfully for ${name}!`);

    if (typeof toggleAuthModal === 'function') toggleAuthModal();
    updateAuthUI();
}



// Initial Execution on Page Load
document.addEventListener('DOMContentLoaded', updateAuthUI);
updateAuthUI();

// Open Checkout Modal & Close Cart
function openCheckoutModal() {
    // 1. Cart Modal ko dhund kar hide karein
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.classList.add('hidden');
        cartModal.style.display = 'none';
    }

    // 2. Checkout Modal ko show karein
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'flex';
    } else {
        showToast("Checkout form HTML file mein nahi mil raha hai!");
    }
}

// Close Checkout Modal
function closeCheckoutModal() {
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'none';
    }
}

// Handle Order Submission (COD & Online Payment)
async function handleCheckoutSubmit(e) {
    if (e) e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.email) {
        alert("Please Login first to place an order!");
        if (typeof openAuthModal === 'function') openAuthModal();
        return;
    }

    const name = document.getElementById('cust-name')?.value || '';
    const phone = document.getElementById('cust-phone')?.value || '';
    const address = document.getElementById('cust-address')?.value || '';
    const paymentMethod = document.getElementById('payment-method')?.value || 'online';

    if (!name || !phone || !address) {
        alert("Please fill all shipping details!");
        return;
    }

    // Total Amount Calculation
    const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);

    if (totalAmount <= 0) {
        alert("Your cart is empty!");
        return;
    }

    const orderDetails = { name, phone, address, userEmail: user.email };

    // Close checkout form modal
    if (typeof closeCheckoutModal === 'function') closeCheckoutModal();

    // Check payment selection: Online Payment vs Cash on Delivery
    if (paymentMethod === 'online') {
        // Trigger Razorpay gateway
        if (typeof payWithRazorpay === 'function') {
            payWithRazorpay(totalAmount, orderDetails);
        } else {
            alert("Payment gateway function missing!");
        }
    } else {
        // Cash on delivery direct order save
        saveOrderToDatabase(orderDetails, totalAmount, 'COD');
    }
}

// Helper Function to Save Order in DB
async function saveOrderToDatabase(orderDetails, totalAmount, paymentStatus) {
    const orderData = {
        userEmail: orderDetails.userEmail,
        customerName: orderDetails.name,
        phone: orderDetails.phone,
        address: orderDetails.address,
        items: cart,
        totalAmount: totalAmount,
        paymentStatus: paymentStatus
    };

    try {
   const response = await fetch('https://e-commerce-1-in9j.onrender.com/api/payment/razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

if (response.ok) {
            alert(`🎉 Order Placed Successfully!\n\nThank you, ${orderDetails.name}. Your order has been saved.`);
            cart = [];
            localStorage.removeItem('cart');
            if (typeof updateCartUI === 'function') updateCartUI();
            if (typeof toggleCart === 'function') toggleCart();
            document.getElementById('checkout-form')?.reset();

            // Modal hide karne ke liye
            document.getElementById('cartModal')?.setAttribute('style', 'display: none !important');
            document.querySelector('.cart-modal')?.classList.remove('active', 'open', 'show');
        } else {
            alert("Failed to place order. Please try again.");
        }
    } catch (error) {
        console.error("Order error:", error);
        alert("Server connection failed!");
    }
}

// Trigger Razorpay Payment with Address Info
function triggerRazorpayPayment(name, phone, address) {
    const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0) || 4999;

    var options = {
        "key": 'rzp_test_TcJyzmy4acf9Bz',
        "amount": totalAmount * 100,
        "currency": "INR",
        "name": "MyStore",
        "description": "Jewelry Purchase",
        "prefill": {
            "name": name,
            "contact": phone
        },
       "handler": function (response) {
            showToast(`Payment Successful! Order placed for ${name}`, 'success');
            
            // Save order history
            const newOrder = {
                id: 'ORD' + Date.now(),
                date: new Date().toLocaleDateString(),
                name: name,
                address: address,
                paymentMethod: 'Online (Razorpay)',
                items: [...cart],
                total: cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
            };
            const existingOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
            existingOrders.unshift(newOrder);
            localStorage.setItem('my_orders', JSON.stringify(existingOrders));

            cart = [];
            localStorage.removeItem('cart');
            if (typeof updateCartUI === 'function') updateCartUI();
            document.getElementById('checkout-form')?.reset();
        }
    };

    if (window.Razorpay) {
        var rzp1 = new Razorpay(options);
        rzp1.open();
    } else {
        showToast("Razorpay SDK failed to load. Please try again.", 'error');
    }
}

// Show Professional Toast Notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
    toast.style.color = '#ffffff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.fontWeight = '500';
    toast.style.fontSize = '14px';
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.innerText = message;

    container.appendChild(toast);

    // Animation in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 50);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Open My Orders Modal (With Fallback for Testing)
async function openOrdersModal() {
    let user = localStorage.getItem('user');
    
    // Fallback: Default email agar login nahi mila
    if (!user) {
        user = { email: "test@gmail.com" };
    } else {
        try {
            user = JSON.parse(user);
        } catch (e) {
            user = { email: user };
        }
    }

    const userEmail = user?.email || "test@gmail.com";

    const container = document.getElementById('orders-list') || document.getElementById('orders-container');
    const modal = document.getElementById('orders-modal');

    try {
   const res = await fetch('https://e-commerce-1-in9j.onrender.com/api/products');
const orders = await res.json();

        if (container) {
            if (!orders || orders.length === 0) {
                container.innerHTML = "<p style='text-align:center; padding: 20px; color: #64748b;'>No previous orders found!</p>";
            } else {
                container.innerHTML = orders.map(order => `
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 12px; background: #f8fafc;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 8px;">
                            <span>Order ID: #${order._id ? order._id.slice(-6) : 'N/A'}</span>
                            <span style="color: #10b981;">₹${order.totalAmount || order.total || 0}</span>
                        </div>
                        <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
                            <span>Date: ${new Date(order.createdAt || order.date).toLocaleDateString()}</span> | 
                            <span>Deliver to: ${order.customerName || order.name || ''} (${order.address || ''})</span>
                        </div>
                        <div style="border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 8px;">
                            ${order.items ? order.items.map(item => `
                                <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                                    <span>${item.name} x ${item.quantity || 1}</span>
                                    <span>₹${item.price * (item.quantity || 1)}</span>
                                </div>
                            `).join('') : ''}
                        </div>
                    </div>
                `).join('');
            }
        }

        if (modal) {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Fetch Orders Error:", err);
        alert("Failed to fetch orders from server!");
    }
}

// Auth/Login Modal Close Function
function closeAuthModal() {
    const modal = document.getElementById('auth-modal') || document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Logout Function
function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
    if (typeof showToast === 'function') {
        showToast('Logged out successfully!', 'info');
    }
}

// Open Product Detail Modal
function showProductDetails(id) {
    const product = products.find(p => p._id === id || p.id === id);
    if (!product) return;

    document.getElementById('detail-img').src = product.image;
    document.getElementById('detail-title').innerText = product.name;
    document.getElementById('detail-category').innerText = product.category || 'Jewelry';
    document.getElementById('detail-price').innerText = `₹${product.price}`;
    document.getElementById('detail-desc').innerText = product.description || 'Premium handcrafted jewelry designed for perfection.';

    const cartBtn = document.getElementById('detail-add-cart-btn');
    cartBtn.onclick = function() {
        addToCart(product._id || product.id);
        closeProductModal();
    };

    const modal = document.getElementById('product-detail-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

// Close Product Detail Modal
function closeProductModal() {
    const modal = document.getElementById('product-detail-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

let currentCategory = 'all';

// Category Button Filter
function filterCategory(cat, e) {
    currentCategory = cat;
    
    // Active class updates
    document.querySelectorAll('.filter-pills .pill').forEach(btn => btn.classList.remove('active'));
    if (e && e.target) {
        e.target.classList.add('active');
    }

    filterProducts();
}

// Master Filter Function (Search + Category + Price)
function filterProducts() {
    const searchInput = document.getElementById('search-input');
    const priceFilter = document.getElementById('price-filter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const priceValue = priceFilter ? priceFilter.value : 'all';

    console.log("Selected Category:", currentCategory);
    const filtered = products.filter(product => {
     // 1. Live Search Match (Fixes Partial Text Conflicts)
    const pName = (product.name || '').toLowerCase();
    const pCat = (product.category || '').toLowerCase();
    let matchesSearch = true;

    if (searchTerm) {
      if (['r', 'ri', 'rin', 'ring', 'rings'].includes(searchTerm)) {
        matchesSearch = (pName.includes('ring') || pCat.includes('ring')) && 
                        !pName.includes('earring') && !pCat.includes('earring');
      } else if (searchTerm === 'e' || searchTerm === 'ea' || searchTerm === 'ear') {
        matchesSearch = pName.includes('earring') || pCat.includes('earring');
      } else {
        matchesSearch = pName.includes(searchTerm) || pCat.includes(searchTerm);
      }
    }

 // Category Match (Exact Keyword & Conflict Fix)
    let matchesCategory = false;
    if (!currentCategory || currentCategory.toLowerCase() === 'all') {
      matchesCategory = true;
    } else {
      const pCat = (product.category || '').toLowerCase();
      const pName = (product.name || '').toLowerCase();
      const selected = currentCategory.toLowerCase();

      if (selected === 'ring') {
        // Ring filter ke waqt Earrings ko STRICT exclude karein
        const isEarring = pCat.includes('earring') || pName.includes('earring');
        const isRing = pCat.includes('ring') || pName.includes('ring');
        matchesCategory = isRing && !isEarring;
      } else if (selected === 'earring') {
        matchesCategory = pCat.includes('earring') || pName.includes('earring');
      } else if (selected === 'chain') {
        matchesCategory = pCat.includes('chain') || pName.includes('chain') || pCat.includes('necklace') || pName.includes('necklace');
      } else {
        matchesCategory = pCat.includes(selected) || pName.includes(selected);
      }
    }

        // Price Match
        let matchesPrice = true;
        const price = Number(product.price);

        if (priceValue === 'under1000') {
            matchesPrice = price < 1000;
        } else if (priceValue === '1000-5000') {
            matchesPrice = price >= 1000 && price <= 5000;
        } else if (priceValue === 'above5000') {
            matchesPrice = price > 5000;
        }

        return matchesSearch && matchesCategory && matchesPrice;
    });

    renderProducts(filtered);
}

// Wishlist State Array
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

// Toggle Wishlist Item
function toggleWishlist(id) {
    const index = wishlist.indexOf(id);
    if (index === -1) {
        wishlist.push(id);
    } else {
        wishlist.splice(index, 1);
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
    filterProducts(); // Screen Refresh
}

// Update Badge Count
function updateWishlistCount() {
    const countSpan = document.getElementById('wishlist-count');
    if (countSpan) {
        countSpan.innerText = wishlist.length;
    }
}

// Initial Call on Load
updateWishlistCount();

// Open Wishlist Modal
function openWishlistModal() {
    const container = document.getElementById('wishlist-items-container');
    if (!container) return;

    const likedProducts = products.filter(p => wishlist.includes(p._id || p.id));

    if (likedProducts.length === 0) {
        container.innerHTML = "<p>Your wishlist is empty!</p>";
    } else {
        container.innerHTML = likedProducts.map(p => {
            const id = p._id || p.id;
            return `
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; padding: 8px 0;">
                    <img src="${p.image}" width="50" height="50" style="object-fit: cover; border-radius: 6px;">
                    <span style="font-weight: 600; flex: 1; margin-left: 10px;">${p.name}</span>
                    <span style="margin-right: 15px;">₹${p.price}</span>
                    <button onclick="addToCart('${id}')" style="padding: 5px 10px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Add to Cart</button>
                </div>
            `;
        }).join('');
    }

    const modal = document.getElementById('wishlist-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function closeWishlistModal() {
    const modal = document.getElementById('wishlist-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// Checkout Modal Logic
function openCheckoutModal() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// Handle Order Placement
function handleCheckout(e) {
    e.preventDefault();
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;

    alert(`🎉 Order Placed Successfully!\n\nThank you, ${name}. Your items will be delivered to:\n${address}\nPhone: ${phone}`);

    // Clear Cart
    cart = [];
    localStorage.removeItem('cart');
    if (typeof updateCartUI === 'function') updateCartUI();

    closeCheckoutModal();
    if (typeof toggleCart === 'function') toggleCart();
}

// Fetch and Show My Orders
async function openOrdersModal() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.email) {
        alert("Please login to view your orders!");
        openAuthModal();
        return;
    }

    const container = document.getElementById('orders-container') || document.getElementById('orders-modal-body');
    
    try {
  const res = await fetch(`https://e-commerce-1-in9j.onrender.com/api/orders/${user.email}`);
        const orders = await res.json();

        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = "<p style='text-align:center;'>No orders placed yet!</p>";
        } else {
            container.innerHTML = orders.map(o => `
                <div style="border: 1px solid #ddd; padding: 12px; border-radius: 8px; margin-bottom: 10px; background: #f9f9f9;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                        <span>Order #${o._id.slice(-6)}</span>
                        <span style="color: #2563eb;">₹${o.totalAmount}</span>
                    </div>
                    <p style="font-size: 12px; color: #666; margin: 4px 0;">Status: ${o.status} | Date: ${new Date(o.createdAt).toLocaleDateString()}</p>
                    <small>Items: ${o.items.map(i => i.name).join(', ')}</small>
                </div>
            `).join('');
        }

        const modal = document.getElementById('orders-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    } catch (err) {
        console.error(err);
    }
}

// Global Scope Open Orders Modal
window.openOrdersModal = async function() {
    console.log("Opening Orders Modal...");
    
    const modal = document.getElementById('orders-modal');
    if (!modal) {
        alert("Error: orders-modal element not found in HTML!");
        return;
    }

    // Force display style directly
    modal.style.display = 'flex';

    let user = localStorage.getItem('user');
    if (user) {
        try { user = JSON.parse(user); } catch (e) { user = { email: user }; }
    }
    const userEmail = user?.email || "test@gmail.com";

    const container = document.getElementById('orders-list');
    if (container) {
        container.innerHTML = "<p style='text-align:center;'>Loading orders...</p>";
        
        try {
          const res = await fetch(`https://e-commerce-1-in9j.onrender.com/api/orders/${user.email}`);
            const orders = await res.json();

            if (!orders || orders.length === 0) {
                container.innerHTML = "<p style='text-align:center; padding: 20px; color: #64748b;'>No previous orders found!</p>";
            } else {
                container.innerHTML = orders.map(order => `
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: #f8fafc;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; color: #0f172a;">
                            <span>Order #${order._id ? order._id.slice(-6) : 'N/A'}</span>
                            <span style="color: #16a34a;">₹${order.totalAmount || order.total || 0}</span>
                        </div>
                        <div style="font-size: 12px; color: #64748b; margin: 4px 0;">
                            Date: ${new Date(order.createdAt || order.date || Date.now()).toLocaleDateString()}
                        </div>
                        <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 6px; font-size: 13px;">
                            ${order.items ? order.items.map(i => `<div>${i.name} x ${i.quantity || 1} - ₹${i.price}</div>`).join('') : ''}
                        </div>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error(err);
            container.innerHTML = "<p style='color:red; text-align:center;'>Failed to load orders from server.</p>";
        }
    }
};

// Global Scope Close Orders Modal
window.closeOrdersModal = function() {
    const modal = document.getElementById('orders-modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.payWithRazorpay = async function(totalAmount, orderDetails) {
    try {
        // 1. Fetch Order ID from Backend
     const response = await fetch('https://e-commerce-1-in9j.onrender.com/api/payment/razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: totalAmount })
        });

        const rzpOrder = await response.json();
        console.log("BACKEND ORDER RESPONSE:", rzpOrder);

        if (!response.ok || !rzpOrder || !rzpOrder.id) {
            alert("Backend Payment Error: " + (rzpOrder.error || "Order ID creation failed!"));
            return;
        }

        // 2. Configure Razorpay Options
        const options = {
            "key": 'rzp_test_TcJyzmy4acf9Bz',
            "amount": rzpOrder.amount,
            "currency": "INR",
            "name": "MyStore Jewelry",
            "description": "Order Payment",
            "order_id": rzpOrder.id,
            "handler": async function (res) {
                alert("🎉 Payment Successful! ID: " + res.razorpay_payment_id);
                if (typeof saveOrderToDatabase === 'function') {
                    saveOrderToDatabase(orderDetails, totalAmount, 'SUCCESS');
                }
            },
            "prefill": {
                "name": orderDetails?.name || "Customer",
                "contact": orderDetails?.phone || "9999999999"
            },
            "theme": {
                "color": "#2563eb"
            }
        };

        // 3. Open Gateway Modal
        const rzp = new Razorpay(options);
        
        rzp.on('payment.failed', function (response) {
            console.error("Razorpay Failure Reason:", response.error);
            alert("Payment Failed Reason: " + response.error.description);
        });

        rzp.open();
    } catch (err) {
        console.error("Razorpay Error:", err);
        alert("Payment gateway connection failed! Check if Node server is running.");
    }
};

/// Product Modal Function Fix
function openProductModal(productId) {
  const product = (products || []).find(p => (p._id || p.id) == productId);
  
  if (!product) {
    console.error("Product not found:", productId);
    return;
  }

  const modalImg = document.getElementById('modal-main-img');
  const modalTitle = document.getElementById('modal-title');
  const modalCat = document.getElementById('modal-category');
  const modalPrice = document.getElementById('modal-price');
  const modalMat = document.getElementById('modal-material-type');
  const modalDesc = document.getElementById('modal-description');
  const modalModal = document.getElementById('product-modal');

  if (modalImg) modalImg.src = product.image || 'https://via.placeholder.com/200';
  if (modalTitle) modalTitle.innerText = product.name || 'Product Details';
  if (modalCat) modalCat.innerText = `Category: ${product.category || 'Jewelry'}`;
  if (modalPrice) modalPrice.innerText = `₹${product.price}`;
  if (modalMat) modalMat.innerText = product.material || 'Gold / Silver';
  if (modalDesc) modalDesc.innerText = product.description || 'Crafted with fine detailing for everyday elegance.';

 const actionsDiv = document.getElementById('modal-actions-container');
  if (actionsDiv) {
    actionsDiv.innerHTML = `
      <div style="display: flex; gap: 10px; width: 100%; margin-top: 15px;">
        <button class="btn" style="flex: 1; padding: 10px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;" onclick="addToCart('${product._id || product.id}')">Add to Cart</button>
        <button class="btn" style="flex: 1; padding: 10px; background: #16a34a; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;" onclick="buyNow('${product._id || product.id}')">Buy Now</button>
      </div>
    `;
  }

  if (modalModal) {
    modalModal.style.display = 'flex';
  }
}

function closeProductModal() {
  const modalModal = document.getElementById('product-modal');
  if (modalModal) modalModal.style.display = 'none';
}

function closeModalOnOutsideClick(event) {
  if (event.target.id === 'product-modal') {
    closeProductModal();
  }
}

// Auto-Sliding Hero Banner Logic
let currentSlide = 0;
const totalSlides = 3;

function updateCarousel() {
  const track = document.getElementById('carouselTrack');
  const dots = document.querySelectorAll('.dot');
  
  if (track) {
    track.style.transform = `translateX(-${currentSlide * 33.333}%)`;
  }
  
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });
}

function goToSlide(slideIndex) {
  currentSlide = slideIndex;
  updateCarousel();
}

// Auto Slide every 4 seconds
setInterval(() => {
  currentSlide = (currentSlide + 1) % totalSlides;
  updateCarousel();
}, 3000);