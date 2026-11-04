document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#customers-table tbody');
    const form = document.getElementById('customer-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const customerIdInput = document.getElementById('customer-id');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');

    async function loadCustomers() {
        try {
            const customers = await apiFetch('/api/customers');
            renderTable(customers);
        } catch (err) {
            alert('Failed to load customers: ' + err.message);
        }
    }

    function renderTable(customers) {
        if (!customers || customers.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="5">No customers found.</td></tr>';
            return;
        }

        tableBody.innerHTML = customers.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${escapeHtml(c.full_name)}</td>
                <td>${escapeHtml(c.email)}</td>
                <td>${escapeHtml(c.phone)}</td>
                <td>
                    <button type="button" class="btn btn-edit"
                        data-id="${c.id}">Edit</button>
                    <button type="button" class="btn btn-delete"
                        data-id="${c.id}">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    tableBody.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit');
        const deleteBtn = e.target.closest('.btn-delete');

        if (editBtn) {
            const id = editBtn.dataset.id;

            try {
                const customer = await apiFetch(`/api/customers/${id}`);

                customerIdInput.value = customer.id;
                nameInput.value = customer.full_name;
                emailInput.value = customer.email || '';
                phoneInput.value = customer.phone;

                cancelBtn.style.display = 'inline-block';
            } catch (err) {
                alert('Failed to load customer: ' + err.message);
            }
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;

            if (confirm('Are you sure you want to delete this customer?')) {
                try {
                    await apiFetch(`/api/customers/${id}`, {
                        method: 'DELETE'
                    });
                    loadCustomers();
                } catch (err) {
                    alert('Error deleting customer: ' + err.message);
                }
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = customerIdInput.value;

        const payload = {
            full_name: nameInput.value,
            email: emailInput.value,
            phone: phoneInput.value
        };

        try {
            if (id) {
                await apiFetch(`/api/customers/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                await apiFetch('/api/customers', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            resetForm();
            loadCustomers();
        } catch (err) {
            alert('Error saving customer: ' + err.message);
        }
    });

    function resetForm() {
        form.reset();
        customerIdInput.value = '';
        cancelBtn.style.display = 'none';
    }

    cancelBtn.addEventListener('click', resetForm);

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }

    loadCustomers();
});