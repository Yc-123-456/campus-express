// 管理后台页面 - admin.js

document.addEventListener('DOMContentLoaded', function() {
    loadAdminStatistics();
    loadUsersTable();
    loadOrdersTable();
    loadStatisticsData();
    
    // 加载未读消息数量
    loadNavUnreadCount();

    // 绑定刷新按钮事件
    const refreshUsersBtn = document.getElementById('refreshUsersBtn');
    if (refreshUsersBtn) {
        refreshUsersBtn.addEventListener('click', loadUsersTable);
    }

    const refreshOrdersBtn = document.getElementById('refreshOrdersBtn');
    if (refreshOrdersBtn) {
        refreshOrdersBtn.addEventListener('click', loadOrdersTable);
    }
});

// 加载管理员统计数据
async function loadAdminStatistics() {
    try {
        // TODO: 替换为实际的 API 调用
        // const response = await axios.get(`${API_BASE_URL}/admin/statistics`);
        // const stats = response.data.data;

        // 模拟数据
        const stats = {
            totalUsers: 156,
            totalOrders: 523,
            activeOrders: 45,
            totalAmount: 3250.80
        };

        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalOrders').textContent = stats.totalOrders;
        document.getElementById('activeOrders').textContent = stats.activeOrders;
        document.getElementById('totalAmount').textContent = `¥${stats.totalAmount.toFixed(2)}`;
    } catch (error) {
        console.error('加载统计数据失败:', error);
        showToast('加载统计数据失败', 'danger');
    }
}

// 加载用户列表
async function loadUsersTable() {
    try {
        // TODO: 替换为实际的 API 调用
        // const response = await axios.get(`${API_BASE_URL}/admin/users`);
        // const users = response.data.data;

        // 模拟数据
        const users = generateMockUsers();

        renderUsersTable(users);
    } catch (error) {
        console.error('加载用户列表失败:', error);
        showToast('加载用户列表失败', 'danger');
    }
}

