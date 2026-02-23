/**
 * Go-Muktinath Budget Estimation Logic
 * ------------------------------------
 * FR-7: System shall display budget categories.
 * FR-8: System shall show approximate cost.
 */

const budgetData = [
    {
        category: "Transport (Pokhara to Jomsom/Muktinath)",
        options: [
            { name: "Local Bus", cost: "NPR 1,500 - 2,500", note: "One-way, budget friendly" },
            { name: "Shared Jeep", cost: "NPR 3,000 - 5,000", note: "Faster than bus" },
            { name: "Domestic Flight", cost: "USD 100 - 125", note: "20-minute scenic flight" }
        ]
    },
    {
        category: "Accommodation",
        options: [
            { name: "Basic Teahouse", cost: "NPR 500 - 1,500", note: "Common bathroom, simple room" },
            { name: "Standard Hotel", cost: "NPR 3,000 - 7,000", note: "Attached bath, better amenities" }
        ]
    },
    {
        category: "Food & Water",
        options: [
            { name: "Daily Meals (3 times)", cost: "NPR 2,500 - 3,500", note: "Includes Dal Bhat, snacks" },
            { name: "Bottled Water", cost: "NPR 100 - 250", note: "Price increases with altitude" }
        ]
    },
    {
        category: "Permits & Fees",
        options: [
            { name: "ACAP Permit", cost: "NPR 3,000", note: "For foreigners (SAARC: NPR 1,000)" },
            { name: "TIMS Card", cost: "NPR 2,000", note: "Required for trekking/independent travelers" }
        ]
    }
];

function loadBudgetTable() {
    const container = document.getElementById('budget-table-container');
    if (!container) return;

    let html = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-dark">
                    <tr>
                        <th scope="col">Category</th>
                        <th scope="col">Option</th>
                        <th scope="col">Approx. Cost</th>
                        <th scope="col">Notes</th>
                    </tr>
                </thead>
                <tbody>
    `;

    budgetData.forEach(item => {
        item.options.forEach((opt, index) => {
            html += `
                <tr>
                    ${index === 0 ? `<td rowspan="${item.options.length}" class="fw-bold bg-light">${item.category}</td>` : ''}
                    <td>${opt.name}</td>
                    <td class="text-primary fw-bold">${opt.cost}</td>
                    <td class="text-muted small">${opt.note}</td>
                </tr>
            `;
        });
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadBudgetTable);