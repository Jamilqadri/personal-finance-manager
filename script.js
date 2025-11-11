// script.js - Main Application Logic

class FinanceManager {
    constructor() {
        this.files = this.loadFromStorage('files') || [];
        this.categories = this.loadFromStorage('categories') || [
            'Salary', 'Business', 'Investment', 'Freelance',
            'Food', 'Transport', 'Rent', 'Utilities', 
            'Healthcare', 'Entertainment', 'Shopping', 'Other'
        ];
        this.settings = this.loadFromStorage('settings') || {};
        
        this.currentFile = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderDashboard();
        this.checkEmptyState();
    }

    // ===== STORAGE MANAGEMENT =====
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(`finance_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from storage:', error);
            return null;
        }
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(`finance_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    }

    // ===== FILE MANAGEMENT =====
    createFile(fileData) {
        const newFile = {
            id: Date.now(),
            name: fileData.name,
            description: fileData.description || '',
            createdAt: new Date().toISOString(),
            transactions: [],
            ...fileData
        };

        this.files.push(newFile);
        this.saveToStorage('files', this.files);
        this.renderDashboard();
        return newFile;
    }

    deleteFile(fileId) {
        this.files = this.files.filter(file => file.id !== fileId);
        this.saveToStorage('files', this.files);
        this.renderDashboard();
    }

    getFile(fileId) {
        return this.files.find(file => file.id === fileId);
    }

    // ===== TRANSACTION MANAGEMENT =====
    addTransaction(fileId, transactionData) {
        const file = this.getFile(fileId);
        if (!file) return false;

        const transaction = {
            id: Date.now(),
            type: transactionData.type, // 'income' or 'expense'
            amount: parseFloat(transactionData.amount),
            category: transactionData.category,
            date: transactionData.date || new Date().toISOString().split('T')[0],
            description: transactionData.description || '',
            image: transactionData.image || null,
            createdAt: new Date().toISOString(),
            ...transactionData
        };

        file.transactions.push(transaction);
        this.saveToStorage('files', this.files);
        
        if (this.currentFile && this.currentFile.id === fileId) {
            this.renderFileView(file);
        }
        
        return transaction;
    }

    updateTransaction(fileId, transactionId, updatedData) {
        const file = this.getFile(fileId);
        if (!file) return false;

        const transactionIndex = file.transactions.findIndex(t => t.id === transactionId);
        if (transactionIndex === -1) return false;

        file.transactions[transactionIndex] = {
            ...file.transactions[transactionIndex],
            ...updatedData,
            amount: parseFloat(updatedData.amount)
        };

        this.saveToStorage('files', this.files);
        
        if (this.currentFile && this.currentFile.id === fileId) {
            this.renderFileView(file);
        }
        
        return true;
    }

    deleteTransaction(fileId, transactionId) {
        const file = this.getFile(fileId);
        if (!file) return false;

        file.transactions = file.transactions.filter(t => t.id !== transactionId);
        this.saveToStorage('files', this.files);
        
        if (this.currentFile && this.currentFile.id === fileId) {
            this.renderFileView(file);
        }
        
        return true;
    }

