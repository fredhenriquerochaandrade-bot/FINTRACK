
/* =====================================
   FINTRACK - SISTEMA FINANCEIRO
===================================== */

// ELEMENTOS DO HTML

const modal = document.getElementById("transaction-modal");
const openModalButton = document.getElementById("add-transaction");
const closeModalButton = document.getElementById("close-modal");
const cancelButton = document.getElementById("cancel-transaction");

const form = document.getElementById("transaction-form");

const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");

const balanceValue = document.getElementById("balance-value");
const incomeValue = document.getElementById("income-value");
const expenseValue = document.getElementById("expense-value");

const transactionList = document.getElementById("transaction-list");

/* =====================================
   ETAPA 7 - GERENCIAMENTO DE TRANSAÇÕES
===================================== */

const searchInput =
    document.getElementById("transaction-search");

const categoryFilter =
    document.getElementById("category-filter");

const transactionCount =
    document.getElementById("transaction-count");

const exportButton =
    document.getElementById("export-transactions");

const modalTitle =
    document.getElementById("modal-title");

const saveButton =
    document.getElementById("save-transaction");

// null significa que estamos cadastrando
// uma nova transação.
let editingTransactionId = null;

// ARMAZENAMENTO LOCAL

const STORAGE_KEY = "fintrack_transactions";

function loadTransactions() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved.filter(transaction =>
            transaction &&
            typeof transaction.id === "string" &&
            typeof transaction.description === "string" &&
            Number.isSafeInteger(transaction.amountCents) &&
            transaction.amountCents > 0 &&
            ["income", "expense"].includes(transaction.type) &&
            typeof transaction.category === "string" &&
            typeof transaction.date === "string"
        );
    } catch (error) {
        console.error("Erro ao carregar transações:", error);
        return [];
    }
}

let transactions = loadTransactions();

/* =====================================
   ETAPA 6 - CONTROLE DE PERÍODO
===================================== */

const monthFilter = document.getElementById("month-filter");
const yearFilter = document.getElementById("year-filter");
const savingsValue = document.getElementById("savings-value");
const transactionDateInput =
    document.getElementById("transaction-date");

const currentDate = new Date();

monthFilter.value = String(currentDate.getMonth());

// Retorna a data local no formato YYYY-MM-DD
function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Preenche os anos disponíveis
function populateYearFilter() {
    const selectedYear = yearFilter.value ||
        String(currentDate.getFullYear());

    const years = new Set([currentDate.getFullYear()]);

    transactions.forEach(transaction => {
        const date = new Date(transaction.date);

        if (!Number.isNaN(date.getTime())) {
            years.add(date.getFullYear());
        }
    });

    yearFilter.replaceChildren();

    [...years].sort((a, b) => b - a).forEach(year => {
        const option = document.createElement("option");
        option.value = String(year);
        option.textContent = String(year);
        yearFilter.appendChild(option);
    });

    yearFilter.value = years.has(Number(selectedYear))
        ? selectedYear
        : String(currentDate.getFullYear());
}

// Retorna apenas as transações do mês selecionado
function getFilteredTransactions() {
    const selectedMonth = Number(monthFilter.value);
    const selectedYear = Number(yearFilter.value);

    return transactions.filter(transaction => {
        const date = new Date(transaction.date);

        return !Number.isNaN(date.getTime()) &&
            date.getMonth() === selectedMonth &&
            date.getFullYear() === selectedYear;
    });
}

// Atualiza tudo quando o período muda
monthFilter.addEventListener("change", updateDashboard);
yearFilter.addEventListener("change", updateDashboard);


function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );
        return true;
    } catch (error) {
        console.error("Erro ao salvar transações:", error);
        alert("Não foi possível salvar os dados neste navegador.");
        return false;
    }
}

// FORMATAÇÃO DE DINHEIRO

