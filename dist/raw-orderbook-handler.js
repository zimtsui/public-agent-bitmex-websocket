"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const autonomous_1 = __importDefault(require("autonomous"));
const autobind_decorator_1 = require("autobind-decorator");
const assert_1 = __importDefault(require("assert"));
const interfaces_1 = require("./interfaces");
var RawDataAction;
(function (RawDataAction) {
    RawDataAction["PARTIAL"] = "partial";
    RawDataAction["UPDATE"] = "update";
    RawDataAction["DELETE"] = "delete";
    RawDataAction["INSERT"] = "insert";
})(RawDataAction || (RawDataAction = {}));
class RawOrderbookHandler extends autonomous_1.default {
    constructor(config) {
        super();
        this.config = config;
        this.orders = new Map();
    }
    async _start() {
        const res = await axios_1.default.get(this.config.INSTRUMENT_LIST_URL);
        const list = res.data;
        this.xbtusdIndex = list.findIndex(instrument => instrument.symbol === 'XBTUSD');
        assert_1.default(this.xbtusdIndex !== -1);
    }
    async _stop() {
    }
    calcPriceCent(id) {
        const price = (100000000 * this.xbtusdIndex - id) * this.config.XBTUSD_TICKSIZE;
        return Math.round(price * 100);
    }
    handle(raw, rawDataAction) {
        if (rawDataAction === RawDataAction.PARTIAL)
            this.orders.clear();
        const orders = raw.map(this.formatRawOrder);
        if (rawDataAction === RawDataAction.INSERT)
            for (const order of orders)
                this.orders.set(order.price, order);
        if (rawDataAction === RawDataAction.DELETE)
            for (const order of orders)
                this.orders.delete(order.price);
        if (rawDataAction === RawDataAction.UPDATE)
            for (const order of orders)
                this.orders.set(order.price, order);
        const allOrders = [...this.orders.values()];
        return {
            bids: allOrders
                .filter(order => order.action === interfaces_1.Action.BID)
                .sort((order1, order2) => order2.price - order1.price),
            asks: allOrders
                .filter(order => order.action === interfaces_1.Action.ASK)
                .sort((order1, order2) => order1.price - order2.price),
        };
    }
    formatRawOrder(rawOrder) {
        const priceCent = this.calcPriceCent(rawOrder.id);
        return {
            price: this.calcPriceCent(rawOrder.id),
            amount: rawOrder.size ? rawOrder.size * 100 / priceCent : 0,
            action: rawOrder.side === 'Buy' ? interfaces_1.Action.BID : interfaces_1.Action.ASK,
        };
    }
}
__decorate([
    autobind_decorator_1.boundMethod
], RawOrderbookHandler.prototype, "formatRawOrder", null);
exports.RawOrderbookHandler = RawOrderbookHandler;
exports.default = RawOrderbookHandler;
//# sourceMappingURL=raw-orderbook-handler.js.map