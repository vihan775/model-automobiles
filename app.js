// --- Supabase Configuration ---
const SUPABASE_URL = 'https://sbyookvpqghxvyupakjj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieW9va3ZwcWdoeHZ5dXBha2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxODEwNTIsImV4cCI6MjEwMTc1NzA1Mn0.lmRJT7bhHT5B5M9XrJLQYziNcfFt2-wsgo7tYyP89Zg';

// Initialize Supabase Client — use 'db' to avoid shadowing the global 'supabase'
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let currentUser = null;

function formatDateDDMMYYYY(dateInput) {
    if (!dateInput) return '';
    var d = new Date(dateInput);
    if (isNaN(d.getTime())) {
        if (typeof dateInput === 'string' && dateInput.includes('-')) {
            var parts = dateInput.split('-');
            if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
        }
        return String(dateInput);
    }
    var day = d.getDate().toString().padStart(2, '0');
    var month = (d.getMonth() + 1).toString().padStart(2, '0');
    var year = d.getFullYear();
    var hours = d.getHours();
    var minutes = d.getMinutes().toString().padStart(2, '0');
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    var strTime = hours.toString().padStart(2, '0') + ':' + minutes + ' ' + ampm;
    return day + '/' + month + '/' + year + ' ' + strTime;
}

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
    
    if (screenId === 'owner-dashboard') await renderOwnerDashboard();
    if (screenId === 'manager-dashboard') await renderManagerDashboard();
    if (screenId === 'telecaller-dashboard') await renderTelecallerDashboard();
    if (screenId === 'salesman-dashboard') await renderSalesmanDashboard();
    if (screenId === 'serviceman-dashboard') await renderServicemanDashboard();
    if (screenId === 'finance-dashboard') await renderFinanceDashboard();
    if (screenId === 'spare-incharge-dashboard') await renderSpareInchargeDashboard();
}

// --- Login Logic ---
function initLogin() {
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').style.display = 'none';
    var pwdField = document.getElementById('login-password');
    pwdField.setAttribute('type', 'password');
    var eyeIcon = document.getElementById('toggle-password');
    if (eyeIcon) eyeIcon.textContent = '\u{1F441}\uFE0F';
}

// Eye toggle for password visibility
(function() {
    var toggleBtn = document.getElementById('toggle-password');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            var pwdField = document.getElementById('login-password');
            if (pwdField.getAttribute('type') === 'password') {
                pwdField.setAttribute('type', 'text');
                toggleBtn.textContent = '\u{1F648}';
            } else {
                pwdField.setAttribute('type', 'password');
                toggleBtn.textContent = '\u{1F441}\uFE0F';
            }
        });
    }
})();

// Login form handler
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var inputId = document.getElementById('login-username').value.trim();
    var inputPass = document.getElementById('login-password').value;
    var btn = document.getElementById('login-form').querySelector('button');
    btn.textContent = 'Logging In...';
    btn.disabled = true;
    document.getElementById('login-error').style.display = 'none';
    
    try {
        var result = await db.from('users').select('*').eq('password', inputPass);
        var users = result.data;
        var error = result.error;
        
        if (error || !users) {
            document.getElementById('login-error').style.display = 'block';
            btn.textContent = 'Log In';
            btn.disabled = false;
            return;
        }
        
        var matchedUser = null;
        for (var i = 0; i < users.length; i++) {
            if (users[i].name.toLowerCase() === inputId.toLowerCase() || users[i].phone === inputId) {
                matchedUser = users[i];
                break;
            }
        }
        
        btn.textContent = 'Log In';
        btn.disabled = false;
        
        if (!matchedUser) {
            document.getElementById('login-error').style.display = 'block';
            return;
        }
        
        currentUser = matchedUser;
        
        if (currentUser.role === 'Owner') switchScreen('owner-dashboard');
        else if (currentUser.role === 'Manager') switchScreen('manager-dashboard');
        else if (currentUser.role === 'Telecaller') switchScreen('telecaller-dashboard');
        else if (currentUser.role === 'Salesman') switchScreen('salesman-dashboard');
        else if (currentUser.role === 'Serviceman') switchScreen('serviceman-dashboard');
        else if (currentUser.role === 'Finance') switchScreen('finance-dashboard');
        else if (currentUser.role === 'Spare Incharge') switchScreen('spare-incharge-dashboard');
    } catch (err) {
        document.getElementById('login-error').style.display = 'block';
        btn.textContent = 'Log In';
        btn.disabled = false;
    }
});

