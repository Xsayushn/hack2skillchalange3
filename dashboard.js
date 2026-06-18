"use strict";

// Dashboard Rendering Module

const dashboard = {
  chart: null,
  
  // Region Targets (in kg CO2e per year)
  REGION_LIMITS: {
    US: 16000,
    EU: 8000,
    IN: 2200,
    GL: 4800
  },

  update(carbonData, userProfile) {
    if (!carbonData || !carbonData.annualTotal) {
      this.renderEmptyState();
      return;
    }

    const annualTons = (carbonData.annualTotal / 1000).toFixed(1);
    const monthlyKg = carbonData.monthlyTotal;
    
    // 1. Core values
    document.getElementById('val-annual-footprint').textContent = annualTons;
    document.getElementById('val-monthly-footprint').textContent = monthlyKg;

    // 2. Target Diff
    const region = userProfile.region || 'EU';
    const limit = this.REGION_LIMITS[region] || 8000;
    const limitPct = Math.round((carbonData.annualTotal / limit) * 100);
    document.getElementById('val-target-diff').textContent = `${limitPct}%`;
    
    const targetStanding = document.getElementById('change-target-standing');
    const targetIndicator = document.getElementById('unit-target-comparison');
    if (limitPct <= 50) {
      targetStanding.innerHTML = `<i class="fa-solid fa-leaf" style="color: var(--color-primary);"></i> <span style="color: var(--color-primary);">Carbon Neutral Champion</span>`;
      targetIndicator.textContent = `of ${region} budget (Excellent)`;
    } else if (limitPct <= 100) {
      targetStanding.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--color-secondary);"></i> <span style="color: var(--color-secondary);">Under Regional Budget</span>`;
      targetIndicator.textContent = `of ${region} budget (Good)`;
    } else {
      targetStanding.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--color-danger);"></i> <span style="color: var(--color-danger);">Over Regional Budget</span>`;
      targetIndicator.textContent = `of ${region} budget (Needs Action)`;
    }

    // 3. Historical comparison
    const annualChange = document.getElementById('change-annual-footprint');
    const monthlyChange = document.getElementById('change-monthly-footprint');
    if (userProfile.previousAnnualTotal) {
      const diffAnnual = carbonData.annualTotal - userProfile.previousAnnualTotal;
      const diffPct = Math.round((diffAnnual / userProfile.previousAnnualTotal) * 100);
      
      if (diffAnnual < 0) {
        annualChange.className = "metric-change negative";
        annualChange.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> <span>Saved ${Math.abs(diffPct)}% since last</span>`;
        monthlyChange.className = "metric-change negative";
        monthlyChange.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> <span>Reduced footprint</span>`;
      } else if (diffAnnual > 0) {
        annualChange.className = "metric-change positive";
        annualChange.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> <span>Increased ${diffPct}% since last</span>`;
        monthlyChange.className = "metric-change positive";
        monthlyChange.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> <span>Increased footprint</span>`;
      } else {
        annualChange.className = "metric-change";
        annualChange.innerHTML = `<i class="fa-solid fa-minus"></i> <span>No change since last</span>`;
        monthlyChange.className = "metric-change";
        monthlyChange.innerHTML = `<i class="fa-solid fa-minus"></i> <span>Steady baseline</span>`;
      }
    } else {
      annualChange.className = "metric-change";
      annualChange.innerHTML = `<i class="fa-solid fa-leaf"></i> <span>First baseline set</span>`;
      monthlyChange.className = "metric-change";
      monthlyChange.innerHTML = `<i class="fa-solid fa-leaf"></i> <span>First baseline set</span>`;
    }

    // 4. Eco Score
    const activeHabits = userProfile.habits ? userProfile.habits.filter(h => h.active).length : 0;
    const baseScore = 100 - (carbonData.annualTotal / 250);
    const bonusPoints = activeHabits * 3.5;
    const finalScore = Math.max(5, Math.min(100, Math.round(baseScore + bonusPoints)));
    
    document.getElementById('val-eco-score').textContent = finalScore;
    const ratingElement = document.getElementById('val-eco-rating');
    const changeEcoRank = document.getElementById('change-eco-rank');
    if (finalScore >= 85) {
      ratingElement.textContent = "Eco Hero";
      changeEcoRank.style.color = "var(--color-primary)";
    } else if (finalScore >= 70) {
      ratingElement.textContent = "Green Guardian";
      changeEcoRank.style.color = "var(--color-secondary)";
    } else if (finalScore >= 50) {
      ratingElement.textContent = "Climate Advocate";
      changeEcoRank.style.color = "var(--color-warning)";
    } else {
      ratingElement.textContent = "Carbon Heavyweight";
      changeEcoRank.style.color = "var(--color-danger)";
    }

    // 5. XP and Leveling Systems
    const xp = userProfile.xp || 0;
    const level = Math.floor(xp / 100) + 1;
    const xpCurrent = xp % 100;
    const xpNeeded = 100 - xpCurrent;

    document.getElementById('sidebar-user-avatar').textContent = `L${level}`;
    document.getElementById('sidebar-user-level').textContent = `Level ${level} (${xpCurrent} / 100 XP)`;
    document.getElementById('badge-current-level').textContent = level;
    document.getElementById('xp-text-current').textContent = `${xpCurrent} XP earned in level`;
    document.getElementById('xp-text-next').textContent = `${xpNeeded} XP to level up`;
    document.getElementById('level-progress-indicator').style.width = `${xpCurrent}%`;
    
    // Level Badge Title update
    const levelTitle = document.getElementById('level-badge-title');
    if (level >= 5) {
      levelTitle.textContent = "Sovereign Green Earthmaster";
    } else if (level === 4) {
      levelTitle.textContent = "Ecosystem Champion";
    } else if (level === 3) {
      levelTitle.textContent = "Eco Specialist";
    } else if (level === 2) {
      levelTitle.textContent = "Nature Protector";
    } else {
      levelTitle.textContent = "Eco Explorer";
    }

    // 6. Renders chart
    this.renderChart(carbonData.breakdown);

    // 7. Milestones
    this.renderAchievements(userProfile, carbonData);
  },

  renderEmptyState() {
    document.getElementById('val-annual-footprint').textContent = "--";
    document.getElementById('val-monthly-footprint').textContent = "--";
    document.getElementById('val-target-diff').textContent = "--%";
    document.getElementById('val-eco-score').textContent = "--";
    document.getElementById('val-eco-rating').textContent = "Enter Data";
    document.getElementById('level-progress-indicator').style.width = `0%`;
    document.getElementById('dashboard-achievements-container').innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
        <i class="fa-solid fa-lock" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
        <span>Unlock milestones by calculating your baseline footprint.</span>
      </div>
    `;
    this.renderChart({ energy: 25, transport: 25, diet: 25, consumption: 25 }, true);
  },

  renderChart(breakdown, isDemo = false) {
    const ctx = document.getElementById('chart-breakdown').getContext('2d');
    
    // Destroy previous instance
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = ['Household Energy', 'Transportation', 'Diet & Food', 'Waste & Shopping'];
    const data = [breakdown.energy, breakdown.transport, breakdown.diet, breakdown.consumption];
    const borderColors = ['rgba(245, 158, 11, 0.5)', 'rgba(6, 182, 212, 0.5)', 'rgba(16, 185, 129, 0.5)', 'rgba(139, 92, 246, 0.5)'];
    const bgColors = ['rgba(245, 158, 11, 0.2)', 'rgba(6, 182, 212, 0.2)', 'rgba(16, 185, 129, 0.2)', 'rgba(139, 92, 246, 0.2)'];
    const hoverBorderColors = ['#f59e0b', '#06b6d4', '#10b981', '#8b5cf6'];
    const hoverBgColors = ['rgba(245, 158, 11, 0.4)', 'rgba(6, 182, 212, 0.4)', 'rgba(16, 185, 129, 0.4)', 'rgba(139, 92, 246, 0.4)'];

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          hoverBackgroundColor: hoverBgColors,
          hoverBorderColor: hoverBorderColors,
          borderWidth: 2,
          spacing: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: {
                family: 'Outfit',
                size: 12
              },
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                if (isDemo) return `${context.label}: Demo Data`;
                return `${context.label}: ${value.toLocaleString()} kg CO₂e/yr`;
              }
            }
          }
        },
        cutout: '65%'
      }
    });
  },

  renderAchievements(userProfile, carbonData) {
    const list = [
      {
        id: 'ach-baseline',
        title: 'Carbon Pioneer',
        desc: 'Established your first carbon footprint baseline.',
        icon: 'fa-flag',
        unlocked: !!(carbonData && carbonData.annualTotal),
        xp: 50
      },
      {
        id: 'ach-under-budget',
        title: 'Green Guardian',
        desc: 'Footprint is below the regional average limit.',
        icon: 'fa-shield-halved',
        unlocked: (carbonData && carbonData.annualTotal && carbonData.annualTotal < this.REGION_LIMITS[userProfile.region || 'EU']),
        xp: 100
      },
      {
        id: 'ach-eco-habits',
        title: 'Active Advocate',
        desc: 'Committed to at least 3 ecological habits.',
        icon: 'fa-circle-check',
        unlocked: !!(userProfile.habits && userProfile.habits.filter(h => h.active).length >= 3),
        xp: 80
      },
      {
        id: 'ach-simulation',
        title: 'Ecological Architect',
        desc: 'Used What-If Simulator and applied habit strategies.',
        icon: 'fa-wand-magic-sparkles',
        unlocked: !!userProfile.simulationUsed,
        xp: 50
      }
    ];

    const container = document.getElementById('dashboard-achievements-container');
    container.innerHTML = '';
    
    let achievementsUnlockedCount = 0;

    list.forEach(ach => {
      const isUnlocked = ach.unlocked;
      if (isUnlocked) achievementsUnlockedCount++;
      
      const itemHtml = `
        <div class="achievement-item ${isUnlocked ? '' : 'locked'}" id="${ach.id}">
          <div class="achievement-icon">
            <i class="fa-solid ${ach.icon}"></i>
          </div>
          <div class="achievement-info" style="flex-grow: 1;">
            <h4>${ach.title} ${isUnlocked ? '' : '<i class="fa-solid fa-lock" style="font-size: 0.75rem; margin-left: 0.25rem; color: var(--text-muted);"></i>'}</h4>
            <p>${ach.desc}</p>
          </div>
          <div style="font-size: 0.8rem; font-weight: 700; color: ${isUnlocked ? 'var(--color-primary)' : 'var(--text-muted)'};">
            +${ach.xp} XP
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', itemHtml);
    });

    // Check achievement unlock award triggers (XP)
    app.checkAchievementAwards(list);
  }
};
