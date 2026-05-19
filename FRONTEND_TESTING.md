# 校园快递代取系统 - 前端测试指南

## 📋 目录
- [1. 测试前准备](#1-测试前准备)
- [2. 配置后端地址](#2-配置后端地址)
- [3. 移除测试登录代码](#3-移除测试登录代码)
- [4. 功能测试清单](#4-功能测试清单)
- [5. 常见问题排查](#5-常见问题排查)
- [6. 测试工具推荐](#6-测试工具推荐)

---

## 1. 测试前准备

### 1.1 确认后端服务运行正常

**步骤**:
1. 打开浏览器访问后端健康检查接口:
   ```
   http://localhost:3000/api/health
   ```
   
2. 应该看到类似响应:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-01T10:00:00Z"
   }
   ```

3. 如果无法访问,检查:
   - 后端服务是否启动
   - 端口号是否正确(默认 3000)
   - 防火墙设置

### 1.2 准备测试数据

**方式一:使用 SQL 脚本初始化测试数据**

创建 `test_data.sql`:
```sql
-- 插入测试用户 (密码都是: 123456,已加密)
INSERT INTO users (id, username, password, real_name, phone, email, student_id, role, status) VALUES
('user001', 'admin', '$2b$10$YourHashedPasswordHere', '管理员', '13800138000', 'admin@campus.com', '20210001', 'admin', 'normal'),
('user002', 'zhangsan', '$2b$10$YourHashedPasswordHere', '张三', '13800138001', 'zhangsan@test.com', '20210002', 'user', 'normal'),
('user003', 'lisi', '$2b$10$YourHashedPasswordHere', '李四', '13800138002', 'lisi@test.com', '20210003', 'user', 'normal');

-- 初始化钱包
INSERT INTO wallets (user_id, balance, total_earnings) VALUES
('user001', 0.00, 0.00),
('user002', 100.00, 50.00),
('user003', 80.00, 30.00);
```

**方式二:通过注册接口创建测试账号**
- 使用 Postman 或前端注册页面
- 创建 2-3 个测试用户

### 1.3 获取测试 Token

**使用 Postman 测试登录**:

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

**保存返回的 token**,后续测试会用到。

---

## 2. 配置前端连接后端

### 2.1 修改 API 地址配置

打开前端项目中的 [`js/auth.js`](file://e:\campus_pro\campus-front\js\auth.js) 文件:

**找到第 4 行**:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**修改为你的后端地址**:
```javascript
// 本地开发
const API_BASE_URL = 'http://localhost:3000/api';

// 或者局域网测试
// const API_BASE_URL = 'http://192.168.1.100:3000/api';

// 生产环境
// const API_BASE_URL = 'https://your-api-domain.com/api';
```

### 2.2 处理跨域问题(CORS)

如果浏览器控制台出现 CORS 错误,需要在后端添加 CORS 支持:

**Node.js Express 示例**:
```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // 前端地址
  credentials: true
}));
```

**或者在 HTML 中添加 meta 标签**(临时方案):
```html
<!-- 仅用于开发测试 -->
<meta http-equiv="Access-Control-Allow-Origin" content="*">
```

---

## 3. 移除测试登录代码

⚠️ **重要**: 根据安全规范,正式测试前必须移除硬编码的测试账号!

### 3.1 恢复真实登录逻辑

打开 [`js/auth.js`](file://e:\campus_pro\campus-front\js\auth.js),找到 `handleLogin` 函数:

**删除或注释掉测试代码**(第 27-57 行):
```javascript
// ❌ 删除这段测试代码
/*
if (username === 'admin' && password === '123456') {
    const mockUser = { ... };
    // ... 测试逻辑
    return;
}
*/
```

**取消注释真实 API 调用**:
```javascript
// ✅ 启用真实登录
try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
    });

    if (response.data.code === 200) {
        const { token, user } = response.data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('userInfo', JSON.stringify(user));
        
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        } else {
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('userInfo', JSON.stringify(user));
        }

        showToast('登录成功!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    }
} catch (error) {
    console.error('登录失败:', error);
    showToast(error.response?.data?.message || '登录失败', 'danger');
}
```

### 3.2 验证修改

1. 刷新登录页面
2. 输入测试账号(admin / 123456)
3. 应该调用真实后端 API
4. 查看浏览器控制台 Network 面板,确认请求发送到后端

---

## 4. 功能测试清单

### ✅ 4.1 认证模块测试

#### 测试项 1: 用户登录
- [ ] 访问 `index.html`
- [ ] 输入正确的用户名和密码
- [ ] 点击登录按钮
- [ ] **预期结果**:
  - 显示 "登录成功!" 提示
  - 自动跳转到 `dashboard.html`
  - LocalStorage 中保存了 token 和 userInfo
  - 导航栏显示用户名

**检查方法**:
```javascript
// 浏览器控制台执行
console.log(localStorage.getItem('token'));
console.log(JSON.parse(localStorage.getItem('userInfo')));
```

#### 测试项 2: 登录失败处理
- [ ] 输入错误的密码
- [ ] **预期结果**:
  - 显示错误提示(如 "密码错误")
  - 停留在登录页面
  - 没有保存 token

#### 测试项 3: 记住我功能
- [ ] 勾选"记住我"后登录
- [ ] 关闭浏览器重新打开
- [ ] **预期结果**:
  - 仍然保持登录状态
  - 直接跳转到仪表盘

#### 测试项 4: 退出登录
- [ ] 点击右上角"退出登录"
- [ ] **预期结果**:
  - 显示确认对话框
  - 清除 token 和用户信息
  - 跳转回登录页面

---

### ✅ 4.2 仪表盘测试

#### 测试项 5: 统计数据加载
- [ ] 登录后进入 `dashboard.html`
- [ ] **预期结果**:
  - 显示 4 个统计卡片(待取件、配送中、已完成、总订单数)
  - 数字正确显示(从后端获取)
  - 如果没有数据显示 0

**检查网络请求**:
```
GET /api/dashboard/stats
Authorization: Bearer {token}
```

#### 测试项 6: 最近订单列表
- [ ] 查看"最近订单"表格
- [ ] **预期结果**:
  - 显示最近的订单(最多 5 条)
  - 包含订单号、快递公司、取件码、状态、时间
  - 状态徽章颜色正确
  - "查看详情"按钮可点击

---

### ✅ 4.3 创建订单测试

#### 测试项 7: 表单提交
- [ ] 访问 `create_order.html`
- [ ] 填写完整表单:
  - 快递公司: 顺丰速运
  - 取件码: 3-2-1024
  - 取件地点: 菜鸟驿站(东校区)
  - 送达地址: 东区宿舍 3号楼 502室
  - 联系人: 张三
  - 联系电话: 13800138000
  - 代取费用: 5.00
- [ ] 点击"提交订单"
- [ ] **预期结果**:
  - 显示 "订单创建成功!"
  - 表单清空
  - 跳转到订单列表页

**检查网络请求**:
```
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "expressCompany": "顺丰速运",
  "pickupCode": "3-2-1024",
  ...
}
```

#### 测试项 8: 表单验证
- [ ] 不选择快递公司直接提交
- [ ] **预期结果**: 显示 "请选择快递公司"
- [ ] 输入错误的手机号
- [ ] **预期结果**: 显示 "请输入正确的手机号"

---

### ✅ 4.4 订单列表测试

#### 测试项 9: 订单列表加载
- [ ] 访问 `orders.html`
- [ ] **预期结果**:
  - 显示订单表格
  - 数据从后端加载
  - 分页控件正确显示
  - 状态徽章颜色正确

**检查网络请求**:
```
GET /api/orders?page=1&pageSize=10
Authorization: Bearer {token}
```

#### 测试项 10: 筛选功能
- [ ] 选择订单状态(如"待取件")
- [ ] 选择日期范围
- [ ] 点击"筛选"按钮
- [ ] **预期结果**:
  - 表格只显示符合条件的订单
  - URL 参数更新

#### 测试项 11: 分页功能
- [ ] 点击下一页
- [ ] 点击页码
- [ ] **预期结果**:
  - 加载对应页的数据
  - 当前页码高亮显示

#### 测试项 12: 取消订单
- [ ] 找到自己的待取件订单
- [ ] 点击"取消"按钮
- [ ] 确认取消
- [ ] **预期结果**:
  - 显示 "订单已取消"
  - 订单状态变为"已取消"
  - 列表自动刷新

---

### ✅ 4.5 订单详情测试

#### 测试项 13: 查看详情
- [ ] 在订单列表点击"查看详情"
- [ ] **预期结果**:
  - 跳转到 `order_detail.html?id={orderId}`
  - 显示完整的订单信息
  - 取件码突出显示
  - 金额格式正确

#### 测试项 14: 接单功能(非发布者)
- [ ] 用另一个账号登录
- [ ] 查看别人的订单(状态为"待取件")
- [ ] 点击"接单"按钮
- [ ] **预期结果**:
  - 显示确认对话框
  - 接单成功后状态变为"已接单"
  - 发布者收到通知

#### 测试项 15: 完成订单(接单人)
- [ ] 用接单人账号登录
- [ ] 查看自己接单的订单(状态为"已接单"或"配送中")
- [ ] 点击"确认完成"
- [ ] **预期结果**:
  - 订单状态变为"已完成"
  - 钱包余额更新
  - 生成交易记录

---

### ✅ 4.6 个人中心测试

#### 测试项 16: 查看个人资料
- [ ] 访问 `profile.html`
- [ ] **预期结果**:
  - 表单显示当前用户信息
  - 用户名不可编辑
  - 其他字段可编辑

**检查网络请求**:
```
GET /api/user/profile
Authorization: Bearer {token}
```

#### 测试项 17: 更新资料
- [ ] 修改姓名、手机号等信息
- [ ] 点击"保存修改"
- [ ] **预期结果**:
  - 显示 "资料更新成功"
  - 导航栏用户名同步更新

#### 测试项 18: 修改密码
- [ ] 输入原密码
- [ ] 输入新密码(至少 6 位)
- [ ] 确认新密码
- [ ] 点击"修改密码"
- [ ] **预期结果**:
  - 显示 "密码修改成功"
  - 可以使用新密码登录

#### 测试项 19: 统计数据
- [ ] 查看"我的统计"卡片
- [ ] **预期结果**:
  - 显示发布订单数量
  - 显示接单数量
  - 显示完成订单数量
  - 显示获得收益

---

### ✅ 4.7 管理后台测试(需要 admin 角色)

#### 测试项 20: 访问管理后台
- [ ] 用 admin 账号登录
- [ ] 访问 `admin.html`
- [ ] **预期结果**:
  - 显示统计数据概览
  - 可以切换标签页(用户管理/订单管理/数据统计)

#### 测试项 21: 用户管理
- [ ] 查看用户列表
- [ ] 点击"禁用"按钮
- [ ] **预期结果**:
  - 用户状态切换
  - 列表自动刷新

#### 测试项 22: 订单管理
- [ ] 查看所有订单
- [ ] 点击"查看"按钮
- [ ] **预期结果**:
  - 在新窗口打开订单详情页

---

## 5. 常见问题排查

### ❌ 问题 1: 登录失败,提示 "Network Error"

**可能原因**:
1. 后端服务未启动
2. API 地址配置错误
3. CORS 跨域问题

**解决方法**:
```bash
# 1. 检查后端是否运行
curl http://localhost:3000/api/health

