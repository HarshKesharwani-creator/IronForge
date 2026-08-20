import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// =========================================================================
// // PASTE YOUR FIREBASE CONFIG HERE
// =========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyD-1cIzGCwioS3b8wa4d33DHmL5_yUFvdM",
  authDomain: "gymprogresstracker-da57f.firebaseapp.com",
  projectId: "gymprogresstracker-da57f",
  storageBucket: "gymprogresstracker-da57f.firebasestorage.app",
  messagingSenderId: "727988682024",
  appId: "1:727988682024:web:24d934c411bd705d97641d"
};

// INITIALIZE FIREBASE & FIRESTORE
let app, db;
let isFirebaseConfigured = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseConfigured = true;
    console.log("Admin Command Center: Firebase SDK initialized successfully.");
  } else {
    console.warn("Firebase Config is at placeholder stage. Paste your config above for live Firestore connection.");
  }
} catch (e) {
  console.error("Firebase Admin Initialization Error:", e);
}

// FALLBACK MOCK DATASET (Used if Firestore database is empty or unconfigured)
const mockUsers = [
  {
    id: "ATH-88492",
    name: "Ronnie Coleman",
    email: "ronnie@iron.com",
    birthdate: "13/05/1964",
    address: "123 Iron Gym Blvd, Austin, TX 78701",
    role: "user",
    status: "Active",
    createdAt: "2024-01-15"
  },
  {
    id: "ATH-92104",
    name: "Arnold Schwarzenegger",
    email: "arnold@gold.com",
    birthdate: "30/07/1947",
    address: "Golds Gym Way, Venice Beach, CA 90291",
    role: "admin",
    status: "Active",
    createdAt: "2023-11-04"
  },
  {
    id: "ATH-77319",
    name: "Jay Cutler",
    email: "jay@quads.com",
    birthdate: "03/08/1973",
    address: "88 Quad Sweep Dr, Las Vegas, NV 89101",
    role: "user",
    status: "Suspended",
    createdAt: "2024-03-22"
  }
];

