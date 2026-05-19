// 订单列表页面 - orders.js

let currentPage = 1;
const pageSize = 10;
let currentFilters = {};
let currentTab = 'published'; // 当前标签：'published' 或 'accepted'
let selectedUserId = null; // 当前选中的用户ID

document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    
    // 加载未读消息数量
    loadNavUnreadCount();
    
    // 添加筛选事件监听
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const expressFilter = document.getElementById('expressFilter');
    const filterBtn = document.getElementById('filterBtn');
    
    // 搜索框回车事件
    searchInput?.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            handleFilter();
        }
    });
    
    // 筛选按钮点击事件
    filterBtn?.addEventListener('click', handleFilter);
    
    // 下拉框变化事件
    statusFilter?.addEventListener('change', handleFilter);
    expressFilter?.addEventListener('change', handleFilter);
});

// 切换标签
function switchTab(tab) {
    currentTab = tab;
    currentPage = 1;
    
    // 更新按钮样式
    const btnPublished = document.getElementById('btnPublished');
    const btnAccepted = document.getElementById('btnAccepted');
    
    if (tab === 'published') {
        btnPublished.classList.add('active');
        btnAccepted.classList.remove('active');
    } else {
        btnAccepted.classList.add('active');
        btnPublished.classList.remove('active');
    }
    
    // 重新加载订单列表
    loadOrders(1);
}

// 加载订单列表
async function loadOrders(page = 1) {
    try {
        currentPage = page;
        const userInfo = getUserInfo();
        
        // 构建请求参数
        const params = {
            page: page,
            pageSize: pageSize,
            userId: userInfo?.id,
            view: currentTab, // 根据当前标签传递参数
            ...currentFilters
        };

        // 从后端 API 获取订单数据
        const response = await axios.get(`${API_BASE_URL}/orders`, { params });
        const pageData = response.data.data;
        const orders = pageData.list || [];

        renderOrdersTable(orders);
        renderPagination(pageData.total || orders.length, page);
    } catch (error) {
        console.error('加载订单失败:', error);
        showToast(error.response?.data?.message || '加载订单失败', 'danger');
    }
}

// 渲染订单表格
function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTable');
    const userInfo = getUserInfo();
    
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        const emptyMessage = currentTab === 'published' ? '暂无发布的订单' : '暂无接取的订单';
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="order-empty-state">
                        <i>📦</i>
                        <h5>${emptyMessage}</h5>
                        <p>当前没有符合条件的订单</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(order => {
        const isPublisher = userInfo && userInfo.id === order.publisherId;
        const isAcceptor = userInfo && userInfo.id === order.acceptorId;
        
        // 生成操作按钮组
        let actionButtons = '';
        
        // 查看详情按钮
        actionButtons += `<a href="order_detail.html?id=${order.id}" class="btn btn-view-detail">查看详情</a>`;
        
        // 添加联系对方按钮（如果对方存在）
        const otherUserId = currentTab === 'published' ? order.acceptorId : order.publisherId;
        if (otherUserId) {
            actionButtons += `<button class="btn btn-contact" onclick="createQuickConversation('${otherUserId}')">联系</button>`;
        }
        
        // 发布者可以确认收货的订单：已送达状态（接单人已确认配送）
        if (isPublisher && (order.status === 'delivered' || order.status === 'DELIVERED')) {
            actionButtons += `<button class="btn btn-sm btn-success" onclick="completeOrder('${order.id}')">确认收货</button>`;
        }
        
        // 发布者可以取消的订单：待取件和已接单状态
        if (isPublisher && (order.status === 'pending' || order.status === 'PENDING' || order.status === 'accepted' || order.status === 'ACCEPTED')) {
            actionButtons += `<button class="btn btn-sm btn-danger" onclick="cancelOrder('${order.id}')">取消</button>`;
        }
        
        // 接单人可以开始的订单：已接单状态
        if (isAcceptor && (order.status === 'accepted' || order.status === 'ACCEPTED')) {
            actionButtons += `<button class="btn btn-sm btn-success" onclick="startDelivery('${order.id}')">开始配送</button>`;
        }
        
        // 接单人确认送达的订单：配送中状态
        if (isAcceptor && (order.status === 'delivering' || order.status === 'DELIVERING')) {
            actionButtons += `<button class="btn btn-sm btn-info" onclick="confirmDelivery('${order.id}')">确认送达</button>`;
        }
        
        // 根据当前标签生成对应的列
        if (currentTab === 'published') {
            // 我的订单：显示接单人，不显示发布者
            const otherUserId = order.acceptorId || '';
            const otherUserName = order.acceptorUsername || '-';
            const otherUserHtml = otherUserId && otherUserName !== '-'
                ? `<a href="javascript:void(0)" onclick="showUserProfile('${otherUserId}', '${otherUserName.replace(/'/g, "\\'")}')" class="text-decoration-none fw-bold text-primary">${otherUserName}</a>`
                : `<span class="text-muted">${otherUserName}</span>`;
            
            return `
                <tr>
                    <td><span class="order-id">${order.id}</span></td>
                    <td><span class="fw-medium">${order.expressCompany}</span></td>
                    <td><span class="badge bg-primary text-white px-2 py-1 rounded">${order.pickupCode}</span></td>
                    <td>${order.pickupLocation}</td>
                    <td><span class="order-fee">${order.fee}</span></td>
                    <td>${createStatusBadge(order.status)}</td>
                    <td>
                        ${otherUserHtml}
                        ${isAcceptor ? '<span class="badge bg-success ms-2">我</span>' : ''}
                    </td>
                    <td>${formatDateTime(order.createdAt)}</td>
                    <td><div class="order-actions">${actionButtons}</div></td>
                </tr>
            `;
        } else {
            // 我的接单：显示发布者，不显示接单人
            const otherUserId = order.publisherId || '';
            const otherUserName = order.publisherUsername || '-';
            const otherUserHtml = otherUserId && otherUserName !== '-'
                ? `<a href="javascript:void(0)" onclick="showUserProfile('${otherUserId}', '${otherUserName.replace(/'/g, "\\'")}')" class="text-decoration-none fw-bold text-primary">${otherUserName}</a>`
                : `<span class="text-muted">${otherUserName}</span>`;
            
            return `
                <tr>
                    <td><span class="order-id">${order.id}</span></td>
                    <td><span class="fw-medium">${order.expressCompany}</span></td>
                    <td><span class="badge bg-primary text-white px-2 py-1 rounded">${order.pickupCode}</span></td>
                    <td>${order.pickupLocation}</td>
                    <td><span class="order-fee">${order.fee}</span></td>
                    <td>${createStatusBadge(order.status)}</td>
                    <td>
                        ${otherUserHtml}
                        ${isPublisher ? '<span class="badge bg-primary ms-2">我</span>' : ''}
                    </td>
                    <td>${formatDateTime(order.createdAt)}</td>
                    <td><div class="order-actions">${actionButtons}</div></td>
                </tr>
            `;
        }
    }).join('');
}

