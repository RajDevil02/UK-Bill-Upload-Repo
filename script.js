// TODO: replace with your deployed Google Apps Script Web App URL (ends with /exec)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxy9lC2SQOpzVB6ZFlCzOdk9JFvLOwXtxAjileypbiZ-2AiezSh0d6B1S4uwkfqUWUadQ/exec';

// See apps-script/Code.gs for the matching doPost handler to deploy in your Google Sheet.

const itemsBody = document.getElementById('items-body');
const addItemBtn = document.getElementById('add-item-btn');
const grandTotalEl = document.getElementById('grand-total');
const billForm = document.getElementById('bill-form');
const submitBtn = document.getElementById('submit-btn');
const statusMessage = document.getElementById('status-message');

function createItemRow() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td data-label="Item Name"><input type="text" class="item-name" placeholder="Item name" required></td>
        <td data-label="Quantity"><input type="number" class="item-qty" min="1" step="1" value="1" required></td>
        <td data-label="Rate"><input type="number" class="item-rate" min="0" step="0.01" placeholder="0.00" required></td>
        <td data-label="Amount" class="item-amount">0.00</td>
        <td data-label=""><button type="button" class="remove-item-btn">Remove</button></td>
    `;
    itemsBody.appendChild(row);
}

function recalcRow(row) {
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const amount = qty * rate;
    row.querySelector('.item-amount').textContent = amount.toFixed(2);
    return amount;
}

function recalcGrandTotal() {
    let total = 0;
    itemsBody.querySelectorAll('tr').forEach(row => {
        total += recalcRow(row);
    });
    grandTotalEl.textContent = total.toFixed(2);
}

addItemBtn.addEventListener('click', () => {
    createItemRow();
});

itemsBody.addEventListener('input', (e) => {
    if (e.target.classList.contains('item-qty') || e.target.classList.contains('item-rate')) {
        recalcGrandTotal();
    }
});

itemsBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item-btn')) {
        const rows = itemsBody.querySelectorAll('tr');
        if (rows.length > 1) {
            e.target.closest('tr').remove();
            recalcGrandTotal();
        }
    }
});

function collectFormData() {
    const items = [];
    itemsBody.querySelectorAll('tr').forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const quantity = parseFloat(row.querySelector('.item-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        items.push({ name, quantity, rate, amount: quantity * rate });
    });

    return {
        date: document.getElementById('order-date').value,
        storeName: document.getElementById('store-name').value.trim(),
        orderId: document.getElementById('order-id').value.trim(),
        items
    };
}

function showStatus(message, isError) {
    statusMessage.textContent = message;
    statusMessage.className = isError ? 'error' : 'success';
}

billForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.startsWith('PASTE_YOUR')) {
        showStatus('Set GOOGLE_SCRIPT_URL in script.js before submitting.', true);
        return;
    }

    const payload = collectFormData();

    submitBtn.disabled = true;
    showStatus('Submitting...', false);

    try {
        // text/plain avoids a CORS preflight request that Apps Script web apps don't handle.
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        showStatus('Bill submitted successfully!', false);
        billForm.reset();
        itemsBody.innerHTML = '';
        createItemRow();
        recalcGrandTotal();
    } catch (err) {
        showStatus('Failed to submit bill: ' + err.message, true);
    } finally {
        submitBtn.disabled = false;
    }
});

// start with one item row
createItemRow();
