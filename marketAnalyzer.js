// marketAnalyzer.js - Оптимізована аналітика для Steam Market
export class MarketAnalyzer {
  constructor() {
    this.MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;
  }

  /**
   * Головний метод для аналітики Steam Market
   */
  analyzeMarketData(marketData) {
    if (!marketData || !marketData.priceGraph?.raw) {
      return this.getEmptyAnalysis();
    }

    const priceData = this.normalizePriceData(marketData.priceGraph.raw);
    const currentPrice = this.getCurrentPrice(marketData, priceData);

    const analysis = {
      currentPrice,
      timestamp: Date.now(),
      trends: this.analyzeTrends(priceData),
      volatility: this.analyzeVolatility(priceData),
      spreadAnalysis: this.analyzeSpread(marketData),
      volumeAnalysis: this.analyzeVolume(priceData),
      recommendations: this.generateRecommendations(priceData, marketData),
    };

    return analysis;
  }

  /**
   * Нормалізація даних цін для Steam Market
   */
  normalizePriceData(rawData) {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];

    return rawData
      .filter((point) => point && point.length >= 2 && point[1] > 0)
      .map((point) => ({
        timestamp: new Date(point[0]).getTime(),
        price: parseFloat(point[1]),
        volume: point[2] || 0,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Отримання поточної ціни
   */
  getCurrentPrice(marketData, priceData) {
    // Пріоритет: ціна продажу з маркету, потім остання ціна з графіка
    if (marketData.salePrice > 0) return marketData.salePrice;
    if (priceData.length > 0) return priceData[priceData.length - 1].price;
    return 0;
  }

  /**
   * Аналіз трендів для Steam Market
   */
  analyzeTrends(priceData) {
    const now = Date.now();
    const oneWeekAgo = now - 7 * this.MILLISECONDS_IN_DAY;
    const oneMonthAgo = now - 30 * this.MILLISECONDS_IN_DAY;

    return {
      last24h: this.calculatePeriodTrend(
        priceData,
        now - this.MILLISECONDS_IN_DAY
      ),
      last7d: this.calculatePeriodTrend(priceData, oneWeekAgo),
      last30d: this.calculatePeriodTrend(priceData, oneMonthAgo),
      overall: this.calculateOverallTrend(priceData),
    };
  }

  /**
   * Розрахунок тренду за період
   */
  calculatePeriodTrend(priceData, fromTimestamp) {
    const periodData = priceData.filter(
      (point) => point.timestamp >= fromTimestamp
    );

    if (periodData.length < 2) {
      return { trend: 0, direction: "neutral", confidence: 0 };
    }

    const startPrice = periodData[0].price;
    const endPrice = periodData[periodData.length - 1].price;
    const trendPercent = ((endPrice - startPrice) / startPrice) * 100;

    return {
      trend: parseFloat(trendPercent.toFixed(2)),
      direction: this.classifyTrendDirection(trendPercent),
      confidence: Math.min(periodData.length / 10, 1), // Впевненість на основі кількості точок
      dataPoints: periodData.length,
    };
  }

  /**
   * Класифікація напряму тренду
   */
  classifyTrendDirection(trendPercent) {
    if (trendPercent > 10) return "strong_bullish";
    if (trendPercent > 3) return "bullish";
    if (trendPercent > -3) return "neutral";
    if (trendPercent > -10) return "bearish";
    return "strong_bearish";
  }

  /**
   * Аналіз волатильності
   */
  analyzeVolatility(priceData) {
    if (priceData.length < 5) {
      return { status: "insufficient_data" };
    }

    const prices = priceData.map((p) => p.price);
    const returns = this.calculateReturns(prices);
    const volatility = this.calculateStandardDeviation(returns) * 100;

    return {
      daily: volatility,
      classification: this.classifyVolatility(volatility),
      riskLevel: this.assessVolatilityRisk(volatility),
    };
  }

  /**
   * Розрахунок прибутковості
   */
  calculateReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  /**
   * Класифікація волатильності для Steam Market
   */
  classifyVolatility(volatility) {
    if (volatility > 8) return "extreme";
    if (volatility > 5) return "high";
    if (volatility > 3) return "moderate";
    if (volatility > 1) return "low";
    return "very_low";
  }

  /**
   * Оцінка ризику на основі волатильності
   */
  assessVolatilityRisk(volatility) {
    if (volatility > 8) return "very_high";
    if (volatility > 5) return "high";
    if (volatility > 3) return "medium";
    return "low";
  }

  /**
   * Аналіз спреду для Steam Market
   */
  analyzeSpread(marketData) {
    const spread = marketData.salePrice - marketData.requestPrice;
    const spreadPercent =
      marketData.requestPrice > 0
        ? (spread / marketData.requestPrice) * 100
        : 0;

    return {
      absolute: spread,
      percent: parseFloat(spreadPercent.toFixed(2)),
      liquidity: marketData.saleCount + marketData.requestCount,
      opportunity: this.assessSpreadOpportunity(spreadPercent),
    };
  }

  /**
   * Оцінка арбітражної можливості на основі спреду
   */
  assessSpreadOpportunity(spreadPercent) {
    if (spreadPercent > 15) return "excellent";
    if (spreadPercent > 10) return "good";
    if (spreadPercent > 5) return "fair";
    return "poor";
  }

  /**
   * Аналіз обсягів торгів
   */
  analyzeVolume(priceData) {
    if (priceData.length === 0) return { status: "insufficient_data" };

    console.log("Analyzing volume with data points:", priceData);

    const volumes = priceData.map((p) => p.volume).filter((v) => v > 0);
    if (volumes.length === 0) return { status: "no_volume_data" };

    console.log("Volume data points:", volumes);
    const totalVolume = volumes.reduce((sum, vol) => +sum + +vol, 0);
    const avgVolume = totalVolume / volumes.length;
    const recentVolume =
      volumes.slice(-7).reduce((sum, vol) => +sum + +vol, 0) / 7;

    return {
      total: totalVolume,
      average: parseFloat(avgVolume.toFixed(2)),
      recentAverage: parseFloat(recentVolume.toFixed(2)),
      trend:
        recentVolume > avgVolume * 1.2
          ? "increasing"
          : recentVolume < avgVolume * 0.8
          ? "decreasing"
          : "stable",
    };
  }

  /**
   * Генерація рекомендацій для Steam Market
   */
  generateRecommendations(priceData, marketData) {
    const recommendations = [];
    const trends = this.analyzeTrends(priceData);
    const spreadAnalysis = this.analyzeSpread(marketData);
    const volatility = this.analyzeVolatility(priceData);

    // Рекомендації на основі тренду
    if (trends.last7d.direction === "strong_bullish") {
      recommendations.push({
        action: "BUY",
        confidence: "high",
        reason: "Сильний висхідний тренд за останні 7 днів",
        timeframe: "short_term",
      });
    }

    if (trends.last7d.direction === "strong_bearish") {
      recommendations.push({
        action: "SELL",
        confidence: "high",
        reason: "Сильний низхідний тренд за останні 7 днів",
        timeframe: "short_term",
      });
    }

    // Рекомендації на основі спреду
    if (spreadAnalysis.opportunity === "excellent") {
      recommendations.push({
        action: "ARBITRAGE",
        confidence: "medium",
        reason: `Високий спред ${spreadAnalysis.percent}% - арбітражна можливість`,
        timeframe: "immediate",
      });
    }

    // Рекомендації на основі волатильності
    if (volatility.riskLevel === "very_high") {
      recommendations.push({
        action: "CAUTION",
        confidence: "high",
        reason: "Дуже висока волатильність - високий ризик",
        timeframe: "all",
      });
    }

    return {
      recommendations,
      summary: this.summarizeRecommendations(recommendations),
    };
  }

  /**
   * Загальний тренд
   */
  calculateOverallTrend(priceData) {
    if (priceData.length < 2) return { trend: 0, direction: "neutral" };

    const firstPrice = priceData[0].price;
    const lastPrice = priceData[priceData.length - 1].price;
    const trend = ((lastPrice - firstPrice) / firstPrice) * 100;

    return {
      trend: parseFloat(trend.toFixed(2)),
      direction: this.classifyTrendDirection(trend),
      periodDays: Math.floor(
        (priceData[priceData.length - 1].timestamp - priceData[0].timestamp) /
          this.MILLISECONDS_IN_DAY
      ),
    };
  }

  /**
   * Стандартне відхилення
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    return Math.sqrt(variance);
  }

  /**
   * Підсумок рекомендацій
   */
  summarizeRecommendations(recommendations) {
    if (recommendations.length === 0) return "Немає активних рекомендацій";

    const buyCount = recommendations.filter((r) => r.action === "BUY").length;
    const sellCount = recommendations.filter((r) => r.action === "SELL").length;
    const cautionCount = recommendations.filter(
      (r) => r.action === "CAUTION"
    ).length;

    if (cautionCount > 0) return "Обережно - високий ризик";
    if (buyCount > sellCount) return "Переважають покупки";
    if (sellCount > buyCount) return "Переважають продажі";

    return "Змішані сигнали";
  }

  getEmptyAnalysis() {
    return {
      currentPrice: 0,
      timestamp: Date.now(),
      trends: { status: "insufficient_data" },
      volatility: { status: "insufficient_data" },
      spreadAnalysis: { status: "insufficient_data" },
      volumeAnalysis: { status: "insufficient_data" },
      recommendations: {
        recommendations: [],
        summary: "Недостатньо даних для аналізу",
      },
    };
  }
}
