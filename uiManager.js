// uiManager.js - Відповідає за створення та управління UI елементами
export class UIManager {
  async addItemInfoDisplay(marketData, analysis = null) {
    const { CONFIG } = await import(chrome.runtime.getURL("config.js"));

    const existingElement = document.getElementById(CONFIG.ui.infoCardId);
    if (existingElement) existingElement.remove();

    const infoElement = this.createElement("div", {
      id: CONFIG.ui.infoCardId,
      className: "vapor-info-card",
      innerHTML: this.generateInfoHTML(marketData, analysis),
    });

    await this.addStyles();
    document.body.appendChild(infoElement);
    console.log("✅ Інформація про предмет з аналітикою додана");
  }

  generateInfoHTML(marketData, analysis) {
    const basicInfo = this.generateBasicInfo(marketData);
    const analyticsInfo = analysis ? this.generateAnalyticsInfo(analysis) : "";

    return `
      <div class="vapor-info-header">
        <div class="vapor-logo">Vapor</div>
        <div class="vapor-toggle" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</div>
      </div>
      <div class="vapor-info-content">
        ${basicInfo}
        ${analyticsInfo}
      </div>
    `;
  }

  generateBasicInfo(marketData) {
    const spread =
      marketData.salePrice && marketData.requestPrice
        ? marketData.salePrice - marketData.requestPrice
        : 0;
    const spreadPercent = marketData.requestPrice
      ? ((spread / marketData.requestPrice) * 100).toFixed(1)
      : "0";

    return `
      <div class="vapor-section">
        <div class="vapor-section-title">Base Info</div>
        <div class="vapor-info-grid">
          <div class="vapor-info-item">
            <span class="vapor-label">Name:</span>
            <span class="vapor-value" title="${
              marketData.name
            }">${this.truncateText(marketData.name, 25)}</span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Sell Price:</span>
            <span class="vapor-value price-sell">${marketData.salePrice.toFixed(
              2
            )}₴</span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Request Price:</span>
            <span class="vapor-value price-buy">${marketData.requestPrice.toFixed(
              2
            )}₴</span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Spread:</span>
            <span class="vapor-value spread">${spread.toFixed(
              2
            )}₴ (${spreadPercent}%)</span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">On Sale:</span>
            <span class="vapor-value">${marketData.saleCount}</span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Requests:</span>
            <span class="vapor-value">${marketData.requestCount}</span>
          </div>
        </div>
      </div>
    `;
  }

  generateAnalyticsInfo(analysis) {
    if (!analysis || analysis.trends?.status === "insufficient_data") {
      return `
        <div class="vapor-section">
          <div class="vapor-section-title">Analytics</div>
          <div class="vapor-info-item no-data">
            <span class="vapor-value">Insufficient data for analysis</span>
          </div>
        </div>
      `;
    }

    return `
      ${this.generateTrendsSection(analysis.trends)}
      ${this.generateVolatilitySection(analysis.volatility)}
      ${this.generateSpreadAnalysisSection(analysis.spreadAnalysis)}
      ${this.generateVolumeAnalysisSection(analysis.volumeAnalysis)}
      ${this.generateRecommendationsSection(analysis.recommendations)}
    `;
  }

  generateTrendsSection(trends) {
    if (trends.status === "insufficient_data") return "";

    return `
      <div class="vapor-section">
        <div class="vapor-section-title">Trends</div>
        <div class="vapor-info-grid">
          <div class="vapor-info-item">
            <span class="vapor-label">Last 24h:</span>
            <span class="vapor-value trend ${this.getTrendClass(
              trends.last24h.direction
            )}">
              ${trends.last24h.trend}% (${this.getTrendText(
      trends.last24h.direction
    )})
            </span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Last 7d:</span>
            <span class="vapor-value trend ${this.getTrendClass(
              trends.last7d.direction
            )}">
              ${trends.last7d.trend}% (${this.getTrendText(
      trends.last7d.direction
    )})
            </span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Last 30d:</span>
            <span class="vapor-value trend ${this.getTrendClass(
              trends.last30d.direction
            )}">
              ${trends.last30d.trend}% (${this.getTrendText(
      trends.last30d.direction
    )})
            </span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Overall:</span>
            <span class="vapor-value trend ${this.getTrendClass(
              trends.overall.direction
            )}">
              ${trends.overall.trend}% (${trends.overall.periodDays} days)
            </span>
          </div>
        </div>
      </div>
    `;
  }

