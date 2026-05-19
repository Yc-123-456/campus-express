# 校园快递代取系统 - 前后端对接快速检查清单

## ✅ 已完成

- [x] 前端 API 地址配置为 `http://localhost:3000/api`
- [x] 已移除测试登录代码,启用真实 API 调用
- [x] Axios 请求拦截器自动携带 Token

---

## 📋 对接步骤检查清单

### 第一步: 后端准备 ✓

- [ ] 后端服务已启动
- [ ] 数据库已初始化(6张表创建成功)
- [ ] 测试账号已插入数据库
- [ ] 健康检查接口正常: `http://localhost:3000/api/health`

**测试命令**:
```bash
curl http://localhost:3000/api/health
```

---

### 第二步: CORS 配置 ✓

- [ ] 后端已配置 CORS 支持跨域
- [ ] 允许前端地址访问

**Node.js Express 示例**:
```javascript
const cors = require('cors');
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));
```

---

### 第三步: 测试登录 🔑

- [ ] 用 Live Server 打开 `index.html`
- [ ] 输入测试账号密码
- [ ] 点击登录按钮

**预期结果**:
- [ ] Network 面板显示 POST 请求到 `/api/auth/login`
- [ ] 响应状态码 200
- [ ] 响应包含 token 和 user 信息
- [ ] LocalStorage 保存了 token
- [ ] 自动跳转到 dashboard.html

**调试命令**(浏览器控制台):
```javascript
console.log(localStorage.getItem('token'));
console.log(JSON.parse(localStorage.getItem('userInfo')));
```

---

### 第四步: 测试仪表盘 📊

- [ ] 登录后进入仪表盘
- [ ] 统计数据正确显示
- [ ] 最近订单列表显示

**检查 Network 面板**:
- [ ] GET `/api/dashboard/stats` 成功
- [ ] GET `/api/dashboard/recent-orders` 成功

---

### 第五步: 测试创建订单 ➕

- [ ] 访问 `create_order.html`
- [ ] 填写完整表单
- [ ] 点击提交

**预期结果**:
- [ ] POST `/api/orders` 成功
- [ ] 响应包含新订单 ID
- [ ] 跳转到订单列表页

---

### 第六步: 测试订单列表 📋

- [ ] 访问 `orders.html`
- [ ] 订单列表显示
- [ ] 分页功能正常
- [ ] 筛选功能正常

---

### 第七步: 测试订单详情 🔍

- [ ] 点击订单查看详情
- [ ] 订单信息完整显示
- [ ] 状态徽章颜色正确

---

### 第八步: 测试订单操作 ⚙️

- [ ] 接单功能(非发布者)
- [ ] 取消订单(发布者)
- [ ] 完成订单(接单人)

---

### 第九步: 测试个人中心 👤

- [ ] 查看个人资料
- [ ] 更新资料并保存
- [ ] 修改密码

---

### 第十步: 测试管理后台(管理员) 🛠️

- [ ] 用 admin 账号登录
- [ ] 访问 `admin.html`
- [ ] 查看统计数据
- [ ] 用户管理功能
- [ ] 订单管理功能

---

## 🐛 常见问题速查

### 问题 1: 登录失败 "Network Error"

**原因**: 后端未启动或地址错误  
**解决**: 
```bash
# 检查后端是否运行
netstat -an | grep 3000

# 测试接口
curl http://localhost:3000/api/health
```

---

### 问题 2: 401 Unauthorized

**原因**: Token 无效或格式错误  
**解决**:
```javascript
// 检查 Token
console.log(localStorage.getItem('token'));

// 清除后重新登录
localStorage.clear();
location.href = 'index.html';
```

---

### 问题 3: CORS 跨域错误

**原因**: 后端未配置 CORS  
**解决**: 按照上面的第二步配置后端 CORS

---

### 问题 4: 数据不显示

**原因**: 数据库为空  
**解决**: 插入测试数据或先创建几个订单

---

## 📊 对接验收表

| 功能模块 | 测试状态 | 备注 |
|---------|---------|------|
| 用户登录 | □ 通过 / □ 失败 | |
| 退出登录 | □ 通过 / □ 失败 | |
| 仪表盘统计 | □ 通过 / □ 失败 | |
| 创建订单 | □ 通过 / □ 失败 | |
| 订单列表 | □ 通过 / □ 失败 | |
| 订单详情 | □ 通过 / □ 失败 | |
| 接单功能 | □ 通过 / □ 失败 | |
| 完成订单 | □ 通过 / □ 失败 | |
| 取消订单 | □ 通过 / □ 失败 | |
| 个人中心 | □ 通过 / □ 失败 | |
| 修改密码 | □ 通过 / □ 失败 | |
| 管理后台 | □ 通过 / □ 失败 | 仅管理员 |

---

## 🎯 快速验证流程 (5分钟)

1. **启动后端** ✓
2. **打开前端** (Live Server) ✓
3. **登录** (输入测试账号) ✓
4. **创建订单** (填写表单) ✓
5. **查看列表** (确认显示) ✓
6. **查看详情** (检查信息) ✓
7. **退出登录** ✓

**全部通过 = 对接成功! 🎉**

---

## 📝 下一步建议

对接成功后:
1. 完善错误处理和用户提示
2. 添加加载动画提升体验
3. 优化页面布局和样式
4. 进行性能测试和优化
5. 准备生产环境部署

---

## 📞 需要帮助?

遇到问题时:
1. 查看浏览器控制台(F12)
2. 检查 Network 请求详情
3. 查看后端日志
4. 参考 [`INTEGRATION_GUIDE.md`](file://e:\campus_pro\campus-front\INTEGRATION_GUIDE.md) 详细文档

祝你对接顺利! 💪
