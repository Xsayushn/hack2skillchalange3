// Eco AI Coach Gaia Module

const assistant = {
  chatHistory: [],
  hasChatted: false,

  init() {
    this.chatHistory = [
      {
        role: 'assistant',
        text: "Hello! I am Gaia, your personal Eco AI Coach. I am here to help you understand your carbon footprint, simulate potential changes, and recommend actions to live more sustainably.\n\nHow can I help you today?"
      }
    ];
    this.renderChatHistory();
  },

  updateContextSummary(userProfile, carbonData) {
    const list = document.getElementById('list-assistant-context');
    if (!list) return;

    if (!carbonData || !carbonData.annualTotal) {
      list.innerHTML = `
        <li>Baseline not calculated</li>
        <li>No active habits</li>
      `;
      return;
    }

    const tons = (carbonData.annualTotal / 1000).toFixed(1);
    const activeCount = userProfile.habits ? userProfile.habits.filter(h => h.active).length : 0;
    
    list.innerHTML = `
      <li>Total: <strong>${tons} t CO₂e/yr</strong></li>
      <li>Energy: ${Math.round(carbonData.breakdown.energy).toLocaleString()} kg</li>
      <li>Transport: ${Math.round(carbonData.breakdown.transport).toLocaleString()} kg</li>
      <li>Active Habits: <strong>${activeCount}</strong></li>
    `;
  },

  renderChatHistory() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    container.innerHTML = '';
    this.chatHistory.forEach(msg => {
      const bubble = document.createElement('div');
      bubble.className = `chat-msg ${msg.role}`;
      bubble.innerHTML = this.formatMarkdown(msg.text);
      container.appendChild(bubble);
    });

    // Auto scroll to bottom
    container.scrollTop = container.scrollHeight;
  },

  formatMarkdown(text) {
    // Basic formatting helper for bolding and list points in chat
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*)/gm, '• $1');
  },

  handleKeyPress(e) {
    if (e.key === 'Enter') {
      this.sendMessage();
    }
  },

  sendMessage() {
    const input = document.getElementById('chat-user-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    // Append user message
    this.chatHistory.push({ role: 'user', text: text });
    input.value = '';
    this.renderChatHistory();

    // Trigger achievement trigger
    if (!this.hasChatted) {
      this.hasChatted = true;
      app.grantXP(30); // Chatted achievement XP
      app.showToast("Milestone Unlocked: Eco Coached (+30 XP)", "success");
      app.updateDashboard();
    }

    // Show typing state
    const container = document.getElementById('chat-messages-container');
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-msg assistant';
    typingBubble.innerHTML = '<i class="fa-solid fa-ellipsis fa-bounce"></i> Gaia is thinking...';
    container.appendChild(typingBubble);
    container.scrollTop = container.scrollHeight;

    // Decide between offline/online modes
    const key = app.userProfile.geminiKey;
    if (key && key.trim().length > 10) {
      this.fetchGeminiResponse(text, key, typingBubble);
    } else {
      setTimeout(() => {
        typingBubble.remove();
        const response = this.generateOfflineResponse(text);
        this.chatHistory.push({ role: 'assistant', text: response });
        this.renderChatHistory();
      }, 700);
    }
  },

  sendQuickQuery(text) {
    document.getElementById('chat-user-input').value = text;
    this.sendMessage();
  },

  // offline rule-based heuristics engine
  generateOfflineResponse(userText) {
    const text = userText.toLowerCase();
    const data = app.carbonData;
    const profile = app.userProfile;
    const hasData = data && data.annualTotal;

    // Helper statistics variables
    const tons = hasData ? (data.annualTotal / 1000).toFixed(1) : "0.0";
    const breakdown = hasData ? data.breakdown : { energy: 0, transport: 0, diet: 0, consumption: 0 };
    const region = profile.region || 'EU';

    // 1. Greet
    if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('greetings')) {
      return `Hello ${profile.name}! Glad to talk. I am operating in **Offline Mode** right now. If you want full-fledged conversations, you can add your **Gemini Developer API Key** in the Settings tab.\n\nHow can I help you improve your carbon score? Try asking to **"analyze my footprint"**!`;
    }

    // 2. Profile Analysis
    if (text.includes('analyze') || text.includes('breakdown') || text.includes('statistics') || text.includes('footprint') || text.includes('status')) {
      if (!hasData) {
        return `I don't have your carbon footprint statistics yet. Please visit the **Calculator** tab, enter your details, and then ask me to analyze your profile.`;
      }

      // Find highest category
      const categories = [
        { name: 'Household Energy', val: breakdown.energy },
        { name: 'Transportation', val: breakdown.transport },
        { name: 'Diet & Food', val: breakdown.diet },
        { name: 'Shopping & Waste', val: breakdown.consumption }
      ];
      categories.sort((a, b) => b.val - a.val);
      const topCat = categories[0];

      return `### My Carbon Footprint Analysis for **${profile.name}**\n
* **Total Footprint:** **${tons} tons CO₂e / year**
* **Household Energy:** ${Math.round(breakdown.energy).toLocaleString()} kg CO₂e
* **Transportation:** ${Math.round(breakdown.transport).toLocaleString()} kg CO₂e
* **Diet & Food:** ${Math.round(breakdown.diet).toLocaleString()} kg CO₂e
* **Waste & Shopping:** ${Math.round(breakdown.consumption).toLocaleString()} kg CO₂e

**Highest Impact Sector:** **${topCat.name}** (${Math.round((topCat.val / data.annualTotal) * 100)}% of total).

**Suggested Action Plan:**
1. Try utilizing our **"What-If" Simulator** to see how transitioning this specific sector affects your rating.
2. In the **Eco-Habits** tab, activate the habits linked with *${topCat.name.split(' ')[0]}* (e.g. ${topCat.name.includes('Energy') ? 'Switch to LEDs or Cut Standby Power' : topCat.name.includes('Trans') ? 'Commute Sustainably' : 'Meatless Mondays'}).`;
    }

    // 3. Energy Footprint Focus
    if (text.includes('energy') || text.includes('electricity') || text.includes('solar') || text.includes('lpg') || text.includes('heating') || text.includes('plug')) {
      const electricityPart = hasData ? Math.round(breakdown.energy) : 1500;
      return `### Household Energy Carbon Optimization
Household electricity and heating contribute heavily to global emissions based on grid intensity. Your current home energy footprint is **${electricityPart.toLocaleString()} kg CO₂e/yr**.

**Key Recommendations:**
* **Switch to LEDs:** Reduces lighting electricity footprint by up to 80%.
* **Unplug standby loads:** Appliances left plugged in consume "vampire power" which accounts for up to 10% of standard home bills.
* **Green tariff / Solar Panels:** Shifting your renewable share from 0% to 100% can save massive grid-intensity emissions (equivalent to savings of ~0.25 to 0.75 kg CO₂e per kWh depending on your region).`;
    }

    // 4. Transport Footprint Focus
    if (text.includes('transport') || text.includes('car') || text.includes('flight') || text.includes('commute') || text.includes('petrol') || text.includes('diesel')) {
      const transPart = hasData ? Math.round(breakdown.transport) : 2000;
      return `### Transportation Carbon Optimization
Transport makes up nearly a quarter of global energy-related greenhouse gases. Your current transportation footprint is **${transPart.toLocaleString()} kg CO₂e/yr**.

**Key Recommendations:**
* **Reduce short-haul flights:** Flights emit around 110 kg CO₂e per passenger-hour. Taking trains or choosing local travel has a dramatic positive footprint impact.
* **Commute Sustainably:** Walking, cycling, or public transport releases only ~0.04 kg CO₂e per km compared to ~0.18 kg CO₂e per km for single-occupancy petrol cars.
* **Consider Electric Vehicles (EV):** Charging an EV on clean energy drops vehicle travel emissions by over 70%.`;
    }

    // 5. Diet Footprint Focus
    if (text.includes('diet') || text.includes('food') || text.includes('meat') || text.includes('vegan') || text.includes('vegetarian') || text.includes('beef') || text.includes('waste')) {
      const dietPart = hasData ? Math.round(breakdown.diet) : 1800;
      return `### Dietary & Food Carbon Optimization
Food production accounts for over 25% of global greenhouse gases. Your current diet footprint is **${dietPart.toLocaleString()} kg CO₂e/yr**.

**Key Recommendations:**
* **Embrace Meatless Days:** Beef releases 10x more emissions per serving than poultry, and 30x more than vegetables. Shifting to a vegetarian or vegan lifestyle cuts emissions down to 1,100 kg or 700 kg per year respectively.
* **Combat Food Waste:** Rotting food in landfills produces methane (a greenhouse gas 28x more potent than CO2). Divert waste by composting and shopping intentionally.`;
    }

    // 6. Fallback General Advice
    return `I am Gaia, operating in **Offline Mode**. I can parse questions about **energy**, **transport**, **diet**, or **analyze your profile**.

Please feel free to connect a **Gemini Developer API Key** in the settings to activate conversational natural language processing! I will then be able to answer any detailed questions you have.`;
  },

  // Online Mode API caller
  async fetchGeminiResponse(userText, key, typingBubble) {
    try {
      const data = app.carbonData;
      const profile = app.userProfile;
      const hasData = data && data.annualTotal;

      // Provide complete context details in system instructions
      const systemPrompt = `You are "Gaia", a highly encouraging, smart, and scientifically accurate Eco AI Coach in a Carbon Footprint Awareness Web App.
Your goal is to help the user understand their footprint, suggest practical habits, and review their data.

Current User Profile:
- User Name: "${profile.name}"
- Grid Region: "${profile.region || 'EU'}"
- Current Carbon Footprint Data:
  - Calculated: ${hasData ? 'Yes' : 'No'}
  - Annual Emissions: ${hasData ? (data.annualTotal / 1000).toFixed(2) + ' metric tons CO2e/yr' : 'Unknown'}
  - Monthly Emissions: ${hasData ? data.monthlyTotal + ' kg CO2e/month' : 'Unknown'}
  - Sector Breakdowns: ${hasData ? JSON.stringify(data.breakdown) : 'Unknown'}
  - Active Habits in Plan: ${profile.habits ? JSON.stringify(profile.habits.filter(h => h.active).map(h => h.id)) : 'None'}

Instructions:
1. Always stay in character as Gaia. Keep responses positive, action-oriented, encouraging, and clear.
2. Rely on the user's statistics when explaining figures.
3. Keep responses concise (under 200 words if possible) so it fits beautifully in the chat interface.
4. Format your output using standard Markdown bullet points and bolding where appropriate.`;

      // Format API payload matching Gemini Developer API specifications
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: `${systemPrompt}\n\nUser Question: ${userText}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const resData = await response.json();
      typingBubble.remove();

      let reply = "";
      if (resData.candidates && resData.candidates[0] && resData.candidates[0].content && resData.candidates[0].content.parts[0]) {
        reply = resData.candidates[0].content.parts[0].text;
      } else {
        reply = "I received a blank answer from the Gemini models. Please make sure your API key is fully active.";
      }

      this.chatHistory.push({ role: 'assistant', text: reply });
      this.renderChatHistory();

    } catch (err) {
      console.error(err);
      typingBubble.remove();
      
      const errorMsg = `Sorry, I had trouble contacting the Gemini API servers.
* **Details:** ${err.message}
* **Fallback:** Reverting to offline heuristics coach. Please review your network connections and API keys in Settings.`;
      
      this.chatHistory.push({ role: 'assistant', text: errorMsg });
      this.renderChatHistory();
    }
  }
};