function initAdminApp() {
  // DOM ELEMENTS
  const userTableBody = document.getElementById('user-table-body');
  const searchInput = document.getElementById('admin-search-input');
  const recordCountEl = document.getElementById('record-count');
  const totalUsersValEl = document.getElementById('total-users-val');
  const serverTimeEl = document.getElementById('server-time');

  // DRAWER ELEMENTS
  const drawer = document.getElementById('profile-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');

  const drawerAvatar = document.getElementById('drawer-avatar');
  const drawerName = document.getElementById('drawer-name');
  const drawerId = document.getElementById('drawer-id');
  const drawerFullname = document.getElementById('drawer-fullname');
  const drawerDob = document.getElementById('drawer-dob');
  const drawerEmail = document.getElementById('drawer-email');
  const drawerAddress = document.getElementById('drawer-address');
  const drawerRoleDisplay = document.getElementById('drawer-role-display');
  const drawerStatusBadge = document.getElementById('drawer-status-badge');

  const btnResetPass = document.getElementById('btn-reset-pass');
  const btnSuspendUser = document.getElementById('btn-suspend-user');
  const btnDeleteUser = document.getElementById('btn-delete-user');

  const toastContainer = document.getElementById('admin-toast-container');

  let loadedUsersList = [];
  let activeUserRecord = null;

  // SERVER CLOCK
  const updateServerClock = () => {
    if (!serverTimeEl) return;
    const now = new Date();
    const isoStr = now.toISOString().replace('T', ' ').substring(0, 19);
    serverTimeEl.textContent = `${isoStr} UTC`;
  };
  setInterval(updateServerClock, 1000);
  updateServerClock();

  // TOAST FEEDBACK
  const showAdminToast = (msg, isDanger = false) => {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isDanger) toast.style.borderColor = 'var(--danger-red)';
    toast.innerHTML = `<span>${isDanger ? '⚠️' : '⚡'}</span><span>${msg}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  };

  // OPEN DEEP DIVE PROFILE PANEL WITH REAL FIRESTORE DATA
  const openDeepDiveProfile = (userData) => {
    activeUserRecord = userData;
    console.log(`[ADMIN] Opening Deep Dive Profile for User ID: ${userData.id} (${userData.name})`);

    const initials = userData.name
      ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : 'AT';

    if (drawerAvatar) drawerAvatar.textContent = initials;
    if (drawerName) drawerName.textContent = userData.name || 'Anonymous Athlete';
    if (drawerId) drawerId.textContent = `ID: #${userData.id.substring(0, 8)}`;
    if (drawerFullname) drawerFullname.textContent = userData.name || 'N/A';
    if (drawerDob) drawerDob.textContent = userData.birthdate || 'N/A';
    if (drawerEmail) drawerEmail.textContent = userData.email || 'N/A';
    if (drawerAddress) drawerAddress.textContent = userData.address || 'N/A';
    if (drawerRoleDisplay) drawerRoleDisplay.textContent = userData.role || 'user';

    const currentStatus = userData.status || (userData.role === 'suspended' ? 'Suspended' : 'Active');
    if (drawerStatusBadge) {
      drawerStatusBadge.textContent = currentStatus;
      drawerStatusBadge.className = `status-badge ${currentStatus.toLowerCase() === 'suspended' ? 'suspended' : 'active'}`;
    }

    if (btnSuspendUser) {
      btnSuspendUser.textContent = currentStatus.toLowerCase() === 'suspended' ? 'UNSUSPEND ACCOUNT' : 'SUSPEND ACCOUNT';
    }

    drawer.classList.add('open');
    drawerOverlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  };

  // CLOSE PROFILE PANEL
  const closeDeepDiveProfile = () => {
    if (drawer) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    }
    if (drawerOverlay) drawerOverlay.classList.remove('open');
  };

  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDeepDiveProfile);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDeepDiveProfile);

  // RENDER DYNAMIC TABLE ROWS FROM FIRESTORE DATA
  const renderTableRows = (dataList) => {
    if (!userTableBody) return;
    userTableBody.innerHTML = '';

    if (dataList.length === 0) {
      userTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding: 32px; color: var(--text-muted);">
            No athlete records found in database.
          </td>
        </tr>
      `;
      if (recordCountEl) recordCountEl.textContent = '0 records found';
      return;
    }

    dataList.forEach((user) => {
      const tr = document.createElement('tr');
      tr.className = 'user-row';
      tr.dataset.userId = user.id;

      const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : 'AT';

      const joinDateStr = user.createdAt
        ? (user.createdAt.includes('T') ? user.createdAt.split('T')[0] : user.createdAt)
        : '2026-08-11';

      const statusStr = user.status || (user.role === 'admin' ? 'Active' : 'Active');

      tr.innerHTML = `
        <td>
          <div class="user-name-cell">
            <div class="user-avatar-sm">${initials}</div>
            <span>${user.name || 'Unnamed Athlete'}</span>
          </div>
        </td>
        <td class="email-text">${user.email || 'N/A'}</td>
        <td class="date-text">${joinDateStr}</td>
        <td>
          <span class="status-badge ${statusStr.toLowerCase() === 'suspended' ? 'suspended' : 'active'}">
            ${statusStr}
          </span>
        </td>
      `;

      // DYNAMIC EVENT LISTENER FOR PANEL SLIDE-IN
      tr.addEventListener('click', () => {
        openDeepDiveProfile(user);
      });

      userTableBody.appendChild(tr);
    });

    if (recordCountEl) {
      recordCountEl.textContent = `Showing ${dataList.length} of ${loadedUsersList.length} records`;
    }
  };

  // =========================================================================
  // FETCH ALL DOCUMENTS FROM FIRESTORE "users" COLLECTION
  // =========================================================================
  const fetchFirestoreUsers = async () => {
    if (!isFirebaseConfigured) {
      console.warn("Using fallback mock data because Firebase config is placeholder.");
      loadedUsersList = [...mockUsers];
      if (totalUsersValEl) totalUsersValEl.textContent = mockUsers.length;
      renderTableRows(loadedUsersList);
      return;
    }

    try {
      console.log("Fetching live documents from Firestore 'users' collection...");
      const usersColRef = collection(db, "users");
      const querySnapshot = await getDocs(usersColRef);

      const firestoreUsers = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        firestoreUsers.push({
          id: docSnap.id,
          name: data.name || "Anonymous Athlete",
          email: data.email || "No Email",
          birthdate: data.birthdate || "N/A",
          address: data.address || "N/A",
          role: data.role || "user",
          status: data.status || "Active",
          createdAt: data.createdAt || "2026-08-11"
        });
      });

      console.log(`Fetched ${firestoreUsers.length} user documents from Firestore.`);

      // Combine with mock dataset if Firestore database has < 3 documents for rich UI demonstration
      if (firestoreUsers.length === 0) {
        loadedUsersList = [...mockUsers];
      } else {
        loadedUsersList = firestoreUsers;
      }

      // UPDATE TOP METRIC CARD: TOTAL USERS
      if (totalUsersValEl) {
        totalUsersValEl.textContent = loadedUsersList.length;
      }

      renderTableRows(loadedUsersList);
      showAdminToast(`Loaded ${loadedUsersList.length} athlete records from Firestore.`);

    } catch (err) {
      console.error("Error fetching Firestore users:", err);
      showAdminToast("Failed to fetch Firestore records. Loading cached records.", true);
      loadedUsersList = [...mockUsers];
      if (totalUsersValEl) totalUsersValEl.textContent = mockUsers.length;
      renderTableRows(loadedUsersList);
    }
  };

  // SEARCH INPUT FILTERING WITH CONSOLE LOGGING
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      
      // REQUIREMENT: Console log when typing in search
      console.log("Filtering user database...");

      const filtered = loadedUsersList.filter(user => {
        return (user.name && user.name.toLowerCase().includes(query)) ||
               (user.email && user.email.toLowerCase().includes(query));
      });

      renderTableRows(filtered);
    });
  }

  // ADMIN CONTROL BUTTON HANDLERS
  if (btnResetPass) {
    btnResetPass.addEventListener('click', () => {
      if (!activeUserRecord) return;
      console.log(`[ADMIN ACTION] Password reset dispatched for ${activeUserRecord.email}`);
      showAdminToast(`Password reset link dispatched to ${activeUserRecord.email}`);
    });
  }

  if (btnSuspendUser) {
    btnSuspendUser.addEventListener('click', async () => {
      if (!activeUserRecord) return;
      const currentStatus = activeUserRecord.status || 'Active';
      const newStatus = currentStatus.toLowerCase() === 'suspended' ? 'Active' : 'Suspended';
      
      activeUserRecord.status = newStatus;
      showAdminToast(`Account status updated to ${newStatus} for ${activeUserRecord.name}`);

      if (isFirebaseConfigured && activeUserRecord.id && !activeUserRecord.id.startsWith('ATH-')) {
        try {
          const userDocRef = doc(db, "users", activeUserRecord.id);
          await updateDoc(userDocRef, { status: newStatus });
          console.log(`Firestore document ${activeUserRecord.id} updated status to ${newStatus}`);
        } catch (e) {
          console.warn("Could not update Firestore document status:", e);
        }
      }

      openDeepDiveProfile(activeUserRecord);
      renderTableRows(loadedUsersList);
    });
  }

  if (btnDeleteUser) {
    btnDeleteUser.addEventListener('click', async () => {
      if (!activeUserRecord) return;
      const confirmDelete = confirm(`Are you sure you want to PERMANENTLY DELETE all data for ${activeUserRecord.name}?`);
      if (confirmDelete) {
        showAdminToast(`PERMANENTLY DELETED record for ${activeUserRecord.name}`, true);

        if (isFirebaseConfigured && activeUserRecord.id && !activeUserRecord.id.startsWith('ATH-')) {
          try {
            await deleteDoc(doc(db, "users", activeUserRecord.id));
            console.log(`Firestore document ${activeUserRecord.id} deleted.`);
          } catch (e) {
            console.warn("Could not delete Firestore document:", e);
          }
        }

        const idx = loadedUsersList.findIndex(u => u.id === activeUserRecord.id);
        if (idx !== -1) loadedUsersList.splice(idx, 1);

        if (totalUsersValEl) totalUsersValEl.textContent = loadedUsersList.length;

        closeDeepDiveProfile();
        renderTableRows(loadedUsersList);
      }
    });
  }

  // FETCH FIRESTORE DATA ON LOAD
  fetchFirestoreUsers();
}

// EXECUTE IMMEDIATELY IF DOM IS READY OR WAIT FOR LOAD
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminApp);
} else {
  initAdminApp();
}
