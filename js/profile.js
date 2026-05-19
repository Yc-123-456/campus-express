// 个人中心页面 - profile.js

document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    loadUserStatistics();
    
    // 加载未读消息数量
    loadNavUnreadCount();

    // 绑定表单提交事件
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleUpdateProfile);
    }

    // 绑定修改密码模态框的提交按钮
    const submitPasswordBtn = document.getElementById('submitPasswordBtn');
    if (submitPasswordBtn) {
        submitPasswordBtn.addEventListener('click', handleChangePassword);
    }
});

// 加载用户资料
async function loadUserProfile() {
    try {
        // TODO: 替换为实际的 API 调用
        // const response = await axios.get(`${API_BASE_URL}/user/profile`);
        // const user = response.data.data;

        // 使用本地存储的用户信息
        const userInfo = getUserInfo();
        
        if (userInfo) {
            document.getElementById('username').value = userInfo.username || '';
            document.getElementById('realName').value = userInfo.realName || '';
            document.getElementById('phone').value = userInfo.phone || '';
            document.getElementById('email').value = userInfo.email || '';
            document.getElementById('studentId').value = userInfo.studentId || '';
            document.getElementById('address').value = userInfo.address || '';
        }
    } catch (error) {
        console.error('加载用户资料失败:', error);
        showToast('加载用户资料失败', 'danger');
    }
}

// 处理更新个人资料
async function handleUpdateProfile(e) {
    e.preventDefault();

    const formData = {
        username: document.getElementById('username').value,
        realName: document.getElementById('realName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        studentId: document.getElementById('studentId').value,
        address: document.getElementById('address').value
    };

    // 表单验证
    if (!validateProfileForm(formData)) {
        return;
    }

    try {
        // 调用后端 API 更新用户资料
        await axios.put(`${API_BASE_URL}/user/profile`, formData);
        
        // 更新本地存储
        const userInfo = getUserInfo();
        if (userInfo) {
            Object.assign(userInfo, formData);
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
        
        showToast('资料更新成功', 'success');
    } catch (error) {
        console.error('更新资料失败:', error);
        showToast(error.response?.data?.message || '更新资料失败', 'danger');
    }
}

// 验证个人资料表单
function validateProfileForm(data) {
    if (!data.username) {
        showToast('请输入用户名', 'warning');
        return false;
    }

    if (!data.realName) {
        showToast('请输入真实姓名', 'warning');
        return false;
    }

    if (!data.phone) {
        showToast('请输入手机号', 'warning');
        return false;
    }

    if (!validatePhone(data.phone)) {
        showToast('请输入正确的手机号', 'warning');
        return false;
    }

    if (data.email && !validateEmail(data.email)) {
        showToast('邮箱格式不正确', 'warning');
        return false;
    }

    return true;
}

// 处理修改密码
async function handleChangePassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 表单验证
    if (!oldPassword) {
        showToast('请输入原密码', 'warning');
        return false;
    }

    if (!newPassword) {
        showToast('请输入新密码', 'warning');
        return false;
    }

    if (newPassword.length < 6) {
        showToast('新密码长度不能少于6位', 'warning');
        return false;
    }

    if (newPassword !== confirmPassword) {
        showToast('两次输入的新密码不一致', 'warning');
        return false;
    }

    try {
        // 调用后端 API 修改密码
        const response = await axios.post(`${API_BASE_URL}/user/change-password`, {
            oldPassword,
            newPassword
        });
        
        if (response.data.code === 200) {
            showToast(response.data.message || '密码修改成功', 'success');
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            if (modal) {
                modal.hide();
            }
            
            // 重置密码表单
            document.getElementById('passwordForm').reset();
        } else {
            // 处理业务失败
            showToast(response.data.message || '密码修改失败', 'danger');
        }
    } catch (error) {
        console.error('修改密码失败:', error);
        showToast(error.response?.data?.message || '修改密码失败', 'danger');
    }
}

// 加载用户统计
async function loadUserStatistics() {
    try {
        // 从后端 API 获取用户统计数据
        const response = await axios.get(`${API_BASE_URL}/user/statistics`);
        const stats = response.data.data;

        document.getElementById('publishCount').textContent = stats.publishCount || 0;
        document.getElementById('acceptCount').textContent = stats.acceptCount || 0;
        document.getElementById('completeCount').textContent = stats.completeCount || 0;
        document.getElementById('earnings').textContent = `¥${(stats.earnings || 0).toFixed(2)}`;
    } catch (error) {
        console.error('加载统计数据失败:', error);
        // 不显示错误提示,保持默认值0
        document.getElementById('publishCount').textContent = '0';
        document.getElementById('acceptCount').textContent = '0';
        document.getElementById('completeCount').textContent = '0';
        document.getElementById('earnings').textContent = '¥0.00';
    }
}
