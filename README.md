# EcoFootprint | Carbon Footprint Awareness Platform

**EcoFootprint** is a premium, client-side gamified Single Page Application (SPA) designed to help individuals understand, track, simulate, and reduce their carbon footprint. 

---

## 🌟 Selected Vertical
**Challenge Vertical:** Carbon Footprint Awareness Platform  
**Target:** To design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

---

## 🚀 Key Features

1. **Interactive Carbon Footprint Calculator**
   * Computes yearly and monthly carbon emissions across four key categories: Home Energy, Transport, Diet & Food, and Waste & Lifestyle.
   * Step-by-step navigation wizard with input limits and smart selectors (such as vehicle fuel types and recycling checklists).

2. **Gamified Leveling & Dashboard**
   * Renders total annual footprint in metric tons, monthly footprint in kg, and evaluates standing compared to regional targets.
   * Features a level-up program where users earn experience points (XP) to promote through 5 distinct ranks.
   * Visualizes category proportions in real-time using a beautiful, interactive Chart.js doughnut chart.
   * Dynamic milestones panel representing unlocking conditions for achievements like *Carbon Pioneer*, *Green Guardian*, *Active Advocate*, and *Ecological Architect*.

3. **Real-time "What-If" Eco-Simulator**
   * Live interactive sliders for commuter reductions, green energy shifts, plant-based diet ratios, and recycling optimization.
   * Custom circular gauge tracking overall percent CO2 reductions, projected annual tonnage, and yearly kg savings in real-time.
   * Adds simulated strategies directly to the active Eco-Habits layout on submission.

4. **Eco-Habits Tracker**
   * A gamified logger with cards representing pre-configured actions like *Meatless Mondays*, *Zero Standby Power*, *Commute Sustainably*, and *Shop Local*.
   * Tracks active streaks (e.g. logging consecutive days), updates database states, and awards habit-specific XP points.

5. **Smart AI Coach "Gaia"**
   * **Offline Mode (Default):** Runs a localized regex heuristics analyzer that parses queries (e.g. "analyze my footprint", "how to optimize transit", "diet transitions") and formats tailored carbon reduction sheets referencing the user's specific inputs.
   * **Online Mode (Optional API):** Allows users to connect their Google Gemini Developer API Key in the Settings panel (stored client-side in localStorage). When configured, Gaia sends structured prompt instructions along with the user's live carbon statistics directly to Gemini (`gemini-2.5-flash`) for real-time generative responses.

6. **Browser Unit Test Suite**
   * Contains a localized test harness (`tests/index.html` & `tests/suite.js`) validating calculator math models, solar conversions, recycling offsets, and assistant parser rules in the browser.

---

## 🛠️ Architecture & Technology Stack

* **Core Structure:** HTML5 with semantic tags (header, nav, main, aside, section) and unique IDs for automated end-to-end testing.
* **Logic:** Modular JavaScript (ES6) separated into clean concern files:
  - [app.js](file:///e:/hack2skillchalange3/app.js) - Application orchestrator, router, and state manager.
  - [calculator.js](file:///e:/hack2skillchalange3/calculator.js) - Formulas, constants, and step navigation.
  - [dashboard.js](file:///e:/hack2skillchalange3/dashboard.js) - Chart.js integrations, rankings, and badge systems.
  - [simulator.js](file:///e:/hack2skillchalange3/simulator.js) - What-If equation adjustments and habit mappings.
  - [habits.js](file:///e:/hack2skillchalange3/habits.js) - Habits logs, streaks trackers, and XP issues.
  - [assistant.js](file:///e:/hack2skillchalange3/assistant.js) - Offline heuristics matching and Gemini client adapters.
* **Styling:** Vanilla CSS3 (`styles.css`) implementing a premium dark-mode theme utilizing glassmorphism styling parameters, keyframe animations, customized ranges, and responsive media rules supporting mobile viewport standards.
* **External Integrations:** Loaded dynamically via secure CDNs (Chart.js and FontAwesome icons) keeping the codebase under **200 KB** (well below the 10 MB limit).

---

## 🔬 Mathematical Calculations & Emission Assumptions

Emissions calculations are based on average green data models, converting inputs into annual kilograms of carbon dioxide equivalents ($kg\ CO_2e$):

### 1. Household Energy
$$\text{Electricity emissions} = (\text{Monthly kWh} \times 12) \times \left(1 - \frac{\text{Renewable \%}}{100}\right) \times \text{Regional Grid Factor}$$
* **Regional Grid Factors ($kg\ CO_2e\text{ per kWh}$):** United States (`US`): $0.37$, European Union (`EU`): $0.25$, India (`IN`): $0.75$, Global Average (`GL`): $0.45$.
* **Gas Cylinder:** LPG cylinders are measured at $42.5\ kg\ CO_2e$ per $14.2\ kg$ cylinder unit.

### 2. Transportation
$$\text{Transport emissions} = (\text{Monthly Car km} \times 12 \times \text{Fuel Constant}) + (\text{Monthly Transit km} \times 12 \times 0.04) + (\text{Annual Flight hours} \times 110)$$
* **Vehicle Fuel Constants ($kg\ CO_2e\text{ per km}$):** Petrol: $0.18$, Diesel: $0.16$, Electric (EV): $0.05$, None: $0.0$.
* **Public Transit:** Standardized transit blend average rate of $0.04\ kg\ CO_2e\text{ per km}$.
* **Flights:** Assumes average high-altitude short/long haul blends emitting $110\ kg\ CO_2e$ per passenger-hour.

### 3. Diet & Food
$$\text{Diet emissions} = \text{Diet Constant} \times \text{Food Waste Multiplier}$$
* **Diet Constants ($kg\ CO_2e\text{ per year}$):** Meat Lover: $2800$, Average/Mixed: $1800$, Vegetarian: $1100$, Vegan: $700$.
* **Food Waste Multipliers:** Low Waste: $0.9$ (10% saving), Medium Waste: $1.0$, High Waste: $1.25$ (25% penalty).

### 4. Waste & Shopping
$$\text{Lifestyle emissions} = \text{Shopping Constant} + \max(50, \text{Garbage bags/week} \times 130 + \text{Recycling Offsets})$$
* **Shopping Constants ($kg\ CO_2e\text{ per year}$):** Minimalist: $400$, Average: $1200$, Frequent Shopper: $2500$.
* **Waste bags:** Standard bag trash landfill output estimated at $130\ kg\ CO_2e\text{ per bag/year}$.
* **Recycling Offsets (Savings/yr):** Paper: $-30\ kg$, Plastic: $-40\ kg$, Metal: $-25\ kg$, Glass: $-20\ kg$.

---

## 🏃 How to Run the Project Locally

1. Since this is a client-side Single Page Application, no installation, compilation, or web servers are required.
2. Simply double-click [index.html](file:///e:/hack2skillchalange3/index.html) or open it using any modern browser (Chrome, Edge, Safari, Firefox).
3. To view or run the unit tests, open [tests/index.html](file:///e:/hack2skillchalange3/tests/index.html) in your browser.
