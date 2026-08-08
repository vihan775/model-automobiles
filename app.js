// --- Supabase Configuration ---
// REPLACE THESE WITH YOUR ACTUAL SUPABASE URL AND ANON KEY BEFORE DEPLOYING
const SUPABASE_URL = 'https://sbyookvpqghxvyupakjj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieW9va3ZwcWdoeHZ5dXBha2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxODEwNTIsImV4cCI6MjEwMTc1NzA1Mn0.lmRJT7bhHT5B5M9XrJLQYziNcfFt2-wsgo7tYyP89Zg';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let currentUser = null;

// --- Sidebar Logic ---
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
function toggleSidebar(show) {
    if (show) {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.getElementById('sidebar-user-name').textContent = currentUser ? currentUser.name : 'Not Logged In';
        document.getElementById('sidebar-user-role').textContent = currentUser ? currentUser.role : '';
    } else {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    }
}
document.querySelectorAll('.hamburger-btn').forEach(btn => btn.addEventListener('click', () => toggleSidebar(true)));
document.getElementById('close-sidebar').addEventListener('click', () => toggleSidebar(false));
sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

// --- Screen Switching & Data Fetching ---
async function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Fetch live data based on screen
    if (screenId === 'owner-dashboard') await renderOwnerDashboard();
    if (screenId === 'manager-dashboard') await renderManagerDashboard();
    if (screenId === 'telecaller-dashboard') await renderTelecallerDashboard();
    if (screenId === 'salesman-dashboard') await renderSalesmanDashboard();
    if (screenId === 'serviceman-dashboard') await renderServicemanDashboard();
    if (screenId === 'finance-dashboard') await renderFinanceDashboard();
}

// --- Login Logic ---
function initLogin() {
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').style.display = 'none';
    
    const passwordInput = document.getElementById('login-password');
    passwordInput.setAttribute('type', 'password');
    const toggleIcon = document.getElementById('toggle-password');
    if (toggleIcon) toggleIcon.textContent = '👁️';
}

