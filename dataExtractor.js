export class DataExtractor {
  async extractItemInfo() {
    try {
      const { CONFIG } = await import(chrome.runtime.getURL("config.js"));

      // Основна інформація про предмет
      const basicInfo = this.extractBasicInfo(CONFIG);

      // Дані з графіка цін
      const priceGraphData = this.extractPriceGraphData();

      // Історія цін з елементів сторінки
      const priceHistoryData = this.extractPriceHistoryFromElements();

      // Інформація про ордери
      const orderBookData = this.extractOrderBookData();

      // Метадані сторінки
      const pageMetadata = this.extractPageMetadata();

      // Додаткові дані зі сторінки
      const additionalData = this.extractAdditionalData();

      // Обчислення метрик
      const calculatedMetrics = this.calculateMetrics(basicInfo);

      console.log("Data", {
        ...basicInfo,
        priceGraph: priceGraphData,
        priceHistory: priceHistoryData,
        orderBook: orderBookData,
        metadata: pageMetadata,
        additional: additionalData,
        metrics: calculatedMetrics,
        timestamp: Date.now(),
        url: window.location.href,
      });

      return {
        ...basicInfo,
        priceGraph: priceGraphData,
        priceHistory: priceHistoryData,
        orderBook: orderBookData,
        metadata: pageMetadata,
        additional: additionalData,
        metrics: calculatedMetrics,
        timestamp: Date.now(),
        url: window.location.href,
      };
    } catch (error) {
      console.error("Error extracting item info:", error);
      return null;
    }
  }

    extractBasicInfo(CONFIG) {
    const nameElement = document.querySelector(CONFIG.selectors.itemName);
    const name = nameElement
      ? nameElement.textContent.trim()
      : "Невідомий товар";

    // Спробуємо отримати ціни різними способами
    const salePrice = this.extractSalePrice(CONFIG);
    console.log("Extracted sale price:", salePrice);
    const requestPrice = this.extractRequestPrice(CONFIG);
    const saleCount = this.extractSaleCount(CONFIG);
    const requestCount = this.extractRequestCount(CONFIG);

    return {
      name,
      salePrice,
      requestPrice,
      saleCount,
      requestCount,
    };
  }

  // Новий метод для отримання ціни продажу
  extractSalePrice(CONFIG) {
    // Спочатку пробуємо стандартний селектор для commodity
    let price = this.extractPrice(CONFIG.selectors.salePrice);
    
    // Якщо не знайшли, шукаємо ціну в списку предметів (для скінів)
    if (price === 0) {
      const listingPrice = document.querySelector('.market_listing_price.market_listing_price_with_fee');
      if (listingPrice) {
        price = this.parsePrice(listingPrice.textContent);
      }
    }
    
    // Додаткові спроби знайти ціну
    if (price === 0) {
      const alternativeSelectors = [
        '.market_listing_right_cell .market_listing_price',
        '.market_listing_table .market_listing_price',
        '[id*="listing_"] .market_listing_price'
      ];
      
      for (const selector of alternativeSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          price = this.parsePrice(element.textContent);
          if (price > 0) break;
        }
      }
    }
    
    return price;
  }

  // Новий метод для отримання ціни запиту
  extractRequestPrice(CONFIG) {
    let price = this.extractPrice(CONFIG.selectors.requestPrice);
    
    // Для скінів ціна запиту може бути в іншому місці
    if (price === 0) {
      const buyOrderPrice = document.querySelector('.market_listing_buyorder_price');
      if (buyOrderPrice) {
        price = this.parsePrice(buyOrderPrice.textContent);
      }
    }
    
    return price;
  }

  // Новий метод для отримання кількості продажів
  extractSaleCount(CONFIG) {
    let count = this.extractCount(CONFIG.selectors.saleCount);
    
    if (count === 0) {
      // Для скінів - рахуємо кількість активних лістингів
      const listings = document.querySelectorAll('.market_listing_row');
      count = listings.length;
    }
    
    return count;
  }

  // Новий метод для отримання кількості запитів
  extractRequestCount(CONFIG) {
    let count = this.extractCount(CONFIG.selectors.requestCount);
    
    if (count === 0) {
      // Для скінів - шукаємо інформацію про buy orders
      const buyOrdersElement = document.querySelector('[href*="#buyorder"]');
      if (buyOrdersElement) {
        const match = buyOrdersElement.textContent.match(/(\d+)/);
        count = match ? parseInt(match[1]) : 0;
      }
    }
    
    return count;
  }

  extractPriceGraphData() {
    // Пробуємо різні можливі змінні з графіком цін
    const possibleSources = [
      "g_plotPriceHistory",
      "line1",
      "g_rgAssetPriceHistory",
      "g_plotData",
      "plotData",
    ];

    let priceData = null;

    for (const source of possibleSources) {
      if (window[source]) {
        priceData = window[source];
        console.log(`✅ Знайдено дані графіка в: ${source}`);
        break;
      }
    }

    // Перевіряємо в об'єкті g_plotPriceHistory
    if (!priceData && window.g_plotPriceHistory) {
      priceData = window.g_plotPriceHistory;
    }

    // Шукаємо в скриптах сторінки
    if (!priceData) {
      priceData = this.extractPriceDataFromScripts();
    }

    return priceData ? this.processPriceGraphData(priceData) : null;
  }

  extractPriceDataFromScripts() {
    const scripts = document.querySelectorAll("script");

    for (const script of scripts) {
      const content = script.textContent;

      // Шукаємо різні паттерни даних графіка
      const patterns = [
        /g_plotPriceHistory\s*=\s*(\[[\s\S]*?\]);/,
        /line1\s*=\s*(\[[\s\S]*?\]);/,
        /"price_history":\s*(\[[\s\S]*?\])/,
        /"prices":\s*(\[[\s\S]*?\])/,
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          try {
            return JSON.parse(match[1]);
          } catch (e) {
            console.warn("Помилка парсингу даних графіка:", e);
          }
        }
      }
    }

    return null;
  }

  processPriceGraphData(rawData) {
    if (!Array.isArray(rawData)) return null;

    return {
      raw: rawData,
      processed: {
        totalPoints: rawData.length,
        dateRange: {
          start: rawData[0] ? new Date(rawData[0][0]) : null,
          end: rawData[rawData.length - 1]
            ? new Date(rawData[rawData.length - 1][0])
            : null,
        },
        priceRange: {
          min: Math.min(...rawData.map((point) => point[1] || 0)),
          max: Math.max(...rawData.map((point) => point[1] || 0)),
        },
        averagePrice:
          rawData.reduce((sum, point) => sum + (point[1] || 0), 0) /
          rawData.length,
        recentTrend: this.calculateTrend(rawData.slice(-10)), // Останні 10 точок
      },
    };
  }

  extractPriceHistoryFromElements() {
    // Шукаємо таблиці з історією цін
    const historySelectors = [
      ".market_commodity_order_block table",
      ".market_listing_table",
      ".market_recent_listing_table",
    ];

    const historyData = {};

    historySelectors.forEach((selector, index) => {
      const table = document.querySelector(selector);
      if (table) {
        historyData[`table_${index}`] = this.parseTable(table);
      }
    });

    return Object.keys(historyData).length > 0 ? historyData : null;
  }

  extractOrderBookData() {
    const orderBook = {
      buyOrders: [],
      sellOrders: [],
    };

    // Шукаємо таблиці ордерів
    const orderTables = document.querySelectorAll(
      ".market_commodity_order_block table"
    );

    orderTables.forEach((table, index) => {
      const rows = table.querySelectorAll("tr");
      const tableData = [];

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 2) {
          tableData.push({
            price: this.parsePrice(cells[0]?.textContent || ""),
            quantity: this.parseQuantity(cells[1]?.textContent || ""),
          });
        }
      });

      if (index === 0) orderBook.sellOrders = tableData;
      if (index === 1) orderBook.buyOrders = tableData;
    });

    return orderBook;
  }

  extractPageMetadata() {
    return {
      appId: this.extractAppId(),
      itemId: this.extractItemId(),
      currency: this.extractCurrency(),
      language: document.documentElement.lang || "en",
      userCountry: this.extractUserCountry(),
      marketHashName: this.extractMarketHashName(),
    };
  }

  extractAdditionalData() {
    return {
      // Інформація про предмет з різних елементів
      itemDescription: this.extractItemDescription(),
      itemImage: this.extractItemImage(),
      itemRarity: this.extractItemRarity(),
      itemType: this.extractItemType(),

      // Статистика сторінки
      pageViews: this.extractPageViews(),
      lastUpdate: this.extractLastUpdate(),

      // Додаткові елементи UI
      notifications: this.extractNotifications(),
      warnings: this.extractWarnings(),
    };
  }

  calculateMetrics(basicInfo) {
    const { salePrice, requestPrice, saleCount, requestCount } = basicInfo;

    const spread = salePrice && requestPrice ? salePrice - requestPrice : 0;
    const spreadPercent =
      salePrice && requestPrice
        ? ((salePrice - requestPrice) / requestPrice) * 100
        : 0;
    const liquidity = saleCount + requestCount;

    return {
      spread,
      spreadPercent,
      liquidity,
      marketDepth: {
        buyDepth: requestCount,
        sellDepth: saleCount,
        ratio: saleCount > 0 ? requestCount / saleCount : 0,
      },
    };
  }

  // Допоміжні методи для витягування специфічних даних

  extractAppId() {
    const match = window.location.pathname.match(/\/(\d+)\//);
    return match ? match[1] : null;
  }

  extractItemId() {
    const urlParts = window.location.pathname.split("/");
    return urlParts[urlParts.length - 1] || null;
  }

  extractCurrency() {
    const currencySymbols = {
      "₴": "UAH",
      $: "USD",
      "€": "EUR",
      "£": "GBP",
      "¥": "JPY",
    };

    const priceElement = document.querySelector(".market_listing_price");
    if (priceElement) {
      const text = priceElement.textContent;
      for (const [symbol, code] of Object.entries(currencySymbols)) {
        if (text.includes(symbol)) return code;
      }
    }
    return "USD"; // за замовчуванням
  }

  extractUserCountry() {
    // Пробуємо знайти інформацію про країну користувача
    const scripts = document.querySelectorAll("script");
    for (const script of scripts) {
      const match = script.textContent.match(
        /g_strCountryCode\s*=\s*["']([^"']+)["']/
      );
      if (match) return match[1];
    }
    return null;
  }

  extractMarketHashName() {
    const match = window.location.pathname.match(
      /\/market\/listings\/\d+\/(.+)/
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  extractItemDescription() {
    const descElement = document.querySelector(
      ".market_listing_item_name_block"
    );
    return descElement ? descElement.textContent.trim() : null;
  }

  extractItemImage() {
    const imgElement = document.querySelector(".market_listing_item_img img");
    return imgElement ? imgElement.src : null;
  }

  extractItemRarity() {
    // Пробуємо знайти рідкість предмета в різних місцях
    const rarityElement = document.querySelector(
      '.descriptor[data-content*="rarity"]'
    );
    return rarityElement ? rarityElement.textContent.trim() : null;
  }

  extractItemType() {
    // Витягуємо тип предмета
    const typeElement = document.querySelector(".market_listing_item_type");
    return typeElement ? typeElement.textContent.trim() : null;
  }

  extractPageViews() {
    // Якщо є лічильник переглядів
    const viewsElement = document.querySelector(".market_listing_views");
    return viewsElement
      ? parseInt(viewsElement.textContent.replace(/\D/g, ""))
      : null;
  }

  extractLastUpdate() {
    // Час останнього оновлення
    const updateElement = document.querySelector(".market_listing_last_update");
    return updateElement ? updateElement.textContent.trim() : null;
  }

  extractNotifications() {
    const notifications = [];
    document
      .querySelectorAll(".market_notification")
      .forEach((notification) => {
        notifications.push(notification.textContent.trim());
      });
    return notifications;
  }

  extractWarnings() {
    const warnings = [];
    document
      .querySelectorAll(".market_warning, .warning")
      .forEach((warning) => {
        warnings.push(warning.textContent.trim());
      });
    return warnings;
  }

  // Допоміжні методи

  calculateTrend(dataPoints) {
    if (!dataPoints || dataPoints.length < 2) return 0;

    const firstPrice = dataPoints[0][1];
    const lastPrice = dataPoints[dataPoints.length - 1][1];

    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }

  parseTable(table) {
    const data = [];
    const rows = table.querySelectorAll("tr");

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td, th");
      const rowData = Array.from(cells).map((cell) => cell.textContent.trim());
      if (rowData.length > 0) data.push(rowData);
    });

    return data;
  }

  parsePrice(priceText) {
    return parseFloat(priceText.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  }

  parseQuantity(quantityText) {
    return parseInt(quantityText.replace(/[^\d]/g, "")) || 0;
  }

  extractPrice(selector) {
    const element = document.querySelector(selector);
    if (element) {
      const priceText = element.textContent
        .replace(",", ".")
        .replace(/[₴$€£,\s]/g, "");
      return parseFloat(priceText) || 0;
    }
    return 0;
  }

  extractCount(selector) {
    const element = document.querySelector(selector);
    if (element) {
      const countText = element.textContent.replace(/[^\d]/g, "");
      return parseInt(countText) || 0;
    }
    return 0;
  }
}
