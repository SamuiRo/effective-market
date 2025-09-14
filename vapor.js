export class Vapor {
  constructor() {
    this.isInitialized = false;
    this.observer = null;
    this.marketData = null;

    this.dataExtractor = null;
    this.uiManager = null;
    this.dialogManager = null;
    this.marketAnalyzer = null;
  }

  async init() {
    if (this.isInitialized || !this.isMarketPage()) return;

    console.log("🚀 Ініціалізація Vapor...");
    console.log("✅ Steam Market page detected");

    // Динамічне завантаження модулів
    await this.loadModules();

    this.processMarketPage();
    this.startObserving();
    this.isInitialized = true;
  }

  async loadModules() {
    try {
      const { DataExtractor } = await import(
        chrome.runtime.getURL("dataExtractor.js")
      );
      const { UIManager } = await import(chrome.runtime.getURL("uiManager.js"));
      const { DialogManager } = await import(
        chrome.runtime.getURL("dialogManager.js")
      );
      const { MarketAnalyzer } = await import(
        chrome.runtime.getURL("marketAnalyzer.js")
      );

      this.dataExtractor = new DataExtractor();
      this.uiManager = new UIManager();
      this.dialogManager = new DialogManager();
      this.marketAnalyzer = new MarketAnalyzer();

      console.log("📦 Модулі завантажено успішно");
    } catch (error) {
      console.error("Помилка завантаження модулів:", error);
    }
  }

  async isMarketPage() {
    // Завантажуємо конфіг динамічно
    const { CONFIG } = await import(chrome.runtime.getURL("config.js"));
    return CONFIG.urlPattern.test(window.location.href);
  }

  async processMarketPage() {
    console.log("🔄 Обробка сторінки маркету...");

    const { CONFIG } = await import(chrome.runtime.getURL("config.js"));

    setTimeout(async () => {
      const marketData = await this.dataExtractor.extractItemInfo();

      if (marketData && marketData.name) {
        this.marketData = marketData;

        console.log("🛒 Дані про товар отримано:", marketData);
        // Виконуємо аналіз ринкових даних
        const analysis = this.marketAnalyzer.analyzeMarketData(marketData);

        // Передаємо як marketData, так і analysis до UI
        this.uiManager.addItemInfoDisplay(marketData, analysis);

        console.log("📊 Аналіз ринкових даних завершено");
      } else {
        console.log("⚠️ Не вдалося отримати дані про товар");
      }
    }, CONFIG.delays.marketPageProcessing);
  }

  startObserving() {
    if (this.observer) this.observer.disconnect();

    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });
  }

  async handleMutations(mutations) {
    const shouldUpdate = mutations.some(
      (mutation) => mutation.addedNodes.length > 0
    );
    if (shouldUpdate) {
      await this.handlePopup();
      if (this.dialogManager) {
        this.dialogManager.autoClickCheckbox();
      }
    }
  }

  async handlePopup() {
    const { CONFIG } = await import(chrome.runtime.getURL("config.js"));

    const orderModal = document.querySelector(CONFIG.selectors.orderModal);

    if (!orderModal || document.getElementById(CONFIG.ui.controlPanelId))
      return;

    const targetElement = document.querySelector(
      CONFIG.selectors.targetElement
    );
    if (targetElement && this.dialogManager) {
      console.log("🎯 Модальне вікно знайдено, додаємо елементи управління");
      await this.dialogManager.insertControlPanel(targetElement);
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    const helperElements = document.querySelectorAll('[id^="vapor"]');
    helperElements.forEach((el) => el.remove());

    this.isInitialized = false;
    console.log("🧹 Vapor очищено");
  }
}