const togglePasswordBtn = document.getElementById('toggle-password');
if(togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', function () {
        const passwordInput = document.getElementById('login-password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🙈';
    });
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputId = document.getElementById('login-username').value.trim();
    const inputPass = document.getElementById('login-password').value;
    const btn = e.target.querySelector('button');
    btn.textContent = 'Logging In...';
    btn.disabled = true;
    
    // Fetch user from Supabase
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${inputId}%,phone.eq.${inputId}`)
        .eq('password', inputPass)
        .single();
    
    btn.textContent = 'Log In';
    btn.disabled = false;
    
    if (error || !data) {
        document.getElementById('login-error').style.display = 'block';
        return;
    }
    
    currentUser = data;
    
    switch (currentUser.role) {
        case 'Owner': switchScreen('owner-dashboard'); break;
        case 'Manager': switchScreen('manager-dashboard'); break;
        case 'Telecaller': switchScreen('telecaller-dashboard'); break;
        case 'Salesman': switchScreen('salesman-dashboard'); break;
        case 'Serviceman': switchScreen('serviceman-dashboard'); break;
        case 'Finance': switchScreen('finance-dashboard'); break;
    }
});

function logout() {
    currentUser = null;
    switchScreen('role-selection');
    initLogin();
}

// --- Owner Logic ---
document.getElementById('manage-users-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.textContent = 'Saving...';
    
    const name = document.getElementById('new-user-name').value;
    const phone = document.getElementById('new-user-phone').value;
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;
    
    await supabase.from('users').insert([{ name, phone, password, role }]);
    
    e.target.reset();
    btn.disabled = false; btn.textContent = 'Add User';
    await renderOwnerDashboard();
});

async function renderOwnerDashboard() {
    // Fetch all users
    const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    
    const uBody = document.getElementById('users-table-body');
    uBody.innerHTML = users.map(u => `
        <tr>
            <td>${u.name}</td>
            <td>${u.phone}</td>
            <td>${u.role}</td>
            <td>
                <button class="action-btn btn-edit" onclick="openUserEdit('${u.id}')">Edit</button>
                ${u.role !== 'Owner' ? `<button class="action-btn btn-delete" onclick="deleteUser('${u.id}')">Remove</button>` : ''}
            </td>
        </tr>
    `).join('');

    // Fetch master data
    const mBody = document.getElementById('master-data-body');
    let masterDataHtml = '';
    
    const [ {data: visits}, {data: leads}, {data: finances} ] = await Promise.all([
        supabase.from('visits').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('finances').select('*').order('created_at', { ascending: false })
    ]);
    
    if(visits) visits.forEach(v => {
        masterDataHtml += `<tr><td>Visit</td><td>By ${v.salesman_name} | ${v.village} | ${v.customer} (${v.convinced})</td><td>
            <button class="action-btn btn-delete" onclick='deleteEntry("visits", "${v.id}")'>Delete</button>
        </td></tr>`;
    });
    
    if(leads) leads.forEach(l => {
        masterDataHtml += `<tr><td>Lead</td><td>By ${l.telecaller_name} | ${l.type} | ${l.customer} | ${l.village}</td><td>
            <button class="action-btn btn-delete" onclick='deleteEntry("leads", "${l.id}")'>Delete</button>
        </td></tr>`;
    });

    if(finances) finances.forEach(f => {
        masterDataHtml += `<tr><td>Finance</td><td>${f.financer_name} | ₹${f.finance_amount} | Reg: ${f.registration_no || 'N'}</td><td>
            <button class="action-btn btn-delete" onclick='deleteEntry("finances", "${f.id}")'>Delete</button>
        </td></tr>`;
    });

    mBody.innerHTML = masterDataHtml;
}

async function deleteUser(id) {
    if(!confirm("Are you sure?")) return;
    await supabase.from('users').delete().eq('id', id);
    await renderOwnerDashboard();
}

async function deleteEntry(table, id) {
    if(!confirm("Are you sure?")) return;
    await supabase.from(table).delete().eq('id', id);
    await renderOwnerDashboard();
}

// User Edit
let editingUserId = null;
async function openUserEdit(id) {
    editingUserId = id;
    const { data: u } = await supabase.from('users').select('*').eq('id', id).single();
    if(!u) return;
    
    document.getElementById('edit-user-id').value = u.id;
    document.getElementById('edit-user-name').value = u.name;
    document.getElementById('edit-user-phone').value = u.phone;
    document.getElementById('edit-user-password').value = u.password;
    document.getElementById('edit-user-role').value = u.role;
    
    const m = document.getElementById('user-edit-modal');
    m.style.display = 'flex';
    m.classList.add('active');
}

document.getElementById('user-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Saving...';
    
    await supabase.from('users').update({
        name: document.getElementById('edit-user-name').value,
        phone: document.getElementById('edit-user-phone').value,
        password: document.getElementById('edit-user-password').value,
        role: document.getElementById('edit-user-role').value
    }).eq('id', editingUserId);
    
    const m = document.getElementById('user-edit-modal');
    m.style.display = 'none';
    m.classList.remove('active');
    btn.disabled = false; btn.textContent = 'Save Updates';
    await renderOwnerDashboard();
});

document.getElementById('cancel-user-edit-btn').addEventListener('click', () => {
    const m = document.getElementById('user-edit-modal');
    m.style.display = 'none';
    m.classList.remove('active');
});

// --- Manager Logic ---
const taskTypeSelect = document.getElementById('task-type');
const taskAssigneeSelect = document.getElementById('task-assignee');

taskTypeSelect.addEventListener('change', async () => {
    const type = taskTypeSelect.value;
    const targetRole = type === 'Sales' ? 'Salesman' : 'Serviceman';
    const { data: users } = await supabase.from('users').select('*').eq('role', targetRole);
    
    taskAssigneeSelect.innerHTML = '<option value="">-- Select Employee --</option>' + 
        (users || []).map(u => `<option value="${u.id}">${u.name}</option>`).join('');
});

document.getElementById('assign-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const assigneeId = taskAssigneeSelect.value;
    const assigneeName = taskAssigneeSelect.options[taskAssigneeSelect.selectedIndex].text;
    
    await supabase.from('tasks').insert([{
        timestamp: new Date().toLocaleDateString(),
        type: taskTypeSelect.value,
        assignee_id: assigneeId,
        assignee_name: assigneeName,
        details: document.getElementById('task-details').value
    }]);
    
    e.target.reset();
    await renderManagerDashboard();
});

async function renderManagerDashboard() {
    const { data: tasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    document.getElementById('active-tasks-body').innerHTML = (tasks||[]).map(t => `
        <tr><td>${t.timestamp}</td><td>${t.assignee_name}</td><td>${t.type}</td><td>${t.details}</td></tr>
    `).join('');
    
    // trigger change to load initial assignee list
    taskTypeSelect.dispatchEvent(new Event('change'));
}

// --- Telecaller Logic ---
const leadTypeSelect = document.getElementById('lead-type');
const leadDateLabel = document.getElementById('lead-date-label');

if(leadTypeSelect) {
    leadTypeSelect.addEventListener('change', () => {
        if (leadTypeSelect.value === 'Sales') {
            leadDateLabel.textContent = 'Expected Buying Date';
        } else {
            leadDateLabel.textContent = 'Expected Service Date';
        }
    });
}

document.getElementById('log-lead-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const segment = leadTypeSelect.value;
    const expectedDate = document.getElementById('lead-date').value;
    let reminderDate = expectedDate;

    if (segment === 'Service' && expectedDate) {
        const d = new Date(expectedDate);
        d.setDate(d.getDate() - 5);
        reminderDate = d.toISOString().split('T')[0];
    }

    await supabase.from('leads').insert([{
        timestamp: new Date().toLocaleDateString(),
        telecaller_id: currentUser.id,
        telecaller_name: currentUser.name,
        type: segment,
        customer: document.getElementById('lead-customer').value,
        mobile: document.getElementById('lead-mobile').value,
        village: document.getElementById('lead-village').value,
        expected_date: expectedDate,
        reminder_date: reminderDate
    }]);
    
    e.target.reset();
    await renderTelecallerDashboard();
});

async function renderTelecallerDashboard() {
    const { data: myLeads } = await supabase.from('leads').select('*').eq('telecaller_id', currentUser.id).order('created_at', { ascending: false });
    const today = new Date().toISOString().split('T')[0];
    
    document.getElementById('telecaller-history-body').innerHTML = (myLeads||[]).map(l => {
        const isDue = l.reminder_date <= today;
        const reminderHtml = isDue ? `<strong style="color: var(--primary-red);">${l.reminder_date} (CALL NOW)</strong>` : l.reminder_date;
        return `<tr><td>${l.timestamp}</td><td>${l.type}</td><td>${l.customer}</td><td>${l.mobile}</td><td>${l.village}</td><td>${l.expected_date}</td><td>${reminderHtml}</td></tr>`;
    }).join('');
}

// --- Salesman Logic ---
document.getElementById('salesman-visit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('visit-photo');
    let photoUrl = 'No Photo';
    if (fileInput.files && fileInput.files[0]) {
        photoUrl = 'Photo Uploaded'; // Note: In a real app, upload to Supabase Storage and save URL here
    }

    await supabase.from('visits').insert([{
        timestamp: new Date().toLocaleDateString(),
        salesman_id: currentUser.id,
        salesman_name: currentUser.name,
        village: document.getElementById('visit-village').value,
        customer: document.getElementById('visit-customer').value,
        mobile: document.getElementById('visit-mobile').value,
        convinced: document.getElementById('visit-convinced').value,
        photo_url: photoUrl
    }]);
    
    e.target.reset();
    alert('Visit logged successfully!');
});

async function renderSalesmanDashboard() {
    const [{ data: myTasks }, { data: salesLeads }] = await Promise.all([
        supabase.from('tasks').select('*').eq('assignee_id', currentUser.id),
        supabase.from('leads').select('*').eq('type', 'Sales')
    ]);
    
    document.getElementById('salesman-tasks-list').innerHTML = (myTasks && myTasks.length) ? 
        myTasks.map(t => `<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${t.timestamp}:</strong> ${t.details}</div>`).join('') :
        'No tasks assigned today.';

    document.getElementById('salesman-leads-list').innerHTML = (salesLeads && salesLeads.length) ?
        salesLeads.map(l => `<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${l.village}:</strong> ${l.customer} (${l.mobile}) <br><small>Logged by ${l.telecaller_name}</small></div>`).join('') :
        'No sales leads available.';
}

// --- Serviceman Logic ---
async function renderServicemanDashboard() {
    const [{ data: myTasks }, { data: serviceLeads }] = await Promise.all([
        supabase.from('tasks').select('*').eq('assignee_id', currentUser.id),
        supabase.from('leads').select('*').eq('type', 'Service')
    ]);

    document.getElementById('serviceman-tasks-list').innerHTML = (myTasks && myTasks.length) ? 
        myTasks.map(t => `<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${t.timestamp}:</strong> ${t.details}</div>`).join('') :
        'No tasks assigned today.';

    document.getElementById('serviceman-leads-list').innerHTML = (serviceLeads && serviceLeads.length) ?
        serviceLeads.map(l => `<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${l.village}:</strong> ${l.customer} (${l.mobile}) <br><small>Logged by ${l.telecaller_name}</small></div>`).join('') :
        'No service leads available.';
}

// --- Finance Logic ---
document.getElementById('finance-entry-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await supabase.from('finances').insert([{
        financer_name: document.getElementById('fin-name').value,
        finance_amount: document.getElementById('fin-amount').value,
        registration_yn: document.getElementById('fin-reg-yn').value,
        date_of_registration: document.getElementById('fin-date').value,
        registration_no: document.getElementById('fin-reg-no').value,
        fresh_exchange: document.getElementById('fin-type').value,
        edit_history: [],
        last_edited_at: 'Never'
    }]);
    
    e.target.reset();
    await renderFinanceDashboard();
});

document.getElementById('btn-search-finance').addEventListener('click', renderFinanceDashboard);
document.getElementById('fin-search').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') renderFinanceDashboard();
});

async function renderFinanceDashboard() {
    const searchQuery = document.getElementById('fin-search').value.toLowerCase();
    
    let query = supabase.from('finances').select('*').order('created_at', { ascending: false });
    if(searchQuery) {
        query = query.ilike('registration_no', `%${searchQuery}%`);
    }
    
    const { data: finances } = await query;
    const tbody = document.getElementById('finance-table-body');

    if (!finances || finances.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--text-light);">No matching records found.</td></tr>';
        return;
    }

    tbody.innerHTML = finances.map(f => `
        <tr>
            <td>${f.financer_name}</td>
            <td>₹${f.finance_amount}</td>
            <td>${f.registration_yn}</td>
            <td>${f.date_of_registration}</td>
            <td>${f.registration_no || '-'}</td>
            <td>${f.fresh_exchange}</td>
            <td style="font-size: 0.8rem; color: var(--text-light);">${f.last_edited_at}</td>
            <td><button class="action-btn btn-edit" onclick="openFinanceEdit('${f.id}')">Edit</button></td>
        </tr>
    `).join('');
}

let editingFinanceId = null;

async function openFinanceEdit(id) {
    editingFinanceId = id;
    const { data: record } = await supabase.from('finances').select('*').eq('id', id).single();
    if(!record) return;
    
    document.getElementById('edit-fin-id').value = record.id;
    document.getElementById('edit-fin-name').value = record.financer_name;
    document.getElementById('edit-fin-amount').value = record.finance_amount;
    document.getElementById('edit-fin-reg-yn').value = record.registration_yn;
    document.getElementById('edit-fin-date').value = record.date_of_registration;
    document.getElementById('edit-fin-reg-no').value = record.registration_no;
    document.getElementById('edit-fin-type').value = record.fresh_exchange;
    
    const modal = document.getElementById('finance-edit-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
}

document.getElementById('finance-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const timestamp = new Date().toLocaleString();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Saving...';
    
    const { data: existing } = await supabase.from('finances').select('edit_history').eq('id', editingFinanceId).single();
    let history = existing ? existing.edit_history : [];
    history.push({ editedBy: currentUser.name, timestamp: timestamp });

    await supabase.from('finances').update({
        financer_name: document.getElementById('edit-fin-name').value,
        finance_amount: document.getElementById('edit-fin-amount').value,
        registration_yn: document.getElementById('edit-fin-reg-yn').value,
        date_of_registration: document.getElementById('edit-fin-date').value,
        registration_no: document.getElementById('edit-fin-reg-no').value,
        fresh_exchange: document.getElementById('edit-fin-type').value,
        last_edited_at: timestamp,
        edit_history: history
    }).eq('id', editingFinanceId);
    
    const modal = document.getElementById('finance-edit-modal');
    modal.style.display = 'none';
    modal.classList.remove('active');
    btn.disabled = false; btn.textContent = 'Save Updates';
    
    await renderFinanceDashboard();
    
    // Update owner dashboard if visible
    if (currentUser && currentUser.role === 'Owner') await renderOwnerDashboard();
});

document.getElementById('cancel-finance-edit-btn').addEventListener('click', () => {
    const modal = document.getElementById('finance-edit-modal');
    modal.style.display = 'none';
    modal.classList.remove('active');
});

// Init
initLogin();
