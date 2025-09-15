(async function() {
  try {

    const { Vapor } = await import(chrome.runtime.getURL('vapor.js'));

    const vapor = new Vapor();

    const initVapor = () => vapor.init();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initVapor);
    } else {
      initVapor();
    }

    window.Vapor = vapor;
  } catch (error) {
    console.error('Помилка завантаження Vapor модулів:', error);
  }
})();