function formatMoney(cents) {
    return (cents / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// ABRIR E FECHAR MODAL

let previousFocus = null;



function openModal() {
    previousFocus = document.activeElement;

    editingTransactionId = null;

    form.reset();

    modalTitle.textContent = "Nova transação";
    saveButton.textContent = "Salvar transação";

    transactionDateInput.value =
        localDateString(new Date());

    modal.hidden = false;
    descriptionInput.focus();
}




function closeModal() {
    modal.hidden = true;

    form.reset();

    editingTransactionId = null;

    if (previousFocus) {
        previousFocus.focus();
    }
}


openModalButton.addEventListener("click", openModal);
closeModalButton.addEventListener("click", closeModal);
cancelButton.addEventListener("click", closeModal);

modal.addEventListener("click", function(event) {
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && !modal.hidden) {
        closeModal();
    }

    if (event.key === "Tab" && !modal.hidden) {
        const focusable = Array.from(
            modal.querySelectorAll(
                "button:not([disabled]), input:not([disabled]), select:not([disabled])"
            )
        );

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
});

// CADASTRAR TRANSAÇÃO


// CADASTRAR OU EDITAR TRANSAÇÃO

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const selectedDate = transactionDateInput.value;

    const amountCents = Math.round(amount * 100);

    // Validar os campos
    if (
        !description ||
        description.length > 80 ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 999999999 ||
        !Number.isSafeInteger(amountCents) ||
        !["income", "expense"].includes(type) ||
        !category ||
        !selectedDate
    ) {
        alert("Preencha os campos corretamente.");
        return;
    }

    const parsedDate = new Date(
        selectedDate + "T12:00:00"
    );

    if (
        Number.isNaN(parsedDate.getTime()) ||
        localDateString(parsedDate) !== selectedDate
    ) {
        alert("Selecione uma data válida.");
        return;
    }

    // Criar os dados atualizados
    const transactionData = {
        description: description,
        amountCents: amountCents,
        type: type,
        category: category,
        date: parsedDate.toISOString()
    };

    // Guardar uma cópia para recuperar
    // caso o armazenamento falhe.
    const previousTransactions = transactions;

    if (editingTransactionId !== null) {

        // EDITAR TRANSAÇÃO EXISTENTE
        const exists = transactions.some(
            item => item.id === editingTransactionId
        );

        if (!exists) {
            alert("Transação não encontrada.");
            return;
        }

        transactions = transactions.map(function(item) {
            if (item.id === editingTransactionId) {
                return {
                    ...item,
                    ...transactionData
                };
            }

            return item;
        });

    } else {

        // CADASTRAR NOVA TRANSAÇÃO
        const newTransaction = {
            id: crypto.randomUUID(),
            ...transactionData
        };

        transactions = [...transactions, newTransaction];
    }

    // Salvar os dados
    if (!saveTransactions()) {
        transactions = previousTransactions;
        return;
    }

    // Atualizar o período selecionado
    monthFilter.value = String(parsedDate.getMonth());

    populateYearFilter();
    yearFilter.value = String(parsedDate.getFullYear());

    // Limpar a pesquisa para mostrar o registro
    searchInput.value = "";
    categoryFilter.value = "all";

    updateDashboard();
    closeModal();
});


// CALCULAR SALDO, RECEITAS E DESPESAS


function updateDashboard() {
    const filteredTransactions = getFilteredTransactions();

    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach(function(transaction) {
        if (transaction.type === "income") {
            totalIncome += transaction.amountCents;
        } else {
            totalExpense += transaction.amountCents;
        }
    });

    const balance = totalIncome - totalExpense;

    // Taxa de economia
    const savingsRate = totalIncome > 0
        ? (balance / totalIncome) * 100
        : null;

    // Atualizar cartões
    balanceValue.textContent = formatMoney(balance);
    incomeValue.textContent = formatMoney(totalIncome);
    expenseValue.textContent = formatMoney(totalExpense);

    savingsValue.textContent = savingsRate === null
        ? "—"
        : savingsRate.toLocaleString("pt-BR", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }) + "%";

    balanceValue.style.color =
        balance < 0 ? "#F87171" : "#16C784";

    savingsValue.style.color =
        savingsRate !== null && savingsRate < 0
            ? "#F87171"
            : "#A78BFA";

// FILTRAR TRANSAÇÕES DO HISTÓRICO

function getVisibleTransactions() {
    const searchTerm = searchInput.value
        .trim()
        .toLocaleLowerCase("pt-BR");

    const selectedCategory = categoryFilter.value;

    return getFilteredTransactions().filter(
        function(transaction) {

            const matchesSearch = transaction.description
                .toLocaleLowerCase("pt-BR")
                .includes(searchTerm);

            const matchesCategory =
                selectedCategory === "all" ||
                transaction.category === selectedCategory;

            return matchesSearch && matchesCategory;
        }
    );
}

// ATUALIZAR LISTA AO PESQUISAR

searchInput.addEventListener("input", renderTransactions);

categoryFilter.addEventListener(
    "change",
    renderTransactions
);

renderTransactions();
updateCharts();
renderBudgets();
updateReports();
}




/* =====================================
   ETAPA 7 - PESQUISA E FILTROS
===================================== */

function getVisibleTransactions() {

    const searchTerm = searchInput.value
        .trim()
        .toLocaleLowerCase("pt-BR");

    const selectedCategory = categoryFilter.value;

    return getFilteredTransactions().filter(
        function(transaction) {

            const matchesSearch = transaction.description
                .toLocaleLowerCase("pt-BR")
                .includes(searchTerm);

            const matchesCategory =
                selectedCategory === "all" ||
                transaction.category === selectedCategory;

            return matchesSearch && matchesCategory;
        }
    );
}

// Atualizar lista ao pesquisar
searchInput.addEventListener("input", renderTransactions);

// Atualizar lista ao mudar categoria
categoryFilter.addEventListener("change", renderTransactions);



// EXIBIR TRANSAÇÕES COM FILTROS E EDIÇÃO

