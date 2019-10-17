import {
    RawTradesData,
    RawTrade,
    Trade,
    Action,
} from './interfaces';

function formatRawTrades(raw: RawTradesData): Trade[] {
    return raw.map((rawTrade: RawTrade): Trade => ({
        amount: rawTrade.size / rawTrade.price,
        price: Math.round(rawTrade.price * 100),
        action: rawTrade.side === 'Buy' ? Action.BID : Action.ASK,
        time: Date.parse(rawTrade.timestamp),
        id: rawTrade.trdMatchID,
    }));
}

export default formatRawTrades;
export { formatRawTrades };