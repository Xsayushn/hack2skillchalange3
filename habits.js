// Eco Habits Module

const habits = {
  PRELOADED_HABITS: [
    {
      id: 'habit-meatless',
      title: 'Meatless Mondays',
      category: 'diet',
      desc: 'Commit to plant-based meals at least one day per week to reduce demand for intensive animal agriculture.',
      impact: 'High Impact (-180 kg CO₂e/yr)',
      xpReward: 15,
      icon: 'fa-seedling'
    },
    {
      id: 'habit-commute',
      title: 'Commute Sustainably',
      category: 'transport',
      desc: 'Swap solo driving for cycling, public transport, or walking at least two days a week.',
      impact: 'High Impact (-400 kg CO₂e/yr)',
      xpReward: 25,
      icon: 'fa-bicycle'
    },
    {
      id: 'habit-led',
      title: 'Switch to LED Lighting',
      category: 'energy',
      desc: 'Replace standard halogen bulbs with energy-efficient LED equivalents around your living space.',
      impact: 'Medium Impact (-120 kg CO₂e/yr)',
      xpReward: 10,
      icon: 'fa-lightbulb'
    },
    {
      id: 'habit-standby',
      title: 'Cut Standby Power',
      category: 'energy',
      desc: 'Turn off entertainment systems, chargers, and appliances directly at the wall plug when not in use.',
      impact: 'Medium Impact (-80 kg CO₂e/yr)',
      xpReward: 10,
      icon: 'fa-plug'
    },
    {
      id: 'habit-compost',
      title: 'Compost Food Scraps',
      category: 'diet',
      desc: 'Divert organics from landfills (where they rot and emit methane) by starting a backyard or local compost bin.',
      impact: 'Low Impact (-50 kg CO₂e/yr)',
      xpReward: 8,
      icon: 'fa-recycle'
    },
    {
      id: 'habit-bags',
      title: 'Say No to Single-Use Bags',
      category: 'lifestyle',
      desc: 'Keep reusable cloth bags in your vehicle or backpack for all grocery and retail shopping trips.',
      impact: 'Low Impact (-30 kg CO₂e/yr)',
      xpReward: 8,
      icon: 'fa-bag-shopping'
    },
    {
      id: 'habit-local',
      title: 'Shop Local & In-Season',
      category: 'lifestyle',
      desc: 'Buy food grown locally within your province to cut down transport miles and greenhouse heating footprint.',
      impact: 'Medium Impact (-110 kg CO₂e/yr)',
      xpReward: 12,
      icon: 'fa-cart-flatbed-suitcase'
    }
  ],

  renderList(userProfile) {
    const container = document.getElementById('habits-cards-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Merge userProfile states into standard definition
    const profileHabits = userProfile.habits || [];
    
    this.PRELOADED_HABITS.forEach(h => {
      const activeState = profileHabits.find(ph => ph.id === h.id) || { active: false, streak: 0, lastLogged: null };
      
      const cardHtml = `
        <div class="card habit-card" id="card-${h.id}">
          <div class="habit-header">
            <div class="habit-title">
              <h3>${h.title}</h3>
              <span class="habit-cat-tag tag-${h.category}">${h.category}</span>
            </div>
            <div style="font-size: 1.25rem; color: var(--text-muted);">
              <i class="fa-solid ${h.icon}"></i>
            </div>
          </div>
          
          <div class="habit-details">
            <p>${h.desc}</p>
          </div>
          
          <div>
            <div class="habit-impact-badge">
              <i class="fa-solid fa-leaf"></i> ${h.impact}
            </div>
            ${activeState.active ? `
              <div class="habit-streak" style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-fire" style="color: var(--color-warning);"></i>
                <span>Active Streak: <strong>${activeState.streak} days</strong></span>
              </div>
            ` : ''}
          </div>
          
          <div class="habit-footer">
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">
              Reward: <strong style="color: var(--color-primary);">+${h.xpReward} XP</strong>
            </span>
            ${activeState.active ? `
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-primary btn-sm habit-action-btn active" onclick="habits.logDaily('${h.id}')" id="btn-log-${h.id}">
                  <i class="fa-solid fa-check"></i> Log Today
                </button>
                <button class="btn btn-secondary btn-sm" style="padding: 0.5rem;" title="Remove Action" onclick="habits.toggleHabitActive('${h.id}', false)">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            ` : `
              <button class="btn btn-secondary btn-sm habit-action-btn" onclick="habits.toggleHabitActive('${h.id}', true)">
                <i class="fa-solid fa-plus"></i> Add to Plan
              </button>
            `}
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', cardHtml);
    });
  },

  toggleHabitActive(id, active) {
    if (active) {
      app.activateHabit(id);
      app.showToast("Added habit to your carbon reduction plan!", "success");
    } else {
      const idx = app.userProfile.habits.findIndex(ph => ph.id === id);
      if (idx !== -1) {
        app.userProfile.habits[idx].active = false;
        app.saveProfile();
        app.showToast("Removed habit from your plan.", "info");
      }
    }
    this.renderList(app.userProfile);
    app.updateDashboard();
  },

  logDaily(id) {
    const item = this.PRELOADED_HABITS.find(h => h.id === id);
    const phIdx = app.userProfile.habits.findIndex(ph => ph.id === id);
    
    if (!item || phIdx === -1) return;
    
    const habitState = app.userProfile.habits[phIdx];
    const today = new Date().toDateString();
    
    if (habitState.lastLogged === today) {
      app.showToast("You have already logged this habit today!", "warning");
      return;
    }
    
    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (habitState.lastLogged === yesterday.toDateString()) {
      habitState.streak++;
    } else {
      habitState.streak = 1;
    }
    
    habitState.lastLogged = today;
    
    // Award XP
    app.grantXP(item.xpReward);
    app.saveProfile();
    
    app.showToast(`Logged! Earned +${item.xpReward} XP. Streak: ${habitState.streak} days`, "success");
    
    this.renderList(app.userProfile);
    app.updateDashboard();
  }
};
