"use strict";

// Client test cases suite

const testSuite = [
  {
    name: "Calculator - Default Grid Intensity Values",
    run() {
      const usGrid = calculator.GRID_INTENSITIES.US;
      const euGrid = calculator.GRID_INTENSITIES.EU;
      if (usGrid !== 0.37) return { pass: false, error: `US intensity expected 0.37, got ${usGrid}` };
      if (euGrid !== 0.25) return { pass: false, error: `EU intensity expected 0.25, got ${euGrid}` };
      return { pass: true };
    }
  },
  {
    name: "Calculator - Home Energy Emissions Math",
    run() {
      // 200 kWh/month electricity, 1 LPG cylinder/month, 0% Renewable, EU grid (0.25)
      const inputs = {
        electricity: 200,
        lpg: 1,
        renewableShare: 0,
        fuelType: 'none',
        carDistance: 0,
        publicTransport: 0,
        flights: 0,
        dietType: 'vegan', // Diet: 700 kg
        foodWaste: 'medium', // Mult: 1.0
        wasteBags: 0,
        recycling: { paper: false, plastic: false, metal: false, glass: false },
        shoppingLevel: 'minimalist' // Shopping: 400 kg
      };

      const results = calculator.calculate(inputs, 'EU');
      
      // Expected electricity: 200 * 12 * 0.25 = 600 kg
      // Expected LPG: 1 * 12 * 42.5 = 510 kg
      // Expected Energy Total: 1110 kg
      // Expected Diet: 700 kg
      // Expected Consumption: 50 (lower limit of waste) + 400 (minimalist) = 450 kg
      // Expected Annual Total: 1110 + 700 + 450 = 2260 kg
      
      if (results.breakdown.energy !== 1110) {
        return { pass: false, error: `Expected energy emissions to be 1110 kg, got ${results.breakdown.energy}` };
      }
      if (results.annualTotal !== 2260) {
        return { pass: false, error: `Expected total annual emissions to be 2260 kg, got ${results.annualTotal}` };
      }
      return { pass: true };
    }
  },
  {
    name: "Calculator - Renewable Energy Reductions",
    run() {
      // 200 kWh/month electricity, 0 LPG, 100% Renewable share, EU Grid (0.25)
      const inputs = {
        electricity: 200,
        lpg: 0,
        renewableShare: 100,
        fuelType: 'none',
        carDistance: 0,
        publicTransport: 0,
        flights: 0,
        dietType: 'vegan',
        foodWaste: 'medium',
        wasteBags: 0,
        recycling: { paper: false, plastic: false, metal: false, glass: false },
        shoppingLevel: 'minimalist'
      };

      const results = calculator.calculate(inputs, 'EU');
      
      // Expected electricity: 200 * 12 * (1 - 1.0) * 0.25 = 0 kg
      // Expected LPG: 0 kg
      // Expected Energy Total: 0 kg
      
      if (results.breakdown.energy !== 0) {
        return { pass: false, error: `Expected renewable offsets to clear energy carbon, got ${results.breakdown.energy}` };
      }
      return { pass: true };
    }
  },
  {
    name: "Calculator - Vehicle Fuel Emissions & Mileage Math",
    run() {
      // 1000 km/month by Petrol car (0.18 kg/km)
      const inputs = {
        electricity: 0,
        lpg: 0,
        renewableShare: 0,
        fuelType: 'petrol',
        carDistance: 1000,
        publicTransport: 0,
        flights: 0,
        dietType: 'vegan',
        foodWaste: 'medium',
        wasteBags: 0,
        recycling: { paper: false, plastic: false, metal: false, glass: false },
        shoppingLevel: 'minimalist'
      };

      const results = calculator.calculate(inputs, 'EU');
      
      // Expected transport: 1000 * 12 * 0.18 = 2160 kg
      if (results.breakdown.transport !== 2160) {
        return { pass: false, error: `Expected petrol car transport footprint to be 2160 kg, got ${results.breakdown.transport}` };
      }
      return { pass: true };
    }
  },
  {
    name: "Calculator - Recycling Offsets Logic",
    run() {
      // 1 garbage bag/week (130 kg CO2/year base)
      // Recycles Paper (-30) and Plastic (-40) -> Net waste footprint = 130 - 70 = 60 kg CO2/year
      const inputs = {
        electricity: 0,
        lpg: 0,
        renewableShare: 0,
        fuelType: 'none',
        carDistance: 0,
        publicTransport: 0,
        flights: 0,
        dietType: 'vegan',
        foodWaste: 'medium',
        wasteBags: 1,
        recycling: { paper: true, plastic: true, metal: false, glass: false },
        shoppingLevel: 'minimalist' // 400 kg
      };

      const results = calculator.calculate(inputs, 'EU');
      
      // Expected consumption = waste + shopping = 60 + 400 = 460 kg
      if (results.breakdown.consumption !== 460) {
        return { pass: false, error: `Expected recycling reduction check to make consumption footprint 460 kg, got ${results.breakdown.consumption}` };
      }
      return { pass: true };
    }
  },
  {
    name: "Assistant Heuristics - Match Analysis Search terms",
    run() {
      // Stub data inside global state object
      window.app.carbonData = {
        annualTotal: 6500,
        monthlyTotal: 542,
        breakdown: { energy: 1200, transport: 2000, diet: 1800, consumption: 1500 }
      };
      
      const response = assistant.generateOfflineResponse("Analyze my statistics please");
      
      if (!response.includes("Total Footprint") || !response.includes("6.5 tons")) {
        return { pass: false, error: `Expected response to contain footprint breakdown summary. Got:\n${response}` };
      }
      return { pass: true };
    }
  },
  {
    name: "Assistant Heuristics - Energy Optimization Queries",
    run() {
      const response = assistant.generateOfflineResponse("How to lower my electricity bill carbon?");
      
      if (!response.includes("Switch to LEDs") || !response.includes("standby")) {
        return { pass: false, error: `Expected response to address standby and LED switching suggestions. Got:\n${response}` };
      }
      return { pass: true };
    }
  },
  {
    name: "Assistant Heuristics - Fallback Offline Advice",
    run() {
      const response = assistant.generateOfflineResponse("What is the temperature of Mars?");
      
      if (!response.includes("Offline Mode") || !response.includes("Gaia")) {
        return { pass: false, error: `Expected response to note offline constraints and mention Gaia. Got:\n${response}` };
      }
      return { pass: true };
    }
  },
  {
    name: "Simulator - Carbon Impact Projection Calculations",
    run() {
      // Sandbox setup
      const div = document.createElement('div');
      div.innerHTML = `
        <input id="sim-transport-reduction" value="50">
        <input id="sim-renewable-shift" value="50">
        <input id="sim-meat-reduction" value="0">
        <input id="sim-waste-reduction" value="0">
        <span id="val-sim-transport"></span>
        <span id="val-sim-energy"></span>
        <span id="val-sim-diet"></span>
        <span id="val-sim-waste"></span>
        <span id="val-sim-reduction-pct"></span>
        <span id="val-sim-current-ton"></span>
        <span id="val-sim-projected-ton"></span>
        <span id="val-sim-saved-kg"></span>
      `;
      document.body.appendChild(div);

      try {
        window.app.userProfile = {
          region: 'EU',
          inputs: {
            electricity: 200,
            renewableShare: 0,
          }
        };
        window.app.carbonData = {
          annualTotal: 4000,
          breakdown: { energy: 1000, transport: 1000, diet: 1000, consumption: 1000 }
        };
        
        simulator.loadProfile(window.app.userProfile, window.app.carbonData);
        
        // Set slider values after loading profile (since loadProfile resets them)
        document.getElementById('sim-transport-reduction').value = 50;
        document.getElementById('sim-renewable-shift').value = 50;
        
        simulator.updateProjection();
        
        const pctText = document.getElementById('val-sim-reduction-pct').innerText;
        const savedText = document.getElementById('val-sim-saved-kg').innerText;
        
        if (pctText !== "20%") {
          return { pass: false, error: `Expected reduction percentage to be 20%, got ${pctText}` };
        }
        if (!savedText.includes("800")) {
          return { pass: false, error: `Expected annual savings to include 800 kg, got ${savedText}` };
        }
        return { pass: true };
      } finally {
        div.remove();
      }
    }
  },
  {
    name: "Habits - Logging daily streak and XP increments",
    run() {
      const userProfile = {
        xp: 100,
        habits: [
          { id: 'habit-meatless', active: true, streak: 0, lastLogged: null }
        ]
      };
      
      const originalProfile = window.app.userProfile;
      window.app.userProfile = userProfile;
      let saved = false;
      window.app.saveProfile = () => { saved = true; };
      
      try {
        habits.logDaily('habit-meatless');
        
        const habitState = userProfile.habits[0];
        if (habitState.streak !== 1) {
          return { pass: false, error: `Expected streak to be 1, got ${habitState.streak}` };
        }
        if (userProfile.xp !== 115) { // 100 + 15 XP reward
          return { pass: false, error: `Expected XP to be 115, got ${userProfile.xp}` };
        }
        if (!saved) {
          return { pass: false, error: "Expected profile to be saved" };
        }
        return { pass: true };
      } finally {
        window.app.userProfile = originalProfile;
        window.app.saveProfile = () => {};
      }
    }
  },
  {
    name: "Habits - Double logging prevention check",
    run() {
      const today = new Date().toDateString();
      const userProfile = {
        xp: 100,
        habits: [
          { id: 'habit-meatless', active: true, streak: 1, lastLogged: today }
        ]
      };
      
      const originalProfile = window.app.userProfile;
      window.app.userProfile = userProfile;
      
      try {
        habits.logDaily('habit-meatless');
        
        const habitState = userProfile.habits[0];
        if (habitState.streak !== 1) {
          return { pass: false, error: `Expected streak to remain 1, got ${habitState.streak}` };
        }
        if (userProfile.xp !== 100) {
          return { pass: false, error: `Expected XP to remain 100, got ${userProfile.xp}` };
        }
        return { pass: true };
      } finally {
        window.app.userProfile = originalProfile;
      }
    }
  },
  {
    name: "Dashboard - Eco standing score calculation math",
    run() {
      const carbonData = {
        annualTotal: 5000,
        breakdown: { energy: 1000, transport: 1500, diet: 1500, consumption: 1000 },
        monthlyTotal: 417
      };
      const userProfile = {
        region: 'EU',
        xp: 150,
        habits: [
          { id: 'habit-meatless', active: true },
          { id: 'habit-commute', active: true },
          { id: 'habit-led', active: false }
        ]
      };
      
      const div = document.createElement('div');
      div.innerHTML = `
        <span id="val-annual-footprint"></span>
        <span id="val-monthly-footprint"></span>
        <span id="val-target-diff"></span>
        <div id="change-target-standing"></div>
        <span id="unit-target-comparison"></span>
        <div id="change-annual-footprint"></div>
        <div id="change-monthly-footprint"></div>
        <span id="val-eco-score"></span>
        <span id="val-eco-rating"></span>
        <div id="change-eco-rank"></div>
        <span id="sidebar-user-avatar"></span>
        <span id="sidebar-user-level"></span>
        <span id="badge-current-level"></span>
        <span id="xp-text-current"></span>
        <span id="xp-text-next"></span>
        <div id="level-progress-indicator"></div>
        <div id="level-badge-title"></div>
        <div id="dashboard-achievements-container"></div>
        <canvas id="chart-breakdown"></canvas>
      `;
      document.body.appendChild(div);
      
      try {
        dashboard.update(carbonData, userProfile);
        
        const scoreText = document.getElementById('val-eco-score').innerText;
        // base = 100 - (5000 / 250) = 80. bonus = 2 active habits * 3.5 = 7. final = 87
        if (scoreText !== "87") {
          return { pass: false, error: `Expected eco standing score to be 87, got ${scoreText}` };
        }
        return { pass: true };
      } finally {
        div.remove();
      }
    }
  }
];