function renderTransactions() {
    transactionList.replaceChildren();

    const visibleTransactions = getVisibleTransactions();

    transactionCount.textContent =
        visibleTransactions.length === 1
            ? "1 transação encontrada"
            : visibleTransactions.length +
              " transações encontradas";

    if (visibleTransactions.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.textContent =
            "Nenhuma transação encontrada para os filtros selecionados.";

        transactionList.appendChild(emptyMessage);
        return;
    }

    const sortedTransactions = [...visibleTransactions].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    sortedTransactions.forEach(function(transaction) {

        // Container principal
        const item = document.createElement("div");
        item.className = "transaction-item";

        // Informações
        const info = document.createElement("div");
        info.className = "transaction-info";

        const title = document.createElement("h4");
        title.textContent = transaction.description;

        const details = document.createElement("p");

        const date = new Date(transaction.date);

        const formattedDate = Number.isNaN(date.getTime())
            ? "Data indisponível"
            : date.toLocaleDateString("pt-BR");

        details.textContent =
            transaction.category + " • " + formattedDate;

        info.append(title, details);

        // Valor e botões
        const right = document.createElement("div");
        right.className = "transaction-right";

        const value = document.createElement("span");
        value.className = "transaction-value";

        if (transaction.type === "income") {
            value.classList.add("positive");
            value.textContent =
                "+ " + formatMoney(transaction.amountCents);
        } else {
            value.classList.add("negative");
            value.textContent =
                "- " + formatMoney(transaction.amountCents);
        }

        // Botão editar
        const editButton = document.createElement("button");
        editButton.className = "edit-button";
        editButton.type = "button";
        editButton.textContent = "Editar";

        editButton.addEventListener("click", function() {
            editTransaction(transaction.id);
        });

        // Botão excluir
        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.type = "button";
        deleteButton.textContent = "Excluir";

        deleteButton.addEventListener("click", function() {
            deleteTransaction(transaction.id);
        });

        const buttons = document.createElement("div");
        buttons.className = "transaction-buttons";

        buttons.append(editButton, deleteButton);

        right.append(value, buttons);
        item.append(info, right);

        transactionList.appendChild(item);
    });
}


// EXCLUIR TRANSAÇÃO

function deleteTransaction(id) {
    const confirmed = confirm(
        "Tem certeza que deseja excluir esta transação?"
    );

    if (!confirmed) {
        return;
    }

    const previousTransactions = transactions;

    transactions = transactions.filter(function(transaction) {
        return transaction.id !== id;
    });

    if (!saveTransactions()) {
        transactions = previousTransactions;
        return;
    }

    updateDashboard();
}

// INICIALIZAR O SISTEMA

/* =====================================
   ETAPA 5 - GRÁFICOS FINANCEIROS
===================================== */

// Referências aos gráficos
let financeChart = null;
let categoryChart = null;

// Configurações gerais
const chartColors = {
    green: "#16C784",
    red: "#F87171",
    blue: "#2583FF",
    purple: "#A78BFA",
    yellow: "#FBBF24",
    cyan: "#38BDF8",
    gray: "#8493A9"
};

// Atualiza os dois gráficos
function updateCharts() {
    if (typeof Chart === "undefined") {
        console.error("Biblioteca Chart.js não carregada.");
        return;
    }

    updateFinanceChart();
    updateCategoryChart();
}

// GRÁFICO DE RECEITAS E DESPESAS

function updateFinanceChart() {
    const canvas = document.getElementById("finance-chart");

    if (!canvas) return;

    
const today = new Date(
    Number(yearFilter.value),
    Number(monthFilter.value),
    1
);


    const months = [];
    const incomeData = [];
    const expenseData = [];

    // Cria os últimos seis meses
    for (let i = 5; i >= 0; i--) {
        const date = new Date(
            today.getFullYear(),
            today.getMonth() - i,
            1
        );

        const year = date.getFullYear();
        const month = date.getMonth();

        const label = date.toLocaleDateString("pt-BR", {
            month: "short",
            year: "2-digit"
        });

        months.push(label);

        let income = 0;
        let expense = 0;

       getFilteredTransactions().forEach(function(transaction) {
            const transactionDate = new Date(transaction.date);

            if (Number.isNaN(transactionDate.getTime())) {
                return;
            }

            // Compara o mês e o ano da transação
            if (
                transactionDate.getMonth() === month &&
                transactionDate.getFullYear() === year
            ) {
                if (transaction.type === "income") {
                    income += transaction.amountCents;
                } else {
                    expense += transaction.amountCents;
                }
            }
        });

        incomeData.push(income / 100);
        expenseData.push(expense / 100);
    }

    // Remove o gráfico anterior
    if (financeChart) {
        financeChart.destroy();
    }

    financeChart = new Chart(canvas, {
        type: "line",

        data: {
            labels: months,

            datasets: [
                {
                    label: "Receitas",
                    data: incomeData,
                    borderColor: chartColors.green,
                    backgroundColor: "rgba(22, 199, 132, 0.12)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                },
                {
                    label: "Despesas",
                    data: expenseData,
                    borderColor: chartColors.red,
                    backgroundColor: "rgba(248, 113, 113, 0.08)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            plugins: {
                legend: {
                    labels: {
                        color: "#A9B8CC",
                        usePointStyle: true
                    }
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ": " +
                                context.parsed.y.toLocaleString(
                                    "pt-BR",
                                    {
                                        style: "currency",
                                        currency: "BRL"
                                    }
                                );
                        }
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#8493A9"
                    },
                    grid: {
                        display: false
                    }
                },

                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#8493A9",
                        callback: function(value) {
                            return "R$ " + value.toLocaleString("pt-BR");
                        }
                    },
                    grid: {
                        color: "rgba(132, 147, 169, 0.12)"
                    }
                }
            }
        }
    });
}

