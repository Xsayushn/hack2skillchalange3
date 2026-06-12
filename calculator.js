// Carbon Footprint Calculator Module

const calculator = {
  // Emission constants (measured in kg CO2e per unit)
  GRID_INTENSITIES: {
    US: 0.37, // kg CO2e per kWh
    EU: 0.25, // kg CO2e per kWh
    IN: 0.75, // kg CO2e per kWh
    GL: 0.45  // kg CO2e per kWh
  },

  LPG_CYLINDER: 42.5, // kg CO2e per cylinder

  VEHICLE_FACTORS: {
    petrol: 0.18,  // kg CO2e per km
    diesel: 0.16,  // kg CO2e per km
    ev: 0.05,      // kg CO2e per km (average grid charging)
    none: 0.0      // kg CO2e per km
  },

  PUBLIC_TRANSIT: 0.04, // kg CO2e per km
  FLIGHT_HOUR: 110.0,   // kg CO2e per hour of flight

  DIET_FACTORS: {
    'meat-heavy': 2800.0, // kg CO2e per year
    'balanced': 1800.0,   // kg CO2e per year
    'vegetarian': 1100.0, // kg CO2e per year
    'vegan': 700.0        // kg CO2e per year
  },

  FOOD_WASTE_MULTIPLIERS: {
    low: 0.9,
    medium: 1.0,
    high: 1.25
  },

  WASTE_BAG: 2.5 * 52, // 2.5 kg CO2e per bag * 52 weeks = 130 kg CO2e/bag/year

  RECYCLE_OFFSETS: {
    paper: -30,    // kg CO2e saved per year
    plastic: -40,  // kg CO2e saved per year
    metal: -25,    // kg CO2e saved per year
    glass: -20     // kg CO2e saved per year
  },

  SHOPPING_FACTORS: {
    minimalist: 400.0, // kg CO2e per year
    average: 1200.0,   // kg CO2e per year
    shopper: 2500.0    // kg CO2e per year
  },

  currentStep: 0,
  totalSteps: 4,

  // Initialize event listeners
  init() {
    const renewRange = document.getElementById('input-renewable');
    if (renewRange) {
      renewRange.addEventListener('input', (e) => {
        document.getElementById('label-val-renewable').innerText = `${e.target.value}%`;
      });
    }

    const fuelRadios = document.getElementsByName('car-fuel');
    fuelRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const carDistGroup = document.getElementById('group-car-dist');
        if (e.target.value === 'none') {
          carDistGroup.style.opacity = '0.4';
          document.getElementById('input-car-distance').disabled = true;
          document.getElementById('input-car-distance').value = 0;
        } else {
          carDistGroup.style.opacity = '1';
          document.getElementById('input-car-distance').disabled = false;
          if (document.getElementById('input-car-distance').value == 0) {
            document.getElementById('input-car-distance').value = 800;
          }
        }
      });
    });
  },

  // UI Navigation
  nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      // Transition to next step
      document.getElementById(`calc-step-${this.currentStep}`).classList.remove('active');
      document.getElementById(`step-indicator-${this.currentStep}`).classList.remove('active');
      document.getElementById(`step-indicator-${this.currentStep}`).classList.add('completed');
      
      this.currentStep++;
      
      document.getElementById(`calc-step-${this.currentStep}`).classList.add('active');
      document.getElementById(`step-indicator-${this.currentStep}`).classList.add('active');
      
      document.getElementById('btn-calc-prev').disabled = false;
      
      if (this.currentStep === this.totalSteps - 1) {
        document.getElementById('btn-calc-next').innerHTML = `Calculate <i class="fa-solid fa-square-check"></i>`;
      }
    } else {
      // Calculate final results
      this.processCalculation();
    }
  },

  prevStep() {
    if (this.currentStep > 0) {
      document.getElementById(`calc-step-${this.currentStep}`).classList.remove('active');
      document.getElementById(`step-indicator-${this.currentStep}`).classList.remove('active');
      
      this.currentStep--;
      
      document.getElementById(`calc-step-${this.currentStep}`).classList.add('active');
      document.getElementById(`step-indicator-${this.currentStep}`).classList.add('active');
      document.getElementById(`step-indicator-${this.currentStep}`).classList.remove('completed');
      
      document.getElementById('btn-calc-next').innerHTML = `Next <i class="fa-solid fa-arrow-right"></i>`;
      
      if (this.currentStep === 0) {
        document.getElementById('btn-calc-prev').disabled = true;
      }
    }
  },

  // Calculate annual/monthly footprint based on forms
  getInputsFromForm() {
    const electricity = parseFloat(document.getElementById('input-electricity').value) || 0;
    const lpg = parseFloat(document.getElementById('input-lpg').value) || 0;
    const renewableShare = parseFloat(document.getElementById('input-renewable').value) || 0;
    
    let fuelType = 'none';
    const fuelRadios = document.getElementsByName('car-fuel');
    for (const r of fuelRadios) {
      if (r.checked) {
        fuelType = r.value;
        break;
      }
    }
    
    const carDistance = parseFloat(document.getElementById('input-car-distance').value) || 0;
    const publicTransport = parseFloat(document.getElementById('input-public-transport').value) || 0;
    const flights = parseFloat(document.getElementById('input-flights').value) || 0;
    
    let dietType = 'balanced';
    const dietRadios = document.getElementsByName('diet');
    for (const r of dietRadios) {
      if (r.checked) {
        dietType = r.value;
        break;
      }
    }
    
    const foodWaste = document.getElementById('select-food-waste').value;
    const wasteBags = parseFloat(document.getElementById('input-waste').value) || 0;
    
    const recPaper = document.getElementById('recycle-paper').checked;
    const recPlastic = document.getElementById('recycle-plastic').checked;
    const recMetal = document.getElementById('recycle-metal').checked;
    const recGlass = document.getElementById('recycle-glass').checked;
    
    const shoppingLevel = document.getElementById('select-shopping').value;

    return {
      electricity,
      lpg,
      renewableShare,
      fuelType,
      carDistance,
      publicTransport,
      flights,
      dietType,
      foodWaste,
      wasteBags,
      recycling: {
        paper: recPaper,
        plastic: recPlastic,
        metal: recMetal,
        glass: recGlass
      },
      shoppingLevel
    };
  },

  calculate(inputs, regionCode = 'EU') {
    // 1. Household Energy Calculations
    const intensity = this.GRID_INTENSITIES[regionCode] || 0.25;
    const yearlyElectricity = inputs.electricity * 12; // kWh/year
    const nonRenewableElectricity = yearlyElectricity * (1 - (inputs.renewableShare / 100));
    const energyElectricityCO2 = nonRenewableElectricity * intensity; // kg CO2e
    const energyGasCO2 = (inputs.lpg * 12) * this.LPG_CYLINDER; // kg CO2e
    const energyTotal = energyElectricityCO2 + energyGasCO2;

    // 2. Transport Calculations
    const fuelFactor = this.VEHICLE_FACTORS[inputs.fuelType] || 0;
    const carTotalCO2 = (inputs.carDistance * 12) * fuelFactor; // kg CO2e
    const transitCO2 = (inputs.publicTransport * 12) * this.PUBLIC_TRANSIT; // kg CO2e
    const flightCO2 = inputs.flights * this.FLIGHT_HOUR; // kg CO2e
    const transportTotal = carTotalCO2 + transitCO2 + flightCO2;

    // 3. Diet Calculations
    const dietBase = this.DIET_FACTORS[inputs.dietType] || 1800.0;
    const wasteMultiplier = this.FOOD_WASTE_MULTIPLIERS[inputs.foodWaste] || 1.0;
    const dietTotal = dietBase * wasteMultiplier;

    // 4. Waste & Consumption Calculations
    const wasteBase = inputs.wasteBags * this.WASTE_BAG; // kg CO2e/year
    
    let recycleSavings = 0;
    if (inputs.recycling.paper) recycleSavings += this.RECYCLE_OFFSETS.paper;
    if (inputs.recycling.plastic) recycleSavings += this.RECYCLE_OFFSETS.plastic;
    if (inputs.recycling.metal) recycleSavings += this.RECYCLE_OFFSETS.metal;
    if (inputs.recycling.glass) recycleSavings += this.RECYCLE_OFFSETS.glass;
    
    const wasteFinal = Math.max(50, wasteBase + recycleSavings); // baseline lower limit of waste carbon
    const shoppingTotal = this.SHOPPING_FACTORS[inputs.shoppingLevel] || 1200.0;
    const consumptionTotal = wasteFinal + shoppingTotal;

    // Aggregates
    const annualTotalKg = energyTotal + transportTotal + dietTotal + consumptionTotal;
    
    return {
      breakdown: {
        energy: Math.round(energyTotal),
        transport: Math.round(transportTotal),
        diet: Math.round(dietTotal),
        consumption: Math.round(consumptionTotal)
      },
      annualTotal: Math.round(annualTotalKg),
      monthlyTotal: Math.round(annualTotalKg / 12)
    };
  },

  processCalculation() {
    const inputs = this.getInputsFromForm();
    const region = document.getElementById('setting-region').value;
    const results = this.calculate(inputs, region);
    
    // Save to application state
    app.updateCarbonData(inputs, results);
    
    app.showToast("Calculation completed successfully!", "success");
    
    // Reset steps
    this.resetStepProgress();
    
    // Navigate back to Dashboard
    app.navigateTo('dashboard');
  },

  resetStepProgress() {
    document.getElementById(`calc-step-${this.currentStep}`).classList.remove('active');
    document.getElementById(`step-indicator-${this.currentStep}`).classList.remove('active');
    
    this.currentStep = 0;
    
    document.getElementById(`calc-step-0`).classList.add('active');
    document.getElementById(`step-indicator-0`).classList.add('active');
    
    for (let i = 0; i < this.totalSteps; i++) {
      document.getElementById(`step-indicator-${i}`).classList.remove('completed');
    }
    
    document.getElementById('btn-calc-prev').disabled = true;
    document.getElementById('btn-calc-next').innerHTML = `Next <i class="fa-solid fa-arrow-right"></i>`;
  }
};