  generateVolatilitySection(volatility) {
    if (volatility.status === "insufficient_data") return "";

    return `
      <div class="vapor-section">
        <div class="vapor-section-title">Volatility</div>
        <div class="vapor-info-grid">
          <div class="vapor-info-item">
            <span class="vapor-label">Daily:</span>
            <span class="vapor-value">${volatility.daily.toFixed(2)}%</span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Level:</span>
            <span class="vapor-value volatility ${volatility.classification}">
              ${this.getVolatilityText(volatility.classification)}
            </span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Risk:</span>
            <span class="vapor-value risk ${volatility.riskLevel}">
              ${this.getRiskText(volatility.riskLevel)}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  generateSpreadAnalysisSection(spreadAnalysis) {
    if (spreadAnalysis.status === "insufficient_data") return "";

    return `
      <div class="vapor-section">
        <div class="vapor-section-title">Spread Analysis</div>
        <div class="vapor-info-grid">
          <div class="vapor-info-item">
            <span class="vapor-label">Spread:</span>
            <span class="vapor-value spread">${spreadAnalysis.percent}%</span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Liquidity:</span>
            <span class="vapor-value">${spreadAnalysis.liquidity}</span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Opportunity:</span>
            <span class="vapor-value opportunity ${spreadAnalysis.opportunity}">
              ${this.getOpportunityText(spreadAnalysis.opportunity)}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  generateVolumeAnalysisSection(volumeAnalysis) {
    if (volumeAnalysis.status === "insufficient_data") return "";
    console.log("volumeAnalysis", volumeAnalysis);
    console.log("volumeAnalysis.total", volumeAnalysis.total);

    return `
      <div class="vapor-section">
        <div class="vapor-section-title">Volume Analysis</div>
        <div class="vapor-info-grid">
          <div class="vapor-info-item">
            <span class="vapor-label">Total Volume:</span>
            <span class="vapor-value">${volumeAnalysis.total}</span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Avg Daily:</span>
            <span class="vapor-value">${volumeAnalysis.average}</span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Recent Avg:</span>
            <span class="vapor-value">${volumeAnalysis.recentAverage}</span>
          </div>
          <div class="vapor-info-item">
            <span class="vapor-label">Trend:</span>
            <span class="vapor-value volume-trend ${volumeAnalysis.trend}">
              ${this.getVolumeTrendText(volumeAnalysis.trend)}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  generateRecommendationsSection(recommendations) {
    console.log("Generating recommendations section:", recommendations);
    if (!recommendations || !recommendations.recommendations.length) return "";

    const mainRecommendation = recommendations.recommendations[0];

    console.log("Main recommendation:", mainRecommendation);

    return `
      <div class="vapor-section">
        <div class="vapor-section-title">Recommendations</div>
        <div class="vapor-recommendation ">
          <div class="rec-action">${mainRecommendation.action}</div>
          <div class="rec-reason">${mainRecommendation.reason}</div>
          <div class="rec-timeframe">Timeframe: ${mainRecommendation.timeframe}</div>
        </div>
        <div class="vapor-summary">
          <span class="summary-label">Summary:</span>
          <span class="summary-text">${recommendations.summary}</span>
        </div>
      </div>
    `;
  }

  // Допоміжні методи для отримання текстових значень та CSS класів

  getTrendClass(direction) {
    if (direction.includes("bullish")) return "positive";
    if (direction.includes("bearish")) return "negative";
    return "neutral";
  }

  getTrendText(direction) {
    const translations = {
      strong_bullish: "Strong Up",
      bullish: "Up",
      neutral: "Neutral",
      bearish: "Down",
      strong_bearish: "Strong Down",
    };
    return translations[direction] || direction;
  }

  getVolatilityText(classification) {
    const translations = {
      very_low: "Very Low",
      low: "Low",
      moderate: "Moderate",
      high: "High",
      very_high: "Very High",
      extreme: "Extreme",
    };
    return translations[classification] || classification;
  }

  getRiskText(risk) {
    const translations = {
      very_low: "Very Low",
      low: "Low",
      medium: "Medium",
      high: "High",
      very_high: "Very High",
    };
    return translations[risk] || risk;
  }

  getOpportunityText(opportunity) {
    const translations = {
      poor: "Poor",
      fair: "Fair",
      good: "Good",
      excellent: "Excellent",
    };
    return translations[opportunity] || opportunity;
  }

  getVolumeTrendText(trend) {
    const translations = {
      increasing: "Increasing",
      decreasing: "Decreasing",
      stable: "Stable",
    };
    return translations[trend] || trend;
  }

  truncateText(text, maxLength) {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  async addStyles() {
    const { CONFIG } = await import(chrome.runtime.getURL("config.js"));

    if (document.getElementById(CONFIG.ui.stylesId)) return;

    const style = document.createElement("style");
    style.id = CONFIG.ui.stylesId;
    style.textContent = this.getStyles();
    document.head.appendChild(style);
  }

  getStyles() {
    return `
      #vapor-info {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999;
        max-width: 450px;
        min-width: 350px;
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
        border-radius: 12px;
      }
      
      .vapor-info-card {
        background: linear-gradient(135deg, #1b2838 0%, #2a475e 100%);
        border: 2px solid #4CAF50;
        border-radius: 12px;
        color: #c7d5e0;
        font-family: "Motiva Sans", Arial, Helvetica, sans-serif;
        font-size: 13px;
        transition: all 0.3s ease;
      }

      .vapor-info-card.collapsed .vapor-info-content {
        display: none;
      }

      .vapor-info-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: rgba(76, 175, 80, 0.1);
        border-bottom: 2px solid #4CAF50;
        border-radius: 10px 10px 0 0;
      }

      .vapor-logo {
        font-size: 18px;
        font-weight: bold;
        color: #4CAF50;
      }

      .vapor-toggle {
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        color: #4CAF50;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(76, 175, 80, 0.2);
        transition: background 0.2s ease;
      }

      .vapor-toggle:hover {
        background: rgba(76, 175, 80, 0.4);
      }

      .vapor-info-content {
        padding: 0;
      }

      .vapor-section {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(76, 175, 80, 0.2);
      }

      .vapor-section:last-child {
        border-bottom: none;
        border-radius: 0 0 10px 10px;
      }

      .vapor-section-title {
        font-weight: bold;
        margin-bottom: 12px;
        color: #4CAF50;
        font-size: 14px;
        border-bottom: 1px solid rgba(76, 175, 80, 0.3);
        padding-bottom: 4px;
      }

      .vapor-info-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .vapor-info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
      }

