// Chart instance
let currencyChart = null;
let currentCurrency = '';
let currentDays = 30;

// Cache for rates to calculate changes
let previousRates = {};
let currentRates = {};

// Initialize rates from localStorage if available
function initializeRates() {
    const savedRates = localStorage.getItem('previousRates');
    if (savedRates) {
        try {
            previousRates = JSON.parse(savedRates);
            // Check if rates are older than 1 hour
            const rateTimestamp = localStorage.getItem('ratesTimestamp');
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            
            if (rateTimestamp && rateTimestamp < oneHourAgo) {
                // Keep the rates but clear the changes
                previousRates = Object.fromEntries(
                    Object.entries(previousRates).map(([key, value]) => [key, value.rate])
                );
            }
        } catch (e) {
            console.error('Error parsing saved rates:', e);
            previousRates = {};
        }
    }
}

// Save current rates for next time
function saveCurrentRates() {
    localStorage.setItem('previousRates', JSON.stringify(currentRates));
    localStorage.setItem('ratesTimestamp', Date.now());
}

// Initial rates initialization
initializeRates();

// Fetch exchange rates using CurrencyService
async function fetchExchangeRates() {
    const currencyGrid = document.getElementById('currency-rates');
    if (!currencyGrid) {
        console.error('Currency grid element not found');
        return;
    }
    
    currencyGrid.innerHTML = '<div class="currency-loading"><i class="fas fa-spinner fa-spin"></i> Ładowanie kursów...</div>';
    
    try {
        const data = await currencyService.fetchAllRates();
        
        // Update last update time
        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated) {
            lastUpdated.textContent = new Date().toLocaleString('pl-PL');
        }
        
        // Update currency select options
        const currencySelect = document.getElementById('currency-select');
        if (currencySelect && currencySelect.options.length <= 1) {
            currencyService.getCurrencies().forEach(currency => {
                const option = document.createElement('option');
                option.value = currency.code;
                option.textContent = `${currency.flag} ${currency.code} - ${currency.name}`;
                currencySelect.appendChild(option);
            });
        }

        // Reset current rates
        currentRates = {};
        let html = '';
        
        // Process each currency for the grid
        currencyService.getCurrencies().forEach(currency => {
            const rate = currencyService.calculateRate(currency, data);

            // Calculate change based on previous rate
            let change = 0;
            if (previousRates[currency.code]) {
                change = calculateChange(rate, previousRates[currency.code]);
            }

            // Store current rate for next time
            currentRates[currency.code] = rate;

            html += createCurrencyItem({
                ...currency,
                rate: rate,
                change: change,
                symbol: (currency.isStock) ? '$' : (currency.isMetal ? 'zł' : undefined)
            });
        });
        
        if (currencyGrid) {
            currencyGrid.innerHTML = html;
            saveCurrentRates();
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        if (currencyGrid) {
            currencyGrid.innerHTML = '<div class="error">Wystąpił błąd podczas pobierania kursów walut. Spróbuj ponownie później.</div>';
        }
    }
}
        
function createCurrencyItem({ code, name, flag, rate, change = 0, amount = 1, symbol = '', isStock = false }) {
    const displayRate = rate ? rate.toFixed(2) : '0.00';
    const displayAmount = amount > 1 ? amount + ' ' : '';
    const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : '';
    const changeSymbol = change > 0 ? '↑' : change < 0 ? '↓' : '';
    const changeText = change !== 0 ? 
        `${changeSymbol} ${Math.abs(change).toFixed(2)}%` : 
        `${changeSymbol} 0.00%`;
    
    const currencySymbol = isStock ? '$' : (symbol || 'PLN');
    const displayValue = isStock ? 
        `${currencySymbol}${displayRate}` : 
        `${displayAmount}${displayRate} ${currencySymbol}`;
        
    return `
        <div class="currency-item" data-currency="${code}">
            <div class="currency-flag">${flag}</div>
            <div class="currency-code">${code}</div>
            <div class="currency-name">${name}</div>
            <div class="currency-rate">${displayValue}</div>
            <div class="currency-change ${changeClass}">${changeText}</div>
        </div>
    `;
}

