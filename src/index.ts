import WebSocket from 'ws';
import { boundMethod } from 'autobind-decorator';
import { Autonomous } from 'autonomous';
import { readJsonSync } from 'fs-extra';
import { join } from 'path';
import { once } from 'events';
import formatRawTrades from './format-raw-trades';
import RawOrderbookHandler from './raw-orderbook-handler';
import {
    Config,
    RawOrderbookData,
    RawTradesData,
    DataFromPublicAgentToCenter as DFPATC,
} from './interfaces';

const config: Config = readJsonSync(join(__dirname, '../cfg/config.json'));

const ACTIVE_CLOSE = 'public-agent-bitmex-websocket';

class PublicAgentBitmexWebsocket extends Autonomous {
    private bitmex!: WebSocket;
    private publicCenter!: WebSocket;
    private rawOrderbookHandler = new RawOrderbookHandler(config);
    private partialCame = false;

    protected async _start(): Promise<void> {
        await this.connectBitmex();
        await this.connectPublicCenter();
        await this.rawOrderbookHandler.start();
        this.bitmex.on('data', this.onRawData);

        await this.subscribeTrades();
        await this.subscribeOrderbook();
    }

    protected async _stop(): Promise<void> {
        if (this.publicCenter) {
            if (this.publicCenter.readyState < 2)
                this.publicCenter.close(1000, ACTIVE_CLOSE);
            if (this.publicCenter.readyState < 3)
                await once(this.publicCenter, 'close');
        }
        if (this.bitmex) {
            if (this.bitmex.readyState < 2)
                this.bitmex.close(1000, ACTIVE_CLOSE);
            if (this.bitmex.readyState < 3)
                await once(this.bitmex, 'close');
        }
        await this.rawOrderbookHandler.stop();
    }

    private async connectPublicCenter(): Promise<void> {
        this.publicCenter = new WebSocket(
            `${config.PUBLIC_CENTER_BASE_URL}/bitmex/XBTUSD/USD`);

        this.publicCenter.on('error', err => {
            console.error(err);
        });
        this.publicCenter.on('close', (code, reason) => {
            if (reason !== ACTIVE_CLOSE) {
                console.error(`public center closed: ${code}`);
                this.stop();
            }
        });

        await once(this.publicCenter, 'open');
    }

    private async connectBitmex(): Promise<void> {
        this.bitmex = new WebSocket(config.BITMEX_WEBSOCKET_URL);

        this.bitmex.on('message', (message: string) => {
            this.bitmex.emit('data', JSON.parse(message));
        });
        this.bitmex.on('error', err => {
            console.error(err);
        });
        this.bitmex.on('close', (code, reason) => {
            if (reason !== ACTIVE_CLOSE)
                console.error(`bitmex closed: ${code}`);
            this.stop();
        });

        await once(this.bitmex, 'open');
    }

    private async subscribeTrades(): Promise<void> {
        this.bitmex.send(JSON.stringify({
            op: 'subscribe',
            args: ['trade:XBTUSD'],
        }));

        const onTradesSub = (raw: any) => {
            if (raw.subscribe !== 'trade:XBTUSD') return;

            if (raw.success)
                this.bitmex.emit('trades subscribed');
            else this.bitmex.emit('error');
        }
        this.bitmex.on('data', onTradesSub);
        await once(this.bitmex, 'trades subscribed');
        this.bitmex.off('data', onTradesSub);
    }

    private async subscribeOrderbook(): Promise<void> {
        this.bitmex.send(JSON.stringify({
            op: 'subscribe',
            args: ['orderBookL2_25:XBTUSD'],
        }));

        const onOrderbookSub = (raw: any) => {
            if (raw.subscribe != 'orderBookL2_25:XBTUSD') return;

            if (raw.success)
                this.bitmex.emit('orderbook subscribed');
            else this.bitmex.emit('error');
        }
        this.bitmex.on('data', onOrderbookSub);
        await once(this.bitmex, 'orderbook subscribed');
        this.bitmex.off('data', onOrderbookSub);
    }

    private onRawOrderbookData(
        raw: RawOrderbookData,
        rawDataAction: string,
    ): void {
        const orderbook = this.rawOrderbookHandler
            .handle(raw, rawDataAction);
        const data: DFPATC = {
            orderbook,
        };
        this.publicCenter.send(JSON.stringify(data));
    }

    private onRawTradesData(raw: RawTradesData): void {
        const trades = formatRawTrades(raw);
        const data: DFPATC = {
            trades,
        };
        this.publicCenter.send(JSON.stringify(data));
    }

    @boundMethod
    private onRawData(raw: any) {
        if (raw.table === 'orderBookL2_25') {
            if (raw.action === 'partial') this.partialCame = true;
            if (this.partialCame)
                this.onRawOrderbookData(raw.data, raw.action);
        }
        if (raw.table === 'trade') {
            this.onRawTradesData(raw.data);
        }
    }
}

export default PublicAgentBitmexWebsocket;
export { PublicAgentBitmexWebsocket };