function runTests() {
  const container = document.getElementById('test-logs-container');
  if (!container) return;
  
  container.innerHTML = '';
  let passed = 0;
  let failed = 0;
  
  testSuite.forEach((t, index) => {
    let result = { pass: false, error: "Runtime error" };
    try {
      result = t.run();
    } catch (err) {
      result.error = err.message;
    }
    
    if (result.pass) {
      passed++;
    } else {
      failed++;
    }
    
    const div = document.createElement('div');
    div.className = `test-case ${result.pass ? 'pass' : 'fail'}`;
    div.innerHTML = `
      <div class="test-info">
        <h3>Test #${index + 1}: ${t.name}</h3>
        <p>${result.pass ? 'Verification validation checks succeeded' : 'Error: ' + result.error}</p>
      </div>
      <div class="test-status ${result.pass ? 'pass' : 'fail'}">
        ${result.pass ? '<i class="fa-solid fa-circle-check"></i> PASS' : '<i class="fa-solid fa-circle-xmark"></i> FAIL'}
      </div>
    `;
    container.appendChild(div);
  });
  
  // Render counters
  const total = testSuite.length;
  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-passed').innerText = passed;
  document.getElementById('stat-failed').innerText = failed;
  
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  document.getElementById('stat-pct').innerText = `${pct}%`;
}

// Auto-run on load
window.addEventListener('DOMContentLoaded', () => {
  runTests();
});
