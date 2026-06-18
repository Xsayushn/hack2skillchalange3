"use strict";

// Main Application Controller Module

const app = {
  userProfile: null,
  carbonData: null,

  init() {
    this.loadProfile();
    
    // Initialize child modules
    calculator.init();
    simulator.init();
    assistant.init();
    habits.init();
    
    // Trigger initial renders
    this.updateDashboard();
    
    // Programmatic event listeners for navigation & settings
    const views = ['dashboard', 'calculator', 'simulator', 'habits', 'assistant', 'settings'];
    views.forEach(v => {
      const navItem = document.getElementById(`nav-${v}`);
      if (navItem) {
        const link = navItem.querySelector('a');
        if (link) {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateTo(v);
          });
        }
      }
    });

    const btnRecalculate = document.getElementById('btn-recalculate');
    if (btnRecalculate) {
      btnRecalculate.addEventListener('click', () => {
        this.navigateTo('calculator');
      });
    }

    const inputName = document.getElementById('setting-user-name');
    if (inputName) {
      inputName.addEventListener('change', () => this.saveSettings());
    }

    const selectRegion = document.getElementById('setting-region');
    if (selectRegion) {
      selectRegion.addEventListener('change', () => this.saveSettings());
    }

    const inputKey = document.getElementById('setting-gemini-key');
    if (inputKey) {
      inputKey.addEventListener('change', () => this.saveSettings());
    }

    const btnToggleKey = document.getElementById('btn-toggle-key-visibility');
    if (btnToggleKey) {
      btnToggleKey.addEventListener('click', () => this.toggleKeyVisibility());
    }

    const btnWipe = document.getElementById('btn-wipe-data');
    if (btnWipe) {
      btnWipe.addEventListener('click', () => this.resetAllData());
    }
    
    // Listen for back/forward navigation or hash changes
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      this.navigateTo(hash);
    });

    // Load initial page matching hash
    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    this.navigateTo(initialHash);
  },

  // State Management (LocalStorage)
  loadProfile() {
    const saved = localStorage.getItem('ecofootprint_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.userProfile = parsed;
        this.carbonData = parsed.carbonData || null;
      } catch (err) {
        console.error("Error parsing profile, resetting...", err);
        this.resetProfileToDefault();
      }
    } else {
      this.resetProfileToDefault();
    }
  },

  resetProfileToDefault() {
    this.userProfile = {
      name: "Eco Explorer",
      region: "EU",
      xp: 0,
      habits: habits.PRELOADED_HABITS.map(h => ({
        id: h.id,
        active: false,
        streak: 0,
        lastLogged: null
      })),
      inputs: null,
      awardedAchievements: [],
      simulationUsed: false,
      geminiKey: ""
    };
    this.carbonData = null;
    this.saveProfile();
  },

  saveProfile() {
    this.userProfile.carbonData = this.carbonData;
    localStorage.setItem('ecofootprint_profile', JSON.stringify(this.userProfile));
  },

  updateCarbonData(inputs, results) {
    // Save history
    if (this.carbonData && this.carbonData.annualTotal) {
      this.userProfile.previousAnnualTotal = this.carbonData.annualTotal;
    }
    
    this.userProfile.inputs = inputs;
    this.carbonData = results;
    
    // Auto-award Pioneer achievement on first save
    if (!this.userProfile.awardedAchievements.includes('ach-baseline')) {
      // XP will be granted by the achievements checker inside dashboard
    }
    
    this.saveProfile();
    this.updateDashboard();
  },

  grantXP(amount) {
    const oldLevel = Math.floor(this.userProfile.xp / 100) + 1;
    this.userProfile.xp += amount;
    const newLevel = Math.floor(this.userProfile.xp / 100) + 1;
    
    if (newLevel > oldLevel) {
      setTimeout(() => {
        this.showToast(`LEVEL UP! You are now Level ${newLevel}! 🎉`, "success");
      }, 500);
    }
    this.saveProfile();
  },

  checkAchievementAwards(achievementsList) {
    let profileUpdated = false;
    
    achievementsList.forEach(ach => {
      if (ach.unlocked && !this.userProfile.awardedAchievements.includes(ach.id)) {
        this.userProfile.awardedAchievements.push(ach.id);
        this.grantXP(ach.xp);
        profileUpdated = true;
        
        // Use a timeout to cascade notifications gracefully
        setTimeout(() => {
          this.showToast(`Achievement Unlocked: ${ach.title} (+${ach.xp} XP) 🏆`, "success");
        }, 100);
      }
    });

    if (profileUpdated) {
      this.saveProfile();
      this.updateDashboard();
    }
  },

  activateHabit(id) {
    if (!this.userProfile.habits) return;
    const idx = this.userProfile.habits.findIndex(h => h.id === id);
    if (idx !== -1) {
      this.userProfile.habits[idx].active = true;
      this.saveProfile();
    }
  },

  // View Controllers & Routing
  navigateTo(pageId) {
    const views = ['dashboard', 'calculator', 'simulator', 'habits', 'assistant', 'settings'];
    
    if (!views.includes(pageId)) pageId = 'dashboard';

    // Switch View Classes
    views.forEach(v => {
      const el = document.getElementById(`${v}-view`);
      const navItem = document.getElementById(`nav-${v}`);
      if (el) el.classList.remove('active');
      if (navItem) navItem.classList.remove('active');
    });

    const activeView = document.getElementById(`${pageId}-view`);
    const activeNav = document.getElementById(`nav-${pageId}`);
    
    if (activeView) activeView.classList.add('active');
    if (activeNav) activeNav.classList.add('active');

    // Contextual Page Loads
    if (pageId === 'dashboard') {
      this.updateDashboard();
    } else if (pageId === 'simulator') {
      simulator.loadProfile(this.userProfile, this.carbonData);
    } else if (pageId === 'habits') {
      habits.renderList(this.userProfile);
    } else if (pageId === 'assistant') {
      assistant.updateContextSummary(this.userProfile, this.carbonData);
    } else if (pageId === 'settings') {
      this.loadSettingsPage();
    }

    // Scroll main panel to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  updateDashboard() {
    dashboard.update(this.carbonData, this.userProfile);
    
    // Keep sidebar stats up to date
    document.getElementById('sidebar-user-name').textContent = this.userProfile.name;
    const level = Math.floor(this.userProfile.xp / 100) + 1;
    const xpCurrent = this.userProfile.xp % 100;
    document.getElementById('sidebar-user-avatar').textContent = `L${level}`;
    document.getElementById('sidebar-user-level').textContent = `Level ${level} (${xpCurrent} / 100 XP)`;
  },

  // Settings Panel Logic
  loadSettingsPage() {
    document.getElementById('setting-user-name').value = this.userProfile.name;
    document.getElementById('setting-region').value = this.userProfile.region || 'EU';
    document.getElementById('setting-gemini-key').value = this.userProfile.geminiKey || '';
    
    const icon = document.getElementById('icon-key-visibility');
    const input = document.getElementById('setting-gemini-key');
    if (input) input.type = "password";
    if (icon) {
      icon.className = "fa-solid fa-eye";
    }
  },

  saveSettings() {
    const name = document.getElementById('setting-user-name').value.trim();
    const region = document.getElementById('setting-region').value;
    const key = document.getElementById('setting-gemini-key').value.trim();

    this.userProfile.name = name || "Eco Explorer";
    
    // If region changes, trigger recalculation of existing inputs
    if (this.userProfile.region !== region) {
      this.userProfile.region = region;
      this.showToast("Region changed. Adjusting baselines...", "info");
      
      if (this.userProfile.inputs) {
        const results = calculator.calculate(this.userProfile.inputs, region);
        this.carbonData = results;
      }
    }

    this.userProfile.geminiKey = key;
    this.saveProfile();
    this.updateDashboard();
    
    // Update Gaia Chat Panel status label
    const labelStatus = document.getElementById('label-chat-status');
    if (labelStatus) {
      if (key.length > 10) {
        labelStatus.textContent = "Ready (Online Coach)";
        labelStatus.style.color = "var(--color-primary)";
      } else {
        labelStatus.textContent = "Ready (Offline Coach)";
        labelStatus.style.color = "";
      }
    }
  },

  toggleKeyVisibility() {
    const input = document.getElementById('setting-gemini-key');
    const icon = document.getElementById('icon-key-visibility');
    if (!input || !icon) return;

    if (input.type === 'password') {
      input.type = 'text';
      icon.className = "fa-solid fa-eye-slash";
    } else {
      input.type = 'password';
      icon.className = "fa-solid fa-eye";
    }
  },

  resetAllData() {
    if (confirm("Are you absolutely sure you want to delete all saved data, streaks, levels, and baselines? This action is permanent.")) {
      localStorage.removeItem('ecofootprint_profile');
      this.resetProfileToDefault();
      this.showToast("Local storage wiped clean.", "danger");
      
      // Redirect
      window.location.hash = '#dashboard';
      this.navigateTo('dashboard');
    }
  },

  // Notification Toast Controller
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container-wrapper');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    if (type === 'danger') iconClass = 'fa-radiation';
    if (type === 'info') iconClass = 'fa-circle-info';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span></span>
    `;
    toast.querySelector('span').textContent = message;

    container.appendChild(toast);

    // Auto-remove animation sequence
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
      toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
  }
};

// Window onload trigger
window.addEventListener('DOMContentLoaded', () => {
  app.init();
});
