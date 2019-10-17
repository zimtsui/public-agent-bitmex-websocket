export * from 'interfaces';
interface Config {
    BITMEX_WEBSOCKET_URL: string;
    PUBLIC_CENTER_BASE_URL: string;
    INSTRUMENT_LIST_URL: string;
    XBTUSD_TICKSIZE: number;
}
interface RawOrderbookDataItem {
    symbol: string;
    id: number;
    side: string;
    size?: number;
    price?: number;
}
declare type RawOrderbookData = RawOrderbookDataItem[];
interface RawTrade {
    timestamp: string;
    symbol: string;
    side: string;
    size: number;
    price: number;
    trdMatchID: string;
}
declare type RawTradesData = RawTrade[];
export { Config, RawOrderbookData, RawOrderbookDataItem, RawTrade, RawTradesData, };
