// Функція, яка виконується після завантаження сторінки
window.onload = () => {
    console.log("Сторінка повністю завантажена");
    initExtension();
};

// Ініціалізація розширення
function initExtension() {
    // Перевіряємо, чи сторінка відповідає шаблону
    const urlPattern = /^https:\/\/steamcommunity\.com\/market\/listings\/\d+\/.+/;
    if (urlPattern.test(window.location.href)) {
        console.log("Steam Market сторінка виявлена.");
        processMarketPage();
        observePopupChanges();
    }
}

// Обробка сторінки ринку Steam
function processMarketPage() {
    const itemNameElement = document.querySelector(".market_listing_item_name");
    const itemPriceElement = document.querySelector(".market_listing_price_with_fee");

    if (itemNameElement && itemPriceElement) {
        const itemName = itemNameElement.textContent.trim();
        const itemPrice = itemPriceElement.textContent.trim();

        console.log(`Назва предмета: ${itemName}`);
        console.log(`Ціна предмета: ${itemPrice}`);
        addItemInfo(itemName, itemPrice);
    }
}

// Додаємо новий елемент на сторінку з інформацією про предмет
function addItemInfo(itemName, itemPrice) {
    const newElement = document.createElement("div");
    newElement.id = "extension-info";
    newElement.style.border = "2px solid #4CAF50";
    newElement.innerHTML = `<strong>Назва:</strong> ${itemName} <br> <strong>Ціна:</strong> ${itemPrice}`;

    const container = document.querySelector("#market_buyorder_info");
    if (container) {
        container.appendChild(newElement);
    }
}

// Спостерігач для відстеження змін на сторінці (поява popup)
function observePopupChanges() {
    const observer = new MutationObserver(handleMutations);
    observer.observe(document.body, { childList: true, subtree: true });
}

// Обробка змін, що відбуваються на сторінці
function handleMutations(mutations) {
    mutations.forEach(() => {
        handlePopup();
        autoClickCheckbox();
    });
}

// Обробка появи popup та додавання елементів
function handlePopup() {
    const orderModal = document.querySelector('div.newmodal[data-panel]');
    if (!orderModal || document.getElementById("custom-info1")) return;

    const targetElement = document.getElementById("market_buyorder_dialog_paymentinfo_frame_container");
    if (targetElement) {
        console.log("Елемент знайдено!");
        insertCustomInfo(targetElement);
        addEventListeners();
        updatePriceButtons();
    } else {
        console.log("Цільовий елемент не знайдено!");
    }
}

// Додаємо новий div для введення даних користувачем
function insertCustomInfo(targetElement) {
    const newDiv = document.createElement("div");
    newDiv.id = "custom-info1";
    newDiv.style.border = "2px solid #4CAF50";
    newDiv.style.padding = "10px";
    newDiv.style.marginBottom = "10px";
    newDiv.innerHTML = ` 
        <div class="price-buttons-row" id="price-buttons-sale">
        <p>% від пропозиції:</p>
        <div class="button-row">
            ${createPriceButtons("price-btn-sale-row", [0.15, 0.25, 0.35, 0.50, 0.60])}
            </div>
        </div>
        <div class="price-buttons-row" id="price-buttons-request" style="margin-top: 10px;">
            <p>% від запитів:</p>
            <div class="button-row">
            ${createPriceButtons("price-btn-request-row", [0.15, 0.25, 0.35, 0.50, 0.60])}
            </div>
        </div>
        <div id="quantity-buttons" style="margin-top: 10px;">
            <p>Виберіть кількість:</p>
            <div class="button-row">
            ${createQuantityButtons([50, 100, 250, 500, 1000])}
            </div>
        </div>
        <style>
        #custom-info1{display: flex; flex-direction: column; width: 100%;}
        .price-buttons-row{display: flex; flex-direction: column; width: 100%;}
        #quantity-buttons{display: flex; flex-direction: column; width: 100%}
        .button-row{display: flex; width: 100%; gap: 15px}
        </style>
    `;
    targetElement.parentNode.insertBefore(newDiv, targetElement);
    console.log("Новий елемент вставлено.");
    addEventListeners();
    updateAllPriceButtons();
}

// Функція для створення кнопок із класом для конкретного ряду
function createPriceButtons(className, percentages) {
    return percentages.map(percentage => `
        <div class="price-btn-container">
            <span class="discount-label">-${percentage * 100}%</span>
            <button class="${className} price-btn" data-percentage="${percentage}">0.00</button>
        </div>
    `).join('');
}

// Створення кнопок для вибору кількості
function createQuantityButtons(values) {
    return values.map(value => `<button class="quantity-btn" data-quantity="${value}">${value}</button>`).join('');
}

// Автоматичне натискання на чекбокс
function autoClickCheckbox() {
    const checkbox = document.querySelector("#market_buyorder_dialog_accept_ssa");
    if (checkbox && !checkbox.checked) {
        checkbox.click();
        console.log("Чекбокс натиснуто автоматично.");
    }
}

// Оновлення всіх рядів кнопок
function updateAllPriceButtons() {
    updatePriceButtons("price-btn-sale-row", "#market_commodity_forsale > span:nth-child(2)", [0.15, 0.25, 0.35, 0.50, 0.60]);
    updatePriceButtons("price-btn-request-row", "#market_commodity_buyrequests > span:nth-child(2)", [0.10, 0.20, 0.30, 0.40, 0.50]);
}

// Додавання обробників подій для кнопок
function addEventListeners() {
    // Кнопки для зміни ціни
    const priceButtons = document.querySelectorAll(".price-btn");
    const priceInput = document.getElementById("market_buy_commodity_input_price");
    priceButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            const price = e.target.getAttribute("data-price");
            if (priceInput) {
                priceInput.value = price;
                console.log(`Ціна встановлена на ${price}`);
            }
        });
    });

    // Кнопки для зміни кількості
    const quantityButtons = document.querySelectorAll(".quantity-btn");
    const quantityInput = document.getElementById("market_buy_commodity_input_quantity");
    quantityButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            const quantity = e.target.getAttribute("data-quantity");
            if (quantityInput) {
                quantityInput.value = quantity;
                console.log(`Кількість встановлена на ${quantity}`);
            }
        });
    });
}

// Оновлення цін на кнопках для конкретного ряду
function updatePriceButtons(className, priceSelector, percentages) {
    const priceText = document.querySelector(priceSelector);
    if (!priceText) {
        console.log(`Не знайдено елемента для ${className}!`);
        return;
    }

    const priceString = priceText.textContent.replace("₴", "").replace(",", ".");
    const price = parseFloat(priceString);
    if (isNaN(price)) {
        console.log("Невірне значення ціни!");
        return;
    }

    const buttons = document.querySelectorAll(`.${className}`);
    buttons.forEach((button, index) => {
        const discount = price * (1 - percentages[index]);
        button.setAttribute("data-price", discount.toFixed(2));
        button.textContent = discount.toFixed(2);
    });

    console.log(`Ціни на кнопках ${className} оновлено.`);
}