function calculateChange(currentRate, previousRate) {
    if (!previousRate) return 0;
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

// Update chart with historical data
async function updateChart(currencyCode, days) {
    console.log(`[Chart] Updating chart for ${currencyCode}, ${days} days`);
    
    const chartCanvas = document.getElementById('currency-chart');
    if (!chartCanvas) {
        console.error('[Chart] Canvas element not found!');
        return;
    }
    
    const ctx = chartCanvas.getContext('2d');
    const currency = currencyService.getCurrencies().find(c => c.code === currencyCode);
    
    if (!currency) {
        console.error(`[Chart] Currency not found: ${currencyCode}`);
        return;
    }
    
    try {
        // We assume the container handles the loading spinner if needed.
        // Since we are potentially redrawing the chart, we don't want to flicker too much.
        
        const rates = await currencyService.getHistoricalRates(currencyCode, days);
        
        if (rates.length === 0) {
            console.warn('No historical data');
            return;
        }
        
        const labels = rates.map(rate => formatDate(rate.date));
        const data = rates.map(rate => currency.amount ? rate.value / currency.amount : rate.value);
        
        if (currencyChart) {
            currencyChart.destroy();
        }
        
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
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(20, 26, 36, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#e6e6e6',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y.toFixed(4)} ${currency.isStock ? 'USD' : 'PLN'}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.6)', maxRotation: 45, minRotation: 45 }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.6)' }
                    }
                },
                interaction: { intersect: false, mode: 'index' },
                animation: { duration: 1000, easing: 'easeInOutQuart' },
                layout: { padding: { top: 10, right: 15, bottom: 10, left: 10 } }
            }
        });
    } catch (error) {
        console.error('[Chart] Error updating chart:', error);
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    const chartView = document.getElementById('chart-view');
    const currencyGrid = document.getElementById('currency-grid');
    
    if (!chartView || !currencyGrid) return;
    
    chartView.style.display = 'none';
    
    function initializeData(retryCount = 0) {
        const maxRetries = 3;
        fetchExchangeRates()
            .then(() => {
                setTimeout(() => setupChartView(), 100);
            })
            .catch(error => {
                if (retryCount < maxRetries) {
                    setTimeout(() => initializeData(retryCount + 1), 1000 * (retryCount + 1));
                }
            });
    }
    
    initializeData();
    
    document.getElementById('refresh-rates').addEventListener('click', () => {
        fetchExchangeRates().catch(console.error);
    });
    
    setInterval(() => {
        fetchExchangeRates().catch(console.error);
    }, 5 * 60 * 1000);
    
    function setupChartView() {
        const currencySelect = document.getElementById('currency-select');
        
        if (currencySelect && currencySelect.options.length > 1) {
            if (!currentCurrency || !Array.from(currencySelect.options).some(o => o.value === currentCurrency)) {
                currentCurrency = currencySelect.options[1].value;
            }
            currencySelect.value = currentCurrency;
            
            if (!currencySelect._hasChangeListener) {
                currencySelect.addEventListener('change', (e) => {
                    currentCurrency = e.target.value;
                    updateChart(currentCurrency, currentDays).catch(console.error);
                });
                currencySelect._hasChangeListener = true;
            }
            // Note: Period buttons are handled via event delegation in showChartView or directly if static.
            // But since showChartView overwrites HTML, we must re-attach or use a stable container.
            // Current implementation re-attaches in showChartView.
        } else {
            setTimeout(() => {
                if (document.getElementById('currency-select')?.options.length > 1) {
                    setupChartView();
                }
            }, 500);
        }
    }
    
    function showChartView() {
        const chartView = document.getElementById('chart-view');
        const currencyGrid = document.getElementById('currency-grid');
        
        currencyGrid.classList.add('hidden');
        chartView.style.display = 'block';
        chartView.classList.remove('hidden');
        
        const currency = currencyService.getCurrencies().find(c => c.code === currentCurrency);
        const currencyName = currency ? currency.name : '';
        const currencyFlag = currency ? currency.flag : '';
        
        // Ensure HTML structure includes canvas
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
                    <button class="period-btn ${currentDays === 7 ? 'active' : ''}" data-days="7">7 dni</button>
                    <button class="period-btn ${currentDays === 14 ? 'active' : ''}" data-days="14">14 dni</button>
                    <button class="period-btn ${currentDays === 30 ? 'active' : ''}" data-days="30">30 dni</button>
                </div>
            </div>
        `;
        
        chartView.innerHTML = chartHTML;
        
        document.getElementById('back-to-grid').addEventListener('click', () => {
            chartView.style.display = 'none';
            chartView.classList.add('hidden');
            currencyGrid.classList.remove('hidden');
        });
        
        // Re-attach period listeners
        chartView.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                chartView.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentDays = parseInt(btn.dataset.days);
                updateChart(currentCurrency, currentDays);
            });
        });

        // Small delay to ensure canvas is in DOM before chart.js tries to access it
        setTimeout(() => {
             updateChart(currentCurrency, currentDays).catch(console.error);
        }, 0);
    }

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
});
