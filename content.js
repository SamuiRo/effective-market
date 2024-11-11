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
        <div id="price-buttons">
            <p>Виберіть ціну:</p>
            ${createPriceButtons([1, 2, 3, 4, 5])}
        </div>
        <div id="quantity-buttons" style="margin-top: 10px;">
            <p>Виберіть кількість:</p>
            ${createQuantityButtons([50, 100, 250, 500, 1000])}
        </div>
    `;
    targetElement.parentNode.insertBefore(newDiv, targetElement);
    console.log("Новий елемент вставлено.");
}

// Створення кнопок для вибору ціни
function createPriceButtons(values) {
    return values.map(value => `<button class="price-btn" data-price="${value}">${value}</button>`).join('');
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

// Оновлення цін на кнопках на основі поточної ціни
function updatePriceButtons() {
    const priceText = document.querySelector("#market_commodity_forsale > span:nth-child(2)");
    if (!priceText) {
        console.log("Не знайдено елемента з ціною!");
        return;
    }

    const priceString = priceText.textContent.replace("₴", "").replace(",", ".");
    const price = parseFloat(priceString);
    if (isNaN(price)) {
        console.log("Невірне значення ціни!");
        return;
    }

    const priceButtons = document.querySelectorAll(".price-btn");
    const pricePercentages = [0.15, 0.25, 0.35, 0.50, 0.60];
    priceButtons.forEach((button, index) => {
        const discount = price * (1 - pricePercentages[index]);
        button.setAttribute("data-price", discount.toFixed(2));
        button.textContent = discount.toFixed(2);
    });

    console.log("Ціни на кнопках оновлено.");
}
