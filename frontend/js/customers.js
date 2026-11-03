document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#customers-table tbody');
    const form = document.getElementById('customer-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const customerIdInput = document.getElementById('customer-id');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');

    // Fetch and display customers
    async function loadCustomers() {
        try {
            const customers = await apiFetch('/api/customers');
            renderTable(customers);
        } catch (err) {
            alert('Failed to load customers: ' + err.message);
        }
    }

    // Render table rows
    function renderTable(customers) {
        if (!customers || customers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">No customers found.</td></tr>';
            return;
        }

        tableBody.innerHTML = customers.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${escapeHtml(c.name)}</td>
                <td>${escapeHtml(c.email)}</td>
                <td>${escapeHtml(c.phone)}</td>
                <td>
                    <button class="btn btn-edit" onclick="editCustomer(${c.id}, '${escapeHtml(c.name)}', '${escapeHtml(c.email)}', '${escapeHtml(c.phone)}')">Edit</button>
                    <button class="btn btn-delete" onclick="deleteCustomer(${c.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    // Handle Create & Update form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = customerIdInput.value;
        const payload = {
            name: nameInput.value,
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

    // Populate form for editing
    window.editCustomer = (id, name, email, phone) => {
        customerIdInput.value = id;
        nameInput.value = name;
        emailInput.value = email;
        phoneInput.value = phone;
        cancelBtn.style.display = 'inline-block';
    };

    // Handle record deletion
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

    // Reset form state
    function resetForm() {
        form.reset();
        customerIdInput.value = '';
        cancelBtn.style.display = 'none';
    }

    cancelBtn.addEventListener('click', resetForm);

    // XSS Prevention Helper
    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (m) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }

    // Initial load call
    loadCustomers();
});