function logout() {
    currentUser = null;
    switchScreen('role-selection');
    initLogin();
}

// --- Owner Logic ---
document.getElementById('manage-users-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = e.target.querySelector('button');
    btn.disabled = true; btn.textContent = 'Saving...';
    
    var name = document.getElementById('new-user-name').value;
    var phone = document.getElementById('new-user-phone').value;
    var password = document.getElementById('new-user-password').value;
    var role = document.getElementById('new-user-role').value;
    
    await db.from('users').insert([{ name: name, phone: phone, password: password, role: role }]);
    
    e.target.reset();
    btn.disabled = false; btn.textContent = 'Add User';
    await renderOwnerDashboard();
});

async function renderOwnerDashboard() {
    var result = await db.from('users').select('*').order('created_at', { ascending: true });
    var users = result.data || [];
    
    var uBody = document.getElementById('users-table-body');
    var html = '';
    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        html += '<tr>';
        html += '<td>' + u.name + '</td>';
        html += '<td>' + u.phone + '</td>';
        html += '<td>' + u.role + '</td>';
        html += '<td>';
        html += '<button class="action-btn btn-edit" onclick="openUserEdit(\'' + u.id + '\')">Edit</button>';
        if (u.role !== 'Owner') {
            html += ' <button class="action-btn btn-delete" onclick="deleteUser(\'' + u.id + '\')">Remove</button>';
        }
        html += '</td>';
        html += '</tr>';
    }
    uBody.innerHTML = html;

    var mBody = document.getElementById('master-data-body');
    var masterHtml = '';
    
    var results = await Promise.all([
        db.from('visits').select('*').order('created_at', { ascending: false }),
        db.from('leads').select('*').order('created_at', { ascending: false }),
        db.from('finances').select('*').order('created_at', { ascending: false })
    ]);
    
    var visits = results[0].data || [];
    var leads = results[1].data || [];
    var finances = results[2].data || [];
    
    for (var i = 0; i < visits.length; i++) {
        var v = visits[i];
        masterHtml += '<tr><td>Visit</td><td>By ' + v.salesman_name + ' | ' + v.village + ' | ' + v.customer + ' (' + v.convinced + ')</td><td>';
        masterHtml += '<button class="action-btn btn-delete" onclick="deleteEntry(\'visits\', \'' + v.id + '\')">Delete</button>';
        masterHtml += '</td></tr>';
    }
    for (var i = 0; i < leads.length; i++) {
        var l = leads[i];
        masterHtml += '<tr><td>Lead</td><td>By ' + l.telecaller_name + ' | ' + l.type + ' | ' + l.customer + ' | ' + l.village + '</td><td>';
        masterHtml += '<button class="action-btn btn-delete" onclick="deleteEntry(\'leads\', \'' + l.id + '\')">Delete</button>';
        masterHtml += '</td></tr>';
    }
    for (var i = 0; i < finances.length; i++) {
        var f = finances[i];
        masterHtml += '<tr><td>Finance</td><td>' + f.financer_name + ' | \u20B9' + f.finance_amount + ' | Reg: ' + (f.registration_no || 'N') + '</td><td>';
        masterHtml += '<button class="action-btn btn-delete" onclick="deleteEntry(\'finances\', \'' + f.id + '\')">Delete</button>';
        masterHtml += '</td></tr>';
    }
    mBody.innerHTML = masterHtml;

    var sBody = document.getElementById('owner-spares-body');
    if (sBody) {
        var spareResults = await Promise.all([
            db.from('spare_orders').select('*').order('created_at', { ascending: false }),
            db.from('spare_countersales').select('*').order('created_at', { ascending: false }),
            db.from('spare_branch_transfers').select('*').order('created_at', { ascending: false })
        ]);
        var sOrders = spareResults[0].data || [];
        var sCountersales = spareResults[1].data || [];
        var sTransfers = spareResults[2].data || [];

        var spareHtml = '';
        for (var i = 0; i < sOrders.length; i++) {
            var o = sOrders[i];
            spareHtml += '<tr><td>Order</td><td>' + o.created_by_name + '</td><td>Amount: \u20B9' + o.amount_ordered + '</td><td>' + o.timestamp + '</td></tr>';
        }
        for (var i = 0; i < sCountersales.length; i++) {
            var c = sCountersales[i];
            var displayDate = c.sale_date.includes('-') ? c.sale_date.split('-').reverse().join('/') : c.sale_date;
            spareHtml += '<tr><td>Countersale</td><td>' + c.created_by_name + '</td><td>Amount: \u20B9' + c.amount + ' (Sale Date: ' + displayDate + ')</td><td>' + formatDateDDMMYYYY(c.created_at) + '</td></tr>';
        }
        for (var i = 0; i < sTransfers.length; i++) {
            var t = sTransfers[i];
            var bName = t.branch_name || 'Unknown';
            var diffColor = t.difference < 0 ? 'var(--primary-red)' : 'green';
            spareHtml += '<tr><td>Branch Transfer (' + bName + ')</td><td>' + t.created_by_name + '</td><td>Parts Sent: \u20B9' + t.amount_sent + ' | Bill: \u20B9' + t.month_bill_amount + ' | <strong style="color: ' + diffColor + '">Diff: \u20B9' + t.difference + '</strong></td><td>' + formatDateDDMMYYYY(t.created_at) + '</td></tr>';
        }
        sBody.innerHTML = spareHtml;
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure?')) return;
    await db.from('users').delete().eq('id', id);
    await renderOwnerDashboard();
}

