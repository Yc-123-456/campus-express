// 认证模块 - auth.js

// API 基础地址 (根据实际后端地址修改)
const API_BASE_URL = 'http://localhost:8080/api';

// 登录功能
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', handleRegister);
    }

    // 检查登录状态
    checkAuthStatus();
});

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // 调用真实后端 API
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            username,
            password
        });

        if (response.data.code === 200) {
            const { token, user } = response.data.data;
            
            // 保存 token 和用户信息
            localStorage.setItem('token', token);
            localStorage.setItem('userInfo', JSON.stringify(user));

            showToast('登录成功!', 'success');
            
            // 跳转到仪表盘
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            // 处理业务失败（HTTP 200 但业务 code 不是 200）
            const message = response.data.message || '登录失败,请检查用户名和密码';
            showToast(message, 'danger');
        }
    } catch (error) {
        console.error('登录失败:', error);
        const message = error.response?.data?.message || '登录失败,请检查用户名和密码';
        showToast(message, 'danger');
    }
}

// 处理登出
function handleLogout(e) {
    e.preventDefault();
    
    if (confirm('确定要退出登录吗?')) {
        // 清除存储的认证信息
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userInfo');
        
        showToast('已退出登录', 'success');
        
        // 跳转到登录页
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }
}

// 处理注册
function handleRegister(e) {
    e.preventDefault();
    // 显示注册模态框
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
}

// 提交注册
document.addEventListener('DOMContentLoaded', function() {
    const submitRegisterBtn = document.getElementById('submitRegisterBtn');
    if (submitRegisterBtn) {
        submitRegisterBtn.addEventListener('click', handleSubmitRegister);
    }
});

// 处理提交注册
async function handleSubmitRegister() {
    // 获取表单数据
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const realName = document.getElementById('regRealName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const studentId = document.getElementById('regStudentId').value.trim();

    // 表单验证
    if (!username) {
        showToast('请输入用户名', 'warning');
        return;
    }

    if (username.length < 3 || username.length > 20) {
        showToast('用户名长度必须在3-20个字符之间', 'warning');
        return;
    }

    if (!password) {
        showToast('请输入密码', 'warning');
        return;
    }

    if (password.length < 6) {
        showToast('密码长度不能少于6个字符', 'warning');
        return;
    }

    if (password !== confirmPassword) {
        showToast('两次输入的密码不一致', 'warning');
        return;
    }

    if (phone && !validatePhone(phone)) {
        showToast('请输入正确的手机号', 'warning');
        return;
    }

    if (email && !validateEmail(email)) {
        showToast('请输入正确的邮箱地址', 'warning');
        return;
    }

    try {
        // 调用后端 API 注册
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            username,
            password,
            realName: realName || null,
            phone: phone || null,
            email: email || null,
            studentId: studentId || null
        });

        if (response.data.code === 200) {
            showToast('注册成功！请登录', 'success');
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            modal.hide();
            
            // 重置表单
            document.getElementById('registerForm').reset();
            
            // 自动填充用户名到登录框
            document.getElementById('username').value = username;
        }
    } catch (error) {
        console.error('注册失败:', error);
        const message = error.response?.data?.message || '注册失败，请稍后重试';
        showToast(message, 'danger');
    }
}

// 检查认证状态
function checkAuthStatus() {
    const token = getToken();
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!token && currentPage !== 'index.html') {
        // 未登录且不在登录页,跳转到登录页
        window.location.href = 'index.html';
        return;
    }
    
    if (token && currentPage === 'index.html') {
        // 已登录且在登录页,跳转到仪表盘
        window.location.href = 'dashboard.html';
        return;
    }
    
    // 更新用户显示名称
    updateUserInfo();
}

// 获取 token
function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// 获取用户信息
function getUserInfo() {
    const userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
}

// 更新用户信息显示
function updateUserInfo() {
    const userInfo = getUserInfo();
    if (userInfo) {
        const displayNameElements = document.querySelectorAll('#userDisplayName');
        displayNameElements.forEach(el => {
            el.textContent = userInfo.username || userInfo.realName || '用户';
        });
    }
}

// 设置请求拦截器
axios.interceptors.request.use(
    config => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 设置响应拦截器
axios.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    showToast('未授权,请重新登录', 'warning');
                    handleLogout({ preventDefault: () => {} });
                    break;
                case 403:
                    showToast('没有权限访问', 'warning');
                    break;
                case 404:
                    showToast('请求的资源不存在', 'warning');
                    break;
                case 500:
                    showToast('服务器错误', 'danger');
                    break;
                default:
                    showToast(error.response.data?.message || '请求失败', 'danger');
            }
        } else {
            showToast('网络错误,请检查网络连接', 'danger');
        }
        return Promise.reject(error);
    }
);

// 显示提示消息
function showToast(message, type = 'info') {
    // 创建 toast 容器
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // 创建 toast
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toast);

    // 显示 toast
    const bsToast = new bootstrap.Toast(toast, {
        delay: 3000
    });
    bsToast.show();

    // 自动移除
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}
