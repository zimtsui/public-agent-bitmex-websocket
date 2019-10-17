"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const interfaces_1 = require("./interfaces");
function formatRawTrades(raw) {
    return raw.map((rawTrade) => ({
        amount: rawTrade.size / rawTrade.price,
        price: Math.round(rawTrade.price * 100),
        action: rawTrade.side === 'Buy' ? interfaces_1.Action.BID : interfaces_1.Action.ASK,
        time: Date.parse(rawTrade.timestamp),
        id: rawTrade.trdMatchID,
    }));
}
exports.formatRawTrades = formatRawTrades;
exports.default = formatRawTrades;
//# sourceMappingURL=format-raw-trades.js.map