// GRÁFICO DE DESPESAS POR CATEGORIA

function updateCategoryChart() {
    const canvas = document.getElementById("category-chart");

    if (!canvas) return;

    const categoryTotals = {};

    // Soma todas as despesas por categoria
    transactions.forEach(function(transaction) {
        if (transaction.type !== "expense") {
            return;
        }

        const category = transaction.category;

        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }

        categoryTotals[category] += transaction.amountCents;
    });

    const labels = Object.keys(categoryTotals);

    const values = Object.values(categoryTotals).map(
        value => value / 100
    );

    const colors = [
        chartColors.green,
        chartColors.blue,
        chartColors.purple,
        chartColors.yellow,
        chartColors.red,
        chartColors.cyan
    ];

    // Remove o gráfico anterior
    if (categoryChart) {
        categoryChart.destroy();
    }

    // Mostra uma distribuição vazia se não houver despesas
    const hasExpenses = values.length > 0;

    categoryChart = new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: hasExpenses
                ? labels
                : ["Sem despesas"],

            datasets: [{
                data: hasExpenses ? values : [1],
                backgroundColor: hasExpenses
                    ? labels.map((_, index) =>
                        colors[index % colors.length]
                    )
                    : ["#26344A"],
                borderColor: "#111A2B",
                borderWidth: 3,
                hoverOffset: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",

            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#A9B8CC",
                        padding: 15,
                        usePointStyle: true,
                        boxWidth: 10
                    }
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (!hasExpenses) {
                                return "Nenhuma despesa cadastrada";
                            }

                            return context.label + ": " +
                                context.parsed.toLocaleString(
                                    "pt-BR",
                                    {
                                        style: "currency",
                                        currency: "BRL"
                                    }
                                );
                        }
                    }
                }
            }
        }
    });
}

// ABRIR FORMULÁRIO PARA EDIÇÃO

function editTransaction(id) {
    const transaction = transactions.find(
        item => item.id === id
    );

    if (!transaction) {
        alert("Transação não encontrada.");
        return;
    }

    previousFocus = document.activeElement;
    editingTransactionId = id;

    modalTitle.textContent = "Editar transação";
    saveButton.textContent = "Salvar alterações";

    descriptionInput.value = transaction.description;

    amountInput.value = (
        transaction.amountCents / 100
    ).toFixed(2);

    typeInput.value = transaction.type;
    categoryInput.value = transaction.category;

    transactionDateInput.value = localDateString(
        new Date(transaction.date)
    );

    modal.hidden = false;
    descriptionInput.focus();
}


/* =====================================
   EXPORTAÇÃO DE BACKUP
===================================== */


// EXPORTAR BACKUP COMPLETO DO FINTRACK

