// dialogManager.js - Відповідає за роботу з модальним вікном
// import { CONFIG } from './config.js';

export class DialogManager {
  async insertControlPanel(targetElement) {
    const { CONFIG } = await import(chrome.runtime.getURL("config.js"));

    const controlPanel = this.createElement("div", {
      id: CONFIG.ui.controlPanelId,
      className: CONFIG.ui.panelClassName,
      innerHTML: await this.createControlPanelHTML(),
    });

    targetElement.parentNode.insertBefore(controlPanel, targetElement);
    this.attachEventListeners();
    await this.updateAllPriceButtons();
    console.log("✨ Панель управління додана");
  }

  async createControlPanelHTML() {
    const { CONFIG } = await import(chrome.runtime.getURL("config.js"));

    return `
      <div class="vapor-panel-header">
        <h3>Vapor Controls</h3>
      </div>
      
      <div class="vapor-control-section">
        <div class="vapor-section-title">% від пропозицій:</div>
        <div class="vapor-button-grid">
          ${this.createPriceButtons("sale", CONFIG.pricePercentages.sale)}
        </div>
      </div>

      <div class="vapor-control-section">
        <div class="vapor-section-title">% від запитів:</div>
        <div class="vapor-button-grid">
          ${this.createPriceButtons("request", CONFIG.pricePercentages.request)}
        </div>
      </div>

      <div class="vapor-control-section">
        <div class="vapor-section-title">Кількість:</div>
        <div class="vapor-button-grid">
          ${await this.createQuantityButtons()}
        </div>
      </div>
    `;
  }

  createPriceButtons(type, percentages) {
    return percentages
      .map(
        (percentage) => `
        <button class="control-btn price-btn" 
                data-type="${type}" 
                data-percentage="${percentage}"
                title="Встановити ціну зі знижкою ${percentage * 100}%">
          <span class="discount">-${(percentage * 100).toFixed(0)}%</span>
          <span class="price">0.00</span>
        </button>
      `
      )
      .join("");
  }

  async createQuantityButtons() {
    const { CONFIG } = await import(chrome.runtime.getURL("config.js"));

    return CONFIG.quantities
      .map(
        (quantity) => `
        <button class="control-btn quantity-btn" 
                data-quantity="${quantity}"
                title="Встановити кількість ${quantity}">
          ${quantity}
        </button>
      `
      )
      .join("");
  }

  attachEventListeners() {
    // Обробники для кнопок цін
    document.querySelectorAll(".price-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const price = button.getAttribute("data-price");
        await this.setPriceInput(price);
        this.highlightButton(button);
      });
    });

    // Обробники для кнопок кількості
    document.querySelectorAll(".quantity-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const quantity = button.getAttribute("data-quantity");
        await this.setQuantityInput(quantity);
        this.highlightButton(button);
      });
    });
  }

  highlightButton(activeButton) {
    const siblingButtons =
      activeButton.parentNode.querySelectorAll(".control-btn");
    siblingButtons.forEach((btn) => btn.classList.remove("active"));
    activeButton.classList.add("active");
  }

  async setPriceInput(price) {
    const { CONFIG } = await import(chrome.runtime.getURL("config.js"));

    const priceInput = document.querySelector(CONFIG.selectors.priceInput);
    if (priceInput) {
      priceInput.value = price;
      priceInput.dispatchEvent(new Event("input", { bubbles: true }));
      console.log(`💰 Ціна встановлена: ${price}`);
    }
  }

  async setQuantityInput(quantity) {
    const { CONFIG } = await import(chrome.runtime.getURL("config.js"));

    const quantityInput = document.querySelector(
      CONFIG.selectors.quantityInput
    );
    if (quantityInput) {
      quantityInput.value = quantity;
      quantityInput.dispatchEvent(new Event("input", { bubbles: true }));
      console.log(`📦 Кількість встановлена: ${quantity}`);
    }
  }

  async autoClickCheckbox() {
    const { CONFIG } = await import(chrome.runtime.getURL("config.js"));

    const checkbox = document.querySelector(CONFIG.selectors.checkbox);
    if (checkbox && !checkbox.checked) {
      checkbox.click();
      console.log("✅ Чекбокс автоматично відзначено");
    }
  }

  async updateAllPriceButtons() {
    const { CONFIG } = await import(chrome.runtime.getURL("config.js"));

    this.updatePriceButtonsForType("sale", CONFIG.selectors.salePrice);
    this.updatePriceButtonsForType("request", CONFIG.selectors.requestPrice);
  }

  updatePriceButtonsForType(type, priceSelector) {
    const priceElement = document.querySelector(priceSelector);
    if (!priceElement) {
      console.log(`⚠️ Не знайдено елемент ціни для типу: ${type}`);
      return;
    }

    const priceText = priceElement.textContent
      .replace("₴", "")
      .replace(",", ".");
    const basePrice = parseFloat(priceText);

    if (isNaN(basePrice)) {
      console.log("⚠️ Невірне значення ціни!");
      return;
    }

    document.querySelectorAll(`[data-type="${type}"]`).forEach((button) => {
      const percentage = parseFloat(button.getAttribute("data-percentage"));
      const discountedPrice = basePrice * (1 - percentage);
      const formattedPrice = discountedPrice.toFixed(2);

      button.setAttribute("data-price", formattedPrice);
      button.querySelector(".price").textContent = formattedPrice;
    });

    console.log(`🔄 Ціни оновлено для типу: ${type}`);
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
