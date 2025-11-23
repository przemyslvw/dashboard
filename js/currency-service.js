class CurrencyService {
    constructor() {
        this.currencies = [
            { code: 'XAU', name: 'Złoto (1g)', flag: '🥇', isMetal: true },
            { code: 'XAG', name: 'Srebro (1g)', flag: '🥈', isMetal: true },
            { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
            { code: 'USD', name: 'Dolar amerykański', flag: '🇺🇸' },
            { code: 'COP', name: 'Peso kolumbijskie', flag: '🇨🇴' },
            { code: 'GBP', name: 'Funt brytyjski', flag: '🇬🇧' },
            { code: 'CHF', name: 'Frank szwajcarski', flag: '🇨🇭' },
            { code: 'JPY', name: 'Jen japoński', flag: '🇯🇵'},
            { code: 'AUD', name: 'Dolar australijski', flag: '🇦🇺' },
            { code: 'CNY', name: 'Juan chiński', flag: '🇨🇳' },
            { code: 'NOK', name: 'Korona norweska', flag: '🇳🇴' },
            { code: 'SEK', name: 'Korona szwedzka', flag: '🇸🇪' },
            { code: 'BTC', name: 'Bitcoin', flag: '₿', isCrypto: true },
            { code: 'ETH', name: 'Ethereum', flag: '⟠', isCrypto: true },
            { code: 'NVDA', name: 'Nvidia Corp', flag: '🎮', isStock: true }
        ];
    }

    getCurrencies() {
        return this.currencies;
    }

    async fetchAllRates() {
        // Define endpoints
        const endpoints = {
            btc: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=pln',
            nvda: 'https://api.coingecko.com/api/v3/simple/price?ids=nvidia&vs_currencies=usd',
            gold: 'https://api.nbp.pl/api/cenyzlota',
            silver: 'https://api.metals.live/v1/spot/silver',
            nbp: 'https://api.nbp.pl/api/exchangerates/tables/A/',
            usd: 'https://api.nbp.pl/api/exchangerates/rates/a/usd/'
        };

        // Fetch all concurrently with error handling for each
        const promises = Object.entries(endpoints).map(async ([key, url]) => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.warn(`[CurrencyService] Failed to fetch ${key}: ${response.status} ${response.statusText}`);
                    return null;
                }
                return { key, data: await response.json() };
            } catch (e) {
                console.warn(`[CurrencyService] Network error fetching ${key}:`, e);
                return null;
            }
        });

        const resultsArr = await Promise.all(promises);

        // Convert array of results to a map
        const dataMap = resultsArr.reduce((acc, item) => {
            if (item) acc[item.key] = item.data;
            return acc;
        }, {});

        // Check if we have at least some data to work with
        if (Object.keys(dataMap).length === 0) {
            throw new Error('Failed to fetch any currency data');
        }

        const results = {};

        // Defaults and Helper Values
        const usdToPln = dataMap.usd?.rates?.[0]?.mid || 4.0;
        const nbpRates = dataMap.nbp?.[0]?.rates || [];

        // Process Specific Assets

        // BTC & ETH
        results['BTC'] = dataMap.btc?.bitcoin?.pln || 0;
        results['ETH'] = (results['BTC'] || 0) * 0.06;

        // NVDA
        results['NVDA'] = dataMap.nvda?.nvidia?.usd || 0;

        // Gold (1g PLN)
        results['XAU'] = dataMap.gold?.[0]?.cena || 0;

        // Silver (USD/oz -> PLN/g)
        const silverPriceUsdOz = dataMap.silver?.price || 0;
        results['XAG'] = (silverPriceUsdOz * usdToPln / 31.1035);

        // Process NBP currencies
        nbpRates.forEach(rateData => {
            results[rateData.code] = rateData.mid;
        });

        return {
            rates: results,
            rawNbpRates: nbpRates,
            timestamp: Date.now()
        };
    }

    calculateRate(currency, fetchedData) {
        const { rates, rawNbpRates } = fetchedData;

        if (currency.isCrypto) {
            return rates[currency.code] || 0;
        }

        if (currency.isMetal) {
            return rates[currency.code] || 0;
        }

        if (currency.isStock) {
            return rates[currency.code] || 0;
        }

        // Fiat
        // First try the processed rates map
        if (rates[currency.code]) {
            return rates[currency.code];
        }

        // Fallback to raw search if needed (redundant if logic above is correct)
        const rateData = rawNbpRates.find(r => r.code === currency.code);
        if (rateData) {
            return rateData.mid;
        }

        return 0;
    }

    async getHistoricalRates(currencyCode, days) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            let rates = [];

            if (currencyCode === 'NVDA') {
                const response = await fetch(`https://api.coingecko.com/api/v3/coins/nvidia/market_chart/range?vs_currency=usd&from=${Math.floor(startDate.getTime() / 1000)}&to=${Math.floor(endDate.getTime() / 1000)}`);
                if (!response.ok) throw new Error('CoinGecko NVDA error');
                const data = await response.json();

                if (data.prices && Array.isArray(data.prices)) {
                    const dailyPrices = {};
                    data.prices.forEach(priceData => {
                        const date = new Date(priceData[0]).toISOString().split('T')[0];
                        if (!dailyPrices[date]) {
                            dailyPrices[date] = priceData[1];
                        }
                    });

                    rates = Object.entries(dailyPrices).map(([date, value]) => ({
                        date: date,
                        value: value
                    }));
                }
            } else if (currencyCode === 'BTC') {
                const response = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=pln&from=${Math.floor(startDate.getTime() / 1000)}&to=${Math.floor(endDate.getTime() / 1000)}`);
                if (!response.ok) throw new Error('CoinGecko BTC error');
                const data = await response.json();

                if (data.prices && Array.isArray(data.prices)) {
                    rates = data.prices.map(priceData => ({
                        date: new Date(priceData[0]).toISOString().split('T')[0],
                        value: priceData[1]
                    }));
                }
            } else {
                // NBP
                const response = await fetch(`https://api.nbp.pl/api/exchangerates/rates/A/${currencyCode}/${startDateStr}/${endDateStr}/?format=json`);
                if (!response.ok) throw new Error('NBP API error');
                const data = await response.json();

                if (data.rates && Array.isArray(data.rates)) {
                    rates = data.rates.map(rate => ({
                        date: rate.effectiveDate,
                        value: rate.mid
                    }));
                }
            }

            return rates;
        } catch (error) {
            console.error('Error fetching historical rates:', error);
            return [];
        }
    }
}

// Create a global instance
const currencyService = new CurrencyService();