// 生成模拟用户数据
function generateMockUsers() {
    const statuses = ['normal', 'disabled'];
    const users = [];
    
    for (let i = 1; i <= 10; i++) {
        users.push({
            id: `user${i.toString().padStart(3, '0')}`,
            username: `student${i}`,
            realName: `学生${i}`,
            phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
            studentId: `2021${String(i).padStart(4, '0')}`,
            createTime: `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
            status: statuses[Math.floor(Math.random() * statuses.length)]
        });
    }
    
    return users;
}

// 渲染用户表格
function renderUsersTable(users) {
    const tbody = document.getElementById('usersTable');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    暂无用户数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.realName}</td>
            <td>${maskPhone(user.phone)}</td>
            <td>${user.studentId}</td>
            <td>${formatDateTime(user.createdAt)}</td>
            <td>
                <span class="badge ${(user.status === 'normal' || user.status === 'NORMAL') ? 'bg-success' : 'bg-secondary'}">
                    ${(user.status === 'normal' || user.status === 'NORMAL') ? '正常' : '禁用'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-info me-1" onclick="viewUserDetail('${user.id}')">查看</button>
                <button class="btn btn-sm btn-warning me-1" onclick="toggleUserStatus('${user.id}', '${user.status}')">
                    ${(user.status === 'normal' || user.status === 'NORMAL') ? '禁用' : '启用'}
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">删除</button>
            </td>
        </tr>
    `).join('');
}

// 加载订单列表
async function loadOrdersTable() {
    try {
        // TODO: 替换为实际的 API 调用
        // const response = await axios.get(`${API_BASE_URL}/admin/orders`);
        // const orders = response.data.data;

        // 模拟数据
        const orders = generateMockAdminOrders();

        renderAdminOrdersTable(orders);
    } catch (error) {
        console.error('加载订单列表失败:', error);
        showToast('加载订单列表失败', 'danger');
    }
}

// 生成模拟管理后台订单数据
function generateMockAdminOrders() {
    const statuses = ['pending', 'accepted', 'delivering', 'completed', 'cancelled'];
    const companies = ['顺丰速运', '中通快递', '圆通速递', '申通快递', '韵达快递', '京东物流'];
    const publishers = ['张三', '李四', '王五', '赵六', '孙七'];
    
    const orders = [];
    for (let i = 1; i <= 10; i++) {
        orders.push({
            id: `ORD2024010${i.toString().padStart(3, '0')}`,
            publisher: publishers[Math.floor(Math.random() * publishers.length)],
            expressCompany: companies[Math.floor(Math.random() * companies.length)],
            pickupCode: `${Math.floor(Math.random() * 5) + 1}-${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 9000) + 1000}`,
            fee: (Math.random() * 10 + 3).toFixed(2),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            createTime: `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`
        });
    }
    return orders;
}

// 渲染管理后台订单表格
function renderAdminOrdersTable(orders) {
    const tbody = document.getElementById('adminOrdersTable');
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    暂无订单数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>${order.id}</strong></td>
            <td>${order.publisher}</td>
            <td>${order.expressCompany}</td>
            <td><span class="text-primary fw-bold">${order.pickupCode}</span></td>
            <td class="text-danger fw-bold">¥${order.fee}</td>
            <td>${createStatusBadge(order.status)}</td>
            <td>${formatDateTime(order.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-info me-1" onclick="viewOrderDetail('${order.id}')">查看</button>
                <button class="btn btn-sm btn-warning" onclick="editOrder('${order.id}')">编辑</button>
            </td>
        </tr>
    `).join('');
}

// 加载统计数据
async function loadStatisticsData() {
    try {
        // TODO: 替换为实际的 API 调用
        // const response = await axios.get(`${API_BASE_URL}/admin/data-statistics`);
        // const data = response.data.data;

        // 模拟数据 - 按状态统计
        const statusStats = [
            { status: 'pending', count: 25 },
            { status: 'accepted', count: 15 },
            { status: 'delivering', count: 10 },
            { status: 'completed', count: 450 },
            { status: 'cancelled', count: 23 }
        ];

        // 模拟数据 - 最近7天趋势
        const trendStats = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            trendStats.push({
                date: formatDate(date),
                count: Math.floor(Math.random() * 20) + 5
            });
        }

        // 渲染状态统计
        const statusStatsHtml = statusStats.map(item => `
            <li class="mb-2">
                ${createStatusBadge(item.status)} 
                <span class="fw-bold ms-2">${item.count}</span> 单
            </li>
        `).join('');
        document.getElementById('statusStats').innerHTML = statusStatsHtml;

        // 渲染趋势统计
        const trendStatsHtml = trendStats.map(item => `
            <li class="mb-2">
                <span class="text-muted">${item.date}</span>: 
                <span class="fw-bold text-primary">${item.count}</span> 单
            </li>
        `).join('');
        document.getElementById('trendStats').innerHTML = trendStatsHtml;
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

// 查看用户详情
function viewUserDetail(userId) {
    showToast(`查看用户详情: ${userId}`, 'info');
    // TODO: 实现用户详情功能
}

// 切换用户状态
async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus === 'normal' ? '禁用' : '启用';
    if (!confirm(`确定要${action}该用户吗?`)) {
        return;
    }

    try {
        // TODO: 替换为实际的 API 调用
        // await axios.post(`${API_BASE_URL}/admin/users/${userId}/toggle-status`);
        
        console.log(`${action}用户:`, userId);
        
        showToast(`用户已${action}`, 'success');
        
        // 重新加载用户列表
        loadUsersTable();
    } catch (error) {
        console.error('操作失败:', error);
        showToast(error.response?.data?.message || '操作失败', 'danger');
    }
}

// 删除用户
async function deleteUser(userId) {
    if (!confirm('确定要删除该用户吗?此操作不可恢复!')) {
        return;
    }

    try {
        // TODO: 替换为实际的 API 调用
        // await axios.delete(`${API_BASE_URL}/admin/users/${userId}`);
        
        console.log('删除用户:', userId);
        
        showToast('用户已删除', 'success');
        
        // 重新加载用户列表
        loadUsersTable();
    } catch (error) {
        console.error('删除用户失败:', error);
        showToast(error.response?.data?.message || '删除用户失败', 'danger');
    }
}

// 查看订单详情
function viewOrderDetail(orderId) {
    window.open(`order_detail.html?id=${orderId}`, '_blank');
}

// 编辑订单
function editOrder(orderId) {
    showToast(`编辑订单: ${orderId}`, 'info');
    // TODO: 实现订单编辑功能
}
