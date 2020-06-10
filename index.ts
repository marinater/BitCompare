const currs = ['USD', 'INR', 'CAD', 'EUR']
const exchangeRates = {} as {[ key: string]: {buy: number, sell: number}}

const getExchangeRates = fetch('https://api.coinbase.com/v2/exchange-rates')
	.then(res => res.json())
	.then(res => {
		const table = document.getElementById('conversion-rates')
        const rates = res.data.rates as {[key: string]: string}

        for (const curr of currs) {
            const tr = document.createElement('tr')
            table.appendChild(tr)

            const td1 = document.createElement('td')
            td1.innerText = curr
            const td2 = document.createElement('td')
            td2.innerText = rates[curr] + ' USD'
            td2.style.textAlign = 'right'

            tr.appendChild(td1)
            tr.appendChild(td2)
        }

        return rates
	})

const fetchPrice = async (a: string, b: string, method: 'buy' | 'sell') => {
	const res = await fetch(`https://api.coinbase.com/v2/prices/${a}-${b}/${method}`)
	if (!res.ok) return null

	const price = (await res.json() as PayloadType).data

	return await toUSD(price)
}

const toUSD = async(price: PayloadType['data']) => {
	const exchangeRates = await getExchangeRates
	const exchangeRate = parseFloat(exchangeRates[price.currency])

	return price.amount / exchangeRate
}

function getColor(arb){
	const perc = (Math.max(0, arb - 1) / 0.15) * 100

	var r, g, b = 0;
	if(perc < 50) {
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
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
	// pad each with zeros and return
	// @ts-ignore
    return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}

const generateMatrix = async () => {
	for (const buyCurr of currs) {
		for (const sellCurr of currs) {
			const cell = document.getElementById(`rate:${buyCurr}-${sellCurr}`)
			
			const arb = exchangeRates[buyCurr].buy / exchangeRates[sellCurr].sell
			const arbPercent = ((arb - 1) * 100)

			cell.innerText = arbPercent.toFixed(2) + '%'
			cell.style.backgroundColor = getColor(arb)
			// cell.style.fontWeight = 'bold'
			cell.style.color = 'black'
		}
	}
}

const populateTable = () => {
	const table = document.getElementById('matrix')

	for (let i = 0; i < currs.length + 1; i++) {
		const tr = document.createElement('tr')
		table.appendChild(tr)
		
		for (let j = 0; j < currs.length + 1; j++) {
			const cell = document.createElement('td')
			tr.appendChild(cell)

			if (i === 0 && j > 0)
				cell.innerText = currs[j - 1]
			else if (j === 0 && i > 0)
				cell.innerText = currs[i - 1]
			else if (i > 0 && j > 0)
				cell.id = `rate:${currs[i - 1]}-${currs[j-1]}`
			else
				cell.innerText = '👇 buy 👉 sell'
		}
	}
}

const populateExchangeRates = async () => {
	const table = document.getElementById('exchange-rates')

	for (let i = 0; i < currs.length; i++) {
		const buy = await fetchPrice('BTC', currs[i], 'buy')
		const sell = await fetchPrice('BTC', currs[i], 'sell')
        
		exchangeRates[currs[i]] = {buy, sell}

		const tr = document.createElement('tr')
		table.appendChild(tr)


		for (const val of [currs[i], buy.toFixed(3), sell.toFixed(3)]) {
			const cell = document.createElement('td')
			tr.appendChild(cell)
			cell.appendChild(document.createTextNode(val))
		}

	}
}

populateTable()
populateExchangeRates().then(generateMatrix)

interface PayloadType {
	"data": {
		"amount": number,
		"currency": string
	}
}
