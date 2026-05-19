// 消息模块 - messages.js

let currentConversation = null;
let conversationsData = [];
let currentPage = 1;
let pageSize = 20;

document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initMessagesPage();
    
    // 加载会话列表
    loadConversations();
    
    // 绑定事件
    bindEvents();
    
    // 定时刷新未读消息数
    setInterval(loadUnreadCount, 30000); // 每30秒刷新一次
    
    // 检查URL参数，如果指定了用户ID，自动打开该用户的会话
    const userId = getUrlParam('userId');
    const userName = getUrlParam('userName');
    
    if (userId) {
        // 等待会话列表加载完成后，自动打开指定用户的会话
        setTimeout(() => {
            selectConversation(userId, null);
        }, 500);
    }
});

// 初始化消息页面
function initMessagesPage() {
    // 检查登录状态
    if (!checkAuth()) {
        window.location.href = 'index.html';
        return;
    }
    
    // 显示用户信息
    displayUserInfo();
    
    // 加载未读消息数量
    loadUnreadCount();
}

// 绑定事件
function bindEvents() {
    // 消息表单提交
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', handleSendMessage);
    }
    
    // 新建对话按钮
    const newConversationBtn = document.getElementById('newConversationBtn');
    if (newConversationBtn) {
        newConversationBtn.addEventListener('click', openNewConversationModal);
    }
    
    // 搜索用户输入框
    const searchUserInput = document.getElementById('searchUserInput');
    if (searchUserInput) {
        let searchTimeout;
        searchUserInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const keyword = e.target.value.trim();
            
            if (keyword.length === 0) {
                document.getElementById('searchResults').innerHTML = '';
                return;
            }
            
            // 延迟300ms执行搜索，避免频繁请求
            searchTimeout = setTimeout(() => searchUsers(keyword), 300);
        });
    }
}