async function deleteEntry(table, id) {
    if (!confirm('Are you sure?')) return;
    await db.from(table).delete().eq('id', id);
    await renderOwnerDashboard();
}

// User Edit
var editingUserId = null;
async function openUserEdit(id) {
    editingUserId = id;
    var result = await db.from('users').select('*').eq('id', id).single();
    var u = result.data;
    if (!u) return;
    
    document.getElementById('edit-user-id').value = u.id;
    document.getElementById('edit-user-name').value = u.name;
    document.getElementById('edit-user-phone').value = u.phone;
    document.getElementById('edit-user-password').value = u.password;
    document.getElementById('edit-user-role').value = u.role;
    
    var m = document.getElementById('user-edit-modal');
    m.style.display = 'flex';
    m.classList.add('active');
}

document.getElementById('user-edit-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Saving...';
    
    await db.from('users').update({
        name: document.getElementById('edit-user-name').value,
        phone: document.getElementById('edit-user-phone').value,
        password: document.getElementById('edit-user-password').value,
        role: document.getElementById('edit-user-role').value
    }).eq('id', editingUserId);
    
    var m = document.getElementById('user-edit-modal');
    m.style.display = 'none';
    m.classList.remove('active');
    btn.disabled = false; btn.textContent = 'Save Updates';
    await renderOwnerDashboard();
});

document.getElementById('cancel-user-edit-btn').addEventListener('click', function() {
    var m = document.getElementById('user-edit-modal');
    m.style.display = 'none';
    m.classList.remove('active');
});

// --- Manager Logic ---
var taskTypeSelect = document.getElementById('task-type');
var taskAssigneeSelect = document.getElementById('task-assignee');

taskTypeSelect.addEventListener('change', async function() {
    var type = taskTypeSelect.value;
    var targetRole = type === 'Sales' ? 'Salesman' : 'Serviceman';
    var result = await db.from('users').select('*').eq('role', targetRole);
    var users = result.data || [];
    
    var opts = '<option value="">-- Select Employee --</option>';
    for (var i = 0; i < users.length; i++) {
        opts += '<option value="' + users[i].id + '">' + users[i].name + '</option>';
    }
    taskAssigneeSelect.innerHTML = opts;
});

