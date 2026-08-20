// PASTE YOUR FIREBASE CONFIG HERE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DEFAULT FIREBASE CONFIG (REPLACE WITH YOUR PROJECT CONFIG IF NEEDED)
const firebaseConfig = {
  apiKey: "AIzaSyYOUR_API_KEY_HERE",
  authDomain: "ironforge-app.firebaseapp.com",
  projectId: "ironforge-app",
  storageBucket: "ironforge-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// INITIALIZE FIREBASE
let app, auth, db;
let isFirebaseConfigured = false;

try {
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseConfigured = true;
  }
} catch (err) {
  console.warn("[IRONFORGE] Firebase initialization note:", err.message);
}

// ONBOARDING TEMPORARY DATA STORE
const onboardingData = {
  currentWeight: null,
  targetWeight: null,
  height: null,
  battlePlan: null,
  arsenal: null
};

// WIZARD STATE
let currentStepIndex = 0;
const screens = [
  document.getElementById('screen-welcome'),
  document.getElementById('screen-biometrics'),
  document.getElementById('screen-battle-plan'),
  document.getElementById('screen-arsenal')
];
const progressBar = document.getElementById('progress-bar');
const userNameSpan = document.getElementById('user-name');

let currentUserUid = null;

// INIT & AUTHENTICATION GUARD
document.addEventListener('DOMContentLoaded', () => {
  initAuthGuardAndUser();
  setupNavigationHandlers();
  setupCardSelectionHandlers();
  updateWizardUI(0);
});

function initAuthGuardAndUser() {
  // Try fetching local user session fallback first
  const localUserStr = localStorage.getItem('ironforge_user') || localStorage.getItem('gym_app_user');
  let hasLocalSession = false;
  if (localUserStr) {
    try {
      const parsed = JSON.parse(localUserStr);
      if (parsed.name || parsed.displayName) {
        userNameSpan.textContent = (parsed.name || parsed.displayName).toUpperCase();
        hasLocalSession = true;
      }
    } catch (e) {
      console.warn("Could not parse local user data.");
    }
  }

  // FIREBASE AUTHENTICATION GUARD
  if (isFirebaseConfigured && auth && db) {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUserUid = user.uid;
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.name) {
              userNameSpan.textContent = data.name.toUpperCase();
            }
          } else if (user.displayName) {
            userNameSpan.textContent = user.displayName.toUpperCase();
          }
        } catch (err) {
          console.warn("[IRONFORGE] Firestore user doc fetch note:", err.message);
        }
      } else if (!hasLocalSession) {
        // AUTH GUARD: If no user is logged in, redirect to index.html
        console.warn("[IRONFORGE AUTH GUARD] No authenticated user found. Redirecting to index.html");
        window.location.href = "index.html";
      }
    });
  }
}

// WIZARD STEP SWITCHER WITH SLIDE-IN/SLIDE-OUT CSS TRANSITIONS
function goToStep(targetIndex) {
  if (targetIndex < 0 || targetIndex >= screens.length) return;

  const currentScreen = screens[currentStepIndex];
  const targetScreen = screens[targetIndex];

  // Configure transition classes
  if (targetIndex > currentStepIndex) {
    // Sliding forward: current slides left out, target slides in from right
    currentScreen.classList.remove('active');
    currentScreen.classList.add('slide-left-out');
    
    targetScreen.classList.remove('slide-left-out');
    targetScreen.classList.add('active');
  } else {
    // Sliding backward: target comes back from left, current goes right
    currentScreen.classList.remove('active');
    
    targetScreen.classList.remove('slide-left-out');
    targetScreen.classList.add('active');
  }

  currentStepIndex = targetIndex;
  updateWizardUI(currentStepIndex);
}

function updateWizardUI(stepIndex) {
  // Update progress bar width
  const progressPercent = (stepIndex / (screens.length - 1)) * 100;
  progressBar.style.width = `${progressPercent}%`;
}

