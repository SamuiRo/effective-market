document.getElementById("fetch-data").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: fetchMarketData
    });
});

function fetchMarketData() {
    const itemName = document.querySelector(".market_listing_item_name")?.textContent;
    const itemPrice = document.querySelector(".market_listing_price_with_fee")?.textContent;
    if (itemName && itemPrice) {
        alert(`Назва: ${itemName}, Ціна: ${itemPrice}`);
    } else {
        alert("Інформація недоступна.");
    }
}