# 2. 检查 auth.js 中的 API_BASE_URL
console.log(API_BASE_URL);

# 3. 浏览器控制台查看具体错误
# F12 → Console → 查看错误信息
# F12 → Network → 查看请求详情
```

---

### ❌ 问题 2: 登录后又跳回登录页

**可能原因**:
1. Token 保存失败
2. Token 格式不正确
3. 后端验证失败

**解决方法**:
```javascript
// 浏览器控制台检查
console.log('Token:', localStorage.getItem('token'));
console.log('UserInfo:', localStorage.getItem('userInfo'));

// 手动测试 Token
fetch('http://localhost:3000/api/user/profile', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
}).then(r => r.json()).then(console.log);
```

---

### ❌ 问题 3: 数据不显示或显示为空

**可能原因**:
1. 数据库中没有数据
2. API 返回格式不匹配
3. 前端解析错误

**解决方法**:
```javascript
// 检查 API 响应
// F12 → Network → 找到请求 → 查看 Response

// 手动调用 API 测试
fetch('http://localhost:3000/api/orders', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

### ❌ 问题 4: 401 Unauthorized 错误

**可能原因**:
1. Token 过期
2. Token 格式错误
3. 后端密钥不一致

**解决方法**:
```javascript
// 1. 重新登录获取新 Token
localStorage.removeItem('token');
location.href = 'index.html';

// 2. 检查后端 JWT_SECRET 是否一致
// 确保生成和验证使用同一个密钥

// 3. 检查 Token 是否正确传递
axios.interceptors.request.use(config => {
  console.log('Request Token:', config.headers.Authorization);
  return config;
});
```

---

### ❌ 问题 5: 403 Forbidden 错误

**可能原因**:
- 权限不足(普通用户访问管理员接口)

**解决方法**:
```javascript
// 检查用户角色
const userInfo = JSON.parse(localStorage.getItem('userInfo'));
console.log('Role:', userInfo.role); // 应该是 'admin'
```

---

## 6. 测试工具推荐

### 6.1 浏览器开发者工具(F12)

**Console 面板** - 查看日志和错误
```javascript
// 常用调试命令
console.log(localStorage);           // 查看所有存储
console.log(getUserInfo());          // 查看当前用户
console.log(getToken());             // 查看 Token
```

**Network 面板** - 查看网络请求
- 过滤: 输入 "api" 只看 API 请求
- 查看请求头、响应数据
- 检查 HTTP 状态码

**Application 面板** - 查看本地存储
- Local Storage
- Session Storage
- Cookies

---

### 6.2 Postman / Apifox

**创建测试集合**:

1. **登录接口测试**
   ```
   POST {{baseUrl}}/auth/login
   Body: {
     "username": "admin",
     "password": "123456"
   }
   Tests: 
   pm.environment.set("token", pm.response.json().data.token);
   ```

2. **获取订单列表**
   ```
   GET {{baseUrl}}/orders
   Headers: Authorization: Bearer {{token}}
   ```

3. **创建订单**
   ```
   POST {{baseUrl}}/orders
   Headers: Authorization: Bearer {{token}}
   Body: { ... }
   ```

---

### 6.3 自动化测试脚本

创建 `test_api.js`(Node.js):

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let token = '';

async function runTests() {
  try {
    // 1. 测试登录
    console.log('1. 测试登录...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: '123456'
    });
    token = loginRes.data.data.token;
    console.log('✓ 登录成功, Token:', token);

    // 2. 测试获取订单列表
    console.log('\n2. 测试获取订单列表...');
    const ordersRes = await axios.get(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 订单列表:', ordersRes.data.data.total, '条');

    // 3. 测试创建订单
    console.log('\n3. 测试创建订单...');
    const createRes = await axios.post(`${API_BASE}/orders`, {
      expressCompany: '顺丰速运',
      pickupCode: '3-2-1024',
      pickupLocation: '菜鸟驿站',
      deliveryAddress: '东区宿舍 3号楼',
      contactName: '测试用户',
      contactPhone: '13800138000',
      fee: 5.00
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 订单创建成功:', createRes.data.data.id);

    console.log('\n✅ 所有测试通过!');
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

runTests();
```

**运行测试**:
```bash
npm install axios
node test_api.js
```

---

## 7. 测试报告模板

### 功能测试报告

| 模块 | 测试项 | 状态 | 备注 |
|------|--------|------|------|
| 认证 | 用户登录 | ✅ / ❌ | |
| 认证 | 退出登录 | ✅ / ❌ | |
| 认证 | 记住我 | ✅ / ❌ | |
| 订单 | 创建订单 | ✅ / ❌ | |
| 订单 | 查看列表 | ✅ / ❌ | |
| 订单 | 订单详情 | ✅ / ❌ | |
| 订单 | 接单功能 | ✅ / ❌ | |
| 订单 | 完成订单 | ✅ / ❌ | |
| 用户 | 查看资料 | ✅ / ❌ | |
| 用户 | 更新资料 | ✅ / ❌ | |
| 用户 | 修改密码 | ✅ / ❌ | |
| 管理 | 用户管理 | ✅ / ❌ | 仅管理员 |
| 管理 | 订单管理 | ✅ / ❌ | 仅管理员 |

**Bug 记录**:
| 编号 | 问题描述 | 复现步骤 | 严重程度 | 状态 |
|------|---------|---------|---------|------|
| 1 | | | 高/中/低 | 待修复/已修复 |

---

## 8. 性能测试建议

### 8.1 并发测试
- 模拟多个用户同时操作
- 测试订单创建的并发处理
- 检查数据一致性

### 8.2 压力测试
- 大量订单数据下的列表加载
- 分页性能
- 搜索筛选性能

### 8.3 响应时间
- API 响应时间应 < 500ms
- 页面加载时间应 < 2s
- 使用浏览器 Performance 面板分析

---

## 9. 安全检查清单

- [ ] 敏感信息(密码)不在前端存储明文
- [ ] Token 有过期时间
- [ ] SQL 注入防护(使用参数化查询)
- [ ] XSS 防护(转义用户输入)
- [ ] CSRF 防护
- [ ] 接口权限验证
- [ ] 频率限制(防止刷接口)
- [ ] 日志记录(关键操作)

---

## 10. 快速测试流程

### 10 分钟快速测试:

1. **启动后端** ✓
2. **修改 API 地址** ✓ (`js/auth.js`)
3. **打开登录页** ✓ (浏览器打开 `index.html`)
4. **登录** ✓ (admin / 123456)
5. **创建订单** ✓ (填写表单并提交)
6. **查看列表** ✓ (确认订单显示)
7. **查看详情** ✓ (点击查看详情按钮)
8. **退出登录** ✓ (点击右上角退出)

---

## 🎯 总结

**测试优先级**:
1. ⭐⭐⭐ 必须先测: 登录、创建订单、查看列表
2. ⭐⭐ 核心功能: 接单、完成订单、取消订单
3. ⭐ 辅助功能: 个人中心、管理后台

**遇到问题时**:
1. 查看浏览器控制台(F12)
2. 检查 Network 请求
3. 确认后端日志
4. 使用 Postman 单独测试接口

祝你测试顺利! 🚀