document.getElementById('assign-task-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var assigneeId = taskAssigneeSelect.value;
    var assigneeName = taskAssigneeSelect.options[taskAssigneeSelect.selectedIndex].text;
    
    await db.from('tasks').insert([{
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
    var result = await db.from('tasks').select('*').order('created_at', { ascending: false });
    var tasks = result.data || [];
    var html = '';
    for (var i = 0; i < tasks.length; i++) {
        var t = tasks[i];
        html += '<tr><td>' + t.timestamp + '</td><td>' + t.assignee_name + '</td><td>' + t.type + '</td><td>' + t.details + '</td></tr>';
    }
    document.getElementById('active-tasks-body').innerHTML = html;
    taskTypeSelect.dispatchEvent(new Event('change'));
}

// --- Telecaller Logic ---
var leadTypeSelect = document.getElementById('lead-type');
var leadDateLabel = document.getElementById('lead-date-label');

if (leadTypeSelect) {
    leadTypeSelect.addEventListener('change', function() {
        if (leadTypeSelect.value === 'Sales') {
            leadDateLabel.textContent = 'Expected Buying Date';
        } else {
            leadDateLabel.textContent = 'Expected Service Date';
        }
    });
}

document.getElementById('log-lead-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var segment = leadTypeSelect.value;
    var expectedDate = document.getElementById('lead-date').value;
    var reminderDate = expectedDate;

    if (segment === 'Service' && expectedDate) {
        var d = new Date(expectedDate);
        d.setDate(d.getDate() - 5);
        reminderDate = d.toISOString().split('T')[0];
    }

    await db.from('leads').insert([{
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
    var result = await db.from('leads').select('*').eq('telecaller_id', currentUser.id).order('created_at', { ascending: false });
    var myLeads = result.data || [];
    var today = new Date().toISOString().split('T')[0];
    var html = '';
    
    for (var i = 0; i < myLeads.length; i++) {
        var l = myLeads[i];
        var isDue = l.reminder_date <= today;
        var reminderHtml = isDue ? '<strong style="color: var(--primary-red);">' + l.reminder_date + ' (CALL NOW)</strong>' : l.reminder_date;
        html += '<tr><td>' + l.timestamp + '</td><td>' + l.type + '</td><td>' + l.customer + '</td><td>' + l.mobile + '</td><td>' + l.village + '</td><td>' + l.expected_date + '</td><td>' + reminderHtml + '</td></tr>';
    }
    document.getElementById('telecaller-history-body').innerHTML = html;
}

// --- Salesman Logic ---
document.getElementById('salesman-visit-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var fileInput = document.getElementById('visit-photo');
    var photoUrl = 'No Photo';
    if (fileInput.files && fileInput.files[0]) {
        photoUrl = 'Photo Uploaded';
    }

    await db.from('visits').insert([{
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
    var results = await Promise.all([
        db.from('tasks').select('*').eq('assignee_id', currentUser.id),
        db.from('leads').select('*').eq('type', 'Sales')
    ]);
    var myTasks = results[0].data || [];
    var salesLeads = results[1].data || [];
    
    var tasksHtml = myTasks.length > 0 ? '' : 'No tasks assigned today.';
    for (var i = 0; i < myTasks.length; i++) {
        tasksHtml += '<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>' + myTasks[i].timestamp + ':</strong> ' + myTasks[i].details + '</div>';
    }
    document.getElementById('salesman-tasks-list').innerHTML = tasksHtml;

    var leadsHtml = salesLeads.length > 0 ? '' : 'No sales leads available.';
    for (var i = 0; i < salesLeads.length; i++) {
        leadsHtml += '<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>' + salesLeads[i].village + ':</strong> ' + salesLeads[i].customer + ' (' + salesLeads[i].mobile + ') <br><small>Logged by ' + salesLeads[i].telecaller_name + '</small></div>';
    }
    document.getElementById('salesman-leads-list').innerHTML = leadsHtml;
}

// --- Serviceman Logic ---
async function renderServicemanDashboard() {
    var results = await Promise.all([
        db.from('tasks').select('*').eq('assignee_id', currentUser.id),
        db.from('leads').select('*').eq('type', 'Service')
    ]);
    var myTasks = results[0].data || [];
    var serviceLeads = results[1].data || [];

    var tasksHtml = myTasks.length > 0 ? '' : 'No tasks assigned today.';
    for (var i = 0; i < myTasks.length; i++) {
        tasksHtml += '<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>' + myTasks[i].timestamp + ':</strong> ' + myTasks[i].details + '</div>';
    }
    document.getElementById('serviceman-tasks-list').innerHTML = tasksHtml;

    var leadsHtml = serviceLeads.length > 0 ? '' : 'No service leads available.';
    for (var i = 0; i < serviceLeads.length; i++) {
        leadsHtml += '<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>' + serviceLeads[i].village + ':</strong> ' + serviceLeads[i].customer + ' (' + serviceLeads[i].mobile + ') <br><small>Logged by ' + serviceLeads[i].telecaller_name + '</small></div>';
    }
    document.getElementById('serviceman-leads-list').innerHTML = leadsHtml;
}

// --- Finance Logic ---
document.getElementById('finance-entry-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    await db.from('finances').insert([{
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
document.getElementById('fin-search').addEventListener('keyup', function(e) {
    if (e.key === 'Enter') renderFinanceDashboard();
});

async function renderFinanceDashboard() {
    var searchQuery = document.getElementById('fin-search').value.toLowerCase();
    
    var query = db.from('finances').select('*').order('created_at', { ascending: false });
    if (searchQuery) {
        query = query.ilike('registration_no', '%' + searchQuery + '%');
    }
    
    var result = await query;
    var finances = result.data || [];
    var tbody = document.getElementById('finance-table-body');

    if (finances.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--text-light);">No matching records found.</td></tr>';
        return;
    }

    var html = '';
    for (var i = 0; i < finances.length; i++) {
        var f = finances[i];
        html += '<tr>';
        html += '<td>' + f.financer_name + '</td>';
        html += '<td>\u20B9' + f.finance_amount + '</td>';
        html += '<td>' + f.registration_yn + '</td>';
        html += '<td>' + f.date_of_registration + '</td>';
        html += '<td>' + (f.registration_no || '-') + '</td>';
        html += '<td>' + f.fresh_exchange + '</td>';
        html += '<td style="font-size: 0.8rem; color: var(--text-light);">' + f.last_edited_at + '</td>';
        html += '<td><button class="action-btn btn-edit" onclick="openFinanceEdit(\'' + f.id + '\')">Edit</button></td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

var editingFinanceId = null;

async function openFinanceEdit(id) {
    editingFinanceId = id;
    var result = await db.from('finances').select('*').eq('id', id).single();
    var record = result.data;
    if (!record) return;
    
    document.getElementById('edit-fin-id').value = record.id;
    document.getElementById('edit-fin-name').value = record.financer_name;
    document.getElementById('edit-fin-amount').value = record.finance_amount;
    document.getElementById('edit-fin-reg-yn').value = record.registration_yn;
    document.getElementById('edit-fin-date').value = record.date_of_registration;
    document.getElementById('edit-fin-reg-no').value = record.registration_no;
    document.getElementById('edit-fin-type').value = record.fresh_exchange;
    
    var modal = document.getElementById('finance-edit-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
}

document.getElementById('finance-edit-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var timestamp = formatDateDDMMYYYY(new Date());
    var btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Saving...';
    
    var existingResult = await db.from('finances').select('edit_history').eq('id', editingFinanceId).single();
    var history = existingResult.data ? existingResult.data.edit_history : [];
    history.push({ editedBy: currentUser.name, timestamp: timestamp });

    await db.from('finances').update({
        financer_name: document.getElementById('edit-fin-name').value,
        finance_amount: document.getElementById('edit-fin-amount').value,
        registration_yn: document.getElementById('edit-fin-reg-yn').value,
        date_of_registration: document.getElementById('edit-fin-date').value,
        registration_no: document.getElementById('edit-fin-reg-no').value,
        fresh_exchange: document.getElementById('edit-fin-type').value,
        last_edited_at: timestamp,
        edit_history: history
    }).eq('id', editingFinanceId);
    
    var modal = document.getElementById('finance-edit-modal');
    modal.style.display = 'none';
    modal.classList.remove('active');
    btn.disabled = false; btn.textContent = 'Save Updates';
    
    await renderFinanceDashboard();
    if (currentUser && currentUser.role === 'Owner') await renderOwnerDashboard();
});

document.getElementById('cancel-finance-edit-btn').addEventListener('click', function() {
    var modal = document.getElementById('finance-edit-modal');
    modal.style.display = 'none';
    modal.classList.remove('active');
});

// --- Spare Incharge Logic ---
if (document.getElementById('spare-order-form')) {
    document.getElementById('spare-order-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        var amount = document.getElementById('spare-order-amount').value;
        var { error } = await db.from('spare_orders').insert([{
            amount_ordered: amount,
            created_by_id: currentUser.id,
            created_by_name: currentUser.name,
            timestamp: formatDateDDMMYYYY(new Date())
        }]);
        if (error) { alert("Error logging order: " + error.message); return; }
        e.target.reset();
        await renderSpareInchargeDashboard();
    });

    document.getElementById('spare-countersale-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        var amount = document.getElementById('spare-cs-amount').value;
        var date = document.getElementById('spare-cs-date').value;
        var { error } = await db.from('spare_countersales').insert([{
            amount: amount,
            sale_date: date,
            created_by_id: currentUser.id,
            created_by_name: currentUser.name
        }]);
        if (error) { alert("Error saving sale: " + error.message); return; }
        e.target.reset();
        await renderSpareInchargeDashboard();
    });

    document.getElementById('spare-transfer-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        var branch = document.getElementById('spare-transfer-branch').value;
        var sent = parseFloat(document.getElementById('spare-transfer-sent').value);
        var billed = parseFloat(document.getElementById('spare-transfer-billed').value);
        var difference = billed - sent;
        var { error } = await db.from('spare_branch_transfers').insert([{
            branch_name: branch,
            amount_sent: sent,
            month_bill_amount: billed,
            difference: difference,
            created_by_id: currentUser.id,
            created_by_name: currentUser.name
        }]);
        if (error) { alert("Error recording transfer: " + error.message); return; }
        e.target.reset();
        await renderSpareInchargeDashboard();
    });
}

async function renderSpareInchargeDashboard() {
    var results = await Promise.all([
        db.from('spare_orders').select('*').eq('created_by_id', currentUser.id),
        db.from('spare_countersales').select('*').eq('created_by_id', currentUser.id),
        db.from('spare_branch_transfers').select('*').eq('created_by_id', currentUser.id)
    ]);
    
    var orders = results[0].data || [];
    var countersales = results[1].data || [];
    var transfers = results[2].data || [];
    
    var allLogs = [];
    for (var i = 0; i < orders.length; i++) {
        allLogs.push({ type: 'Order', details: 'Amount: \u20B9' + orders[i].amount_ordered, date: new Date(orders[i].created_at) });
    }
    for (var i = 0; i < countersales.length; i++) {
        var displayDate = countersales[i].sale_date.includes('-') ? countersales[i].sale_date.split('-').reverse().join('/') : countersales[i].sale_date;
        allLogs.push({ type: 'Countersale', details: 'Amount: \u20B9' + countersales[i].amount + ' (Sale Date: ' + displayDate + ')', date: new Date(countersales[i].created_at) });
    }
    for (var i = 0; i < transfers.length; i++) {
        var diffColor = transfers[i].difference < 0 ? 'var(--primary-red)' : 'green';
        var bName = transfers[i].branch_name || 'Unknown';
        var details = 'Branch: ' + bName + ' | Sent: \u20B9' + transfers[i].amount_sent + ' | Billed: \u20B9' + transfers[i].month_bill_amount + ' | <strong style="color: ' + diffColor + '">Diff: \u20B9' + transfers[i].difference + '</strong>';
        allLogs.push({ type: 'Branch Transfer', details: details, date: new Date(transfers[i].created_at) });
    }
    
    allLogs.sort(function(a, b) { return b.date - a.date; });
    
    var html = '';
    for (var i = 0; i < allLogs.length; i++) {
        html += '<tr><td>' + allLogs[i].type + '</td><td>' + allLogs[i].details + '</td><td>' + formatDateDDMMYYYY(allLogs[i].date) + '</td></tr>';
    }
    
    document.getElementById('spare-history-body').innerHTML = html;
}

// Init
initLogin();
// Force Vercel deployment (v10)
