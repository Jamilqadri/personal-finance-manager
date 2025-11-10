// expenses.js - Expenses Management

class ExpensesManager {
    constructor(financeManager) {
        this.financeManager = financeManager;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.displayExpensesList();
        this.setDefaultDate();
        this.updateTodayExpenses();
        this.updateCategoryChart();
    }

    setDefaultDate() {
        document.getElementById('expenseDate').valueAsDate = new Date();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Filters
        document.getElementById('filterCategory').addEventListener('change', () => {
            this.displayExpensesList();
        });

        document.getElementById('filterMonth').addEventListener('change', () => {
            this.displayExpensesList();
        });

        document.getElementById('resetFilters').addEventListener('click', () => {
            this.resetFilters();
        });

        // Update today's expenses when date changes
        document.getElementById('expenseDate').addEventListener('change', () => {
            this.updateTodayExpenses();
        });
    }

    addExpense() {
        const amount = document.getElementById('expenseAmount').value;
        const description = document.getElementById('expenseDescription').value;
        const category = document.getElementById('expenseCategory').value;
        const date = document.getElementById('expenseDate').value;

        if (!amount || !description || !category || !date) {
            alert('Please fill all fields');
            return;
        }

        const expenseData = {
            type: 'expense',
            amount: amount,
            description: description,
            category: category,
            date: date
        };

        this.financeManager.addTransaction(expenseData);
        this.resetForm();
        this.displayExpensesList();
        this.updateTodayExpenses();
        this.updateCategoryChart();
        showNotification('Expense added successfully!');
    }

    resetForm() {
        document.getElementById('expenseForm').reset();
        this.setDefaultDate();
    }

    resetFilters() {
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterMonth').value = '';
        this.displayExpensesList();
    }

    displayExpensesList() {
        const expensesList = document.getElementById('expensesList');
        const categoryFilter = document.getElementById('filterCategory').value;
        const monthFilter = document.getElementById('filterMonth').value;

        let expenses = this.financeManager.transactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Apply filters
        if (categoryFilter) {
            expenses = expenses.filter(expense => expense.category === categoryFilter);
        }

        if (monthFilter) {
            expenses = expenses.filter(expense => {
                const expenseMonth = expense.date.substring(0, 7);
                return expenseMonth === monthFilter;
            });
        }

        if (expenses.length === 0) {
            expensesList.innerHTML = '<p class="no-data">No expense records found</p>';
            return;
        }

        expensesList.innerHTML = expenses.map(expense => `
            <div class="transaction-item expense-item">
                <div class="transaction-info">
                    <div class="transaction-main">
                        <strong>${expense.description}</strong>
                        <span class="amount expense-amount">-$${parseFloat(expense.amount).toFixed(2)}</span>
                    </div>
                    <div class="transaction-details">
                        <span class="category ${expense.category}">${this.formatCategory(expense.category)}</span>
                        <span class="date">${new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                </div>
                <button class="delete-btn" onclick="expensesManager.deleteExpense(${expense.id})">×</button>
            </div>
        `).join('');
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

    deleteExpense(expenseId) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.financeManager.transactions = this.financeManager.transactions
                .filter(t => t.id !== expenseId);
            this.financeManager.setStoredData('transactions', this.financeManager.transactions);
            this.displayExpensesList();
            this.updateTodayExpenses();
            this.updateCategoryChart();
            showNotification('Expense deleted successfully!');
        }
    }

    updateTodayExpenses() {
        const today = new Date().toISOString().split('T')[0];
        const selectedDate = document.getElementById('expenseDate').value;
        
        const todayExpenses = this.financeManager.transactions
            .filter(t => t.type === 'expense' && t.date === selectedDate)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        document.getElementById('todayExpenses').textContent = `$${todayExpenses.toFixed(2)}`;
    }

    updateCategoryChart() {
        const categoryChart = document.getElementById('categoryChart');
        const expenses = this.financeManager.transactions.filter(t => t.type === 'expense');
        
        const categoryTotals = {};
        expenses.forEach(expense => {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += parseFloat(expense.amount);
        });

        if (Object.keys(categoryTotals).length === 0) {
            categoryChart.innerHTML = '<p class="no-data">No expenses data</p>';
            return;
        }

        const maxAmount = Math.max(...Object.values(categoryTotals));
        
        categoryChart.innerHTML = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => {
                const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                return `
                    <div class="category-bar">
                        <div class="category-info">
                            <span class="category-label">${this.formatCategory(category)}</span>
                            <span class="category-amount">$${amount.toFixed(2)}</span>
                        </div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    getTotalExpenses() {
        return this.financeManager.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    }
}

// Initialize Expenses Manager when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof financeManager !== 'undefined') {
        window.expensesManager = new ExpensesManager(financeManager);
    }
});
