// script.js - Main JavaScript File

class FinanceManager {
    constructor() {
        this.transactions = this.getStoredData('transactions') || [];
        this.budget = this.getStoredData('budget') || {};
        this.init();
    }

    init() {
        this.displayDashboard();
        this.setupEventListeners();
    }

    // Local Storage Functions
    getStoredData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    setStoredData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Dashboard Calculations
    calculateTotalBalance() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        return totalIncome - totalExpenses;
    }

    calculateMonthlySummary() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyIncome = this.transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'income' && 
                       transactionDate.getMonth() === currentMonth &&
                       transactionDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const monthlyExpenses = this.transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'expense' && 
                       transactionDate.getMonth() === currentMonth &&
                       transactionDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return {
            income: monthlyIncome,
            expenses: monthlyExpenses,
            savings: monthlyIncome - monthlyExpenses
        };
    }

    // Display Functions
    displayDashboard() {
        const totalBalance = this.calculateTotalBalance();
        const monthly = this.calculateMonthlySummary();
        
        // Update summary cards
        document.querySelector('.amount:not(.income):not(.expense):not(.savings)').textContent = 
            `$${totalBalance.toFixed(2)}`;
        document.querySelector('.amount.income').textContent = `$${monthly.income.toFixed(2)}`;
        document.querySelector('.amount.expense').textContent = `$${monthly.expenses.toFixed(2)}`;
        document.querySelector('.amount.savings').textContent = `$${monthly.savings.toFixed(2)}`;

        this.displayRecentTransactions();
    }

    displayRecentTransactions() {
        const transactionList = document.getElementById('transaction-list');
        const recentTransactions = this.transactions.slice(-5).reverse();

        if (recentTransactions.length === 0) {
            transactionList.innerHTML = '<p>No transactions yet</p>';
            return;
        }

        transactionList.innerHTML = recentTransactions.map(transaction => `
            <div class="transaction-item" style="
                padding: 15px; 
                margin: 10px 0; 
                background: #f8f9fa; 
                border-radius: 10px;
                border-left: 4px solid ${transaction.type === 'income' ? '#27ae60' : '#e74c3c'};
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <strong>${transaction.description}</strong>
                    <br>
                    <small style="color: #7f8c8d;">${new Date(transaction.date).toLocaleDateString()}</small>
                </div>
                <span style="color: ${transaction.type === 'income' ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                    ${transaction.type === 'income' ? '+' : '-'}$${parseFloat(transaction.amount).toFixed(2)}
                </span>
            </div>
        `).join('');
    }

    // Add New Transaction
    addTransaction(transactionData) {
        const transaction = {
            id: Date.now(),
            type: transactionData.type,
            amount: parseFloat(transactionData.amount),
            description: transactionData.description,
            category: transactionData.category,
            date: transactionData.date || new Date().toISOString().split('T')[0]
        };

        this.transactions.push(transaction);
        this.setStoredData('transactions', this.transactions);
        this.displayDashboard();
    }

    setupEventListeners() {
        // Navigation active state
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('nav a').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }
}

// Initialize the Finance Manager when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.financeManager = new FinanceManager();
});

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