// SETUP NAVIGATION HANDLERS
function setupNavigationHandlers() {
  // Welcome Gate -> Step 1: Biometrics
  document.getElementById('btn-start').addEventListener('click', () => {
    goToStep(1);
  });

  // Step 1: Biometrics -> Step 2: Battle Plan
  const btnNextBiometrics = document.getElementById('btn-next-biometrics');
  btnNextBiometrics.addEventListener('click', () => {
    const curWt = parseFloat(document.getElementById('input-current-weight').value);
    const tarWt = parseFloat(document.getElementById('input-target-weight').value);
    const height = parseFloat(document.getElementById('input-height').value);

    // Save biometrics data (defaults provided if empty for smooth interaction)
    onboardingData.currentWeight = !isNaN(curWt) ? curWt : 80;
    onboardingData.targetWeight = !isNaN(tarWt) ? tarWt : 85;
    onboardingData.height = !isNaN(height) ? height : 180;

    goToStep(2);
  });

  // Step 2: Battle Plan -> Step 3: Arsenal
  document.getElementById('btn-next-battle-plan').addEventListener('click', () => {
    if (onboardingData.battlePlan) {
      goToStep(3);
    }
  });

  // Step 3: Arsenal -> Finish & Dashboard
  document.getElementById('btn-finish').addEventListener('click', async () => {
    if (!onboardingData.arsenal) return;
    await completeOnboarding();
  });

  // Back Buttons
  document.getElementById('btn-back-1').addEventListener('click', () => goToStep(0));
  document.getElementById('btn-back-2').addEventListener('click', () => goToStep(1));
  document.getElementById('btn-back-3').addEventListener('click', () => goToStep(2));
}

// SETUP CARD SELECTION HANDLERS (BATTLE PLAN & ARSENAL)
function setupCardSelectionHandlers() {
  // Battle Plan Cards
  const battleCards = document.querySelectorAll('#battle-plan-grid .selectable-card');
  const btnNextBattlePlan = document.getElementById('btn-next-battle-plan');

  battleCards.forEach(card => {
    card.addEventListener('click', () => {
      battleCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      onboardingData.battlePlan = card.dataset.plan;
      btnNextBattlePlan.removeAttribute('disabled');
    });
  });

  // Arsenal Cards
  const arsenalCards = document.querySelectorAll('#arsenal-grid .selectable-card');
  const btnFinish = document.getElementById('btn-finish');

  arsenalCards.forEach(card => {
    card.addEventListener('click', () => {
      arsenalCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      onboardingData.arsenal = card.dataset.arsenal;
      btnFinish.removeAttribute('disabled');
    });
  });
}

// FINISH ONBOARDING & DATABASE HANDOFF WITH `onboardingComplete: true`
async function completeOnboarding() {
  const finishBtn = document.getElementById('btn-finish');
  finishBtn.disabled = true;
  finishBtn.textContent = "[SAVING PROTOCOLS...]";

  const payload = {
    biometrics: {
      currentWeight: onboardingData.currentWeight,
      targetWeight: onboardingData.targetWeight,
      height: onboardingData.height
    },
    battlePlan: onboardingData.battlePlan,
    goal: onboardingData.battlePlan,
    arsenal: onboardingData.arsenal,
    equipment: onboardingData.arsenal,
    onboardingComplete: true,
    onboardingCompleted: true,
    onboardedAt: new Date().toISOString()
  };

  // Always save to localStorage for instant local reliability
  localStorage.setItem('ironforge_onboarding_data', JSON.stringify(payload));

  // Update user's specific Firestore document using updateDoc()
  if (db && currentUserUid) {
    try {
      const userRef = doc(db, "users", currentUserUid);
      await updateDoc(userRef, {
        biometrics: payload.biometrics,
        battlePlan: payload.battlePlan,
        goal: payload.goal,
        arsenal: payload.arsenal,
        equipment: payload.equipment,
        onboardingComplete: true,
        onboardingCompleted: true,
        updatedAt: payload.onboardedAt
      });
      console.log("[IRONFORGE] User profile & onboardingComplete flag updated in Firestore.");
    } catch (err) {
      console.warn("[IRONFORGE] Firestore updateDoc note:", err.message);
    }
  }

  // Route to dashboard.html upon successful update
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 600);
}
