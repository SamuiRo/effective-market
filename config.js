export const CONFIG = {
  urlPattern: /^https:\/\/steamcommunity\.com\/market\/listings\/\d+\/.+/,
  selectors: {
    itemName: "#largeiteminfo_item_name",
    container: ".market_commodity_order_block",
    salePrice: "#market_commodity_forsale > span:nth-child(2)",
    requestPrice: "#market_commodity_buyrequests > span:nth-child(2)",
    saleCount: "#market_commodity_forsale > span:nth-child(1)",
    requestCount: "#market_commodity_buyrequests > span:nth-child(1)",
    orderModal: "div.newmodal[data-panel]",
    targetElement: "#market_buyorder_dialog_paymentinfo_frame_container",
    checkbox: "#market_buyorder_dialog_accept_ssa",
    priceInput: "#market_buy_commodity_input_price",
    quantityInput: "#market_buy_commodity_input_quantity",
  },
  pricePercentages: {
    sale: [0.15, 0.25, 0.35, 0.5, 0.6],
    request: [0.1, 0.2, 0.3, 0.4, 0.5],
  },
  quantities: [50, 100, 250, 500, 1000],
  ui: {
    infoCardId: "vapor-info",
    controlPanelId: "vapor-controls",
    panelClassName: "vapor-panel",
    stylesId: "vapor-styles",
  },
  delays: {
    marketPageProcessing: 1000,
    mutationThrottle: 100,
  },
};
