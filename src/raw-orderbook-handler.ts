import axios from 'axios';
import Autonomous from 'autonomous';
import { boundMethod } from 'autobind-decorator';
import assert from 'assert';
import {
    Config,
    RawOrderbookData,
    RawOrderbookDataItem,
    Order,
    Orderbook,
    Action,
} from './interfaces';

enum RawDataAction {
    PARTIAL = 'partial',
    UPDATE = 'update',
    DELETE = 'delete',
    INSERT = 'insert',
}

class RawOrderbookHandler extends Autonomous {
    private xbtusdIndex!: number;
    private orders = new Map<number, Order>();

    constructor(private config: Config) {
        super();
    }

    protected async _start(): Promise<void> {
        const res = await axios.get(this.config.INSTRUMENT_LIST_URL);
        const list = <any[]>res.data;
        this.xbtusdIndex = list.findIndex(instrument =>
            instrument.symbol === 'XBTUSD');
        assert(this.xbtusdIndex !== -1);
    }

    protected async _stop(): Promise<void> {

    }

    private calcPriceCent(id: number) {
        const price = (100000000 * this.xbtusdIndex - id) * this.config.XBTUSD_TICKSIZE;
        return Math.round(price * 100);
    }

    public handle(
        raw: RawOrderbookData,
        rawDataAction: string,
    ): Orderbook {
        if (rawDataAction === RawDataAction.PARTIAL) this.orders.clear();

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
                .filter(order => order.action === Action.BID)
                .sort((order1, order2) => order2.price - order1.price),
            asks: allOrders
                .filter(order => order.action === Action.ASK)
                .sort((order1, order2) => order1.price - order2.price),
        }
    }

    @boundMethod
    private formatRawOrder(rawOrder: RawOrderbookDataItem): Order {
        const priceCent = this.calcPriceCent(rawOrder.id);
        return {
            price: this.calcPriceCent(rawOrder.id),
            amount: rawOrder.size ? rawOrder.size * 100 / priceCent : 0,
            action: rawOrder.side === 'Buy' ? Action.BID : Action.ASK,
        }
    }
}

export default RawOrderbookHandler;
export { RawOrderbookHandler };