// budget.js - Budget Management

class BudgetManager {
    constructor(financeManager) {
        this.financeManager = financeManager;
        this.budgets = this.financeManager.getStoredData('budgets') || {};
        this.categoryBudgets = this.financeManager.getStoredData('categoryBudgets') || {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultMonth();
        this.displayBudgetOverview();
        this.displayCurrentBudget();
        this.displayCategoryBudgets();
        this.displayBudgetHistory();
    }

    setDefaultMonth() {
        const now = new Date();
        const currentMonth = now.toISOString().substring(0, 7);
        document.getElementById('budgetMonth').value = currentMonth;
    }

    setupEventListeners() {
        // Main budget form
        document.getElementById('budgetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.setMonthlyBudget();
        });

        // Category budget form
        document.getElementById('categoryBudgetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.setCategoryBudget();
        });

        // Update when month changes
        document.getElementById('budgetMonth').addEventListener('change', () => {
            this.displayCurrentBudget();
        });
    }

    setMonthlyBudget() {
        const month = document.getElementById('budgetMonth').value;
        const amount = parseFloat(document.getElementById('budgetAmount').value);

        if (!month || !amount) {
            alert('Please fill all fields');
            return;
        }

        this.budgets[month] = {
            amount: amount,
            setDate: new Date().toISOString()
        };

        this.financeManager.setStoredData('budgets', this.budgets);
        this.displayBudgetOverview();
        this.displayCurrentBudget();
        this.displayBudgetHistory();
        showNotification('Monthly budget set successfully!');
        
        // Reset form
        document.getElementById('budgetForm').reset();
        this.setDefaultMonth();
    }

    setCategoryBudget() {
        const category = document.getElementById('categorySelect').value;
        const amount = parseFloat(document.getElementById('categoryBudgetAmount').value);

        if (!category || !amount) {
            alert('Please fill all fields');
            return;
        }

        const currentMonth = new Date().toISOString().substring(0, 7);
        
        if (!this.categoryBudgets[currentMonth]) {
            this.categoryBudgets[currentMonth] = {};
        }

        this.categoryBudgets[currentMonth][category] = {
            amount: amount,
            setDate: new Date().toISOString()
        };

        this.financeManager.setStoredData('categoryBudgets', this.categoryBudgets);
        this.displayCategoryBudgets();
        this.displayBudgetOverview();
        showNotification('Category budget set successfully!');
        
        // Reset form
        document.getElementById('categoryBudgetAmount').value = '';
    }

    displayBudgetOverview() {
        const currentMonth = new Date().toISOString().substring(0, 7);
        const monthlyData = this.financeManager.calculateMonthlySummary();
        
        // Update stats
        document.getElementById('totalIncome').textContent = `$${monthlyData.income.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `$${monthlyData.expenses.toFixed(2)}`;
        document.getElementById('totalSavings').textContent = `$${monthlyData.savings.toFixed(2)}`;

        // Update budget progress
        const currentBudget = this.budgets[currentMonth];
        if (currentBudget) {
            const budgetAmount = currentBudget.amount;
            const spent = monthlyData.expenses;
            const remaining = budgetAmount - spent;
            const progress = Math.min((spent / budgetAmount) * 100, 100);

            document.getElementById('budgetTotal').textContent = `$${budgetAmount.toFixed(2)}`;
            document.getElementById('budgetSpent').textContent = `$${spent.toFixed(2)}`;
            document.getElementById('budgetRemaining').textContent = `$${remaining.toFixed(2)}`;
            document.getElementById('budgetProgress').style.width = `${progress}%`;

            // Change color based on progress
            const progressFill = document.getElementById('budgetProgress');
            if (progress > 90) {
                progressFill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
            } else if (progress > 75) {
                progressFill.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
            } else {
                progressFill.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
            }
        } else {
            document.getElementById('budgetTotal').textContent = '$0';
            document.getElementById('budgetSpent').textContent = '$0';
            document.getElementById('budgetRemaining').textContent = '$0';
            document.getElementById('budgetProgress').style.width = '0%';
        }
    }

    displayCurrentBudget() {
        const currentMonth = document.getElementById('budgetMonth').value;
        const budgetInfo = document.getElementById('currentBudgetInfo');
        const budget = this.budgets[currentMonth];

        if (budget) {
            const monthlyData = this.getMonthlyData(currentMonth);
            const remaining = budget.amount - monthlyData.expenses;
            const progress = Math.min((monthlyData.expenses / budget.amount) * 100, 100);

            budgetInfo.innerHTML = `
                <div class="budget-detail">
                    <div class="detail-row">
                        <span>Budget Amount:</span>
                        <span class="amount">$${budget.amount.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Spent:</span>
                        <span class="amount expense">$${monthlyData.expenses.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Remaining:</span>
                        <span class="amount ${remaining >= 0 ? 'savings' : 'expense'}">$${remaining.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Progress:</span>
                        <span>${progress.toFixed(1)}%</span>
                    </div>
                </div>
            `;
        } else {
            budgetInfo.innerHTML = '<p class="no-data">No budget set for this month</p>';
        }
    }

    displayCategoryBudgets() {
        const currentMonth = new Date().toISOString().substring(0, 7);
        const categoryBudgetsContainer = document.getElementById('categoryBudgets');
        const monthlyCategoryBudgets = this.categoryBudgets[currentMonth] || {};

        if (Object.keys(monthlyCategoryBudgets).length === 0) {
            categoryBudgetsContainer.innerHTML = '<p class="no-data">No category budgets set</p>';
            return;
        }

        const monthlyExpenses = this.getCategoryExpenses(currentMonth);

        categoryBudgetsContainer.innerHTML = Object.entries(monthlyCategoryBudgets)
            .map(([category, budget]) => {
                const spent = monthlyExpenses[category] || 0;
                const remaining = budget.amount - spent;
                const progress = Math.min((spent / budget.amount) * 100, 100);

                return `
                    <div class="category-budget-item">
                        <div class="category-budget-header">
                            <span class="category-name">${this.formatCategory(category)}</span>
                            <span class="category-amount">$${budget.amount.toFixed(2)}</span>
                        </div>
                        <div class="budget-progress-small">
                            <div class="progress-bar-small">
                                <div class="progress-fill-small" style="width: ${progress}%"></div>
                            </div>
                            <div class="progress-text-small">
                                <span>$${spent.toFixed(2)} spent</span>
                                <span>$${remaining.toFixed(2)} left</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    displayBudgetHistory() {
        const budgetHistory = document.getElementById('budgetHistory');
        const budgetEntries = Object.entries(this.budgets)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 6); // Show last 6 months

        if (budgetEntries.length === 0) {
            budgetHistory.innerHTML = '<p class="no-data">No budget history</p>';
            return;
        }

        budgetHistory.innerHTML = budgetEntries.map(([month, budget]) => {
            const monthlyData = this.getMonthlyData(month);
            const remaining = budget.amount - monthlyData.expenses;
            const progress = Math.min((monthlyData.expenses / budget.amount) * 100, 100);

            return `
                <div class="budget-history-item">
                    <div class="history-month">${this.formatMonth(month)}</div>
                    <div class="history-details">
                        <span>Budget: $${budget.amount.toFixed(2)}</span>
                        <span>Spent: $${monthlyData.expenses.toFixed(2)}</span>
                        <span class="${remaining >= 0 ? 'savings' : 'expense'}">${remaining >= 0 ? 'Saved' : 'Overspent'}: $${Math.abs(remaining).toFixed(2)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    getMonthlyData(month) {
        const monthlyIncome = this.financeManager.transactions
            .filter(t => t.type === 'income' && t.date.startsWith(month))
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const monthlyExpenses = this.financeManager.transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(month))
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return {
            income: monthlyIncome,
            expenses: monthlyExpenses,
            savings: monthlyIncome - monthlyExpenses
        };
    }

    getCategoryExpenses(month) {
        const categoryExpenses = {};
        
        this.financeManager.transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(month))
            .forEach(transaction => {
                if (!categoryExpenses[transaction.category]) {
                    categoryExpenses[transaction.category] = 0;
                }
                categoryExpenses[transaction.category] += parseFloat(transaction.amount);
            });

        return categoryExpenses;
    }

    formatCategory(category) {
        const categories = {
            'housing': '🏠 Housing',
            'food': '🍔 Food & Groceries',
            'transport': '🚗 Transportation',
            'utilities': '💡 Utilities',
            'healthcare': '🏥 Healthcare',
            'entertainment': '🎬 Entertainment',
            'shopping': '🛍️ Shopping',
            'other': '📦 Other'
        };
        return categories[category] || category;
    }

    formatMonth(monthString) {
        const [year, month] = monthString.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
}

// Initialize Budget Manager when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof financeManager !== 'undefined') {
        window.budgetManager = new BudgetManager(financeManager);
    }
});
