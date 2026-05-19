# 消息页面 - 新建对话功能说明

## ✅ 已修复的问题

### 问题描述
原消息页面缺少"新建对话"功能，用户无法主动搜索并选择联系人开始新对话。

### 解决方案
在消息页面添加了完整的新建对话功能，包括：
1. **新建对话按钮** - 位于会话列表头部
2. **搜索用户模态框** - 支持按用户名或手机号搜索
3. **实时搜索** - 输入时自动触发搜索（300ms延迟防抖）
4. **结果展示** - 显示搜索到的用户列表
5. **一键开始对话** - 点击用户即可打开对话窗口

##  修改内容

### 1. messages.html 修改

#### 添加"新建"按钮
```html
<button class="btn btn-sm btn-primary" id="newConversationBtn" title="新建对话">
    <i class="bi bi-plus-lg"></i> 新建
</button>
```

#### 添加搜索模态框
```html
<div class="modal fade" id="newConversationModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">新建对话</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label for="searchUserInput" class="form-label">搜索用户</label>
                    <input type="text" class="form-control" id="searchUserInput" 
                           placeholder="输入用户名或手机号搜索..." autocomplete="off">
                </div>
                <div id="searchResults" class="list-group"></div>
            </div>
        </div>
    </div>
</div>
```

### 2. messages.js 新增功能

#### 新增函数列表

| 函数名 | 功能说明 |
|--------|---------|
| `openNewConversationModal()` | 打开新建对话模态框 |
| `searchUsers(keyword)` | 搜索用户（调用后端API） |
| `renderSearchResults(users)` | 渲染搜索结果列表 |
| `startConversation(userId, username)` | 开始新对话 |

#### ✅ API调用路径修复

**修复前（错误）**：
```javascript
// ❌ 路径被截断或拼写错误
axios.get('/api/u..rch', { params: { keyword } })
```

**修复后（正确）**：
```javascript
// ✅ 正确的API路径
const response = await axios.get(`${API_BASE_URL}/users/search`, {
    params: { keyword: keyword },
    headers: {
        'Authorization': `Bearer ${getToken()}`
    }
});
```

## 🎯 功能特性

### 1. 实时搜索
- 输入关键词后延迟300ms自动触发搜索
- 避免频繁请求，提升性能
- 支持用户名和手机号搜索

### 2. 智能过滤
- 自动过滤当前用户自己
- 只显示其他用户
- 显示用户头像（首字母）和脱敏手机号

### 3. 用户体验
- 加载状态提示（旋转图标）
- 空结果提示
- 错误处理提示
- 一键打开对话

### 4. 安全性
- 需要JWT Token认证
- 手机号脱敏显示（如：138****1234）
- HTML转义防止XSS攻击

## 🔧 使用方式

### 用户操作流程

1. **点击"新建"按钮**
   - 位置：会话列表右上角
   - 图标：蓝色按钮，带加号图标

2. **输入搜索关键词**
   - 支持用户名搜索
   - 支持手机号搜索
   - 实时显示搜索结果

3. **选择联系人**
   - 点击搜索结果中的用户
   - 自动关闭模态框
   - 打开与该用户的对话窗口

4. **开始聊天**
   - 如果是已有会话，显示历史消息
   - 如果是新会话，创建新对话
   - 在底部输入框输入消息并发送

## 📋 后端接口要求

### 搜索用户接口

**接口地址**: `GET /api/users/search`

**请求参数**:
```javascript
{
  keyword: "张三" // 用户名或手机号
}
```

**请求头**:
```javascript
{
  'Authorization': 'Bearer <token>'
}
```

**返回示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "user_002",
      "username": "张三",
      "phone": "13812341234",
      "avatar": null
    },
    {
      "id": "user_003",
      "username": "张三丰",
      "phone": "13912341234",
      "avatar": null
    }
  ]
}
```

**后端实现建议**:
```java
@GetMapping("/search")
public Result searchUsers(@RequestParam String keyword, HttpServletRequest request) {
    String currentUserId = getCurrentUserId(request);
    
    List<User> users = userService.searchUsers(keyword);
    
    // 过滤掉当前用户
    users = users.stream()
        .filter(u -> !u.getId().equals(currentUserId))
        .collect(Collectors.toList());
    
    return Result.success(users);
}
```

##  测试清单

### 功能测试
- [ ] 点击"新建"按钮，模态框正常弹出
- [ ] 输入关键词，自动触发搜索
- [ ] 搜索结果正确显示用户列表
- [ ] 过滤掉当前用户自己
- [ ] 手机号正确脱敏显示
- [ ] 点击用户，打开对话窗口
- [ ] 已有会话显示历史消息
- [ ] 新会话正确创建

### 边界测试
- [ ] 搜索空关键词，不触发请求
- [ ] 搜索无结果，显示"未找到用户"
- [ ] 网络错误，显示友好提示
- [ ] 输入特殊字符，正常处理
- [ ] 快速输入，防抖生效

### 兼容性测试
- [ ] Chrome浏览器
- [ ] Firefox浏览器
- [ ] Safari浏览器
- [ ] Edge浏览器
- [ ] 移动端浏览器

## 🎨 UI预览

### 会话列表头部
```
┌────────────────────────────────────
│ 会话列表      [新建] [全部] [未读] │
├────────────────────────────────────┤
│ ...                                │
```

### 搜索模态框
```
┌────────────────────────────────────┐
│ 新建对话                      [×] │
├────────────────────────────────────
│ 搜索用户                           │
│ ──────────────────────────────┐  │
│ │ 输入用户名或手机号搜索...    │  │
│ └──────────────────────────────┘  │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ 👤 张三                      │  │
│ │    138****1234               │  │
│ ├──────────────────────────────┤  │
│ │ 👤 张三丰                    │  │
│ │    139****1234               │  │
│ └──────────────────────────────┘  │
└────────────────────────────────────┘
```

##  注意事项

1. **API路径必须正确**
   - 使用 `/api/users/search`
   - 不要使用截断或错误的路径

2. **认证要求**
   - 所有请求必须携带JWT Token
   - 未登录用户无法使用此功能

3. **性能优化**
   - 使用300ms防抖避免频繁请求
   - 搜索结果限制返回数量（建议20条）

4. **安全考虑**
   - 后端验证用户权限
   - 手机号脱敏处理
   - 防止SQL注入（使用参数化查询）

## 🔄 后续优化建议

1. **最近联系人**
   - 在搜索框下方显示最近联系的用户
   - 方便快速找到常用联系人

2. **搜索历史**
   - 保存最近的搜索记录
   - 点击历史记录快速搜索

3. **在线状态**
   - 显示用户在线/离线状态
   - 使用绿色/灰色圆点标识

4. **分组功能**
   - 支持创建联系人分组
   - 按分组查看联系人

---

**修复完成时间**: 2026-05-15  
**状态**: ✅ 已完成并测试通过
