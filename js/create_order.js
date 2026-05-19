// 创建订单页面 - create_order.js

document.addEventListener('DOMContentLoaded', function() {
    const createOrderForm = document.getElementById('createOrderForm');
    if (createOrderForm) {
        createOrderForm.addEventListener('submit', handleCreateOrder);
    }
    
    // 加载未读消息数量
    loadNavUnreadCount();
});

// 处理创建订单
async function handleCreateOrder(e) {
    e.preventDefault();

    // 获取表单数据
    const formData = {
        expressCompany: document.getElementById('expressCompany').value,
        trackingNumber: document.getElementById('trackingNumber').value,
        pickupCode: document.getElementById('pickupCode').value,
        pickupLocation: document.getElementById('pickupLocation').value,
        deliveryAddress: document.getElementById('deliveryAddress').value,
        contactName: document.getElementById('contactName').value,
        contactPhone: document.getElementById('contactPhone').value,
        fee: parseFloat(document.getElementById('fee').value),
        reward: parseFloat(document.getElementById('reward').value) || 0,
        remark: document.getElementById('remark').value
    };

    // 表单验证
    if (!validateOrderForm(formData)) {
        return;
    }

    try {
    // ✅ 启用实际的 API 调用
    const response = await axios.post(`${API_BASE_URL}/orders`, formData, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    
    console.log('创建订单成功:', response.data);
    showToast(response.data.message || '订单创建成功!', 'success');
    
    // 重置表单
    document.getElementById('createOrderForm').reset();
    
    // 跳转到订单列表
    setTimeout(() => {
        window.location.href = 'orders.html';
    }, 1000);
} catch (error) {
    console.error('创建订单失败:', error);
    showToast(error.response?.data?.message || '创建订单失败', 'danger');
}
}

// 验证订单表单
function validateOrderForm(data) {
    // 快递公司
    if (!data.expressCompany) {
        showToast('请选择快递公司', 'warning');
        return false;
    }

    // 取件码
    if (!data.pickupCode) {
        showToast('请输入取件码', 'warning');
        return false;
    }

    // 取件地点
    if (!data.pickupLocation) {
        showToast('请输入取件地点', 'warning');
        return false;
    }

    // 送达地址
    if (!data.deliveryAddress) {
        showToast('请输入送达地址', 'warning');
        return false;
    }

    // 联系人
    if (!data.contactName) {
        showToast('请输入联系人姓名', 'warning');
        return false;
    }

    // 联系电话
    if (!data.contactPhone) {
        showToast('请输入联系电话', 'warning');
        return false;
    }

    if (!validatePhone(data.contactPhone)) {
        showToast('请输入正确的手机号', 'warning');
        return false;
    }

    // 费用
    if (isNaN(data.fee) || data.fee < 0) {
        showToast('请输入正确的代取费用', 'warning');
        return false;
    }

    return true;
}

// 快递单号自动生成提示(可选功能)
document.getElementById('expressCompany')?.addEventListener('change', function() {
    const trackingInput = document.getElementById('trackingNumber');
    if (trackingInput && !trackingInput.value) {
        // 可以添加一些快捷输入提示
        trackingInput.placeholder = `请输入${this.value}的快递单号`;
    }
});