    // ===== CALCULATIONS =====
    calculateFileStats(file) {
        const transactions = file.transactions || [];
        
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expense,
            balance: income - expense
        };
    }

    calculateOverallStats() {
        let totalIncome = 0;
        let totalExpense = 0;

        this.files.forEach(file => {
            const stats = this.calculateFileStats(file);
            totalIncome += stats.income;
            totalExpense += stats.expense;
        });

        return {
            totalIncome,
            totalExpense,
            totalBalance: totalIncome - totalExpense,
            totalSavings: totalIncome - totalExpense
        };
    }

    // ===== RENDERING =====
    renderDashboard() {
        this.showDashboardView();
        this.renderFinancialOverview();
        this.renderFilesList();
        this.checkEmptyState();
    }

    renderFinancialOverview() {
        const stats = this.calculateOverallStats();
        
        document.getElementById('totalBalance').textContent = this.formatCurrency(stats.totalBalance);
        document.getElementById('totalIncome').textContent = this.formatCurrency(stats.totalIncome);
        document.getElementById('totalExpense').textContent = this.formatCurrency(stats.totalExpense);
        document.getElementById('totalSavings').textContent = this.formatCurrency(stats.totalSavings);
    }

    renderFilesList() {
        const filesGrid = document.getElementById('filesGrid');
        
        if (this.files.length === 0) {
            filesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No Files Yet</h3>
                    <p>Create your first file to start managing finances</p>
                    <button class="create-first-file" id="createFirstFile">
                        Create First File
                    </button>
                </div>
            `;
            
            document.getElementById('createFirstFile').addEventListener('click', () => {
                this.showCreateFileModal();
            });
            
            return;
        }

        filesGrid.innerHTML = this.files.map(file => {
            const stats = this.calculateFileStats(file);
            
            return `
                <div class="file-card" data-file-id="${file.id}">
                    <div class="file-header">
                        <i class="fas fa-folder file-icon"></i>
                        <div class="file-actions">
                            <button class="file-action-btn edit-file" title="Edit File">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="file-action-btn delete-file" title="Delete File">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="file-content">
                        <h3>${file.name}</h3>
                        <p>${file.description || 'No description'}</p>
                        <div class="file-stats">
                            <div class="stat">
                                <div class="stat-value income">${this.formatCurrency(stats.income)}</div>
                                <div class="stat-label">Income</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value expense">${this.formatCurrency(stats.expense)}</div>
                                <div class="stat-label">Expense</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${this.formatCurrency(stats.balance)}</div>
                                <div class="stat-label">Balance</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to file cards
        document.querySelectorAll('.file-card').forEach(card => {
            const fileId = parseInt(card.dataset.fileId);
            
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.file-actions')) {
                    this.openFile(fileId);
                }
            });

            const editBtn = card.querySelector('.edit-file');
            const deleteBtn = card.querySelector('.delete-file');

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditFileModal(fileId);
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteFile(fileId);
            });
        });
    }

    renderFileView(file) {
        this.currentFile = file;
        this.showFileView();
        
        document.getElementById('fileName').textContent = file.name;
        this.renderTransactionsList(file);
    }

    renderTransactionsList(file) {
        const transactionsList = document.getElementById('transactionsList');
        const transactions = file.transactions || [];
        
        if (transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>No Transactions Yet</h3>
                    <p>Add your first income or expense to get started</p>
                </div>
            `;
            return;
        }

        // Sort transactions by date (newest first)
        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        transactionsList.innerHTML = sortedTransactions.map(transaction => `
            <div class="transaction-item ${transaction.type}" data-transaction-id="${transaction.id}">
                <div class="transaction-header">
                    <div>
                        <div class="transaction-amount ${transaction.type}">
                            ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                        </div>
                        <div class="transaction-details">
                            <span class="transaction-category">${transaction.category}</span>
                            <span class="transaction-date">${this.formatDate(transaction.date)}</span>
                        </div>
                    </div>
                    <div class="transaction-actions">
                        <button class="file-action-btn edit-transaction" title="Edit Transaction">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="file-action-btn delete-transaction" title="Delete Transaction">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${transaction.description ? `
                    <div class="transaction-description">
                        ${transaction.description}
                    </div>
                ` : ''}
                ${transaction.image ? `
                    <img src="${transaction.image}" alt="Transaction receipt" class="transaction-image" onclick="financeManager.viewImage('${transaction.image}')">
                ` : ''}
            </div>
        `).join('');

        // Add event listeners to transaction actions
        document.querySelectorAll('.edit-transaction').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const transactionId = parseInt(e.target.closest('.transaction-item').dataset.transactionId);
                this.showEditTransactionModal(file.id, transactionId);
            });
        });

        document.querySelectorAll('.delete-transaction').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const transactionId = parseInt(e.target.closest('.transaction-item').dataset.transactionId);
                this.deleteTransaction(file.id, transactionId);
            });
        });
    }

    // ===== VIEW MANAGEMENT =====
    showDashboardView() {
        document.querySelector('.dashboard-main').style.display = 'block';
        document.querySelector('.file-view-container').style.display = 'none';
        this.currentFile = null;
    }

    showFileView() {
        document.querySelector('.dashboard-main').style.display = 'none';
        document.querySelector('.file-view-container').style.display = 'block';
    }

    openFile(fileId) {
        const file = this.getFile(fileId);
        if (file) {
            this.renderFileView(file);
        }
    }

    checkEmptyState() {
        // Implementation for empty state check
    }

    // ===== MODAL MANAGEMENT =====
    showCreateFileModal() {
        this.showModal('create-file-modal', `
            <div class="modal-header">
                <h2>Create New File</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="createFileForm">
                    <div class="form-group">
                        <label for="fileName">File Name</label>
                        <input type="text" id="fileName" class="form-control" required placeholder="e.g., Home Expenses, School Fees">
                    </div>
                    <div class="form-group">
                        <label for="fileDescription">Description (Optional)</label>
                        <textarea id="fileDescription" class="form-control" rows="3" placeholder="Brief description of this file..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                <button type="submit" form="createFileForm" class="btn btn-primary">Create File</button>
            </div>
        `);

        document.getElementById('createFileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateFile();
        });
    }

    handleCreateFile() {
        const name = document.getElementById('fileName').value.trim();
        const description = document.getElementById('fileDescription').value.trim();

        if (!name) {
            alert('Please enter a file name');
            return;
        }

        this.createFile({ name, description });
        this.hideModal();
    }

    showModal(modalId, content) {
        const modalHTML = `
            <div class="modal-overlay" id="${modalId}">
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').innerHTML = modalHTML;
        
        // Add event listeners to close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });

        // Close modal when clicking outside
        document.getElementById(modalId).addEventListener('click', (e) => {
            if (e.target.id === modalId) {
                this.hideModal();
            }
        });
    }

    hideModal() {
        document.getElementById('modalsContainer').innerHTML = '';
    }

    // ===== UTILITY FUNCTIONS =====
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    viewImage(imageUrl) {
        // Implementation for image viewing
        window.open(imageUrl, '_blank');
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Create File Button
        document.getElementById('createFileBtn').addEventListener('click', () => {
            this.showCreateFileModal();
        });

        // Settings Button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // Back Button in File View
        document.getElementById('backToDashboard').addEventListener('click', () => {
            this.showDashboardView();
        });

        // Add Income Button
        document.getElementById('addIncomeBtn').addEventListener('click', () => {
            if (this.currentFile) {
                this.showAddTransactionModal('income');
            }
        });

        // Add Expense Button
        document.getElementById('addExpenseBtn').addEventListener('click', () => {
            if (this.currentFile) {
                this.showAddTransactionModal('expense');
            }
        });

        // Date Filter
        document.getElementById('dateRange').addEventListener('change', (e) => {
            this.handleDateFilterChange(e.target.value);
        });
    }

    handleDateFilterChange(filterValue) {
        // Implementation for date filtering
        console.log('Date filter changed:', filterValue);
    }

    showSettingsModal() {
        // Implementation for settings modal
        alert('Settings feature will be implemented in the next version!');
    }

    showAddTransactionModal(type) {
        // Implementation for add transaction modal
        const title = type === 'income' ? 'Add Income' : 'Add Expense';
        
        this.showModal('add-transaction-modal', `
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addTransactionForm">
                    <div class="form-group">
                        <label for="transactionAmount">Amount (₹)</label>
                        <input type="number" id="transactionAmount" class="form-control" required step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label for="transactionCategory">Category</label>
                        <select id="transactionCategory" class="form-control" required>
                            <option value="">Select Category</option>
                            ${this.categories.map(cat => 
                                `<option value="${cat}">${cat}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="transactionDate">Date</label>
                        <input type="date" id="transactionDate" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label for="transactionDescription">Description (Optional)</label>
                        <textarea id="transactionDescription" class="form-control" rows="3" placeholder="Add notes about this transaction..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Attach Image (Optional)</label>
                        <div class="file-upload-btn" id="imageUploadBtn">
                            <i class="fas fa-camera"></i>
                            <span>Click to upload receipt/screenshot</span>
                        </div>
                        <input type="file" id="transactionImage" accept="image/*" style="display: none;">
                        <img id="imagePreview" class="file-preview" alt="Image preview">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                <button type="submit" form="addTransactionForm" class="btn btn-primary">Add ${type === 'income' ? 'Income' : 'Expense'}</button>
            </div>
        `);

        // Image upload handling
        const imageUploadBtn = document.getElementById('imageUploadBtn');
        const imageInput = document.getElementById('transactionImage');
        const imagePreview = document.getElementById('imagePreview');

        imageUploadBtn.addEventListener('click', () => imageInput.click());
        
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('addTransactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTransaction(type);
        });
    }

    handleAddTransaction(type) {
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const category = document.getElementById('transactionCategory').value;
        const date = document.getElementById('transactionDate').value;
        const description = document.getElementById('transactionDescription').value.trim();
        
        const imageInput = document.getElementById('transactionImage');
        let image = null;
        
        if (imageInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                image = e.target.result;
                this.finalizeAddTransaction(type, amount, category, date, description, image);
            };
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            this.finalizeAddTransaction(type, amount, category, date, description, null);
        }
    }

    finalizeAddTransaction(type, amount, category, date, description, image) {
        if (!amount || !category || !date) {
            alert('Please fill all required fields');
            return;
        }

        this.addTransaction(this.currentFile.id, {
            type,
            amount,
            category,
            date,
            description,
            image
        });

        this.hideModal();
    }

    showEditFileModal(fileId) {
        // Implementation for edit file modal
        alert('Edit file feature coming soon!');
    }

    showEditTransactionModal(fileId, transactionId) {
        // Implementation for edit transaction modal
        alert('Edit transaction feature coming soon!');
    }
}

// Initialize the application
let financeManager;

document.addEventListener('DOMContentLoaded', function() {
    financeManager = new FinanceManager();
    window.financeManager = financeManager;
});