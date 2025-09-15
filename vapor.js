export class Vapor {
  constructor() {
    this.isInitialized = false;
    this.observer = null;
    this.marketData = null;

    this.dataExtractor = null;
    this.uiManager = null;
    this.dialogManager = null;
    this.marketAnalyzer = null;
    this.handleContextInvalidation = this.handleContextInvalidation.bind(this);
    window.addEventListener("beforeunload", this.handleContextInvalidation);
  }

  async init() {
    if (this.isInitialized || !this.isMarketPage()) return;

    console.log("🚀 Initializing Vapor...");
    console.log("✅ Steam Market page detected");

    await this.loadModules();
    this.processMarketPage();
    this.startObserving();
    this.isInitialized = true;
  }

  async loadModules() {
    if (!this.isExtensionContextValid()) {
      console.warn("Extension context invalidated - cannot load modules");
      return;
    }

    try {
      const [
        { DataExtractor },
        { UIManager },
        { DialogManager },
        { MarketAnalyzer },
      ] = await Promise.all([
        import(chrome.runtime.getURL("dataExtractor.js")),
        import(chrome.runtime.getURL("uiManager.js")),
        import(chrome.runtime.getURL("dialogManager.js")),
        import(chrome.runtime.getURL("marketAnalyzer.js")),
      ]);

      this.dataExtractor = new DataExtractor();
      this.uiManager = new UIManager();
      this.dialogManager = new DialogManager();
      this.marketAnalyzer = new MarketAnalyzer();

      console.log("📦 Modules loaded successfully");
    } catch (error) {
      console.error("Error loading modules:", error);
    }
  }

  async isMarketPage() {
    if (!this.isExtensionContextValid()) return false;

    try {
      const config = await this.getConfig();
      return config?.urlPattern.test(window.location.href) || false;
    } catch (error) {
      return false;
    }
  }

  async processMarketPage() {
    console.log("🔄 Processing market page...");

    const config = await this.getConfig();
    if (!config) return;

    setTimeout(async () => {
      const marketData = await this.dataExtractor.extractItemInfo();

      if (marketData?.name) {
        this.marketData = marketData;
        console.log("🛒 Item data extracted:", marketData);

        const analysis = this.marketAnalyzer.analyzeMarketData(marketData);
        this.uiManager.addItemInfoDisplay(marketData, analysis);
        console.log("📊 Market data analysis completed");
      } else {
        console.log("⚠️ Failed to extract item data");
      }
    }, config.delays.marketPageProcessing);
  }

  startObserving() {
    if (this.observer) this.observer.disconnect();

    this.observer = new MutationObserver((mutations) =>
      this.handleMutations(mutations)
    );
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });
  }

  async handleMutations(mutations) {
    if (!this.isExtensionContextValid()) {
      this.destroy();
      return;
    }

    const shouldUpdate = mutations.some(
      (mutation) => mutation.addedNodes.length > 0
    );
    if (shouldUpdate) {
      await this.handlePopup();
      this.dialogManager?.autoClickCheckbox();
    }
  }

  async handlePopup() {
    if (!this.isExtensionContextValid()) {
      console.warn("Extension context invalidated - skipping handlePopup");
      return;
    }

    const config = await this.getConfig();
    if (!config) return;

    const orderModal = document.querySelector(config.selectors.orderModal);
    if (!orderModal || document.getElementById(config.ui.controlPanelId))
      return;

    const targetElement = document.querySelector(
      config.selectors.targetElement
    );
    if (targetElement && this.dialogManager) {
      console.log("🎯 Modal found, adding controls");
      await this.dialogManager.insertControlPanel(targetElement);
    }
  }

  async getConfig() {
    if (this._config && this.isExtensionContextValid()) {
      return this._config;
    }

    try {
      const { CONFIG } = await import(chrome.runtime.getURL("config.js"));
      this._config = CONFIG;
      return CONFIG;
    } catch (error) {
      console.error("Failed to load config:", error);
      return null;
    }
  }

  isExtensionContextValid() {
    try {
      return (
        typeof chrome !== "undefined" &&
        chrome.runtime?.getURL &&
        chrome.runtime?.id
      );
    } catch (error) {
      return false;
    }
  }

  handleContextInvalidation() {
    console.log("Extension context being invalidated - cleaning up");
    this.destroy();
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    document.querySelectorAll('[id^="vapor"]').forEach((el) => el.remove());
    window.removeEventListener("beforeunload", this.handleContextInvalidation);

    this.isInitialized = false;
    console.log("🧹 Vapor cleaned up");
  }
}