      .vapor-info-item.no-data {
        justify-content: center;
        color: #8bb5d1;
        font-style: italic;
      }

      .vapor-label {
        font-weight: 500;
        color: #8bb5d1;
        font-size: 12px;
      }

      .vapor-value {
        font-weight: 600;
        text-align: right;
      }

      .vapor-value.price-sell {
        color: #ff6b6b;
      }

      .vapor-value.price-buy {
        color: #4CAF50;
      }

      .vapor-value.spread {
        color: #ffd700;
      }

      .vapor-value.trend.positive {
        color: #4CAF50;
      }

      .vapor-value.trend.negative {
        color: #ff6b6b;
      }

      .vapor-value.trend.neutral {
        color: #8bb5d1;
      }

      .vapor-value.volatility.very_low,
      .vapor-value.volatility.low {
        color: #4CAF50;
      }

      .vapor-value.volatility.moderate {
        color: #ffd700;
      }

      .vapor-value.volatility.high,
      .vapor-value.volatility.very_high,
      .vapor-value.volatility.extreme {
        color: #ff6b6b;
      }

      .vapor-value.risk.very_low,
      .vapor-value.risk.low {
        color: #4CAF50;
      }

      .vapor-value.risk.medium {
        color: #ffd700;
      }

      .vapor-value.risk.high,
      .vapor-value.risk.very_high {
        color: #ff6b6b;
      }

      .vapor-value.opportunity.poor {
        color: #ff6b6b;
      }

      .vapor-value.opportunity.fair {
        color: #ffd700;
      }

