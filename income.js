// income.js - Income Management

class IncomeManager {
    constructor(financeManager) {
        this.financeManager = financeManager;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.displayIncomeList();
        this.setDefaultDate();
    }

    setDefaultDate() {
        document.getElementById('incomeDate').valueAsDate = new Date();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('incomeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addIncome();
        });

        // Filters
        document.getElementById('filterCategory').addEventListener('change', () => {
            this.displayIncomeList();
        });

        document.getElementById('filterMonth').addEventListener('change', () => {
            this.displayIncomeList();
        });
    }

    addIncome() {
        const amount = document.getElementById('incomeAmount').value;
        const description = document.getElementById('incomeDescription').value;
        const category = document.getElementById('incomeCategory').value;
        const date = document.getElementById('incomeDate').value;

        if (!amount || !description || !category || !date) {
            alert('Please fill all fields');
            return;
        }

        const incomeData = {
            type: 'income',
            amount: amount,
            description: description,
            category: category,
            date: date
        };

        this.financeManager.addTransaction(incomeData);
        this.resetForm();
        this.displayIncomeList();
        showNotification('Income added successfully!');
    }

    resetForm() {
        document.getElementById('incomeForm').reset();
        this.setDefaultDate();
    }

    displayIncomeList() {
        const incomeList = document.getElementById('incomeList');
        const categoryFilter = document.getElementById('filterCategory').value;
        const monthFilter = document.getElementById('filterMonth').value;

        let incomes = this.financeManager.transactions
            .filter(t => t.type === 'income')
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Apply filters
        if (categoryFilter) {
            incomes = incomes.filter(income => income.category === categoryFilter);
        }

        if (monthFilter) {
            incomes = incomes.filter(income => {
                const incomeMonth = income.date.substring(0, 7); // YYYY-MM
                return incomeMonth === monthFilter;
            });
        }

        if (incomes.length === 0) {
            incomeList.innerHTML = '<p class="no-data">No income records found</p>';
            return;
        }

        incomeList.innerHTML = incomes.map(income => `
            <div class="transaction-item income-item">
                <div class="transaction-info">
                    <div class="transaction-main">
                        <strong>${income.description}</strong>
                        <span class="amount income-amount">+$${parseFloat(income.amount).toFixed(2)}</span>
                    </div>
                    <div class="transaction-details">
                        <span class="category">${this.formatCategory(income.category)}</span>
                        <span class="date">${new Date(income.date).toLocaleDateString()}</span>
                    </div>
                </div>
                <button class="delete-btn" onclick="incomeManager.deleteIncome(${income.id})">×</button>
            </div>
        `).join('');
    }

    formatCategory(category) {
        const categories = {
            'salary': 'Salary',
            'freelance': 'Freelance',
            'business': 'Business',
            'investment': 'Investment',
            'other': 'Other'
        };
        return categories[category] || category;
    }

    deleteIncome(incomeId) {
        if (confirm('Are you sure you want to delete this income record?')) {
            this.financeManager.transactions = this.financeManager.transactions
                .filter(t => t.id !== incomeId);
            this.financeManager.setStoredData('transactions', this.financeManager.transactions);
            this.displayIncomeList();
            showNotification('Income deleted successfully!');
        }
    }

    getTotalIncome() {
        return this.financeManager.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    }
}

// Initialize Income Manager when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof financeManager !== 'undefined') {
        window.incomeManager = new IncomeManager(financeManager);
    }
});
