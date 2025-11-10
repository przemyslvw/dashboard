    // Currency data with flags and NBP API codes
        const currencies = [
            { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
            { code: 'USD', name: 'Dolar amerykański', flag: '🇺🇸' },
            { code: 'GBP', name: 'Funt brytyjski', flag: '🇬🇧' },
            { code: 'CHF', name: 'Frank szwajcarski', flag: '🇨🇭' },
            { code: 'BTC', name: 'Bitcoin', flag: '₿', isCrypto: true },
            { code: 'JPY', name: 'Jen japoński', flag: '🇯🇵', amount: 100 },
            { code: 'CZK', name: 'Korona czeska', flag: '🇨🇿', amount: 100 },
            { code: 'SEK', name: 'Korona szwedzka', flag: '🇸🇪', amount: 100 },
        ];

        // Cache for rates to calculate changes
        let previousRates = {};
        
        // Fetch exchange rates from NBP API
        async function fetchExchangeRates() {
            const currencyGrid = document.getElementById('currency-rates');
            currencyGrid.innerHTML = '<div class="currency-loading"><i class="fas fa-spinner fa-spin"></i> Ładowanie kursów...</div>';
            
            try {
                // Get BTC rate from CoinGecko
                const btcResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=pln');
                const btcData = await btcResponse.json();
                const btcRate = btcData.bitcoin.pln;
                
                // Get other currencies from NBP
                const response = await fetch('https://api.nbp.pl/api/exchangerates/tables/A/');
                const data = await response.json();
                const rates = data[0].rates;
                
                // Update last update time
                document.getElementById('last-updated').textContent = new Date().toLocaleString('pl-PL');
                
                // Process and display rates
                let html = '';
                
                // Add PLN as base currency
                html += `
                    <div class="currency-item">
                        <div class="currency-flag">🇵🇱</div>
                        <div class="currency-code">PLN</div>
                        <div class="currency-name">Złoty polski</div>
                        <div class="currency-rate">1.0000</div>
                        <div class="currency-change">-</div>
                    </div>
                `;
                
                // Process each currency
                currencies.forEach(currency => {
                    if (currency.isCrypto) {
                        // Handle BTC separately
                        const change = previousRates['BTC'] ? 
                            calculateChange(btcRate, previousRates['BTC']) : 0;
                            
                        html += createCurrencyItem({
                            ...currency,
                            rate: btcRate,
                            change: change
                        });
                        
                        // Update previous rate for next time
                        previousRates['BTC'] = btcRate;
                    } else {
                        const rateData = rates.find(r => r.code === currency.code);
                        if (rateData) {
                            const amount = currency.amount || 1;
                            const rate = rateData.mid / (currency.amount ? rateData.amount : 1);
                            const change = previousRates[currency.code] ? 
                                calculateChange(rate, previousRates[currency.code]) : 0;
                                
                            html += createCurrencyItem({
                                ...currency,
                                rate: rate,
                                change: change,
                                amount: amount
                            });
                            
                            // Update previous rate for next time
                            previousRates[currency.code] = rate;
                        }
                    }
                });
                
                currencyGrid.innerHTML = html;
                
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
                currencyGrid.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i> Błąd podczas pobierania kursów walut.
                        <button id="retry-button" class="retry-btn">Spróbuj ponownie</button>
                    </div>
                `;
                document.getElementById('retry-button').addEventListener('click', fetchExchangeRates);
            }
        }
        
        function createCurrencyItem({ code, name, flag, rate, change, amount = 1 }) {
            const displayRate = (code === 'BTC' ? rate : rate).toFixed(4);
            const displayAmount = amount > 1 ? amount + ' ' : '';
            const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : '';
            const changeSymbol = change > 0 ? '↑' : change < 0 ? '↓' : '';
            const changeText = change !== 0 ? 
                `${changeSymbol} ${Math.abs(change).toFixed(2)}%` : '-';
                
            return `
                <div class="currency-item">
                    <div class="currency-flag">${flag}</div>
                    <div class="currency-code">${code}</div>
                    <div class="currency-name">${name}</div>
                    <div class="currency-rate">${displayAmount}${displayRate} PLN</div>
                    <div class="currency-change ${changeClass}">${changeText}</div>
                </div>
            `;
        }
        
        function calculateChange(currentRate, previousRate) {
            return ((currentRate - previousRate) / previousRate) * 100;
        }
        
        // Initial load
        document.addEventListener('DOMContentLoaded', () => {
            fetchExchangeRates();
            
            // Set up refresh button
            document.getElementById('refresh-rates').addEventListener('click', fetchExchangeRates);
            
            // Auto-refresh every 5 minutes
            setInterval(fetchExchangeRates, 5 * 60 * 1000);
        });