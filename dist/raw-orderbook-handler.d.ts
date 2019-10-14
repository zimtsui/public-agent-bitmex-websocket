import Autonomous from 'autonomous';
import { Config, RawOrderbookData, Orderbook } from './interfaces';
declare class RawOrderbookHandler extends Autonomous {
    private config;
    private xbtusdIndex;
    private orders;
    constructor(config: Config);
    protected _start(): Promise<void>;
    protected _stop(): Promise<void>;
    private calcPriceCent;
    handle(raw: RawOrderbookData, rawDataAction: string): Orderbook;
    private formatRawOrder;
}
export default RawOrderbookHandler;
export { RawOrderbookHandler };