// 快速创建对话
function createQuickConversation(userId) {
    selectedUserId = userId;
    handleCreateConversation();
}

// 渲染分页
function renderPagination(total, currentPage, paginationId = 'pagination') {
    const totalPages = Math.ceil(total / pageSize);
    const pagination = document.getElementById(paginationId);
    
    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';
    
    // 上一页
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadOrders(${currentPage - 1}); return false;">上一页</a>
        </li>
    `;

    // 页码
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadOrders(${i}); return false;">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }

    // 下一页
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadOrders(${currentPage + 1}); return false;">下一页</a>
        </li>
    `;

    pagination.innerHTML = html;
}

// 处理筛选
function handleFilter(e) {
    if (e) e.preventDefault();

    const searchKeyword = document.getElementById('searchInput')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const expressCompany = document.getElementById('expressFilter')?.value || '';

    currentFilters = {};
    
    if (searchKeyword.trim()) {
        currentFilters.keyword = searchKeyword.trim();
    }
    if (status) {
        currentFilters.status = status;
    }
    if (expressCompany) {
        currentFilters.expressCompany = expressCompany;
    }

    currentPage = 1;
    loadOrders(1);
}

// 取消订单
async function cancelOrder(orderId) {
    if (!confirm('确定要取消这个订单吗?')) {
        return;
    }

    try {
        // 调用后端 API 取消订单
        await axios.post(`${API_BASE_URL}/orders/${orderId}/cancel`);
        
        showToast('订单已取消', 'success');
        
        // 重新加载订单列表
        refreshCurrentTab();
    } catch (error) {
        console.error('取消订单失败:', error);
        showToast(error.response?.data?.message || '取消订单失败', 'danger');
    }
}

// 开始配送（接单人操作）
async function startDelivery(orderId) {
    if (!confirm('确定要开始配送吗?')) {
        return;
    }

    try {
        console.log('调用开始配送接口:', `${API_BASE_URL}/orders/${orderId}/start-delivery`);
        // 调用后端 API 开始配送
        const response = await axios.post(`${API_BASE_URL}/orders/${orderId}/start-delivery`);
        console.log('开始配送响应:', response.data);
        
        showToast('已开始配送', 'success');
        
        // 重新加载订单列表
        refreshCurrentTab();
    } catch (error) {
        console.error('开始配送失败:', error);
        showToast(error.response?.data?.message || '开始配送失败', 'danger');
    }
}

// 接单人确认配送
async function confirmDelivery(orderId) {
    if (!confirm('确认已完成配送吗?')) {
        return;
    }

    try {
        // 调用后端 API 确认配送（订单状态变为 DELIVERED）
        await axios.post(`${API_BASE_URL}/orders/${orderId}/confirm-delivery`);
        
        showToast('已确认配送，等待发布者确认收货', 'success');
        
        // 重新加载订单列表
        refreshCurrentTab();
    } catch (error) {
        console.error('确认配送失败:', error);
        showToast(error.response?.data?.message || '确认配送失败', 'danger');
    }
}

