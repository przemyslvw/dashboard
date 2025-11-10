    // Currency data with flags and NBP API codes
const currencies = [
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
];

// Chart instance
let currencyChart = null;
let currentCurrency = '';
let currentDays = 30;

// Cache for rates to calculate changes
let previousRates = {};

// Fetch exchange rates from NBP API
async function fetchExchangeRates() {
    const currencyGrid = document.getElementById('currency-rates');
    if (!currencyGrid) {
        console.error('Currency grid element not found');
        return;
    }
    
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
        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated) {
            lastUpdated.textContent = new Date().toLocaleString('pl-PL');
        }
        
        // Process and display rates
        let html = '';
        
        // Update currency select options
        const currencySelect = document.getElementById('currency-select');
        if (currencySelect && currencySelect.options.length <= 1) { // Only add once
            currencies.forEach(currency => {
                // Include all currencies including BTC
                const option = document.createElement('option');
                option.value = currency.code;
                option.textContent = `${currency.flag} ${currency.code} - ${currency.name}`;
                currencySelect.appendChild(option);
            });
        }

        // Process each currency for the grid
        currencies.forEach(currency => {
            if (currency.isCrypto) {
                // Handle crypto currencies
                const change = previousRates[currency.code] ? 
                    calculateChange(btcRate, previousRates[currency.code]) : 0;
                
                html += createCurrencyItem({
                    ...currency,
                    rate: btcRate,
                    change: change
                });
                
                // Update previous rate for next time
                previousRates[currency.code] = btcRate;
            } else {
                // Handle fiat currencies
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
        
        if (currencyGrid) {
            currencyGrid.innerHTML = html;
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        if (currencyGrid) {
            currencyGrid.innerHTML = '<div class="error">Wystąpił błąd podczas pobierania kursów walut. Spróbuj ponownie później.</div>';
        }
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
        <div class="currency-item" data-currency="${code}">
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

// Format date for display
function formatDate(date) {
    return new Date(date).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
}

// Fetch historical rates
async function fetchHistoricalRates(currencyCode, days) {
    try {
        console.log(`Fetching historical rates for ${currencyCode} for the last ${days} days`);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log(`Date range: ${startDateStr} to ${endDateStr}`);
        
        let rates = [];
        
        // For BTC, use CoinGecko API
        if (currencyCode === 'BTC') {
            console.log('Fetching BTC data from CoinGecko...');
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=pln&from=${Math.floor(startDate.getTime() / 1000)}&to=${Math.floor(endDate.getTime() / 1000)}`);
            const data = await response.json();
            console.log('CoinGecko API response:', data);
            
            if (!data.prices || !Array.isArray(data.prices)) {
                console.error('Invalid data format from CoinGecko API');
                return [];
            }
            
            rates = data.prices.map(priceData => ({
                date: new Date(priceData[0]).toISOString().split('T')[0],
                value: priceData[1]
            }));
        } else {
            // For other currencies, use NBP API
            console.log(`Fetching ${currencyCode} data from NBP...`);
            const response = await fetch(`https://api.nbp.pl/api/exchangerates/rates/A/${currencyCode}/${startDateStr}/${endDateStr}/?format=json`);
            const data = await response.json();
            console.log('NBP API response:', data);
            
            if (!data.rates || !Array.isArray(data.rates) || data.rates.length === 0) {
                console.error('No rates data received from NBP API');
                return [];
            }
            
            rates = data.rates.map(rate => ({
                date: rate.effectiveDate,
                value: rate.mid
            }));
        }
        
        console.log(`Fetched ${rates.length} rate points for ${currencyCode}`);
        return rates;
    } catch (error) {
        console.error('Error fetching historical rates:', error);
        return [];
    }
}

// Update chart with historical data
async function updateChart(currencyCode, days) {
    console.log(`[Chart] Updating chart for ${currencyCode}, ${days} days`);
    const chartContainer = document.getElementById('chart-view');
    
    // Show loading state
    chartContainer.innerHTML = `
        <div class="chart-loading">
            <i class="fas fa-spinner fa-spin"></i> Ładowanie danych wykresu...
        </div>
        <div class="chart-container" style="width: 100%; height: 100%;">
            <canvas id="currency-chart" style="display: none;"></canvas>
        </div>
    `;
    
    const chartCanvas = document.getElementById('currency-chart');
    if (!chartCanvas) {
        console.error('[Chart] Canvas element not found!');
        return;
    }
    
    const ctx = chartCanvas.getContext('2d');
    const currency = currencies.find(c => c.code === currencyCode);
    
    if (!currency) {
        const errorMsg = `Nie znaleziono waluty: ${currencyCode}`;
        console.error(`[Chart] ${errorMsg}`);
        chartContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i> ${errorMsg}
            </div>
        `;
        return;
    }
    
    try {
        console.log(`[Chart] Fetching rates for ${currencyCode}...`);
        const rates = await fetchHistoricalRates(currencyCode, days);
        console.log(`[Chart] Received ${rates.length} data points`);
        
        if (rates.length === 0) {
            throw new Error('Brak danych historycznych');
        }
        
        // Show chart and hide loading
        const loadingElement = chartContainer.querySelector('.chart-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Make sure canvas is visible and properly sized
        chartCanvas.style.display = 'block';
        chartCanvas.style.width = '100%';
        chartCanvas.style.height = '100%';
        
        // Prepare data
        const labels = rates.map(rate => formatDate(rate.date));
        const data = rates.map(rate => currency.amount ? rate.value / currency.amount : rate.value);
        
        console.log('[Chart] Data prepared:', { 
            labels: labels.slice(0, 5).join(', ') + (labels.length > 5 ? ', ...' : ''), 
            values: data.slice(0, 5).map(v => v.toFixed(4)).join(', ') + (data.length > 5 ? ', ...' : '')
        });
        
        // Destroy existing chart if it exists
        if (currencyChart) {
            console.log('[Chart] Destroying existing chart');
            currencyChart.destroy();
        }
        
        console.log('[Chart] Creating new chart instance');
        currencyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${currency.code} (${currency.name})`,
                    data: data,
                    borderColor: 'rgba(23, 147, 209, 0.8)',
                    backgroundColor: 'rgba(23, 147, 209, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: 'rgba(255, 255, 255, 0.8)',
                    pointBorderColor: 'rgba(23, 147, 209, 1)',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: 'rgba(23, 147, 209, 1)',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                    pointHitRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(20, 26, 36, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#e6e6e6',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y.toFixed(4)} PLN`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            callback: function(value) {
                                return value.toFixed(4);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                elements: {
                    line: {
                        borderWidth: 2
                    },
                    point: {
                        radius: 0,
                        hoverRadius: 6
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        right: 15,
                        bottom: 10,
                        left: 10
                    }
                }
            }
        }
    );
    } catch (error) {
        console.error('[Chart] Error updating chart:', error);
        const chartContainer = document.getElementById('chart-view');
        chartContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i> Wystąpił błąd podczas ładowania wykresu: ${error.message || 'Nieznany błąd'}
            </div>
        `;
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initializing...');
    
    // Initialize elements
    const chartView = document.getElementById('chart-view');
    const currencyGrid = document.getElementById('currency-grid');
    
    if (!chartView || !currencyGrid) {
        console.error('Required elements not found!', { chartView: !!chartView, currencyGrid: !!currencyGrid });
        return;
    }
    
    // Initially hide the chart view
    chartView.style.display = 'none';
    
    // Initial data load with retry logic
    function initializeData(retryCount = 0) {
        const maxRetries = 3;
        
        fetchExchangeRates()
            .then(() => {
                console.log('Rates loaded, setting up chart view...');
                // Give the DOM a moment to update
                setTimeout(() => {
                    setupChartView();
                }, 100);
            })
            .catch(error => {
                console.error('Error initializing currency data:', error);
                if (retryCount < maxRetries) {
                    console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
                    setTimeout(() => initializeData(retryCount + 1), 1000 * (retryCount + 1));
                }
            });
    }
    
    // Start the initialization
    initializeData();
    
    // Set up refresh button
    document.getElementById('refresh-rates').addEventListener('click', () => {
        fetchExchangeRates().catch(console.error);
    });
    
    // Auto-refresh every 5 minutes
    setInterval(() => {
        fetchExchangeRates().catch(console.error);
    }, 5 * 60 * 1000);
    
    function setupChartView() {
        console.log('setupChartView called');
        const currencySelect = document.getElementById('currency-select');
        const chartView = document.getElementById('chart-view');
        
        if (!currencySelect) {
            console.error('Currency select element not found in setupChartView!');
            console.log('Current chart-view content:', chartView?.innerHTML);
            console.log('Document body:', document.body.innerHTML);
            return;
        }
        
        console.log('Currency select found, proceeding with chart setup');
        
        console.log('Available currencies:', Array.from(currencySelect.options).map(o => o.value));
        
        // If no currency is selected yet, select the first available one
        if (currencySelect.options.length > 1) {
            if (!currentCurrency || !Array.from(currencySelect.options).some(o => o.value === currentCurrency)) {
                currentCurrency = currencySelect.options[1].value;
                console.log('Setting initial currency to:', currentCurrency);
            }
            currencySelect.value = currentCurrency;
            
            // Add event listener for currency change
            if (!currencySelect._hasChangeListener) {
                currencySelect.addEventListener('change', (e) => {
                    currentCurrency = e.target.value;
                    console.log('Currency changed to:', currentCurrency);
                    updateChart(currentCurrency, currentDays).catch(console.error);
                });
                currencySelect._hasChangeListener = true;
            }
            
            // Add event listeners for period buttons using event delegation
            const chartView = document.getElementById('chart-view');
            if (chartView) {
                chartView.addEventListener('click', (e) => {
                    const periodBtn = e.target.closest('.period-btn');
                    if (periodBtn) {
                        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                        periodBtn.classList.add('active');
                        currentDays = parseInt(periodBtn.dataset.days);
                        console.log('Period changed to:', currentDays, 'days');
                        updateChart(currentCurrency, currentDays).catch(console.error);
                    }
                });
            }
            
            // Initialize the chart
            console.log('Calling updateChart with:', { currency: currentCurrency, days: currentDays });
            updateChart(currentCurrency, currentDays).catch(error => {
                console.error('Error in initial chart update:', error);
            });
        } else {
            console.warn('No currency options available yet');
            // Try again after a short delay if no options are available yet
            setTimeout(() => {
                if (document.getElementById('currency-select')?.options.length > 1) {
                    setupChartView();
                }
            }, 500);
        }
    }
    
    function showChartView() {
        console.log('showChartView called');
        const chartView = document.getElementById('chart-view');
        const currencyGrid = document.getElementById('currency-grid');
        
        if (!chartView || !currencyGrid) {
            console.error('Required elements not found in showChartView');
            return;
        }
        
        // First hide the grid and show the chart view
        currencyGrid.classList.add('hidden');
        chartView.style.display = 'block'; // Make sure it's visible
        
        // Get the current currency name and flag
        const currency = currencies.find(c => c.code === currentCurrency);
        const currencyName = currency ? currency.name : '';
        const currencyFlag = currency ? currency.flag : '';
        
        // Create the chart HTML structure with back button
        const chartHTML = `
            <div class="chart-header">
                <button id="back-to-grid" class="back-button">
                    <i class="fas fa-arrow-left"></i> Wróć do listy
                </button>
                <h3>${currencyFlag} ${currencyName} (${currentCurrency})</h3>
            </div>
            <div class="chart-container" style="position: relative; height: calc(100% - 50px); width: 100%;">
                <canvas id="currency-chart"></canvas>
            </div>
            <div class="chart-controls">
                <div class="chart-period">
                    <button class="period-btn active" data-days="7">7 dni</button>
                    <button class="period-btn" data-days="14">14 dni</button>
                    <button class="period-btn" data-days="30">30 dni</button>
                </div>
            </div>
        `;
        
        console.log('Setting chart view HTML...');
        chartView.innerHTML = chartHTML;
        
        // Verify the select element was created
        const checkSelect = () => {
            const select = document.getElementById('currency-select');
            if (select) {
                console.log('Currency select found, proceeding with setupChartView');
                console.log('Select element:', select);
                console.log('Options:', Array.from(select.options).map(o => o.value));
                setupChartView();
            } else {
                console.error('Currency select still not found, retrying...');
                console.log('Current chart view content:', chartView.innerHTML);
                setTimeout(checkSelect, 100);
            }
        };
        
        // Set up back button
        document.getElementById('back-to-grid').addEventListener('click', () => {
            chartView.style.display = 'none';
            currencyGrid.classList.remove('hidden');
        });
        
        // Initialize the chart with the current currency
        updateChart(currentCurrency, currentDays).catch(console.error);
    }
    
    function showGridView() {
        document.getElementById('currency-grid').classList.remove('hidden');
        document.getElementById('chart-view').classList.add('hidden');
    }

        // Handle currency item clicks
    document.addEventListener('click', (e) => {
        const currencyItem = e.target.closest('.currency-item');
        if (currencyItem) {
            const currencyCode = currencyItem.dataset.currency;
            if (currencyCode) {
                currentCurrency = currencyCode;
                showChartView();
            }
        }
    });

    // Currency select change
    document.getElementById('currency-select').addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        if (currentCurrency) {
            updateChart(currentCurrency, currentDays);
        }
    });

    // Period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDays = parseInt(btn.dataset.days);
            if (currentCurrency) {
                updateChart(currentCurrency, currentDays);
            }
        });
    });
});