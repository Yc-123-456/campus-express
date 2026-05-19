# 校园快递代取系统 - 前后端对接指南

## 📋 目录
- [1. 对接前检查清单](#1-对接前检查清单)
- [2. 前端配置修改](#2-前端配置修改)
- [3. 移除测试代码](#3-移除测试代码)
- [4. 跨域问题处理](#4-跨域问题处理)
- [5. 联调测试步骤](#5-联调测试步骤)
- [6. 常见问题解决](#6-常见问题解决)
- [7. 部署建议](#7-部署建议)

---

## 1. 对接前检查清单

### ✅ 后端检查

**1.1 确认后端服务运行正常**

打开浏览器或使用 curl 测试:
```bash
curl http://localhost:3000/api/health
```

**预期响应**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

**1.2 确认数据库已初始化**

登录 MySQL 检查:
```sql
-- 检查数据库是否存在
SHOW DATABASES LIKE 'campus_express';

-- 检查表是否创建成功
USE campus_express;
SHOW TABLES;

-- 应该有这些表:
-- users
-- orders
-- wallets
-- transactions
-- order_logs
-- notifications
```

**1.3 准备测试账号**

在数据库中插入测试用户(密码是 `123456` 的 bcrypt 哈希):

```sql
-- 插入管理员账号
INSERT INTO users (id, username, password, real_name, phone, email, student_id, role, status) 
VALUES (
    'admin001', 
    'admin', 
    '$2b$10$YourHashedPasswordHere...', -- 需要生成真实的 bcrypt 哈希
    '管理员', 
    '13800138000', 
    'admin@campus.com', 
    '20240001', 
    'admin', 
    'normal'
);

-- 初始化钱包
INSERT INTO wallets (user_id, balance, total_earnings) 
VALUES ('admin001', 0.00, 0.00);
```

**生成 bcrypt 密码哈希** (Node.js):
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('123456', 10);
console.log(hash); // 复制这个哈希值到 SQL
```

---

## 2. 前端配置修改

### 2.1 修改 API 地址配置 ⚠️ 重要

打开前端项目中的 [`js/auth.js`](file://e:\campus_pro\campus-front\js\auth.js) 文件:

**找到第 4 行**,修改为你的后端地址:

```javascript
// 本地开发环境
const API_BASE_URL = 'http://localhost:3000/api';

// 如果后端在不同端口或服务器,修改为对应地址
// const API_BASE_URL = 'http://192.168.1.100:3000/api';
// const API_BASE_URL = 'https://your-api-domain.com/api';
```

### 2.2 验证配置

在浏览器控制台测试:
```javascript
// 打开任意页面,按 F12,在 Console 中输入:
console.log(API_BASE_URL);
// 应该显示你配置的地址
```

---

## 3. 移除测试代码 ⚠️ 安全要求

根据安全规范,必须移除所有硬编码的测试账号逻辑!

### 3.1 恢复真实登录逻辑

打开 [`js/auth.js`](file://e:\campus_pro\campus-front\js\auth.js),找到 `handleLogin` 函数(约第 26 行开始):

**完整替换为以下代码**:

```javascript
// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

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
            
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            } else {
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('userInfo', JSON.stringify(user));
            }

            showToast('登录成功!', 'success');
            
            // 跳转到仪表盘
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        }
    } catch (error) {
        console.error('登录失败:', error);
        const message = error.response?.data?.message || '登录失败,请检查用户名和密码';
        showToast(message, 'danger');
    }
}
```

**删除之前的测试代码**(大约第 27-57 行的这段):
```javascript
// ❌ 删除这段代码
/*
if (username === 'admin' && password === '123456') {
    const mockUser = { ... };
    // ... 所有测试逻辑
    return;
}
*/
```

### 3.2 验证修改

1. 保存文件
2. 刷新登录页面
3. 打开浏览器控制台 Network 面板
4. 尝试登录,应该看到对后端的真实请求

---

## 4. 跨域问题处理

### 4.1 什么是跨域问题?

前端地址: `http://127.0.0.1:5500` (Live Server)  
后端地址: `http://localhost:3000`  

浏览器会阻止这种跨域请求,需要在后端配置 CORS。

### 4.2 后端配置 CORS

**Node.js Express 示例**:

安装 cors 包:
```bash
npm install cors
```

在 `app.js` 中添加:
```javascript
const cors = require('cors');

// 在所有路由之前使用
app.use(cors({
    origin: [
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://127.0.0.1:5501',
        'http://localhost:5501'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Java Spring Boot 示例**:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://127.0.0.1:5500", "http://localhost:5500")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

**Python Flask 示例**:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://127.0.0.1:5500", "http://localhost:5500"],
        "supports_credentials": True
    }
})
```

### 4.3 验证 CORS 配置

在浏览器控制台 Network 面板查看请求:
- Status 应该是 200
- 没有 CORS 错误提示
- Response Headers 包含 `Access-Control-Allow-Origin`

---

## 5. 联调测试步骤

### 🎯 测试顺序(由简到繁)

#### 第一步: 测试健康检查接口

**目的**: 确认前后端网络连通

**操作**:
1. 浏览器访问: `http://localhost:3000/api/health`
2. 应该看到 JSON 响应

**结果**: ✅ 后端可访问

---

#### 第二步: 测试登录功能

**目的**: 验证认证流程

**操作**:
1. 打开 `index.html` (用 Live Server)
2. 输入测试账号密码
3. 点击登录
4. 观察 Network 面板

**检查点**:
- [ ] 请求发送到 `POST http://localhost:3000/api/auth/login`
- [ ] Request Payload 包含用户名和密码
- [ ] 响应状态码 200
- [ ] 响应包含 `token` 和 `user` 信息
- [ ] LocalStorage 保存了 token
- [ ] 自动跳转到 dashboard.html

**调试技巧**:
```javascript
// 浏览器控制台执行
console.log(localStorage.getItem('token'));
console.log(JSON.parse(localStorage.getItem('userInfo')));
```

---

#### 第三步: 测试仪表盘数据加载

**目的**: 验证数据获取

**操作**:
1. 登录后自动进入仪表盘
2. 查看 Network 面板

**检查点**:
- [ ] 请求 `GET /api/dashboard/stats`
- [ ] 请求 `GET /api/dashboard/recent-orders`
- [ ] 统计数字正确显示
- [ ] 订单列表显示

**常见问题**:
- 401 错误: Token 未正确传递
- 数据为空: 数据库中没有数据

---

#### 第四步: 测试创建订单

**目的**: 验证数据提交

**操作**:
1. 点击"创建订单"
2. 填写完整表单
3. 点击"提交订单"

**检查点**:
- [ ] 请求 `POST /api/orders`
- [ ] Request Headers 包含 Authorization
- [ ] 表单数据正确发送
- [ ] 响应包含新订单 ID
- [ ] 跳转到订单列表页

---

#### 第五步: 测试订单列表

**目的**: 验证列表展示和分页

**操作**:
1. 访问 `orders.html`
2. 查看订单列表

**检查点**:
- [ ] 请求 `GET /api/orders?page=1&pageSize=10`
- [ ] 表格显示订单数据
- [ ] 状态徽章颜色正确
- [ ] 分页控件工作正常

---

#### 第六步: 测试订单详情和操作

**目的**: 验证完整业务流程

**操作**:
1. 点击订单"查看详情"
2. 测试接单、取消、完成等操作

**检查点**:
- [ ] 订单详情正确显示
- [ ] 接单按钮可用(非发布者)
- [ ] 取消按钮可用(发布者)
- [ ] 状态流转正确

---

#### 第七步: 测试个人中心

**目的**: 验证用户资料管理

**操作**:
1. 访问 `profile.html`
2. 查看个人资料
3. 修改信息并保存
4. 测试修改密码

**检查点**:
- [ ] 资料正确显示
- [ ] 更新成功
- [ ] 密码修改成功

---

#### 第八步: 测试管理后台(管理员账号)

**目的**: 验证权限控制

**操作**:
1. 用 admin 账号登录
2. 访问 `admin.html`
3. 测试用户管理和订单管理

**检查点**:
- [ ] 统计数据正确显示
- [ ] 用户列表显示
- [ ] 可以切换用户状态
- [ ] 可以查看所有订单

---

## 6. 常见问题解决

### ❌ 问题 1: 登录失败 - "Network Error"

**原因**: 
- 后端未启动
- API 地址配置错误
- 网络不通

**解决**:
```bash
# 1. 检查后端是否运行
netstat -an | grep 3000

# 2. 测试后端接口
curl http://localhost:3000/api/health

# 3. 检查前端配置
# 打开 js/auth.js,确认 API_BASE_URL 正确
```

---

### ❌ 问题 2: 401 Unauthorized

**原因**:
- Token 格式错误
- Token 过期
- 后端验证逻辑问题

**解决**:
```javascript
// 浏览器控制台检查
console.log('Token:', localStorage.getItem('token'));

// 手动测试
fetch('http://localhost:3000/api/user/profile', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
}).then(r => r.json()).then(console.log);
```

**检查后端 JWT 配置**:
```javascript
// 确保生成和验证使用同一个密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
```

---

### ❌ 问题 3: CORS 跨域错误

**错误信息**:
```
Access to XMLHttpRequest at 'http://localhost:3000/api/...' 
from origin 'http://127.0.0.1:5500' has been blocked by CORS policy
```

**解决**: 按照第 4 节配置后端 CORS

---

### ❌ 问题 4: 数据不显示

**原因**:
- 数据库为空
- API 返回格式不匹配
- 前端解析错误

**解决**:
```javascript
// 浏览器控制台查看
// Network 面板 -> 找到请求 -> Response
console.log(response.data);

// 手动测试 API
fetch('http://localhost:3000/api/orders', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
}).then(r => r.json()).then(data => {
    console.log('API 响应:', data);
});
```

---

### ❌ 问题 5: 500 Internal Server Error

**原因**: 后端代码错误

**解决**:
1. 查看后端日志
2. 检查数据库连接
3. 检查请求参数格式

---

## 7. 部署建议

### 7.1 开发环境

**前端**: 使用 Live Server  
**后端**: `npm run dev` (nodemon)

### 7.2 生产环境部署

#### 方案一: 分离部署

**前端**: 
- 部署到 Nginx / Apache
- 或使用静态托管服务(Vercel, Netlify)

**Nginx 配置示例**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/campus-express-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

**后端**:
- 部署到云服务器
- 使用 PM2 管理 Node.js 进程
- 配置域名和 HTTPS

**PM2 启动**:
```bash
npm install -g pm2
pm2 start app.js --name campus-express-api
pm2 save
pm2 startup
```

#### 方案二: 统一部署

前端打包后由后端静态文件服务提供:

**Express 示例**:
```javascript
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
```

### 7.3 环境变量配置

创建 `.env.production`:
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=prod_user
DB_PASSWORD=strong_password
DB_NAME=campus_express
JWT_SECRET=very-strong-secret-key-change-in-production
CORS_ORIGIN=https://your-domain.com
```

### 7.4 安全检查清单

- [ ] 移除所有测试账号和硬编码逻辑
- [ ] 使用环境变量存储敏感信息
- [ ] 启用 HTTPS
- [ ] 配置防火墙
- [ ] 设置速率限制
- [ ] 启用日志记录
- [ ] 定期备份数据库
- [ ] 更新依赖包到稳定版本

---

## 8. 快速对接流程图

```
┌─────────────────┐
│ 1. 启动后端服务  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 测试健康检查  │ → 失败: 检查后端日志
└────────┬────────┘
         │ 成功
         ▼
┌──────────────────────┐
│ 3. 修改前端 API 地址  │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 4. 移除测试登录代码    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 5. 配置后端 CORS      │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 6. 测试登录功能       │ → 失败: 检查 Network 面板
└────────┬─────────────┘
         │ 成功
         ▼
┌──────────────────────┐
│ 7. 逐个功能联调       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 8. 修复发现的问题     │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ ✅ 对接完成!          │
└──────────────────────┘
```

---

## 9. 调试工具推荐

### 9.1 浏览器开发者工具

**Network 面板**:
- 查看所有 HTTP 请求
- 检查请求头、响应数据
- 分析请求耗时

**Console 面板**:
- 查看日志和错误
- 执行调试命令

**Application 面板**:
- 查看 LocalStorage
- 查看 SessionStorage
- 查看 Cookies

### 9.2 Postman / Apifox

用于独立测试后端接口,无需前端配合。

### 9.3 后端日志

```javascript
// Express 示例
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});
```

---

## 10. 对接验收标准

### 功能验收

| 模块 | 功能 | 状态 |
|------|------|------|
| 认证 | 用户登录 | □ |
| 认证 | 退出登录 | □ |
| 订单 | 创建订单 | □ |
| 订单 | 查看列表 | □ |
| 订单 | 查看详情 | □ |
| 订单 | 接单功能 | □ |
| 订单 | 完成订单 | □ |
| 订单 | 取消订单 | □ |
| 用户 | 查看资料 | □ |
| 用户 | 更新资料 | □ |
| 用户 | 修改密码 | □ |
| 管理 | 用户管理 | □ |
| 管理 | 订单管理 | □ |

### 性能验收

- [ ] 登录响应时间 < 1s
- [ ] 列表加载时间 < 2s
- [ ] 无明显的 UI 卡顿
- [ ] 无内存泄漏

### 安全验收

- [ ] 无硬编码密码
- [ ] Token 有过期机制
- [ ] 敏感数据加密存储
- [ ] SQL 注入防护
- [ ] XSS 防护

---

## 🎉 总结

**对接关键步骤**:
1. ✅ 确认后端正常运行
2. ✅ 修改前端 API 地址
3. ✅ 移除测试登录代码
4. ✅ 配置后端 CORS
5. ✅ 按顺序测试各功能
6. ✅ 修复发现的问题

**遇到问题时**:
1. 查看浏览器控制台(F12)
2. 检查 Network 请求详情
3. 查看后端日志
4. 使用 Postman 单独测试接口

祝你对接顺利! 🚀