// 打开新建对话模态框
function openNewConversationModal() {
    const modal = new bootstrap.Modal(document.getElementById('newConversationModal'));
    document.getElementById('searchUserInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
    modal.show();
}

// 搜索用户
async function searchUsers(keyword) {
    const loadingEl = document.getElementById('searchLoading');
    const resultsEl = document.getElementById('searchResults');
    
    loadingEl.style.display = 'block';
    resultsEl.innerHTML = '';
    
    try {
        // ✅ 正确的API路径
        const response = await axios.get(`${API_BASE_URL}/users/search`, {
            params: { keyword: keyword },
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.data.code === 200) {
            const users = response.data.data || [];
            renderSearchResults(users);
        } else {
            resultsEl.innerHTML = '<div class="text-center text-muted py-3">搜索失败</div>';
        }
    } catch (error) {
        console.error('搜索用户失败:', error);
        resultsEl.innerHTML = '<div class="text-center text-muted py-3">搜索失败，请重试</div>';
    } finally {
        loadingEl.style.display = 'none';
    }
}

// 渲染搜索结果
function renderSearchResults(users) {
    const resultsEl = document.getElementById('searchResults');
    const currentUser = getUserInfo();
    
    if (!users || users.length === 0) {
        resultsEl.innerHTML = '<div class="text-center text-muted py-3">未找到用户</div>';
        return;
    }
    
    resultsEl.innerHTML = users.map(user => {
        // 过滤掉当前用户自己
        if (user.id === currentUser.id) return '';
        
        const initial = user.username ? user.username.charAt(0).toUpperCase() : '?';
        
        return `
            <a href="#" class="list-group-item list-group-item-action" 
               onclick="startConversation('${user.id}', '${user.username}')">
                <div class="d-flex align-items-center">
                    <div class="conversation-avatar">
                        ${initial}
                    </div>
                    <div class="ms-3">
                        <div class="fw-bold">${escapeHtml(user.username)}</div>
                        ${user.phone ? `<small class="text-muted">${maskPhone(user.phone)}</small>` : ''}
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

// 开始新对话
async function startConversation(userId, username) {
    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('newConversationModal'));
    modal.hide();
    
    showToast(`正在打开与 ${username} 的对话...`, 'info');
    
    // 直接选择该用户作为对话对象
    // 如果已有会话，会加载历史消息；如果没有，会创建新会话
    await selectConversation(userId, null);
}

// 加载会话列表
async function loadConversations() {
    try {
        const response = await axios.get(`${API_BASE_URL}/messages/conversations`, {
            params: {
                page: currentPage,
                pageSize: pageSize
            },
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.data.code === 200) {
            conversationsData = response.data.data.list || [];
            renderConversations(conversationsData);
        } else {
            showToast(response.data.message || '加载会话失败', 'danger');
        }
    } catch (error) {
        console.error('加载会话失败:', error);
        showToast('加载会话失败', 'danger');
    }
}

// 渲染会话列表
function renderConversations(conversations) {
    const container = document.getElementById('conversationsList');
    
    if (!conversations || conversations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-chat" style="font-size: 48px; opacity: 0.3;"></i>
                <p class="mt-3">暂无会话</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = conversations.map(conv => {
        const initial = conv.otherUserName ? conv.otherUserName.charAt(0).toUpperCase() : '?';
        const isActive = currentConversation && currentConversation.otherUserId === conv.otherUserId;
        const timeStr = formatTime(conv.lastMessageTime);
        
        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" 
                 data-user-id="${conv.otherUserId}"
                 data-conversation-id="${conv.conversationId}"
                 onclick="selectConversation('${conv.otherUserId}', '${conv.conversationId}')">
                <div class="d-flex align-items-start">
                    <div class="conversation-avatar">${initial}</div>
                    <div class="conversation-info">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="conversation-name">${escapeHtml(conv.otherUserName)}</div>
                            <div class="conversation-time">${timeStr}</div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="conversation-preview">${escapeHtml(conv.lastMessageContent || '暂无消息')}</div>
                            ${conv.unreadCount > 0 ? `<span class="unread-badge ms-2">${conv.unreadCount}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 选择会话
async function selectConversation(userId, conversationId) {
    currentConversation = {
        otherUserId: userId,
        conversationId: conversationId
    };
    
    // 更新UI
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('chatContent').style.display = 'flex';
    
    // 立即标记该会话为已读（在加载消息之前）
    await markConversationAsRead(userId);
    
    // 加载聊天消息
    await loadChatMessages(userId);
    
    // 重新加载会话列表（更新未读数显示）
    await loadConversations();
    
    // 重新加载未读消息数量（更新导航栏角标）
    await loadUnreadCount();
}

// 加载聊天消息
async function loadChatMessages(userId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/messages/conversation/${userId}`, {
            params: {
                page: 1,
                pageSize: 50
            },
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.data.code === 200) {
            const data = response.data.data;
            const messages = data.list || [];
            
            // 更新聊天窗口头部信息
            updateChatHeader(data.otherUser);
            
            // 渲染消息列表
            renderMessages(messages);
        } else {
            showToast(response.data.message || '加载消息失败', 'danger');
        }
    } catch (error) {
        console.error('加载消息失败:', error);
        showToast('加载消息失败', 'danger');
    }
}

// 更新聊天窗口头部
function updateChatHeader(user) {
    if (!user) return;
    
    const avatar = document.getElementById('chatAvatar');
    const userName = document.getElementById('chatUserName');
    
    if (avatar) {
        avatar.textContent = user.username ? user.username.charAt(0).toUpperCase() : '?';
    }
    
    if (userName) {
        // 如果是系统用户，显示"系统通知"
        if (user.username === 'system' || user.id === 'system') {
            userName.textContent = '系统通知';
        } else {
            userName.textContent = user.username || '未知用户';
        }
    }
}

// 渲染消息列表
function renderMessages(messages) {
    const container = document.getElementById('chatMessages');
    
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <p>暂无聊天记录</p>
            </div>
        `;
        return;
    }
    
    // 按时间升序排序：较早的消息在上方，最新消息在下方
    const sortedMessages = [...messages].sort((a, b) => {
        const timeA = new Date(a.createdAt || a.created_at).getTime();
        const timeB = new Date(b.createdAt || b.created_at).getTime();
        return timeA - timeB;
    });
    
    const currentUser = getUserInfo();
    
    container.innerHTML = sortedMessages.map(msg => {
        const isSent = msg.senderId === currentUser.id;
        const isSystem = msg.messageType === 'SYSTEM';
        const timeStr = formatTime(msg.createdAt || msg.created_at);
        
        if (isSystem) {
            // 系统消息
            return `
                <div class="message-system">
                    <div class="message-bubble">
                        ${escapeHtml(msg.content)}
                        <div class="message-time">${timeStr}</div>
                    </div>
                </div>
            `;
        } else {
            // 用户消息
            return `
                <div class="message-item ${isSent ? 'sent' : 'received'}">
                    <div class="message-bubble">
                        ${escapeHtml(msg.content)}
                        <div class="message-time">${timeStr}</div>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    // 滚动到底部（显示最新消息）
    container.scrollTop = container.scrollHeight;
}

// 发送消息
async function handleSendMessage(e) {
    e.preventDefault();
    
    if (!currentConversation) {
        showToast('请先选择一个会话', 'warning');
        return;
    }
    
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content) {
        showToast('请输入消息内容', 'warning');
        return;
    }
    
    try {
        const response = await axios.post(`${API_BASE_URL}/messages/send`, {
            receiverId: currentConversation.otherUserId,
            content: content
        }, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.data.code === 200) {
            // 清空输入框
            input.value = '';
            
            // 重新加载消息
            await loadChatMessages(currentConversation.otherUserId);
            
            // 重新加载会话列表
            loadConversations();
        } else {
            showToast(response.data.message || '发送失败', 'danger');
        }
    } catch (error) {
        console.error('发送消息失败:', error);
        showToast('发送消息失败', 'danger');
    }
}

// 标记会话为已读
async function markConversationAsRead(userId) {
    try {
        await axios.post(`${API_BASE_URL}/messages/conversation/${userId}/read`, {}, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
    } catch (error) {
        console.error('标记已读失败:', error);
    }
}

// 加载未读消息数量
async function loadUnreadCount() {
    try {
        const response = await axios.get(`${API_BASE_URL}/messages/unread-count`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.data.code === 200) {
            const count = response.data.data.total || 0;
            updateUnreadBadge(count);
        }
    } catch (error) {
        console.error('加载未读数失败:', error);
    }
}

// 更新未读角标
function updateUnreadBadge(count) {
    const navBadge = document.getElementById('navUnreadBadge');
    
    if (navBadge) {
        if (count > 0) {
            navBadge.textContent = count > 99 ? '99+' : count;
            navBadge.style.display = 'inline-block';
        } else {
            navBadge.style.display = 'none';
        }
    }
}

// 格式化时间
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const now = dayjs();
    const date = dayjs(timestamp);
    
    // 今天
    if (date.isSame(now, 'day')) {
        return date.format('HH:mm');
    }
    
    // 昨天
    if (date.isSame(now.subtract(1, 'day'), 'day')) {
        return '昨天 ' + date.format('HH:mm');
    }
    
    // 本周
    if (date.isAfter(now.subtract(7, 'day'))) {
        return date.format('dddd HH:mm');
    }
    
    // 其他
    return date.format('YYYY-MM-DD HH:mm');
}

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 显示用户信息
function displayUserInfo() {
    const userInfo = getUserInfo();
    if (userInfo) {
        const displayName = document.getElementById('userDisplayName');
        if (displayName) {
            displayName.textContent = userInfo.username || userInfo.name || '用户';
        }
    }
}

// 检查认证
function checkAuth() {
    return !!getToken();
}
