/*  */// 公共工具函数 - common.js

// 格式化日期时间
function formatDateTime(dateStr, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!dateStr) return '-';
    return dayjs(dateStr).format(format);
}

// 格式化日期
function formatDate(dateStr, format = 'YYYY-MM-DD') {
    if (!dateStr) return '-';
    return dayjs(dateStr).format(format);
}

// 获取订单状态文本
function getOrderStatusText(status) {
    const statusMap = {
        'pending': '待取件',
        'accepted': '已接单',
        'delivering': '配送中',
        'delivered': '已送达',
        'completed': '已完成',
        'cancelled': '已取消',
        'PENDING': '待取件',
        'ACCEPTED': '已接单',
        'DELIVERING': '配送中',
        'DELIVERED': '已送达',
        'COMPLETED': '已完成',
        'CANCELLED': '已取消'
    };
    return statusMap[status] || '未知';
}

// 获取订单状态样式类
function getOrderStatusClass(status) {
    const classMap = {
        'pending': 'order-status order-status-pending',
        'accepted': 'order-status order-status-accepted',
        'delivering': 'order-status order-status-delivering',
        'delivered': 'order-status order-status-delivered',
        'completed': 'order-status order-status-completed',
        'cancelled': 'order-status order-status-cancelled',
        'PENDING': 'order-status order-status-pending',
        'ACCEPTED': 'order-status order-status-accepted',
        'DELIVERING': 'order-status order-status-delivering',
        'DELIVERED': 'order-status order-status-delivered',
        'COMPLETED': 'order-status order-status-completed',
        'CANCELLED': 'order-status order-status-cancelled'
    };
    return classMap[status] || '';
}

// 获取订单状态图标
function getOrderStatusIcon(status) {
    const iconMap = {
        'pending': '📋',
        'accepted': '✅',
        'delivering': '🚚',
        'delivered': '📍',
        'completed': '🎉',
        'cancelled': '❌',
        'PENDING': '📋',
        'ACCEPTED': '✅',
        'DELIVERING': '🚚',
        'DELIVERED': '📍',
        'COMPLETED': '🎉',
        'CANCELLED': '❌'
    };
    return iconMap[status] || '';
}

// 创建订单状态徽章
function createStatusBadge(status) {
    const statusClass = getOrderStatusClass(status);
    const statusText = getOrderStatusText(status);
    const statusIcon = getOrderStatusIcon(status);
    return `<span class="${statusClass}">${statusIcon} ${statusText}</span>`;
}

// 格式化金额
function formatMoney(amount) {
    if (amount === null || amount === undefined) return '¥0.00';
    return `¥${parseFloat(amount).toFixed(2)}`;
}

// 手机号脱敏
function maskPhone(phone) {
    if (!phone) return '-';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

// 验证手机号
function validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
}

// 验证邮箱
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 复制到剪贴板
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板', 'success');
        return true;
    } catch (err) {
        console.error('复制失败:', err);
        showToast('复制失败', 'danger');
        return false;
    }
}

// 生成随机字符串
function generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// URL 参数解析
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// 获取 URL 参数
function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// 设置 URL 参数
function setUrlParam(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

// 删除 URL 参数
function removeUrlParam(name) {
    const url = new URL(window.location);
    url.searchParams.delete(name);
    window.history.pushState({}, '', url);
}

// 本地存储封装
const storage = {
    // 设置
    set(key, value, expireTime = null) {
        const data = {
            value: value,
            expireTime: expireTime ? Date.now() + expireTime : null
        };
        localStorage.setItem(key, JSON.stringify(data));
    },
    
    // 获取
    get(key) {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const data = JSON.parse(item);
        if (data.expireTime && Date.now() > data.expireTime) {
            localStorage.removeItem(key);
            return null;
        }
        return data.value;
    },
    
    // 删除
    remove(key) {
        localStorage.removeItem(key);
    },
    
    // 清空
    clear() {
        localStorage.clear();
    }
};

// 确认对话框
function confirmDialog(message, callback) {
    if (confirm(message)) {
        callback && callback();
    }
}

// 加载动画显示
function showLoading(element) {
    if (element) {
        element.innerHTML = '<div class="loading"></div> 加载中...';
        element.disabled = true;
    }
}

// 隐藏加载动画
function hideLoading(element) {
    if (element) {
        element.innerHTML = element.getAttribute('data-original-text') || '提交';
        element.disabled = false;
    }
}

// 表格行号计算
function calculateRowNumber(page, pageSize, index) {
    return (page - 1) * pageSize + index + 1;
}

// 文件上传验证
function validateFile(file, options = {}) {
    const {
        maxSize = 5 * 1024 * 1024, // 默认 5MB
        allowedTypes = []
    } = options;

    // 检查文件大小
    if (file.size > maxSize) {
        showToast(`文件大小不能超过 ${formatFileSize(maxSize)}`, 'warning');
        return false;
    }

    // 检查文件类型
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        showToast(`只支持 ${allowedTypes.join(', ')} 格式的文件`, 'warning');
        return false;
    }

    return true;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 图片预览
function previewImage(file, callback) {
    if (!file.type.startsWith('image/')) {
        showToast('请选择图片文件', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        callback && callback(e.target.result);
    };
    reader.readAsDataURL(file);
}

// 表单验证
function validateForm(formData, rules) {
    const errors = {};
    
    for (const field in rules) {
        const value = formData[field];
        const rule = rules[field];
        
        // 必填验证
        if (rule.required && (!value || value.trim() === '')) {
            errors[field] = rule.message || `${field}不能为空`;
            continue;
        }
        
        // 长度验证
        if (value && rule.minLength && value.length < rule.minLength) {
            errors[field] = `${field}长度不能少于${rule.minLength}个字符`;
            continue;
        }
        
        if (value && rule.maxLength && value.length > rule.maxLength) {
            errors[field] = `${field}长度不能超过${rule.maxLength}个字符`;
            continue;
        }
        
        // 正则验证
        if (value && rule.pattern && !rule.pattern.test(value)) {
            errors[field] = rule.message || `${field}格式不正确`;
            continue;
        }
    }
    
    return Object.keys(errors).length === 0 ? { valid: true } : { valid: false, errors };
}

// 数组分页
function paginateArray(array, page, pageSize) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
        data: array.slice(start, end),
        total: array.length,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(array.length / pageSize)
    };
}

// 搜索过滤
function filterArray(array, keyword, fields) {
    if (!keyword) return array;
    
    const lowerKeyword = keyword.toLowerCase();
    return array.filter(item => {
        return fields.some(field => {
            const value = item[field];
            return value && String(value).toLowerCase().includes(lowerKeyword);
        });
    });
}

// 排序数组
function sortArray(array, field, order = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (order === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

// 加载未读消息数量（在所有页面显示角标）
async function loadNavUnreadCount() {
    try {
        const token = getToken();
        if (!token) return;
        
        const response = await axios.get(`${API_BASE_URL}/messages/unread-count`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.data.code === 200) {
            const count = response.data.data.total || 0;
            updateNavUnreadBadge(count);
        }
    } catch (error) {
        // 静默失败，不影响其他功能
        console.error('加载未读消息数失败:', error);
    }
}

// 更新导航栏未读角标
function updateNavUnreadBadge(count) {
    const badge = document.getElementById('navUnreadBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}