import Autonomous from 'autonomous';
declare class PublicAgentBitmexWebsocket extends Autonomous {
    private bitmex;
    private publicCenter;
    private rawOrderbookHandler;
    private partialCame;
    protected _start(): Promise<void>;
    protected _stop(): Promise<void>;
    private connectPublicCenter;
    private connectBitmex;
    private subscribeTrades;
    private subscribeOrderbook;
    private onRawOrderbookData;
    private onRawTradesData;
    private onRawData;
}
export default PublicAgentBitmexWebsocket;
export { PublicAgentBitmexWebsocket };
