const CurrencyConfig = {
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    defaultChartDays: 30,

    endpoints: {
        coingecko_btc: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=pln',
        coingecko_eth: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=pln',
        coingecko_nvda: 'https://api.coingecko.com/api/v3/simple/price?ids=nvidia&vs_currencies=usd',
        nbp_gold: 'https://api.nbp.pl/api/cenyzlota',
        metals_silver: 'https://api.metals.live/v1/spot/silver',
        nbp_table_a: 'https://api.nbp.pl/api/exchangerates/tables/A/',
        nbp_usd: 'https://api.nbp.pl/api/exchangerates/rates/a/usd/'
    },

    // Base URLs for historical data
    historicalEndpoints: {
        coingecko: 'https://api.coingecko.com/api/v3/coins',
        nbp: 'https://api.nbp.pl/api/exchangerates/rates/A'
    },

    currencies: [
        { code: 'XAU', name: 'Złoto (1g)', flag: '🥇', type: 'metal', provider: 'nbp_gold' },
        { code: 'XAG', name: 'Srebro (1g)', flag: '🥈', type: 'metal', provider: 'metals_silver' },
        { code: 'EUR', name: 'Euro', flag: '🇪🇺', type: 'fiat', provider: 'nbp' },
        { code: 'USD', name: 'Dolar amerykański', flag: '🇺🇸', type: 'fiat', provider: 'nbp' },
        { code: 'COP', name: 'Peso kolumbijskie', flag: '🇨🇴', type: 'fiat', provider: 'nbp' },
        { code: 'GBP', name: 'Funt brytyjski', flag: '🇬🇧', type: 'fiat', provider: 'nbp' },
        { code: 'CHF', name: 'Frank szwajcarski', flag: '🇨🇭', type: 'fiat', provider: 'nbp' },
        { code: 'JPY', name: 'Jen japoński', flag: '🇯🇵', type: 'fiat', provider: 'nbp' },
        { code: 'AUD', name: 'Dolar australijski', flag: '🇦🇺', type: 'fiat', provider: 'nbp' },
        { code: 'CNY', name: 'Juan chiński', flag: '🇨🇳', type: 'fiat', provider: 'nbp' },
        { code: 'NOK', name: 'Korona norweska', flag: '🇳🇴', type: 'fiat', provider: 'nbp' },
        { code: 'SEK', name: 'Korona szwedzka', flag: '🇸🇪', type: 'fiat', provider: 'nbp' },
        { code: 'BTC', name: 'Bitcoin', flag: '₿', type: 'crypto', provider: 'coingecko_btc', apiId: 'bitcoin' },
        { code: 'ETH', name: 'Ethereum', flag: '⟠', type: 'crypto', provider: 'coingecko_eth', apiId: 'ethereum' },
        { code: 'NVDA', name: 'Nvidia Corp', flag: '🎮', type: 'stock', provider: 'coingecko_nvda', apiId: 'nvidia' }
    ],

    constants: {
        silverToGram: 31.1035, // oz to g
        ethBtcRatio: 0.06, // Legacy fallback if fetch fails
        defaultUsdRate: 4.0 // Fallback
    }
};
