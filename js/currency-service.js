class CurrencyService {
    constructor() {
        this.config = CurrencyConfig;
    }

    getCurrencies() {
        return this.config.currencies;
    }

    async fetchAllRates() {
        // Fetch all endpoints defined in config
        const fetchPromises = Object.entries(this.config.endpoints).map(async ([key, url]) => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.warn(`[CurrencyService] Failed to fetch ${key}: ${response.status} ${response.statusText}`);
                    return [key, null];
                }
                return [key, await response.json()];
            } catch (e) {
                console.warn(`[CurrencyService] Network error fetching ${key}:`, e);
                return [key, null];
            }
        });

        const resultsArr = await Promise.all(fetchPromises);
        const results = Object.fromEntries(resultsArr);

        // Get helper rates (USD is needed for conversions)
        const usdRate = this._parseNbpRate(results['nbp_usd']) || this.config.constants.defaultUsdRate;

        const processedRates = {};

        this.config.currencies.forEach(currency => {
            let rate = 0;

            try {
                if (currency.provider === 'nbp') {
                    // Check Table A first, then Table B
                    rate = this._parseNBPTable(results['nbp_table_a'], currency.code);
                    if (!rate) {
                        rate = this._parseNBPTable(results['nbp_table_b'], currency.code);
                    }
                } else if (currency.provider.startsWith('coingecko')) {
                    // Determine target currency (USD for stocks/silver, PLN for crypto usually)
                    // Silver (XAG) is fetched in USD (via kinesis-silver)
                    // Stocks (NVDA) are fetched in USD
                    // BTC/ETH are fetched in PLN (as per config endpoint vs_currencies=pln)

                    let targetCurrency = 'pln';
                    if (currency.type === 'stock' || currency.code === 'XAG') {
                        targetCurrency = 'usd';
                    }

                    // Special case for Silver: verify endpoint config vs logical need
                    // config endpoint for silver has vs_currencies=usd

                    let rawRate = this._parseCoinGecko(results[currency.provider], currency.apiId, targetCurrency);

                    if (currency.code === 'XAG') {
                        // Silver comes in USD/oz. Convert to PLN/g.
                        // 1 oz = 31.1035 g
                        // Rate = (Price USD/oz * USD/PLN) / 31.1035
                        if (rawRate) {
                            rate = (rawRate * usdRate) / this.config.constants.silverToGram;
                        }
                    } else if (currency.type === 'stock') {
                        // Convert USD stock price to PLN
                        rate = rawRate * usdRate;
                    } else {
                        // Crypto is already in PLN if configured so
                        rate = rawRate;
                    }

                } else if (currency.provider === 'nbp_gold') {
                    rate = this._parseNBPGold(results['nbp_gold']);
                }

                // Fallback for ETH if direct fetch failed (Legacy support)
                if (currency.code === 'ETH' && !rate) {
                    const btcRate = processedRates['BTC'] || 0;
                    rate = btcRate * this.config.constants.ethBtcRatio;
                }
            } catch (e) {
                console.warn(`Error processing rate for ${currency.code}`, e);
            }

            processedRates[currency.code] = rate;
        });

        return {
            rates: processedRates,
            timestamp: Date.now()
        };
    }

    calculateRate(currency, fetchedData) {
        return fetchedData.rates[currency.code] || 0;
    }

    // --- Parsing Strategies ---

    _parseNBPTable(data, code) {
        if (!data || !data[0] || !data[0].rates) return 0;
        const rate = data[0].rates.find(r => r.code === code);
        return rate ? rate.mid : 0;
    }

    _parseNbpRate(data) {
        return data?.rates?.[0]?.mid || 0;
    }

    _parseNBPGold(data) {
        return data && data[0] ? data[0].cena : 0;
    }

    _parseCoinGecko(data, id, vsCurrency) {
        if (!data || !data[id]) return 0;
        return data[id][vsCurrency] || 0;
    }

    // --- Historical Data ---

    async getHistoricalRates(currencyCode, days) {
        const currency = this.config.currencies.find(c => c.code === currencyCode);
        if (!currency) return [];

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        try {
            if (currency.type === 'crypto' || currency.type === 'stock') {
                return await this._fetchCoinGeckoHistory(currency, startDate, endDate);
            } else if (currency.code === 'XAG') {
                 // For Silver proxy (Kinesis), use CoinGecko history
                 return await this._fetchCoinGeckoHistory(currency, startDate, endDate);
            } else if (currency.code === 'XAU') {
                return await this._fetchNBPGoldHistory(startDateStr, endDateStr);
            } else if (currency.provider === 'nbp') {
                // Determine if Table A or B
                // Note: History for Table B might be tricky via standard NBP endpoint structure if not A.
                // Standard NBP history endpoint: /api/exchangerates/rates/{table}/{code}/{startDate}/{endDate}/
                // We default to A in config.historicalEndpoints.nbp.
                // We need to check which table the currency belongs to or try both.

                // Try Table A first
                try {
                    return await this._fetchNBPHistory(currency.code, 'A', startDateStr, endDateStr);
                } catch (e) {
                    // Try Table B
                     return await this._fetchNBPHistory(currency.code, 'B', startDateStr, endDateStr);
                }
            }
        } catch (error) {
            console.error(`Error fetching historical rates for ${currencyCode}:`, error);
            return [];
        }
        return [];
    }

    async _fetchCoinGeckoHistory(currency, startDate, endDate) {
        let vsCurrency = 'pln';
        if (currency.type === 'stock' || currency.code === 'XAG') {
            vsCurrency = 'usd';
        }

        const from = Math.floor(startDate.getTime() / 1000);
        const to = Math.floor(endDate.getTime() / 1000);

        const url = `${this.config.historicalEndpoints.coingecko}/${currency.apiId}/market_chart/range?vs_currency=${vsCurrency}&from=${from}&to=${to}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('CoinGecko API error');

        const data = await response.json();
        if (data.prices && Array.isArray(data.prices)) {
            // Filter to one point per day
            const dailyMap = new Map();
            data.prices.forEach(([timestamp, price]) => {
                const date = new Date(timestamp).toISOString().split('T')[0];
                if (!dailyMap.has(date)) {
                    dailyMap.set(date, price);
                }
            });

            return Array.from(dailyMap.entries()).map(([date, value]) => ({ date, value }));
        }
        return [];
    }

    async _fetchNBPHistory(code, table, startDateStr, endDateStr) {
        // config.historicalEndpoints.nbp is 'https://api.nbp.pl/api/exchangerates/rates'
        // We append /{table}/{code}/{startDate}/{endDate}/?format=json
        const url = `${this.config.historicalEndpoints.nbp}/${table}/${code}/${startDateStr}/${endDateStr}/?format=json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`NBP API error for table ${table}`);

        const data = await response.json();
        if (data.rates && Array.isArray(data.rates)) {
            return data.rates.map(rate => ({
                date: rate.effectiveDate,
                value: rate.mid
            }));
        }
        return [];
    }

    async _fetchNBPGoldHistory(startDateStr, endDateStr) {
        const url = `https://api.nbp.pl/api/cenyzlota/${startDateStr}/${endDateStr}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('NBP Gold API error');

        const data = await response.json();
        if (Array.isArray(data)) {
            return data.map(item => ({
                date: item.data,
                value: item.cena
            }));
        }
        return [];
    }
}

// Global instance
const currencyService = new CurrencyService();
