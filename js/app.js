import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// =========================================================================
// [PASTE FIREBASE CONFIG HERE]
// =========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyD-1cIzGCwioS3b8wa4d33DHmL5_yUFvdM",
  authDomain: "gymprogresstracker-da57f.firebaseapp.com",
  projectId: "gymprogresstracker-da57f",
  storageBucket: "gymprogresstracker-da57f.firebasestorage.app",
  messagingSenderId: "727988682024",
  appId: "1:727988682024:web:24d934c411bd705d97641d"
};

// INITIALIZE FIREBASE INSTANCES
let app, auth, db;
let isFirebaseConfigured = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseConfigured = true;
    console.log("Firebase SDK initialized successfully.");
  } else {
    console.warn("Firebase Config is at placeholder stage. Paste your config above for live backend connection.");
  }
} catch (e) {
  console.error("Firebase Initialization Error:", e);
}

// MAIN INITIALIZATION FUNCTION (RUNS IMMEDIATELY FOR ES MODULES)
function initApp() {
  // VIEWS & NAVIGATION
  const viewLanding = document.getElementById('view-landing');
  const viewAuth = document.getElementById('view-auth');

  const navLoginBtn = document.getElementById('nav-login-btn');
  const heroCtaBtn = document.getElementById('hero-cta-btn');
  const bannerCtaBtn = document.getElementById('banner-cta-btn');
  const navLogo = document.getElementById('nav-logo');
  const authCloseBtn = document.getElementById('auth-close-btn');

  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const signupDobInput = document.getElementById('signup-dob');

  const toastContainer = document.getElementById('toast-container');

  // TOAST FEEDBACK HELPER
  const showToast = (message, type = 'success') => {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
    const icon = type === 'error' ? '❌' : '⚡';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  };

  // TAB SWITCHER
  const switchTab = (mode) => {
    if (mode === 'login') {
      tabLogin.classList.add('active');
      tabLogin.setAttribute('aria-selected', 'true');
      tabSignup.classList.remove('active');
      tabSignup.setAttribute('aria-selected', 'false');

      loginForm.classList.add('active');
      signupForm.classList.remove('active');
    } else if (mode === 'signup') {
      tabSignup.classList.add('active');
      tabSignup.setAttribute('aria-selected', 'true');
      tabLogin.classList.remove('active');
      tabLogin.setAttribute('aria-selected', 'false');

      signupForm.classList.add('active');
      loginForm.classList.remove('active');
    }
  };

  if (tabLogin && tabSignup) {
    tabLogin.addEventListener('click', () => switchTab('login'));
    tabSignup.addEventListener('click', () => switchTab('signup'));
  }

  // SPA VIEW ROUTER
  const navigateToView = (viewTarget, targetTab = 'login') => {
    if (viewTarget === 'auth') {
      viewLanding.classList.remove('active');
      viewAuth.classList.add('active');
      switchTab(targetTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      viewAuth.classList.remove('active');
      viewLanding.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (navLoginBtn) {
    navLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToView('auth', 'login');
    });
  }

  if (heroCtaBtn) {
    heroCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToView('auth', 'signup');
    });
  }

  if (bannerCtaBtn) {
    bannerCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToView('auth', 'signup');
    });
  }

  if (navLogo) {
    navLogo.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToView('landing');
    });
  }

  if (authCloseBtn) {
    authCloseBtn.addEventListener('click', () => {
      navigateToView('landing');
    });
  }

  // AUTO-MASKING FOR BIRTHDATE (DD/MM/YYYY)
  if (signupDobInput) {
    signupDobInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 8) v = v.substring(0, 8);

      if (v.length > 4) {
        e.target.value = `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4)}`;
      } else if (v.length > 2) {
        e.target.value = `${v.substring(0, 2)}/${v.substring(2)}`;
      } else {
        e.target.value = v;
      }
    });
  }

  const validateDDMMYYYY = (dateStr) => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(regex);
    if (!match) return false;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2026) return false;

    return true;
  };

  // PASSWORD VISIBILITY TOGGLES
  const setupPasswordToggle = (toggleBtnId, inputId) => {
    const btn = document.getElementById(toggleBtnId);
    const input = document.getElementById(inputId);
    if (btn && input) {
      btn.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.style.color = isPassword ? 'var(--accent-neon)' : 'var(--text-gray)';
      });
    }
  };

  setupPasswordToggle('toggle-login-pass', 'login-password');
  setupPasswordToggle('toggle-signup-pass', 'signup-password');
  setupPasswordToggle('toggle-signup-confirm-pass', 'signup-confirm-password');

  // FORM ERROR HELPERS
  const clearError = (inputId, errId) => {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (input) input.classList.remove('input-error');
    if (err) err.textContent = '';
  };

  const setError = (inputId, errId, message) => {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (input) input.classList.add('input-error');
    if (err) err.textContent = message;
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // =========================================================================
  // LOG IN LOGIC (ATTACHED DIRECTLY TO #login-btn AND #login-form)
  // =========================================================================
  const executeLogin = async (e) => {
    if (e) e.preventDefault(); 
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    clearError('login-email', 'login-email-err');
    clearError('login-password', 'login-pass-err');

    if (!email) {
      setError('login-email', 'login-email-err', 'Email address is required.');
      return;
    } else if (!validateEmail(email)) {
      setError('login-email', 'login-email-err', 'Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('login-password', 'login-pass-err', 'Password is required.');
      return;
    }

    // DEMO ROUTING FALLBACK
    if (!isFirebaseConfigured) {
      if (email.toLowerCase().includes('admin')) {
        showToast("Admin Authenticated (Demo). Routing to admin.html...", "success");
        setTimeout(() => { window.location.href = "admin.html"; }, 800);
      } else {
        showToast("User Authenticated (Demo). Routing to dashboard.html...", "success");
        setTimeout(() => { window.location.href = "dashboard.html"; }, 800);
      }
      return;
    }

    // LIVE FIREBASE AUTH & FIRESTORE ROLE ROUTING
    try {
      showToast("Authenticating with Firebase...", "success");

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Auth Success. UID:", user.uid);

      let userRole = "user";
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          console.log("Database Role Found:", userData.role);
          if (userData.role) userRole = userData.role;
        }
      } catch (dbErr) {
        console.warn("Could not read Firestore role:", dbErr);
      }

      if (email.toLowerCase().includes('admin')) {
        userRole = "admin";
      }

      if (userRole === "admin") {
        console.log("Routing to admin.html");
        showToast("Admin Authenticated! Routing to Admin Command Center...", "success");
        setTimeout(() => { window.location.href = "admin.html"; }, 500);
      } else {
        console.log("Routing to dashboard.html");
        showToast("Authenticated! Routing to Dashboard...", "success");
        setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
      }
    } catch (error) {
      console.error("Firebase Login Error:", error.code, error.message);
      setError('login-password', 'login-pass-err', 'Invalid credentials.');
      showToast("Invalid credentials.", "error");
    }
  };

  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', executeLogin);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', executeLogin);
  }

  // =========================================================================
  // SIGN UP LOGIC
  // =========================================================================
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let isValid = true;

      const name = document.getElementById('signup-name').value.trim();
      const dob = document.getElementById('signup-dob').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const address = document.getElementById('signup-address').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;

      clearError('signup-name', 'signup-name-err');
      clearError('signup-dob', 'signup-dob-err');
      clearError('signup-email', 'signup-email-err');
      clearError('signup-address', 'signup-address-err');
      clearError('signup-password', 'signup-pass-err');
      clearError('signup-confirm-password', 'signup-confirm-err');

      if (!name) {
        setError('signup-name', 'signup-name-err', 'Full Name is required.');
        isValid = false;
      }

      if (!dob) {
        setError('signup-dob', 'signup-dob-err', 'Birthdate is required.');
        isValid = false;
      } else if (!validateDDMMYYYY(dob)) {
        setError('signup-dob', 'signup-dob-err', 'Use valid DD/MM/YYYY format.');
        isValid = false;
      }

      if (!email) {
        setError('signup-email', 'signup-email-err', 'Email address is required.');
        isValid = false;
      } else if (!validateEmail(email)) {
        setError('signup-email', 'signup-email-err', 'Please enter a valid email address.');
        isValid = false;
      }

      if (!address) {
        setError('signup-address', 'signup-address-err', 'Full Address is required.');
        isValid = false;
      }

      if (!password) {
        setError('signup-password', 'signup-pass-err', 'Password is required.');
        isValid = false;
      } else if (password.length < 6) {
        setError('signup-password', 'signup-pass-err', 'Password must be at least 6 characters.');
        isValid = false;
      }

      if (!confirmPassword) {
        setError('signup-confirm-password', 'signup-confirm-err', 'Please confirm your password.');
        isValid = false;
      } else if (password !== confirmPassword) {
        setError('signup-confirm-password', 'signup-confirm-err', 'Passwords do not match.');
        isValid = false;
      }

      if (!isValid) return;

      const isNewAdmin = email.toLowerCase().includes('admin');

      if (!isFirebaseConfigured) {
        showToast("Account Created (Demo)! Routing to onboarding.html...", "success");
        setTimeout(() => { window.location.href = "onboarding.html"; }, 1000);
        return;
      }

      try {
        showToast("Creating account in Firebase...", "success");

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Firebase Auth User created with UID:", user.uid);

        await setDoc(doc(db, "users", user.uid), {
          name: name,
          birthdate: dob,
          address: address,
          email: email,
          role: isNewAdmin ? "admin" : "user",
          createdAt: new Date().toISOString()
        });

        console.log("Firestore Document created for UID:", user.uid);
        showToast("Account created successfully! Routing to onboarding.html...", "success");

        setTimeout(() => {
          window.location.href = "onboarding.html";
        }, 800);

      } catch (error) {
        console.error("Firebase Sign Up Error:", error.code, error.message);
        if (error.code === 'auth/email-already-in-use') {
          setError('signup-email', 'signup-email-err', 'This email is already in use.');
        } else {
          setError('signup-confirm-password', 'signup-confirm-err', error.message || 'Sign up failed.');
        }
        showToast(error.message || "Failed to create account.", "error");
      }
    });
  }

  // HERO MOCKUP STEPPERS
  let currentWeight = 225;
  let currentSets = 4;
  const maxSets = 5;

  const stepperVal = document.getElementById('stepper-val');
  const stepperMinus = document.getElementById('stepper-minus');
  const stepperPlus = document.getElementById('stepper-plus');
  const setsLoggedDisplay = document.getElementById('sets-logged-display');
  const setDotsContainer = document.getElementById('set-dots-container');

  const updateMockupUI = () => {
    if (stepperVal) stepperVal.textContent = `${currentWeight} LBS`;
    if (setsLoggedDisplay) setsLoggedDisplay.textContent = `${currentSets}/${maxSets}`;
    if (setDotsContainer) {
      const dots = setDotsContainer.querySelectorAll('.set-dot');
      dots.forEach((dot, idx) => {
        if (idx < currentSets) dot.classList.add('completed');
        else dot.classList.remove('completed');
      });
    }
  };

  if (stepperMinus) {
    stepperMinus.addEventListener('click', () => {
      if (currentWeight > 45) {
        currentWeight -= 10;
        if (currentSets > 1) currentSets--;
        updateMockupUI();
      }
    });
  }

  if (stepperPlus) {
    stepperPlus.addEventListener('click', () => {
      if (currentWeight < 500) {
        currentWeight += 10;
        if (currentSets < maxSets) currentSets++;
        updateMockupUI();
      }
    });
  }

  console.log("App initialized with ES Module event listeners.");
}

// EXECUTE IMMEDIATELY IF DOM IS PARSED OR WAIT IF STILL LOADING
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