function exportTransactions() {

    const backup = {
        application: "FINTRACK",
        version: 2,
        exportedAt: new Date().toISOString(),

        // Todas as transações cadastradas
        transactions: transactions,

        // Todos os limites de orçamento
        budgets: budgets
    };

    const json = JSON.stringify(backup, null, 2);

    const blob = new Blob([json], {
        type: "application/json;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    const today = localDateString(new Date());

    link.download = `fintrack-backup-${today}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);
}


exportButton.addEventListener(
    "click",
    exportTransactions
);

/* =====================================
   ETAPA 8 - CONTROLE DE ORÇAMENTOS
===================================== */

const BUDGET_STORAGE_KEY = "fintrack_budgets";

const budgetForm = document.getElementById("budget-form");
const budgetCategory = document.getElementById("budget-category");
const budgetLimit = document.getElementById("budget-limit");
const budgetList = document.getElementById("budget-list");

// CARREGAR ORÇAMENTOS

function loadBudgets() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(BUDGET_STORAGE_KEY) || "{}"
        );

        if (
            saved === null ||
            typeof saved !== "object" ||
            Array.isArray(saved)
        ) {
            return {};
        }

        const validBudgets = {};

        Object.entries(saved).forEach(([category, limit]) => {
            if (
                typeof category === "string" &&
                Number.isSafeInteger(limit) &&
                limit > 0
            ) {
                validBudgets[category] = limit;
            }
        });

        return validBudgets;

    } catch (error) {
        console.error("Erro ao carregar orçamentos:", error);
        return {};
    }
}

let budgets = loadBudgets();

// SALVAR ORÇAMENTOS

function saveBudgets() {
    try {
        localStorage.setItem(
            BUDGET_STORAGE_KEY,
            JSON.stringify(budgets)
        );

        return true;

    } catch (error) {
        console.error("Erro ao salvar orçamentos:", error);
        alert("Não foi possível salvar o orçamento.");
        return false;
    }
}

// CADASTRAR OU ATUALIZAR LIMITE

budgetForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const category = budgetCategory.value;
    const amount = Number(budgetLimit.value);
    const limitCents = Math.round(amount * 100);

    if (
        !category ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 999999999 ||
        !Number.isSafeInteger(limitCents)
    ) {
        alert("Informe um limite válido.");
        return;
    }

    const previousBudgets = { ...budgets };

    // Uma categoria possui apenas um limite.
    // Salvar novamente atualiza o limite existente.
    budgets[category] = limitCents;

    if (!saveBudgets()) {
        budgets = previousBudgets;
        return;
    }

    budgetForm.reset();
    renderBudgets();
});

// EXCLUIR ORÇAMENTO

function deleteBudget(category) {
    const confirmed = confirm(
        `Deseja remover o limite de ${category}?`
    );

    if (!confirmed) return;

    const previousBudgets = { ...budgets };

    delete budgets[category];

    if (!saveBudgets()) {
        budgets = previousBudgets;
        return;
    }

    renderBudgets();
}

// CALCULAR DESPESAS DE UMA CATEGORIA

function getCategoryExpenses(category) {
    return getFilteredTransactions()
        .filter(transaction =>
            transaction.type === "expense" &&
            transaction.category === category
        )
        .reduce(
            (total, transaction) =>
                total + transaction.amountCents,
            0
        );
}

// EXIBIR ORÇAMENTOS

function renderBudgets() {
    budgetList.replaceChildren();

    const categories = Object.keys(budgets);

    if (categories.length === 0) {
        const message = document.createElement("p");
        message.textContent = "Nenhum orçamento definido.";
        budgetList.appendChild(message);
        return;
    }

    categories.forEach(function(category) {
        const limit = budgets[category];
        const spent = getCategoryExpenses(category);

        const percentage = (spent / limit) * 100;
        const progressWidth = Math.min(percentage, 100);

        let color = "#16C784";
        let status = "Dentro do orçamento";

        if (percentage > 100) {
            color = "#F87171";
            status = "Orçamento ultrapassado!";
        } else if (percentage >= 80) {
            color = "#FBBF24";
            status = "Atenção: próximo do limite!";
        }

        const item = document.createElement("div");
        item.className = "budget-item";

        const header = document.createElement("div");
        header.className = "budget-item-header";

        const title = document.createElement("h4");
        title.textContent = category;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "budget-delete";
        deleteButton.textContent = "Remover";

        deleteButton.addEventListener("click", function() {
            deleteBudget(category);
        });

        header.append(title, deleteButton);

        const amount = document.createElement("p");
        amount.className = "budget-amount";
        amount.textContent =
            `${formatMoney(spent)} de ${formatMoney(limit)}`;

        const progress = document.createElement("div");
        progress.className = "budget-progress";
        progress.setAttribute("role", "progressbar");
        progress.setAttribute("aria-label", category);
        progress.setAttribute("aria-valuemin", "0");
        progress.setAttribute("aria-valuemax", "100");
        progress.setAttribute(
            "aria-valuenow",
            String(Math.round(progressWidth))
        );

        const fill = document.createElement("div");
        fill.className = "budget-progress-fill";
        fill.style.width = `${progressWidth}%`;
        fill.style.backgroundColor = color;

        progress.appendChild(fill);

        const statusText = document.createElement("p");
        statusText.className = "budget-status";
        statusText.style.color = color;

        statusText.textContent =
            `${percentage.toFixed(1).replace(".", ",")}% utilizado — ${status}`;

        item.append(
            header,
            amount,
            progress,
            statusText
        );

        budgetList.appendChild(item);
    });
}

/* =====================================
   ETAPA 9 - IMPORTAÇÃO DE BACKUP
===================================== */

const importButton =
    document.getElementById("import-transactions");

const backupFileInput =
    document.getElementById("backup-file");

const MAX_BACKUP_SIZE = 5 * 1024 * 1024;

// ABRIR SELETOR DE ARQUIVOS

importButton.addEventListener("click", function() {
    backupFileInput.click();
});

// VALIDAR TRANSAÇÃO DO BACKUP

function validateBackupTransaction(item) {
    if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item) ||
        typeof item.id !== "string" ||
        item.id.trim() === "" ||
        typeof item.description !== "string" ||
        item.description.trim() === "" ||
        item.description.length > 80 ||
        !Number.isSafeInteger(item.amountCents) ||
        item.amountCents <= 0 ||
        item.amountCents > 99999999900 ||
        !["income", "expense"].includes(item.type) ||
        typeof item.category !== "string" ||
        ![
            "Salário",
            "Alimentação",
            "Transporte",
            "Moradia",
            "Lazer",
            "Outros"
        ].includes(item.category) ||
        typeof item.date !== "string" ||
        !Number.isFinite(Date.parse(item.date))
    ) {
        return false;
    }

    return true;
}

// VALIDAR E PREPARAR O BACKUP

function validateBackup(data) {

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        data.application !== "FINTRACK" ||
        ![1, 2].includes(data.version) ||
        !Array.isArray(data.transactions)
    ) {
        throw new Error(
            "Arquivo incompatível com o FINTRACK."
        );
    }

    // Impede arquivos com dados inválidos
    if (!data.transactions.every(validateBackupTransaction)) {
        throw new Error(
            "O backup contém transações inválidas."
        );
    }

    // Impede identificadores repetidos
    const ids = data.transactions.map(item => item.id);

    if (new Set(ids).size !== ids.length) {
        throw new Error(
            "O backup contém transações duplicadas."
        );
    }

    let importedBudgets = {};

    // Backups da versão 2 incluem orçamentos
    if (data.version === 2) {

        if (
            !data.budgets ||
            typeof data.budgets !== "object" ||
            Array.isArray(data.budgets)
        ) {
            throw new Error(
                "Os orçamentos do backup são inválidos."
            );
        }

        for (const [category, limit] of
            Object.entries(data.budgets)) {

            const validCategory = [
                "Salário",
                "Alimentação",
                "Transporte",
                "Moradia",
                "Lazer",
                "Outros"
            ].includes(category);

            if (
                !validCategory ||
                !Number.isSafeInteger(limit) ||
                limit <= 0 ||
                limit > 99999999900
            ) {
                throw new Error(
                    "O backup contém limites inválidos."
                );
            }

            importedBudgets[category] = limit;
        }
    }

    return {
        version: data.version,
        transactions: data.transactions.map(item => ({
            id: item.id,
            description: item.description,
            amountCents: item.amountCents,
            type: item.type,
            category: item.category,
            date: item.date
        })),
        budgets: importedBudgets
    };
}

// LER O ARQUIVO SELECIONADO

backupFileInput.addEventListener(
    "change",
    async function(event) {

        const file = event.target.files[0];

        if (!file) return;

        try {

            if (file.size > MAX_BACKUP_SIZE) {
                throw new Error(
                    "O arquivo excede o limite de 5 MB."
                );
            }

            if (!file.name.toLowerCase().endsWith(".json")) {
                throw new Error(
                    "Selecione um arquivo JSON."
                );
            }

            const content = await file.text();
            const parsedData = JSON.parse(content);

            // Valida antes de modificar qualquer dado
            const backup = validateBackup(parsedData);

            const replace = confirm(
                "Como deseja importar o backup?\n\n" +
                "OK = Substituir os dados atuais.\n" +
                "Cancelar = Escolher mesclar ou desistir."
            );

            let mode = "replace";

            if (!replace) {
                const merge = confirm(
                    "Deseja MESCLAR as transações?\n\n" +
                    "OK = Mesclar sem duplicar IDs.\n" +
                    "Cancelar = Não importar."
                );

                if (!merge) return;

                mode = "merge";
            }

            importBackupData(backup, mode);

        } catch (error) {
            console.error("Erro na importação:", error);

            alert(
                "Não foi possível importar o backup.\n\n" +
                error.message
            );

        } finally {
            // Permite selecionar o mesmo arquivo novamente
            backupFileInput.value = "";
        }
    }
);

// RESTAURAR OU MESCLAR DADOS

function importBackupData(backup, mode) {

    const previousTransactions = transactions;
    const previousBudgets = budgets;

    let nextTransactions;
    let nextBudgets;

    if (mode === "replace") {

        nextTransactions = [...backup.transactions];

        // Backups antigos não possuem orçamentos.
        // Nesse caso, preservamos os limites atuais.
        nextBudgets = backup.version === 2
            ? { ...backup.budgets }
            : { ...budgets };

    } else if (mode === "merge") {

        const existingIds = new Set(
            transactions.map(item => item.id)
        );

        const newTransactions =
            backup.transactions.filter(
                item => !existingIds.has(item.id)
            );

        nextTransactions = [
            ...transactions,
            ...newTransactions
        ];

        // Em caso de conflito, os limites atuais
        // têm prioridade sobre os importados.
        nextBudgets = backup.version === 2
            ? { ...backup.budgets, ...budgets }
            : { ...budgets };

    } else {
        throw new Error("Modo de importação inválido.");
    }

    // Preparar os dados para armazenamento
    const oldTransactionsJSON =
        localStorage.getItem(STORAGE_KEY);

    const oldBudgetsJSON =
        localStorage.getItem(BUDGET_STORAGE_KEY);

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(nextTransactions)
        );

        localStorage.setItem(
            BUDGET_STORAGE_KEY,
            JSON.stringify(nextBudgets)
        );

    } catch (error) {

        // Tentar restaurar os valores anteriores
        try {
            if (oldTransactionsJSON === null) {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(
                    STORAGE_KEY,
                    oldTransactionsJSON
                );
            }

            if (oldBudgetsJSON === null) {
                localStorage.removeItem(BUDGET_STORAGE_KEY);
            } else {
                localStorage.setItem(
                    BUDGET_STORAGE_KEY,
                    oldBudgetsJSON
                );
            }
        } catch (rollbackError) {
            console.error(
                "Falha ao restaurar armazenamento:",
                rollbackError
            );
        }

        transactions = previousTransactions;
        budgets = previousBudgets;

        throw new Error(
            "Falha ao salvar os dados importados. " +
            "Verifique o espaço do navegador e " +
            "confira os dados antes de continuar."
        );
    }

    // Aplicar os dados somente após salvar
    transactions = nextTransactions;
    budgets = nextBudgets;

    // Atualizar os filtros de período
    populateYearFilter();

    const dates = transactions
        .map(item => new Date(item.date))
        .filter(date => !Number.isNaN(date.getTime()));

    if (dates.length > 0) {
        const latestDate = new Date(
            Math.max(...dates.map(date => date.getTime()))
        );

        populateYearFilter();

        yearFilter.value = String(latestDate.getFullYear());
        monthFilter.value = String(latestDate.getMonth());
    }

    // Limpar pesquisa e filtro de categoria
    searchInput.value = "";
    categoryFilter.value = "all";

    // Atualizar toda a interface
    updateDashboard();

    alert(
        "Backup importado com sucesso!\n\n" +
        "Transações: " + transactions.length + "\n" +
        "Orçamentos: " + Object.keys(budgets).length
    );
}

/* =====================================
   ETAPA 10 - RELATÓRIOS AVANÇADOS
===================================== */

const reportIncome =
    document.getElementById("report-income");

const reportExpense =
    document.getElementById("report-expense");

const reportBalance =
    document.getElementById("report-balance");

const reportCount =
    document.getElementById("report-count");

const incomeChange =
    document.getElementById("income-change");

const expenseChange =
    document.getElementById("expense-change");

const reportCategoryList =
    document.getElementById("report-category-list");

const exportCsvButton =
    document.getElementById("export-csv");

// CALCULAR TOTAIS DE UM CONJUNTO DE TRANSAÇÕES

function calculateReportTotals(items) {
    let income = 0;
    let expense = 0;

    items.forEach(function(item) {
        if (item.type === "income") {
            income += item.amountCents;
        } else if (item.type === "expense") {
            expense += item.amountCents;
        }
    });

    return {
        income: income,
        expense: expense,
        balance: income - expense,
        count: items.length
    };
}

// BUSCAR TRANSAÇÕES DE UM MÊS ESPECÍFICO

function getTransactionsByMonth(year, month) {
    return transactions.filter(function(item) {
        const date = new Date(item.date);

        return !Number.isNaN(date.getTime()) &&
            date.getFullYear() === year &&
            date.getMonth() === month;
    });
}

// CALCULAR VARIAÇÃO PERCENTUAL

function calculatePercentageChange(current, previous) {
    if (previous === 0) {
        return current === 0 ? "0,0%" : "Sem base anterior";
    }

    const change = ((current - previous) / previous) * 100;

    const sign = change > 0 ? "+" : "";

    return sign + change.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }) + "%";
}

// ATUALIZAR RELATÓRIO

function updateReports() {
    const selectedMonth = Number(monthFilter.value);
    const selectedYear = Number(yearFilter.value);

    const currentTransactions = getFilteredTransactions();

    const currentTotals =
        calculateReportTotals(currentTransactions);

    // Cartões do relatório
    reportIncome.textContent =
        formatMoney(currentTotals.income);

    reportExpense.textContent =
        formatMoney(currentTotals.expense);

    reportBalance.textContent =
        formatMoney(currentTotals.balance);

    reportCount.textContent =
        String(currentTotals.count);

    reportBalance.style.color =
        currentTotals.balance < 0
            ? "#F87171"
            : "#16C784";

    // Mês anterior, incluindo mudança de ano
    const previousDate = new Date(
        selectedYear,
        selectedMonth - 1,
        1
    );

    const previousTransactions = getTransactionsByMonth(
        previousDate.getFullYear(),
        previousDate.getMonth()
    );

    const previousTotals =
        calculateReportTotals(previousTransactions);

    // Comparação mensal
    incomeChange.textContent =
        calculatePercentageChange(
            currentTotals.income,
            previousTotals.income
        );

    expenseChange.textContent =
        calculatePercentageChange(
            currentTotals.expense,
            previousTotals.expense
        );

    // Cores da variação
    incomeChange.style.color =
        currentTotals.income >= previousTotals.income
            ? "#16C784"
            : "#F87171";

    expenseChange.style.color =
        currentTotals.expense <= previousTotals.expense
            ? "#16C784"
            : "#F87171";

    // Ranking das categorias
    renderReportCategories(currentTransactions);
}

// EXIBIR RANKING DE CATEGORIAS

function renderReportCategories(items) {
    reportCategoryList.replaceChildren();

    const totals = {};

    items.forEach(function(item) {
        if (item.type !== "expense") {
            return;
        }

        if (!totals[item.category]) {
            totals[item.category] = 0;
        }

        totals[item.category] += item.amountCents;
    });

    const categories = Object.entries(totals)
        .sort((a, b) => b[1] - a[1]);

    if (categories.length === 0) {
        const message = document.createElement("p");
        message.textContent =
            "Nenhuma despesa cadastrada neste período.";

        reportCategoryList.appendChild(message);
        return;
    }

    const highestExpense = categories[0][1];

    categories.forEach(function([category, value]) {
        const percentage = highestExpense > 0
            ? (value / highestExpense) * 100
            : 0;

        const item = document.createElement("div");
        item.className = "report-category-item";

        const info = document.createElement("div");
        info.className = "report-category-info";

        const name = document.createElement("span");
        name.className = "report-category-name";
        name.textContent = category;

        const amount = document.createElement("span");
        amount.className = "report-category-value";
        amount.textContent = formatMoney(value);

        info.append(name, amount);

        const progress = document.createElement("div");
        progress.className = "report-category-progress";

        const fill = document.createElement("div");
        fill.className = "report-category-fill";
        fill.style.width = percentage + "%";

        progress.appendChild(fill);
        item.append(info, progress);

        reportCategoryList.appendChild(item);
    });
}

/* =====================================
   ETAPA 10 - EXPORTAÇÃO CSV
===================================== */

// Protege valores de texto ao abrir o CSV
// em aplicativos de planilha.
function safeCsvText(value) {
    const text = String(value);

    // Evita que descrições sejam interpretadas
    // como fórmulas por aplicativos de planilha.
    if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) {
        return "'" + text;
    }

    return text;
}

// Formata cada célula CSV
function csvCell(value) {
    const text = String(value);

    return '"' + text.replace(/"/g, '""') + '"';
}

// EXPORTAR TRANSAÇÕES DO MÊS SELECIONADO

function exportTransactionsCSV() {
    const items = getFilteredTransactions();

    if (items.length === 0) {
        alert(
            "Não existem transações neste período para exportar."
        );
        return;
    }

    const header = [
        "Data",
        "Descrição",
        "Tipo",
        "Categoria",
        "Valor (R$)"
    ];

    const rows = items.map(function(item) {
        const date = new Date(item.date);

        const formattedDate = date.toLocaleDateString("pt-BR");

        const type = item.type === "income"
            ? "Receita"
            : "Despesa";

        // Despesas são exportadas com valor negativo
        const signedCents = item.type === "expense"
            ? -item.amountCents
            : item.amountCents;

        const value = (signedCents / 100)
            .toFixed(2)
            .replace(".", ",");

        return [
            formattedDate,
            safeCsvText(item.description),
            type,
            safeCsvText(item.category),
            value
        ];
    });

    // Ponto e vírgula funciona bem no Excel
    // configurado para português do Brasil.
    const csv = [
        header.map(csvCell).join(";"),
        ...rows.map(row => row.map(csvCell).join(";"))
    ].join("\r\n");

    // BOM ajuda o Excel a reconhecer UTF-8.
    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    const year = yearFilter.value;
    const month = String(
        Number(monthFilter.value) + 1
    ).padStart(2, "0");

    link.download =
        `fintrack-relatorio-${year}-${month}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);
}

exportCsvButton.addEventListener(
    "click",
    exportTransactionsCSV
);


/* =====================================
   ETAPA 11 - MENU RESPONSIVO
===================================== */

const sidebar =
    document.getElementById("sidebar");

const mobileMenuButton =
    document.getElementById("mobile-menu-button");

const sidebarOverlay =
    document.getElementById("sidebar-overlay");

const sidebarLinks =
    document.querySelectorAll(
        '.sidebar nav a[href^="#"]'
    );

// ABRIR MENU

function openMobileMenu() {
    sidebar.classList.add("sidebar-open");

    sidebarOverlay.classList.add(
        "overlay-visible"
    );

    mobileMenuButton.setAttribute(
        "aria-expanded",
        "true"
    );

    mobileMenuButton.setAttribute(
        "aria-label",
        "Fechar menu"
    );

    mobileMenuButton.textContent = "✕";
}

// FECHAR MENU

function closeMobileMenu() {
    sidebar.classList.remove("sidebar-open");

    sidebarOverlay.classList.remove(
        "overlay-visible"
    );

    mobileMenuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    mobileMenuButton.setAttribute(
        "aria-label",
        "Abrir menu"
    );

    mobileMenuButton.textContent = "☰";
}

// BOTÃO MOBILE

mobileMenuButton.addEventListener(
    "click",
    function() {
        if (
            sidebar.classList.contains(
                "sidebar-open"
            )
        ) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }
);

// FECHAR AO CLICAR FORA

sidebarOverlay.addEventListener(
    "click",
    closeMobileMenu
);

// FECHAR AO SELECIONAR UM LINK

sidebarLinks.forEach(function(link) {
    link.addEventListener("click", function() {
        closeMobileMenu();
    });
});

// FECHAR COM ESC

document.addEventListener(
    "keydown",
    function(event) {
        if (event.key === "Escape") {
            closeMobileMenu();
        }
    }
);

// FECHAR SE A TELA VOLTAR AO DESKTOP

window.addEventListener("resize", function() {
    if (window.innerWidth > 768) {
        closeMobileMenu();
    }
});

/* =====================================
   ETAPA 11 - NAVEGAÇÃO ATIVA
===================================== */

const navigationSections = [
    "dashboard",
    "transactions",
    "reports",
    "budgets"
];

function updateActiveNavigation() {
    let currentSection = "dashboard";

    const scrollPosition =
        window.scrollY + 160;

    navigationSections.forEach(function(id) {
        const section = document.getElementById(id);

        if (
            section &&
            section.getBoundingClientRect().top +
                window.scrollY <= scrollPosition
        ) {
            currentSection = id;
        }
    });

    sidebarLinks.forEach(function(link) {
        const isActive =
            link.getAttribute("href") ===
            "#" + currentSection;

        link.classList.toggle(
            "active",
            isActive
        );

        if (isActive) {
            link.setAttribute(
                "aria-current",
                "location"
            );
        } else {
            link.removeAttribute(
                "aria-current"
            );
        }
    });
}

window.addEventListener(
    "scroll",
    updateActiveNavigation,
    { passive: true }
);

window.addEventListener(
    "resize",
    updateActiveNavigation
);

updateActiveNavigation();

// INICIALIZAR O FINTRACK

populateYearFilter();
updateDashboard();