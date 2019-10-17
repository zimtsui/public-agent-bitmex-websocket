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
const ws_1 = __importDefault(require("ws"));
const autobind_decorator_1 = require("autobind-decorator");
const autonomous_1 = __importDefault(require("autonomous"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const events_1 = require("events");
const format_raw_trades_1 = __importDefault(require("./format-raw-trades"));
const raw_orderbook_handler_1 = __importDefault(require("./raw-orderbook-handler"));
const config = fs_extra_1.readJsonSync(path_1.join(__dirname, '../cfg/config.json'));
const ACTIVE_CLOSE = 4000;
class PublicAgentBitmexWebsocket extends autonomous_1.default {
    constructor() {
        super(...arguments);
        this.rawOrderbookHandler = new raw_orderbook_handler_1.default(config);
        this.partialCame = false;
    }
    async _start() {
        await this.connectBitmex();
        await this.connectPublicCenter();
        await this.rawOrderbookHandler.start();
        this.bitmex.on('data', this.onRawData);
        await this.subscribeTrades();
        await this.subscribeOrderbook();
    }
    async _stop() {
        if (this.publicCenter) {
            if (this.publicCenter.readyState < 2)
                this.publicCenter.close(ACTIVE_CLOSE);
            if (this.publicCenter.readyState < 3)
                await events_1.once(this.publicCenter, 'close');
        }
        if (this.bitmex) {
            if (this.bitmex.readyState < 2)
                this.bitmex.close(ACTIVE_CLOSE);
            if (this.bitmex.readyState < 3)
                await events_1.once(this.bitmex, 'close');
        }
        await this.rawOrderbookHandler.stop();
    }
    async connectPublicCenter() {
        this.publicCenter = new ws_1.default(`${config.PUBLIC_CENTER_BASE_URL}/bitmex/XBTUSD/USD`);
        this.publicCenter.on('error', err => {
            console.error(err);
        });
        this.publicCenter.on('close', code => {
            if (code !== ACTIVE_CLOSE) {
                console.error(new Error('public center closed'));
                this.stop();
            }
        });
        await events_1.once(this.publicCenter, 'open');
    }
    async connectBitmex() {
        this.bitmex = new ws_1.default(config.BITMEX_WEBSOCKET_URL);
        this.bitmex.on('message', (message) => {
            this.bitmex.emit('data', JSON.parse(message));
        });
        this.bitmex.on('error', err => {
            console.error(err);
        });
        this.bitmex.on('close', code => {
            if (code !== ACTIVE_CLOSE)
                console.error(new Error('bitmex closed'));
            this.stop();
        });
        await events_1.once(this.bitmex, 'open');
    }
    async subscribeTrades() {
        this.bitmex.send(JSON.stringify({
            op: 'subscribe',
            args: ['trade:XBTUSD'],
        }));
        const onTradesSub = (raw) => {
            if (raw.subscribe !== 'trade:XBTUSD')
                return;
            if (raw.success)
                this.bitmex.emit('trades subscribed');
            else
                this.bitmex.emit('error');
        };
        this.bitmex.on('data', onTradesSub);
        await events_1.once(this.bitmex, 'trades subscribed');
        this.bitmex.off('data', onTradesSub);
    }
    async subscribeOrderbook() {
        this.bitmex.send(JSON.stringify({
            op: 'subscribe',
            args: ['orderBookL2_25:XBTUSD'],
        }));
        const onOrderbookSub = (raw) => {
            if (raw.subscribe != 'orderBookL2_25:XBTUSD')
                return;
            if (raw.success)
                this.bitmex.emit('orderbook subscribed');
            else
                this.bitmex.emit('error');
        };
        this.bitmex.on('data', onOrderbookSub);
        await events_1.once(this.bitmex, 'orderbook subscribed');
        this.bitmex.off('data', onOrderbookSub);
    }
    onRawOrderbookData(raw, rawDataAction) {
        const orderbook = this.rawOrderbookHandler
            .handle(raw, rawDataAction);
        const data = {
            orderbook,
        };
        this.publicCenter.send(JSON.stringify(data));
    }
    onRawTradesData(raw) {
        const trades = format_raw_trades_1.default(raw);
        const data = {
            trades,
        };
        this.publicCenter.send(JSON.stringify(data));
    }
    onRawData(raw) {
        if (raw.table === 'orderBookL2_25') {
            if (raw.action === 'partial')
                this.partialCame = true;
            if (this.partialCame)
                this.onRawOrderbookData(raw.data, raw.action);
        }
        if (raw.table === 'trade') {
            this.onRawTradesData(raw.data);
        }
    }
}
__decorate([
    autobind_decorator_1.boundMethod
], PublicAgentBitmexWebsocket.prototype, "onRawData", null);
exports.PublicAgentBitmexWebsocket = PublicAgentBitmexWebsocket;
exports.default = PublicAgentBitmexWebsocket;
//# sourceMappingURL=index.js.map