// reports.js - Reports & Analytics

class ReportsManager {
    constructor(financeManager) {
        this.financeManager = financeManager;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateReport('current_month');
    }

    setupEventListeners() {
        // Report period change
        document.getElementById('reportPeriod').addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                document.getElementById('customRange').style.display = 'flex';
            } else {
                document.getElementById('customRange').style.display = 'none';
                this.generateReport(e.target.value);
            }
        });

        // Generate report button
        document.getElementById('generateReport').addEventListener('click', () => {
            const period = document.getElementById('reportPeriod').value;
            this.generateReport(period);
        });

        // Export report button
        document.getElementById('exportReport').addEventListener('click', () => {
            this.exportToPDF();
        });
    }

    generateReport(period) {
        const dateRange = this.getDateRange(period);
        const reportData = this.calculateReportData(dateRange);
        
        this.updateFinancialSummary(reportData);
        this.createExpenseChart(reportData.expenseByCategory);
        this.createTrendChart(reportData.monthlyTrends);
        this.updateMonthlyComparison(reportData.monthlyTrends);
        this.updateCategoryBreakdown(reportData.expenseByCategory);
        this.generateInsights(reportData);
    }

    getDateRange(period) {
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case 'current_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'last_3_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last_6_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'current_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            case 'custom':
                const startMonth = document.getElementById('startDate').value;
                const endMonth = document.getElementById('endDate').value;
                if (startMonth && endMonth) {
                    startDate = new Date(startMonth + '-01');
                    endDate = new Date(endMonth + '-01');
                    endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
                } else {
                    return this.getDateRange('current_month');
                }
                break;
            default:
                return this.getDateRange('current_month');
        }

        return { start: startDate, end: endDate };
    }

    calculateReportData(dateRange) {
        const transactions = this.financeManager.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
        });

        // Calculate basic totals
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        // Expense by category
        const expenseByCategory = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                if (!expenseByCategory[t.category]) {
                    expenseByCategory[t.category] = 0;
                }
                expenseByCategory[t.category] += parseFloat(t.amount);
            });

        // Monthly trends
        const monthlyTrends = this.calculateMonthlyTrends(dateRange);

        // Comparison with previous period
        const previousPeriodData = this.calculatePreviousPeriodData(dateRange);

        return {
            totalIncome,
            totalExpenses,
            netSavings,
            savingsRate,
            expenseByCategory,
            monthlyTrends,
            previousPeriodData
        };
    }

    calculateMonthlyTrends(dateRange) {
        const trends = [];
        const current = new Date(dateRange.start);
        
        while (current <= dateRange.end) {
            const year = current.getFullYear();
            const month = current.getMonth();
            const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
            
            const monthlyIncome = this.financeManager.transactions
                .filter(t => t.type === 'income' && t.date.startsWith(monthKey))
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const monthlyExpenses = this.financeManager.transactions
                .filter(t => t.type === 'expense' && t.date.startsWith(monthKey))
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            trends.push({
                month: monthKey,
                income: monthlyIncome,
                expenses: monthlyExpenses,
                savings: monthlyIncome - monthlyExpenses,
                savingsRate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
            });

            current.setMonth(current.getMonth() + 1);
        }

        return trends;
    }

    calculatePreviousPeriodData(dateRange) {
        const periodLength = dateRange.end - dateRange.start;
        const previousStart = new Date(dateRange.start.getTime() - periodLength);
        const previousEnd = new Date(dateRange.start.getTime() - 1);

        const previousTransactions = this.financeManager.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= previousStart && transactionDate <= previousEnd;
        });

        const previousIncome = previousTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const previousExpenses = previousTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return {
            income: previousIncome,
            expenses: previousExpenses,
            savings: previousIncome - previousExpenses
        };
    }

    updateFinancialSummary(data) {
        document.getElementById('totalIncomeReport').textContent = `$${data.totalIncome.toFixed(2)}`;
        document.getElementById('totalExpensesReport').textContent = `$${data.totalExpenses.toFixed(2)}`;
        document.getElementById('netSavingsReport').textContent = `$${data.netSavings.toFixed(2)}`;
        document.getElementById('savingsRate').textContent = `${data.savingsRate.toFixed(1)}%`;

        // Calculate trends
        const incomeTrend = this.calculateTrend(data.totalIncome, data.previousPeriodData.income);
        const expensesTrend = this.calculateTrend(data.totalExpenses, data.previousPeriodData.expenses);
        const savingsTrend = this.calculateTrend(data.netSavings, data.previousPeriodData.savings);

        document.getElementById('incomeTrend').textContent = `${incomeTrend > 0 ? '+' : ''}${incomeTrend}%`;
        document.getElementById('expensesTrend').textContent = `${expensesTrend > 0 ? '+' : ''}${expensesTrend}%`;
        document.getElementById('savingsTrend').textContent = `${savingsTrend > 0 ? '+' : ''}${savingsTrend}%`;

        // Set trend colors
        this.setTrendColor('incomeTrend', incomeTrend);
        this.setTrendColor('expensesTrend', -expensesTrend); // Negative for expenses
        this.setTrendColor('savingsTrend', savingsTrend);
    }

    calculateTrend(current, previous) {
        if (previous === 0) return 0;
        return ((current - previous) / previous * 100).toFixed(1);
    }

    setTrendColor(elementId, trend) {
        const element = document.getElementById(elementId);
        if (trend > 0) {
            element.style.color = '#27ae60';
        } else if (trend < 0) {
            element.style.color = '#e74c3c';
        } else {
            element.style.color = '#7f8c8d';
        }
    }

    createExpenseChart(expenseData) {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.expenseChart) {
            this.expenseChart.destroy();
        }

        const categories = Object.keys(expenseData);
        const amounts = Object.values(expenseData);

        this.expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => this.formatCategory(cat)),
                datasets: [{
                    data: amounts,
                    backgroundColor: [
                        '#3498db', '#e74c3c', '#f39c12', '#9b59b6',
                        '#2ecc71', '#1abc9c', '#d35400', '#7f8c8d'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    createTrendChart(monthlyTrends) {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.trendChart) {
            this.trendChart.destroy();
        }

        const months = monthlyTrends.map(t => this.formatMonth(t.month));
        const incomeData = monthlyTrends.map(t => t.income);
        const expenseData = monthlyTrends.map(t => t.expenses);

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    updateMonthlyComparison(monthlyTrends) {
        const tbody = document.querySelector('#monthlyComparison tbody');
        
        tbody.innerHTML = monthlyTrends.map(trend => `
            <tr>
                <td>${this.formatMonth(trend.month)}</td>
                <td>$${trend.income.toFixed(2)}</td>
                <td>$${trend.expenses.toFixed(2)}</td>
                <td class="${trend.savings >= 0 ? 'savings' : 'expense'}">$${Math.abs(trend.savings).toFixed(2)}</td>
                <td>${trend.savingsRate.toFixed(1)}%</td>
            </tr>
        `).join('');
    }

    updateCategoryBreakdown(expenseData) {
        const tbody = document.querySelector('#categoryBreakdown tbody');
        const totalExpenses = Object.values(expenseData).reduce((sum, amount) => sum + amount, 0);
        
        const breakdown = Object.entries(expenseData)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => {
                const percentage = totalExpenses > 0 ? (amount / totalExpenses * 100) : 0;
                return `
                    <tr>
                        <td>${this.formatCategory(category)}</td>
                        <td>$${amount.toFixed(2)}</td>
                        <td>${percentage.toFixed(1)}%</td>
                        <td>
                            <div class="progress-bar-small">
                                <div class="progress-fill-small" style="width: ${percentage}%"></div>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

        tbody.innerHTML = breakdown || '<tr><td colspan="4" class="no-data">No expense data</td></tr>';
    }

    generateInsights(data) {
        const insightsContainer = document.getElementById('financialInsights');
        const insights = [];

        // Savings rate insight
        if (data.savingsRate > 20) {
            insights.push('🎉 Excellent! Your savings rate is above 20%. Keep up the great work!');
        } else if (data.savingsRate > 10) {
            insights.push('👍 Good job! Your savings rate is healthy. Consider increasing it to 20% for better financial security.');
        } else if (data.savingsRate > 0) {
            insights.push('💡 You\'re saving money! Try to increase your savings rate by reducing unnecessary expenses.');
        } else {
            insights.push('⚠️ You\'re spending more than you earn. Review your expenses and create a budget
