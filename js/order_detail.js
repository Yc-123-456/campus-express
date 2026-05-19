// 订单详情页面 - order_detail.js

let orderId = null;
let orderData = null;

document.addEventListener('DOMContentLoaded', function() {
    // 获取订单ID
    orderId = getUrlParam('id');
    
    if (!orderId) {
        showToast('订单ID不存在', 'danger');
        setTimeout(() => {
            window.location.href = 'orders.html';
        }, 1000);
        return;
    }

    loadOrderDetail();
    
    // 加载未读消息数量
    loadNavUnreadCount();

    // 绑定按钮事件
    bindButtonEvents();
});

// 加载订单详情
async function loadOrderDetail() {
    try {
        // 从后端 API 获取订单详情
        const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`);
        orderData = response.data.data;

        renderOrderDetail();
    } catch (error) {
        console.error('加载订单详情失败:', error);
        showToast(error.response?.data?.message || '加载订单详情失败', 'danger');
        
        // 如果订单不存在，返回订单列表
        if (error.response?.status === 404) {
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 1500);
        }
    }
}

// 渲染订单详情
function renderOrderDetail() {
    if (!orderData) return;

    // 填充订单信息
    document.getElementById('orderId').textContent = orderData.id;
    document.getElementById('createTime').textContent = formatDateTime(orderData.createdAt);
    document.getElementById('expressCompany').textContent = orderData.expressCompany;
    document.getElementById('trackingNumber').textContent = orderData.trackingNumber || '-';
    document.getElementById('pickupCode').textContent = orderData.pickupCode;
    document.getElementById('pickupLocation').textContent = orderData.pickupLocation;
    document.getElementById('deliveryAddress').textContent = orderData.deliveryAddress;
    document.getElementById('contactName').textContent = orderData.contactName;
    document.getElementById('contactPhone').textContent = maskPhone(orderData.contactPhone);
    document.getElementById('fee').textContent = formatMoney(orderData.fee);
    document.getElementById('reward').textContent = formatMoney(orderData.reward);
    document.getElementById('totalFee').textContent = formatMoney(orderData.fee + orderData.reward);
    document.getElementById('remark').textContent = orderData.remark || '无';

    // 更新状态徽章
    const statusBadge = document.getElementById('orderStatusBadge');
    statusBadge.className = `badge ${getOrderStatusClass(orderData.status)}`;
    statusBadge.textContent = getOrderStatusText(orderData.status);

    // 根据订单状态和用户角色显示/隐藏操作按钮
    updateActionButtons();
}

// 更新操作按钮显示状态
function updateActionButtons() {
    const userInfo = getUserInfo();
    const isPublisher = userInfo && userInfo.id === orderData.publisherId;
    const isAcceptor = userInfo && userInfo.id === orderData.acceptorId;

    const acceptBtn = document.getElementById('acceptOrderBtn');
    const completeBtn = document.getElementById('completeOrderBtn');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    const contactBtn = document.getElementById('contactBtn');

    // 隐藏所有按钮
    acceptBtn.style.display = 'none';
    completeBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    contactBtn.style.display = 'none';

    // 根据状态和角色显示相应按钮
    switch (orderData.status) {
        case 'pending':
        case 'PENDING':
            // 待取件状态:发布者可取消,其他用户可接单
            if (!isPublisher) {
                acceptBtn.style.display = 'inline-block';
            } else {
                cancelBtn.style.display = 'inline-block';
            }
            // 待取件状态不显示联系按钮
            break;
        
        case 'accepted':
        case 'ACCEPTED':
            // 已接单状态:接单人可开始配送,发布者可取消
            if (isAcceptor) {
                completeBtn.textContent = '开始配送';
                completeBtn.style.display = 'inline-block';
                // 接单人联系发布者
                contactBtn.textContent = '联系发布者';
                contactBtn.style.display = 'inline-block';
            } else if (isPublisher) {
                cancelBtn.style.display = 'inline-block';
                // 发布者联系接单人
                contactBtn.textContent = '联系接单人';
                contactBtn.style.display = 'inline-block';
            }
            break;
        
        case 'delivering':
        case 'DELIVERING':
            // 配送中状态:接单人可确认配送
            if (isAcceptor) {
                completeBtn.textContent = '确认配送';
                completeBtn.style.display = 'inline-block';
                // 接单人联系发布者
                contactBtn.textContent = '联系发布者';
                contactBtn.style.display = 'inline-block';
            } else if (isPublisher) {
                // 发布者联系接单人
                contactBtn.textContent = '联系接单人';
                contactBtn.style.display = 'inline-block';
            }
            break;
        
        case 'delivered':
        case 'DELIVERED':
            // 已送达状态:发布者可确认收货
            if (isPublisher) {
                completeBtn.textContent = '确认收货';
                completeBtn.style.display = 'inline-block';
                // 发布者联系接单人
                contactBtn.textContent = '联系接单人';
                contactBtn.style.display = 'inline-block';
            } else if (isAcceptor) {
                // 接单人联系发布者
                contactBtn.textContent = '联系发布者';
                contactBtn.style.display = 'inline-block';
            }
            break;
        
        case 'completed':
        case 'COMPLETED':
        case 'cancelled':
        case 'CANCELLED':
            // 已完成或已取消:显示联系按钮
            if (isPublisher) {
                // 发布者联系接单人（如果有接单人）
                if (orderData.acceptorId) {
                    contactBtn.textContent = '联系接单人';
                    contactBtn.style.display = 'inline-block';
                }
            } else if (isAcceptor) {
                // 接单人联系发布者
                contactBtn.textContent = '联系发布者';
                contactBtn.style.display = 'inline-block';
            }
            break;
    }
}

// 绑定按钮事件
function bindButtonEvents() {
    const acceptBtn = document.getElementById('acceptOrderBtn');
    const completeBtn = document.getElementById('completeOrderBtn');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    const contactBtn = document.getElementById('contactBtn');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', handleAcceptOrder);
    }

    if (completeBtn) {
        completeBtn.addEventListener('click', handleCompleteOrder);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancelOrder);
    }

    if (contactBtn) {
        contactBtn.addEventListener('click', handleContact);
    }
}

// 处理接单
async function handleAcceptOrder() {
    if (!confirm('确定要接这个订单吗?')) {
        return;
    }

    try {
        // TODO: 替换为实际的 API 调用
        // await axios.post(`${API_BASE_URL}/orders/${orderId}/accept`);
        
        console.log('接单:', orderId);
        
        showToast('接单成功', 'success');
        
        // 重新加载订单详情
        loadOrderDetail();
    } catch (error) {
        console.error('接单失败:', error);
        showToast(error.response?.data?.message || '接单失败', 'danger');
    }
}

// 处理完成订单
async function handleCompleteOrder() {
    const userInfo = getUserInfo();
    const isPublisher = userInfo && userInfo.id === orderData.publisherId;
    const isAcceptor = userInfo && userInfo.id === orderData.acceptorId;
    
    let action = '';
    let apiEndpoint = '';
    
    // 根据当前订单状态和用户角色确定操作
    if (isAcceptor && (orderData.status === 'accepted' || orderData.status === 'ACCEPTED')) {
        // 接单人：已接单 → 开始配送
        action = '开始配送';
        apiEndpoint = 'start-delivery';
    } else if (isAcceptor && (orderData.status === 'delivering' || orderData.status === 'DELIVERING')) {
        // 接单人：配送中 → 确认送达
        action = '确认送达';
        apiEndpoint = 'confirm-delivery';
    } else if (isPublisher && (orderData.status === 'delivered' || orderData.status === 'DELIVERED')) {
        // 发布者：已送达 → 确认收货
        action = '确认收货';
        apiEndpoint = 'complete';
    } else {
        showToast('当前状态不允许此操作', 'warning');
        return;
    }
    
    if (!confirm(`确定要${action}吗?`)) {
        return;
    }

    try {
        // 调用后端 API
        await axios.post(`${API_BASE_URL}/orders/${orderId}/${apiEndpoint}`);
        
        showToast(action + '成功', 'success');
        
        // 重新加载订单详情
        loadOrderDetail();
    } catch (error) {
        console.error('操作失败:', error);
        showToast(error.response?.data?.message || '操作失败', 'danger');
    }
}

// 处理取消订单
async function handleCancelOrder() {
    if (!confirm('确定要取消这个订单吗?')) {
        return;
    }

    try {
        // 调用后端 API 取消订单
        await axios.post(`${API_BASE_URL}/orders/${orderId}/cancel`);
        
        showToast('订单已取消', 'success');
        
        // 重新加载订单详情
        loadOrderDetail();
    } catch (error) {
        console.error('取消订单失败:', error);
        showToast(error.response?.data?.message || '取消订单失败', 'danger');
    }
}

// 处理联系
function handleContact() {
    const userInfo = getUserInfo();
    const isPublisher = userInfo && userInfo.id === orderData.publisherId;
    const isAcceptor = userInfo && userInfo.id === orderData.acceptorId;
    
    // 根据用户角色决定联系谁
    let targetUserId = null;
    let targetUserName = null;
    
    if (isPublisher) {
        // 发布者联系接单人
        if (!orderData.acceptorId) {
            showToast('订单还未被接取，无法联系接单人', 'warning');
            return;
        }
        targetUserId = orderData.acceptorId;
        targetUserName = orderData.acceptorName || orderData.acceptorUsername || '接单人';
    } else if (isAcceptor) {
        // 接单人联系发布者
        targetUserId = orderData.publisherId;
        targetUserName = orderData.publisherName || orderData.publisherUsername || orderData.contactName || '发布者';
    } else {
        showToast('您无权联系该用户', 'warning');
        return;
    }
    
    showToast(`正在打开与 ${targetUserName} 的对话...`, 'info');
    
    // 跳转到消息页面，并传递用户ID参数
    const messagesUrl = `messages.html?userId=${targetUserId}&userName=${encodeURIComponent(targetUserName)}`;
    window.location.href = messagesUrl;
}
