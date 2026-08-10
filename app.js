// Phase 1: Vanilla JavaScript App Shell & Navigation Controller

document.addEventListener('DOMContentLoaded', () => {
  initTabNavigation();
  console.log("⚡ Hardcore Iron Gym Progress Tracker - Phase 1 Initialized.");
});

/**
 * Tab Navigation Switcher Logic (Vanilla JS)
 * Displays target screen tab and hides all other screens.
 */
function initTabNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Deactivate all tabs and screens
      tabs.forEach(t => t.classList.remove('active'));
      screens.forEach(s => s.classList.remove('active'));

      // Activate clicked tab & target view screen
      tab.classList.add('active');
      const activeScreen = document.getElementById(`tab-${targetTab}`);
      if (activeScreen) {
        activeScreen.classList.add('active');
      }

      // Smooth scroll back to top of main viewport
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}