      .vapor-value.opportunity.good {
        color: #4CAF50;
      }

      .vapor-value.opportunity.excellent {
        color: #4CAF50;
        font-weight: bold;
      }

      .vapor-value.volume-trend.increasing {
        color: #4CAF50;
      }

      .vapor-value.volume-trend.decreasing {
        color: #ff6b6b;
      }

      .vapor-value.volume-trend.stable {
        color: #8bb5d1;
      }

      .vapor-recommendation {
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 12px;
      }

      .vapor-recommendation.buy {
        background: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.3);
      }

      .vapor-recommendation.sell {
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
      }

      .vapor-recommendation.arbitrage {
        background: rgba(255, 215, 0, 0.1);
        border: 1px solid rgba(255, 215, 0, 0.3);
      }

      .vapor-recommendation.caution {
        background: rgba(255, 165, 0, 0.1);
        border: 1px solid rgba(255, 165, 0, 0.3);
      }

      .rec-action {
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 4px;
      }

      .rec-reason {
        font-size: 12px;
        margin-bottom: 4px;
        color: #c7d5e0;
      }

      .rec-timeframe {
        font-size: 10px;
        color: #8bb5d1;
      }

      .vapor-summary {
        margin-top: 8px;
        padding: 8px;
        background: rgba(42, 71, 94, 0.3);
        border-radius: 4px;
        font-size: 12px;
      }

      .summary-label {
        font-weight: bold;
        color: #4CAF50;
        margin-right: 6px;
      }

      .summary-text {
        color: #c7d5e0;
      }

      /* Scrollbar styling */
      #vapor-info::-webkit-scrollbar {
        width: 6px;
      }

      #vapor-info::-webkit-scrollbar-track {
        background: rgba(27, 40, 56, 0.5);
        border-radius: 3px;
      }

      #vapor-info::-webkit-scrollbar-thumb {
        background: rgba(76, 175, 80, 0.6);
        border-radius: 3px;
      }

      #vapor-info::-webkit-scrollbar-thumb:hover {
        background: rgba(76, 175, 80, 0.8);
      }

      .vapor-panel {
        border-radius: 12px;
        padding: 20px;
        margin: 16px 0;
        box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        background: linear-gradient(135deg, #1b2838 0%, #2a475e 100%);
        border: 2px solid #4CAF50;
      }

      .vapor-panel-header h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        text-align: center;
        border-bottom: 2px solid #4CAF50;
        padding-bottom: 10px;
        color: #4CAF50;
        font-weight: bold;
      }

      .vapor-control-section {
        margin-bottom: 20px;
      }

      .vapor-button-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 8px;
      }

      .control-btn {
        background: linear-gradient(135deg, #2a475e 0%, #1b2838 100%);
        border: 1px solid #4CAF50;
        border-radius: 6px;
        color: #c7d5e0;
        padding: 8px 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        font-size: 12px;
        min-height: 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .control-btn:hover {
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
      }

      .control-btn:active {
        transform: translateY(0);
      }
      
      .control-btn.active {
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%) !important;
        box-shadow: 0 0 10px rgba(76, 175, 80, 0.5) !important;
      }

      .price-btn .discount {
        font-size: 10px;
        color: #ff6b6b;
        font-weight: bold;
      }

      .price-btn .price {
        font-size: 11px;
        color: #4CAF50;
        font-weight: bold;
      }

      .quantity-btn {
        font-weight: bold;
        font-size: 14px;
      }

      #vapor-info::-webkit-scrollbar {
        width: 6px;
      }

      #vapor-info::-webkit-scrollbar-track {
        background: rgba(27, 40, 56, 0.5);
        border-radius: 3px;
      }

      #vapor-info::-webkit-scrollbar-thumb {
        background: rgba(76, 175, 80, 0.6);
        border-radius: 3px;
      }

      #vapor-info::-webkit-scrollbar-thumb:hover {
        background: rgba(76, 175, 80, 0.8);
      }

      @media (max-width: 600px) {
        #vapor-info {
          max-width: calc(100vw - 40px);
          min-width: 300px;
        }
      }
    `;
  }

  createElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === "innerHTML") {
        element.innerHTML = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    return element;
  }
}
