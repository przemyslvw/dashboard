class CurrencyApp {
    constructor() {
        this.config = CurrencyConfig;
        this.state = {
            currentCurrency: null,
            currentDays: this.config.defaultChartDays || 30,
            rates: {},
            previousRates: {},
            lastUpdated: null
        };

        this.chartInstance = null;
        this.elements = {};

        // Bind methods
        this.handleRefresh = this.handleRefresh.bind(this);
        this.handleCurrencyClick = this.handleCurrencyClick.bind(this);
        this.handlePeriodChange = this.handlePeriodChange.bind(this);
        this.handleBackToGrid = this.handleBackToGrid.bind(this);
    }

    async init() {
        this.cacheElements();
        this.loadSavedRates();
        this.bindEvents();

        await this.refreshRates();

        // Auto refresh
        setInterval(() => this.refreshRates(), this.config.refreshInterval);
    }

    cacheElements() {
        this.elements = {
            grid: document.getElementById('currency-grid'),
            ratesContainer: document.getElementById('currency-rates'),
            chartView: document.getElementById('chart-view'),
            lastUpdated: document.getElementById('last-updated'),
            refreshBtn: document.getElementById('refresh-rates'),
            currencySelect: document.getElementById('currency-select'),
            // These might be dynamically created, so we might need to query them later
        };
    }

    bindEvents() {
        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.addEventListener('click', this.handleRefresh);
        }

        // Delegate grid clicks
        if (this.elements.ratesContainer) {
            this.elements.ratesContainer.addEventListener('click', (e) => {
                const item = e.target.closest('.currency-item');
                if (item) {
                    const code = item.dataset.currency;
                    this.handleCurrencyClick(code);
                }
            });
        }
    }

    loadSavedRates() {
        try {
            const saved = localStorage.getItem('previousRates');
            if (saved) {
                this.state.previousRates = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading saved rates:', e);
        }
    }

    saveRates() {
        localStorage.setItem('previousRates', JSON.stringify(this.state.rates));
    }

    async refreshRates() {
        if (this.elements.ratesContainer) {
            this.elements.ratesContainer.innerHTML = '<div class="currency-loading"><i class="fas fa-spinner fa-spin"></i> Ładowanie kursów...</div>';
        }

        try {
            const data = await currencyService.fetchAllRates();
            this.state.rates = {}; // Reset current rates buffer

            // Build Grid HTML
            let gridHtml = '';

            this.config.currencies.forEach(currency => {
                const rate = currencyService.calculateRate(currency, data);
                const prevRate = this.state.previousRates[currency.code];
                const change = this.calculateChange(rate, prevRate);

                this.state.rates[currency.code] = rate;

                gridHtml += this.renderCurrencyItem(currency, rate, change);
            });

            if (this.elements.ratesContainer) {
                this.elements.ratesContainer.innerHTML = gridHtml;
            }

            if (this.elements.lastUpdated) {
                this.elements.lastUpdated.textContent = new Date(data.timestamp).toLocaleString('pl-PL');
            }

            this.updateSelectOptions();
            this.saveRates();

        } catch (error) {
            console.error('Error refreshing rates:', error);
            if (this.elements.ratesContainer) {
                this.elements.ratesContainer.innerHTML = '<div class="error">Błąd pobierania danych.</div>';
            }
        }
    }

    calculateChange(current, previous) {
        if (!previous) return 0;
        return ((current - previous) / previous) * 100;
    }

    renderCurrencyItem(currency, rate, change) {
        let displayRate = '0.00';
        if (rate) {
            if (rate < 0.01) {
                displayRate = rate.toFixed(6);
            } else if (rate < 1) {
                displayRate = rate.toFixed(4);
            } else {
                displayRate = rate.toFixed(2);
            }
        }

        const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : '';
        const changeSymbol = change > 0 ? '↑' : change < 0 ? '↓' : '';
        const currencySymbol = currency.type === 'stock' ? '$' : (currency.type === 'metal' ? 'zł' : 'PLN');
        
        return `
            <div class="currency-item" data-currency="${currency.code}">
                <div class="currency-flag">${currency.flag}</div>
                <div class="currency-code">${currency.code}</div>
                <div class="currency-name">${currency.name}</div>
                <div class="currency-rate">${displayRate} ${currencySymbol}</div>
                <div class="currency-change ${changeClass}">
                    ${changeSymbol} ${Math.abs(change).toFixed(2)}%
                </div>
            </div>
        `;
    }

    updateSelectOptions() {
        if (!this.elements.currencySelect) return;
        
        // Only populate if empty
        if (this.elements.currencySelect.options.length <= 1) {
            this.config.currencies.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.code;
                opt.textContent = `${c.flag} ${c.code}`;
                this.elements.currencySelect.appendChild(opt);
            });
            
            // Bind select change
            this.elements.currencySelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.handleCurrencyClick(e.target.value);
                }
            });
        }
    }

    // --- Chart / Details View ---

    handleCurrencyClick(code) {
        this.state.currentCurrency = code;
        this.showChartView();
    }

    showChartView() {
        const currency = this.config.currencies.find(c => c.code === this.state.currentCurrency);
        if (!currency) return;

        // Hide grid, show chart
        if (this.elements.grid) this.elements.grid.classList.add('hidden');
        if (this.elements.chartView) {
            this.elements.chartView.style.display = 'block';
            this.elements.chartView.classList.remove('hidden');

            this.renderChartLayout(currency);
            this.updateChart(currency.code, this.state.currentDays);
        }
    }

    renderChartLayout(currency) {
        if (!this.elements.chartView) return;

        this.elements.chartView.innerHTML = `
            <div class="chart-header">
                <button id="back-to-grid" class="back-button">
                    <i class="fas fa-arrow-left"></i> Wróć
                </button>
                <h3>${currency.flag} ${currency.name} (${currency.code})</h3>
            </div>
            <div class="chart-container" style="position: relative; height: 300px; width: 100%;">
                <canvas id="currency-chart"></canvas>
            </div>
            <div class="chart-controls">
                <div class="chart-period">
                    <button class="period-btn ${this.state.currentDays === 7 ? 'active' : ''}" data-days="7">7 dni</button>
                    <button class="period-btn ${this.state.currentDays === 14 ? 'active' : ''}" data-days="14">14 dni</button>
                    <button class="period-btn ${this.state.currentDays === 30 ? 'active' : ''}" data-days="30">30 dni</button>
                </div>
            </div>
        `;

        // Bind internal events
        document.getElementById('back-to-grid').addEventListener('click', this.handleBackToGrid);
        
        this.elements.chartView.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const days = parseInt(e.target.dataset.days);
                this.handlePeriodChange(days);
            });
        });
    }

    handleBackToGrid() {
        if (this.elements.chartView) {
            this.elements.chartView.style.display = 'none';
            this.elements.chartView.classList.add('hidden');
        }
        if (this.elements.grid) {
            this.elements.grid.classList.remove('hidden');
        }
        
        // Clean up chart
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    }

    handlePeriodChange(days) {
        this.state.currentDays = days;
        // Update active class
        this.elements.chartView.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.days) === days);
        });

        this.updateChart(this.state.currentCurrency, days);
    }

    async updateChart(code, days) {
        const ctx = document.getElementById('currency-chart')?.getContext('2d');
        if (!ctx) return;

        try {
            const data = await currencyService.getHistoricalRates(code, days);

            if (this.chartInstance) {
                this.chartInstance.destroy();
            }

            const currency = this.config.currencies.find(c => c.code === code);
            const labels = data.map(d => new Date(d.date).toLocaleDateString('pl-PL'));
            const values = data.map(d => d.value);

            this.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${code} Rate`,
                        data: values,
                        borderColor: '#1793d1',
                        backgroundColor: 'rgba(23, 147, 209, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#aaa' }
                        },
                        y: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#aaa' }
                        }
                    }
                }
            });

        } catch (e) {
            console.error('Error updating chart:', e);
        }
    }

    handleRefresh() {
        this.refreshRates();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    const app = new CurrencyApp();
    app.init();
});
