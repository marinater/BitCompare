var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const getExchangeRates = fetch('https://api.exchangeratesapi.io/latest?base=USD')
    .then(res => res.json())
    .then(res => {
    const text = document.getElementById('conversion-rate');
    const rates = res.rates;
    text.innerText = `$1.00 = ${rates['INR'].toFixed(3)} INR`;
    return rates;
});
const fetchPrice = (a, b, method) => __awaiter(this, void 0, void 0, function* () {
    const res = yield fetch(`https://api.coinbase.com/v2/prices/${a}-${b}/${method}`);
    if (!res.ok)
        return null;
    const price = (yield res.json()).data;
    return yield toUSD(price);
});
const toUSD = (price) => __awaiter(this, void 0, void 0, function* () {
    const exchangeRates = yield getExchangeRates;
    const exchangeRate = exchangeRates[price.currency];
    return price.amount / exchangeRate;
});
function getColor(arb) {
    const perc = (Math.max(0, arb - 1) / 0.15) * 100;
    var r, g, b = 0;
    if (perc < 50) {
        r = 255;
        g = Math.round(5.1 * perc);
    }
    else {
        g = 255;
        r = Math.round(510 - 5.10 * perc);
    }
    var h = r * 0x10000 + g * 0x100 + b * 0x1;
    return '#' + ('000000' + h.toString(16)).slice(-6);
}
const currs = ['USD', 'INR', 'AUD'];
const exchangeRates = {};
function invertColor(hex) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16), g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16), b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    // pad each with zeros and return
    // @ts-ignore
    return '#' + padZero(r) + padZero(g) + padZero(b);
}
function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}
const generateMatrix = () => __awaiter(this, void 0, void 0, function* () {
    for (const buyCurr of currs) {
        for (const sellCurr of currs) {
            const cell = document.getElementById(`rate:${buyCurr}-${sellCurr}`);
            const arb = exchangeRates[buyCurr].buy / exchangeRates[sellCurr].sell;
            const arbPercent = ((arb - 1) * 100);
            cell.innerText = arbPercent.toFixed(2) + '%';
            cell.style.backgroundColor = getColor(arb);
            // cell.style.fontWeight = 'bold'
            cell.style.color = 'black';
        }
    }
});
const populateTable = () => {
    const table = document.getElementById('matrix');
    for (let i = 0; i < currs.length + 1; i++) {
        const tr = document.createElement('tr');
        table.appendChild(tr);
        for (let j = 0; j < currs.length + 1; j++) {
            const cell = document.createElement('td');
            tr.appendChild(cell);
            if (i === 0 && j > 0)
                cell.innerText = currs[j - 1];
            else if (j === 0 && i > 0)
                cell.innerText = currs[i - 1];
            else if (i > 0 && j > 0)
                cell.id = `rate:${currs[i - 1]}-${currs[j - 1]}`;
            else
                cell.innerText = '👇 buy 👉 sell';
        }
    }
};
const populateExchangeRates = () => __awaiter(this, void 0, void 0, function* () {
    const table = document.getElementById('exchange-rates');
    for (let i = 0; i < currs.length; i++) {
        const buy = yield fetchPrice('BTC', currs[i], 'buy');
        const sell = yield fetchPrice('BTC', currs[i], 'sell');
        exchangeRates[currs[i]] = { buy, sell };
        const tr = document.createElement('tr');
        table.appendChild(tr);
        for (const val of [currs[i], buy.toFixed(3), sell.toFixed(3)]) {
            const cell = document.createElement('td');
            tr.appendChild(cell);
            cell.appendChild(document.createTextNode(val));
        }
    }
});
populateTable();
populateExchangeRates().then(generateMatrix);
