"use strict";

// Eco Simulator Module

const simulator = {
  inputs: {},
  breakdown: {},
  annualTotal: 0,

  init() {
    const sliders = [
      'sim-transport-reduction',
      'sim-renewable-shift',
      'sim-meat-reduction',
      'sim-waste-reduction'
    ];

    sliders.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.updateProjection());
      }
    });

    const btnConvert = document.getElementById('btn-convert-sim-to-habits');
    if (btnConvert) {
      btnConvert.addEventListener('click', () => this.applySimulatedActions());
    }
  },

  loadProfile(userProfile, carbonData) {
    if (!carbonData || !carbonData.annualTotal) {
      this.inputs = {
        renewableShare: 0,
        electricity: 250,
        lpg: 1,
        carDistance: 800,
        publicTransport: 200,
        flights: 10,
        dietType: 'balanced',
        foodWaste: 'medium',
        wasteBags: 2,
        recycling: { paper: true, plastic: true, metal: false, glass: false },
        shoppingLevel: 'average'
      };
      this.breakdown = { energy: 1500, transport: 2400, diet: 1800, consumption: 1400 };
      this.annualTotal = 7100;
    } else {
      this.inputs = JSON.parse(JSON.stringify(userProfile.inputs));
      this.breakdown = JSON.parse(JSON.stringify(carbonData.breakdown));
      this.annualTotal = carbonData.annualTotal;
    }

    // Set slider initial values from current inputs
    const renewableSlider = document.getElementById('sim-renewable-shift');
    if (renewableSlider) {
      renewableSlider.value = this.inputs.renewableShare || 0;
    }

    // Reset others to 0
    document.getElementById('sim-transport-reduction').value = 0;
    document.getElementById('sim-meat-reduction').value = 0;
    document.getElementById('sim-waste-reduction').value = 0;

    this.updateProjection();
  },

  updateProjection() {
    const transportPct = parseFloat(document.getElementById('sim-transport-reduction').value);
    const energyVal = parseFloat(document.getElementById('sim-renewable-shift').value);
    const dietPct = parseFloat(document.getElementById('sim-meat-reduction').value);
    const wastePct = parseFloat(document.getElementById('sim-waste-reduction').value);

    // Update slider UI value labels
    document.getElementById('val-sim-transport').innerText = `${transportPct}% Less`;
    document.getElementById('val-sim-energy').innerText = energyVal > 0 ? `${energyVal}% Green` : 'No Change';
    document.getElementById('val-sim-diet').innerText = dietPct > 0 ? `${dietPct}% Less Meat` : 'No Change';
    document.getElementById('val-sim-waste').innerText = `${wastePct}% Less Waste`;

    // 1. Calculate Transport Savings
    // Simulating cutting back car/transit distances
    const transportSavings = this.breakdown.transport * (transportPct / 100);

    // 2. Calculate Energy Savings
    // Shift renewable share to slider setting
    const region = app.userProfile.region || 'EU';
    const gridIntensity = calculator.GRID_INTENSITIES[region] || 0.25;
    const yearlyElectricity = (this.inputs.electricity || 250) * 12;
    
    const baseRenewablePct = this.inputs.renewableShare || 0;
    const baseElectricityCO2 = yearlyElectricity * (1 - (baseRenewablePct / 100)) * gridIntensity;
    
    // Simulated electricity CO2
    const simRenewablePct = Math.max(baseRenewablePct, energyVal);
    const simElectricityCO2 = yearlyElectricity * (1 - (simRenewablePct / 100)) * gridIntensity;
    const energySavings = Math.max(0, baseElectricityCO2 - simElectricityCO2);

    // 3. Calculate Diet Savings
    // Shifting diet from current down to Vegan level (700 kg/year)
    const veganFloor = 700;
    const dietCurrent = this.breakdown.diet;
    const potentialDietSavings = Math.max(0, dietCurrent - veganFloor);
    const dietSavings = potentialDietSavings * (dietPct / 100);

    // 4. Calculate Waste/Shopping Savings
    // Reducing garbage count & optimizing recycling
    const wasteSavings = this.breakdown.consumption * 0.3 * (wastePct / 100);

    // Totals
    const totalSavings = transportSavings + energySavings + dietSavings + wasteSavings;
    const projectedAnnual = Math.max(500, this.annualTotal - totalSavings); // baseline limit
    const reductionPct = this.annualTotal > 0 ? Math.round((totalSavings / this.annualTotal) * 100) : 0;

    // Render outputs
    document.getElementById('val-sim-reduction-pct').innerText = `${reductionPct}%`;
    document.getElementById('val-sim-current-ton').innerText = `${(this.annualTotal / 1000).toFixed(2)} t/year`;
    document.getElementById('val-sim-projected-ton').innerText = `${(projectedAnnual / 1000).toFixed(2)} t/year`;
    document.getElementById('val-sim-saved-kg').innerText = `${Math.round(totalSavings).toLocaleString()} kg CO₂e`;
  },

  applySimulatedActions() {
    const transportPct = parseFloat(document.getElementById('sim-transport-reduction').value);
    const energyVal = parseFloat(document.getElementById('sim-renewable-shift').value);
    const dietPct = parseFloat(document.getElementById('sim-meat-reduction').value);
    const wastePct = parseFloat(document.getElementById('sim-waste-reduction').value);

    let habitsActivated = 0;

    if (transportPct >= 20) {
      app.activateHabit('habit-commute');
      habitsActivated++;
    }
    if (energyVal > (this.inputs.renewableShare || 0) + 15) {
      app.activateHabit('habit-led');
      app.activateHabit('habit-standby');
      habitsActivated += 2;
    }
    if (dietPct >= 20) {
      app.activateHabit('habit-meatless');
      habitsActivated++;
    }
    if (wastePct >= 20) {
      app.activateHabit('habit-compost');
      app.activateHabit('habit-bags');
      habitsActivated += 2;
    }

    if (habitsActivated > 0) {
      app.userProfile.simulationUsed = true;
      app.grantXP(30); // simulation applied bonus
      app.saveProfile();
      app.showToast(`Applied ${habitsActivated} Eco-Habits! Gained +30 XP`, "success");
      app.navigateTo('habits');
    } else {
      app.showToast("Increase simulator sliders to adopt eco habits!", "warning");
    }
  }
};