// 发布者确认收货
async function completeOrder(orderId) {
    if (!confirm('确认已收到快递，完成订单吗?')) {
        return;
    }

    try {
        // 调用后端 API 完成订单
        await axios.post(`${API_BASE_URL}/orders/${orderId}/complete`);
        
        showToast('订单已完成', 'success');
        
        // 重新加载订单列表
        refreshCurrentTab();
    } catch (error) {
        console.error('完成订单失败:', error);
        showToast(error.response?.data?.message || '完成订单失败', 'danger');
    }
}

// 刷新当前标签页
function refreshCurrentTab() {
    loadOrders(currentPage);
}

// 显示用户信息
async function showUserProfile(userId, username) {
    selectedUserId = userId;
    
    // 获取当前用户信息
    const currentUser = getUserInfo();
    const isAdmin = currentUser && (currentUser.role?.toUpperCase() === 'ADMIN' || currentUser.isAdmin);
    
    try {
        // 并行请求用户资料和统计数据
        const [profileResponse, statsResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/user/profile`, { params: { targetUserId: userId } }),
            axios.get(`${API_BASE_URL}/user/statistics`, { params: { targetUserId: userId } })
        ]);
        
        const profile = profileResponse.data.data;
        const stats = statsResponse.data?.data || {};
        
        // 根据角色控制显示内容
        const basicInfoSection = document.getElementById('profileBasicInfo');
        const statsSection = document.getElementById('profileStatsSection');
        const statsTitle = document.getElementById('profileStatsTitle');
        
        if (basicInfoSection && statsSection) {
            if (isAdmin) {
                // 管理员：显示左右两栏
                basicInfoSection.style.display = 'block';
                basicInfoSection.className = 'col-md-6';
                statsSection.className = 'col-md-6';
                statsTitle.textContent = '统计数据';
            } else {
                // 普通用户：只显示统计数据，居中显示
                basicInfoSection.style.display = 'none';
                statsSection.className = 'col-12'; // 占满整行
                statsTitle.textContent = '用户信息'; // 标题改为用户信息
            }
        }
        
        // 填充统计数据（所有人都可见）
        document.getElementById('profilePublishCount').textContent = stats.publishCount || 0;
        document.getElementById('profileAcceptCount').textContent = stats.acceptCount || 0;
        document.getElementById('profileCompleteCount').textContent = stats.completeCount || 0;
        document.getElementById('profileEarnings').textContent = `¥${(stats.earnings || 0).toFixed(2)}`;
        
        // 填充基本信息（仅管理员可见）
        if (isAdmin) {
            document.getElementById('profileUsername').textContent = profile.username || '-';
            document.getElementById('profileRealName').textContent = profile.realName || '-';
            document.getElementById('profilePhone').textContent = profile.phone || '-';
            document.getElementById('profileEmail').textContent = profile.email || '-';
            document.getElementById('profileStudentId').textContent = profile.studentId || '-';
            
            // 管理员使用大模态框
            const modalDialog = document.getElementById('userProfileModalDialog');
            if (modalDialog) {
                modalDialog.className = 'modal-dialog modal-lg';
            }
        } else {
            // 普通用户使用小模态框
            const modalDialog = document.getElementById('userProfileModalDialog');
            if (modalDialog) {
                modalDialog.className = 'modal-dialog modal-sm';
            }
        }
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('userProfileModal'));
        modal.show();
    } catch (error) {
        console.error('获取用户信息失败:', error);
        
        // 降级处理：只显示统计数据
        try {
            const statsResponse = await axios.get(`${API_BASE_URL}/user/statistics`, { params: { targetUserId: userId } });
            const stats = statsResponse.data?.data || {};
            
            document.getElementById('profilePublishCount').textContent = stats.publishCount || 0;
            document.getElementById('profileAcceptCount').textContent = stats.acceptCount || 0;
            document.getElementById('profileCompleteCount').textContent = stats.completeCount || 0;
            document.getElementById('profileEarnings').textContent = '¥0.00';
            
            // 普通用户隐藏基本信息
            const basicInfoSection = document.getElementById('profileBasicInfo');
            if (basicInfoSection) {
                basicInfoSection.style.display = isAdmin ? 'block' : 'none';
            }
            
            // 根据角色设置模态框大小
            const modalDialog = document.getElementById('userProfileModalDialog');
            if (modalDialog) {
                modalDialog.className = isAdmin ? 'modal-dialog modal-lg' : 'modal-dialog modal-sm';
            }
            
            const modal = new bootstrap.Modal(document.getElementById('userProfileModal'));
            modal.show();
        } catch (err) {
            showToast('获取用户信息失败', 'danger');
        }
    }
}

// 创建对话
async function handleCreateConversation() {
    if (!selectedUserId) {
        showToast('未选择用户', 'warning');
        return;
    }
    
    const userInfo = getUserInfo();
    if (selectedUserId === userInfo?.id) {
        showToast('不能与自己创建对话', 'warning');
        return;
    }
    
    try {
        const userProfileModal = bootstrap.Modal.getInstance(document.getElementById('userProfileModal'));
        userProfileModal.hide();
        
        // 跳转到消息页面并打开对话
        window.location.href = `messages.html?userId=${selectedUserId}`;
    } catch (error) {
        console.error('创建对话失败:', error);
        showToast('创建对话失败', 'danger');
    }
}