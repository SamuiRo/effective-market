// content.js - Головний файл розширення

// Динамічне завантаження модулів
(async function() {
  try {
    // Імпортуємо основний клас
    const { Vapor } = await import(chrome.runtime.getURL('vapor.js'));
    
    // Ініціалізація розширення
    const vapor = new Vapor();

    // Запуск після завантаження сторінки
    const initVapor = () => vapor.init();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initVapor);
    } else {
      initVapor();
    }

    // Експорт для можливого використання в інших частинах розширення
    window.Vapor = vapor;
    
  } catch (error) {
    console.error('Помилка завантаження Vapor модулів:', error);
  }
})();