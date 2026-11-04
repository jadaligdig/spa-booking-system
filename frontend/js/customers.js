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
            const response = await apiFetch('/api/customers');
            const customers = Array.isArray(response) ? response : (response.data || []);
            renderTable(customers);
        } catch (err) {
            alert('Failed to load customers: ' + err.message);
        }
    }

    function renderTable(customers) {
        if (!customers || customers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No customers found.</td></tr>';
            return;
        }

        tableBody.innerHTML = customers.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${escapeHtml(c.full_name)}</td>
                <td>${escapeHtml(c.email || 'N/A')}</td>
                <td>${escapeHtml(c.phone)}</td>
                <td>
                    <button class="btn btn-edit" onclick="editCustomer(${c.id}, '${escapeHtml(c.full_name)}', '${escapeHtml(c.email || '')}', '${escapeHtml(c.phone)}')">Edit</button>
                    <button class="btn btn-delete" onclick="deleteCustomer(${c.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }

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

    window.editCustomer = (id, fullName, email, phone) => {
        customerIdInput.value = id;
        nameInput.value = fullName;
        emailInput.value = email;
        phoneInput.value = phone;
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
    };

    window.deleteCustomer = async (id) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            try {
                await apiFetch(`/api/customers/${id}`, { method: 'DELETE' });
                loadCustomers();
            } catch (err) {
                alert('Error deleting customer: ' + err.message);
            }
        }
    };

    function resetForm() {
        form.reset();
        customerIdInput.value = '';
        if (cancelBtn) cancelBtn.style.display = 'none';
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetForm);
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (m) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }

    loadCustomers();
});