# 私信功能 - 后端实现指南

## 一、数据库表结构

### 1. 消息表 (messages)

```sql
CREATE TABLE `messages` (
  `id` VARCHAR(50) NOT NULL COMMENT '消息ID',
  `sender_id` VARCHAR(50) NOT NULL COMMENT '发送者ID',
  `receiver_id` VARCHAR(50) NOT NULL COMMENT '接收者ID',
  `order_id` VARCHAR(50) DEFAULT NULL COMMENT '关联订单ID（系统消息可为空）',
  `message_type` ENUM('USER', 'SYSTEM') NOT NULL DEFAULT 'USER' COMMENT '消息类型：USER-用户私信，SYSTEM-系统消息',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读：0-未读，1-已读',
  `read_at` TIMESTAMP NULL DEFAULT NULL COMMENT '阅读时间',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_receiver_id` (`receiver_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表';
```

### 2. 会话表 (conversations)

```sql
CREATE TABLE `conversations` (
  `id` VARCHAR(50) NOT NULL COMMENT '会话ID',
  `user1_id` VARCHAR(50) NOT NULL COMMENT '用户1 ID',
  `user2_id` VARCHAR(50) NOT NULL COMMENT '用户2 ID',
  `last_message_id` VARCHAR(50) DEFAULT NULL COMMENT '最后一条消息ID',
  `last_message_content` VARCHAR(500) DEFAULT NULL COMMENT '最后一条消息内容预览',
  `last_message_time` TIMESTAMP NULL DEFAULT NULL COMMENT '最后一条消息时间',
  `unread_count_user1` INT NOT NULL DEFAULT 0 COMMENT '用户1的未读数',
  `unread_count_user2` INT NOT NULL DEFAULT 0 COMMENT '用户2的未读数',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_pair` (`user1_id`, `user2_id`),
  KEY `idx_last_message_time` (`last_message_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会话表';
```

## 二、后端接口实现

### 1. 获取会话列表

**接口**: `GET /api/messages/conversations`

**参数**:
- page: 页码（默认1）
- pageSize: 每页数量（默认20）
- type: 过滤类型（all/unread/system，默认all）

**返回示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "conversationId": "conv_001",
        "otherUserId": "user_002",
        "otherUserName": "李四",
        "otherUserAvatar": null,
        "lastMessageContent": "好的，我马上过去",
        "lastMessageTime": "2024-01-15T11:00:00Z",
        "unreadCount": 3,
        "isSystemConversation": false
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

**实现逻辑**:
```java
@GetMapping("/conversations")
public Result getConversations(
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "20") int pageSize,
    @RequestParam(defaultValue = "all") String type,
    HttpServletRequest request) {
    
    String currentUserId = getCurrentUserId(request);
    
    List<ConversationVO> conversations;
    int total;
    
    if ("system".equals(type)) {
        // 只返回系统消息会话
        conversations = messageService.getSystemConversations(currentUserId, page, pageSize);
        total = messageService.countSystemConversations(currentUserId);
    } else if ("unread".equals(type)) {
        // 只返回有未读消息的会话
        conversations = messageService.getUnreadConversations(currentUserId, page, pageSize);
        total = messageService.countUnreadConversations(currentUserId);
    } else {
        // 返回所有会话
        conversations = messageService.getAllConversations(currentUserId, page, pageSize);
        total = messageService.countAllConversations(currentUserId);
    }
    
    return Result.success(new PageResult<>(conversations, total, page, pageSize));
}
```

### 2. 获取会话消息列表

**接口**: `GET /api/messages/conversation/{userId}`

**参数**:
- userId: 对方用户ID
- page: 页码（默认1）
- pageSize: 每页数量（默认20）

**返回示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "msg_001",
        "senderId": "user_001",
        "senderName": "张三",
        "receiverId": "user_002",
        "orderId": null,
        "messageType": "USER",
        "content": "你好，请问什么时候可以取件？",
        "isRead": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 30,
    "page": 1,
    "pageSize": 20,
    "otherUser": {
      "id": "user_002",
      "username": "李四",
      "avatar": null
    }
  }
}
```

**实现逻辑**:
```java
@GetMapping("/conversation/{userId}")
public Result getConversationMessages(
    @PathVariable String userId,
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "20") int pageSize,
    HttpServletRequest request) {
    
    String currentUserId = getCurrentUserId(request);
    
    // 验证权限：只能查看自己参与的会话
    if (!messageService.hasConversationPermission(currentUserId, userId)) {
        return Result.error("无权访问该会话");
    }
    
    List<MessageVO> messages = messageService.getConversationMessages(
        currentUserId, userId, page, pageSize);
    int total = messageService.countConversationMessages(currentUserId, userId);
    
    UserVO otherUser = userService.getUserById(userId);
    
    Map<String, Object> data = new HashMap<>();
    data.put("list", messages);
    data.put("total", total);
    data.put("page", page);
    data.put("pageSize", pageSize);
    data.put("otherUser", otherUser);
    
    return Result.success(data);
}
```

### 3. 发送消息

**接口**: `POST /api/messages/send`

**请求体**:
```json
{
  "receiverId": "user_002",
  "content": "你好，请问什么时候可以取件？",
  "orderId": "order_001" // 可选
}
```

**返回示例**:
```json
{
  "code": 200,
  "message": "发送成功",
  "data": {
    "id": "msg_001",
    "senderId": "user_001",
    "receiverId": "user_002",
    "content": "你好，请问什么时候可以取件？",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**实现逻辑**:
```java
@PostMapping("/send")
public Result sendMessage(@RequestBody SendMessageRequest request, 
                         HttpServletRequest httpRequest) {
    String senderId = getCurrentUserId(httpRequest);
    
    // 验证接收者是否存在
    User receiver = userService.getUserById(request.getReceiverId());
    if (receiver == null) {
        return Result.error("接收者不存在");
    }
    
    // 验证内容
    if (request.getContent() == null || request.getContent().trim().isEmpty()) {
        return Result.error("消息内容不能为空");
    }
    
    if (request.getContent().length() > 1000) {
        return Result.error("消息内容不能超过1000字");
    }
    
    Message message = messageService.sendMessage(
        senderId, 
        request.getReceiverId(), 
        request.getContent(), 
        request.getOrderId()
    );
    
    return Result.success(message);
}
```

**Service层实现**:
```java
@Transactional
public Message sendMessage(String senderId, String receiverId, 
                          String content, String orderId) {
    // 1. 创建消息
    Message message = new Message();
    message.setId(generateMessageId());
    message.setSenderId(senderId);
    message.setReceiverId(receiverId);
    message.setOrderId(orderId);
    message.setMessageType("USER");
    message.setContent(content);
    message.setIsRead(false);
    message.setCreatedAt(new Date());
    
    messageMapper.insert(message);
    
    // 2. 更新或创建会话
    updateOrCreateConversation(senderId, receiverId, message);
    
    return message;
}

private void updateOrCreateConversation(String user1Id, String user2Id, Message message) {
    // 确保 user1Id < user2Id（按字母顺序）
    String firstUser = user1Id.compareTo(user2Id) < 0 ? user1Id : user2Id;
    String secondUser = user1Id.compareTo(user2Id) < 0 ? user2Id : user1Id;
    
    Conversation conversation = conversationMapper.selectByUsers(firstUser, secondUser);
    
    if (conversation == null) {
        // 创建新会话
        conversation = new Conversation();
        conversation.setId(generateConversationId());
        conversation.setUser1Id(firstUser);
        conversation.setUser2Id(secondUser);
        conversation.setUnreadCountUser1(firstUser.equals(message.getReceiverId()) ? 1 : 0);
        conversation.setUnreadCountUser2(secondUser.equals(message.getReceiverId()) ? 1 : 0);
        conversationMapper.insert(conversation);
    } else {
        // 更新会话
        conversation.setLastMessageId(message.getId());
        conversation.setLastMessageContent(truncateContent(message.getContent(), 500));
        conversation.setLastMessageTime(message.getCreatedAt());
        
        // 增加接收者的未读数
        if (firstUser.equals(message.getReceiverId())) {
            conversation.setUnreadCountUser1(conversation.getUnreadCountUser1() + 1);
        } else {
            conversation.setUnreadCountUser2(conversation.getUnreadCountUser2() + 1);
        }
        
        conversationMapper.updateById(conversation);
    }
}
```

### 4. 标记消息为已读

**接口**: `POST /api/messages/{messageId}/read`

**实现逻辑**:
```java
@PostMapping("/{messageId}/read")
public Result markMessageAsRead(@PathVariable String messageId, 
                               HttpServletRequest request) {
    String currentUserId = getCurrentUserId(request);
    
    Message message = messageMapper.selectById(messageId);
    if (message == null) {
        return Result.error("消息不存在");
    }
    
    // 只能标记自己的消息为已读
    if (!message.getReceiverId().equals(currentUserId)) {
        return Result.error("无权操作");
    }
    
    if (!message.getIsRead()) {
        message.setIsRead(true);
        message.setReadAt(new Date());
        messageMapper.updateById(message);
        
        // 减少会话未读数
        messageService.decreaseUnreadCount(
            message.getSenderId(), 
            message.getReceiverId()
        );
    }
    
    return Result.success();
}
```

### 5. 批量标记会话为已读

**接口**: `POST /api/messages/conversation/{userId}/read`

**实现逻辑**:
```java
@PostMapping("/conversation/{userId}/read")
public Result markConversationAsRead(@PathVariable String userId, 
                                    HttpServletRequest request) {
    String currentUserId = getCurrentUserId(request);
    
    messageService.markConversationAsRead(currentUserId, userId);
    
    return Result.success();
}

@Transactional
public void markConversationAsRead(String currentUserId, String otherUserId) {
    // 标记所有来自对方的消息为已读
    messageMapper.markMessagesAsRead(currentUserId, otherUserId);
    
    // 重置会话未读数
    String firstUser = currentUserId.compareTo(otherUserId) < 0 ? currentUserId : otherUserId;
    String secondUser = currentUserId.compareTo(otherUserId) < 0 ? otherUserId : currentUserId;
    
    Conversation conversation = conversationMapper.selectByUsers(firstUser, secondUser);
    if (conversation != null) {
        if (firstUser.equals(currentUserId)) {
            conversation.setUnreadCountUser1(0);
        } else {
            conversation.setUnreadCountUser2(0);
        }
        conversationMapper.updateById(conversation);
    }
}
```

### 6. 获取未读消息数量

**接口**: `GET /api/messages/unread-count`

**返回示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 10,
    "userMessages": 7,
    "systemMessages": 3
  }
}
```

**实现逻辑**:
```java
@GetMapping("/unread-count")
public Result getUnreadCount(HttpServletRequest request) {
    String currentUserId = getCurrentUserId(request);
    
    int userMessages = messageMapper.countUnreadUserMessages(currentUserId);
    int systemMessages = messageMapper.countUnreadSystemMessages(currentUserId);
    
    Map<String, Object> data = new HashMap<>();
    data.put("total", userMessages + systemMessages);
    data.put("userMessages", userMessages);
    data.put("systemMessages", systemMessages);
    
    return Result.success(data);
}
```

### 7. 删除消息

**接口**: `DELETE /api/messages/{messageId}`

**实现逻辑**:
```java
@DeleteMapping("/{messageId}")
public Result deleteMessage(@PathVariable String messageId, 
                           HttpServletRequest request) {
    String currentUserId = getCurrentUserId(request);
    
    Message message = messageMapper.selectById(messageId);
    if (message == null) {
        return Result.error("消息不存在");
    }
    
    // 只能删除自己发送或接收的消息
    if (!message.getSenderId().equals(currentUserId) && 
        !message.getReceiverId().equals(currentUserId)) {
        return Result.error("无权删除");
    }
    
    messageMapper.deleteById(messageId);
    
    return Result.success();
}
```

## 三、系统消息自动推送

### 在订单状态变更时发送系统消息

**示例代码**（在订单服务中）:

```java
@Service
public class OrderService {
    
    @Autowired
    private MessageService messageService;
    
    /**
     * 更新订单状态
     */
    @Transactional
    public void updateOrderStatus(String orderId, String newStatus, String operatorId) {
        Order order = orderMapper.selectById(orderId);
        String oldStatus = order.getStatus();
        
        // 更新订单状态
        order.setStatus(newStatus);
        order.setUpdatedAt(new Date());
        orderMapper.updateById(order);
        
        // 根据状态变化发送系统消息
        sendStatusChangeNotification(order, oldStatus, newStatus, operatorId);
    }
    
    /**
     * 发送状态变更通知
     */
    private void sendStatusChangeNotification(Order order, String oldStatus, 
                                             String newStatus, String operatorId) {
        String content = null;
        String receiverId = null;
        
        switch (newStatus.toUpperCase()) {
            case "ACCEPTED":
                // 订单被接取，通知发布者
                receiverId = order.getPublisherId();
                User acceptor = userService.getUserById(order.getAcceptorId());
                content = String.format("您的订单 %s 已被 %s 接取", 
                    order.getOrderNo(), acceptor.getUsername());
                break;
                
            case "DELIVERING":
                // 开始配送，通知发布者
                receiverId = order.getPublisherId();
                User acceptor = userService.getUserById(order.getAcceptorId());
                content = String.format("%s 已开始配送您的订单 %s", 
                    acceptor.getUsername(), order.getOrderNo());
                break;
                
            case "DELIVERED":
                // 已送达，通知发布者确认收货
                receiverId = order.getPublisherId();
                User acceptor = userService.getUserById(order.getAcceptorId());
                content = String.format("%s 已完成配送订单 %s，请确认收货", 
                    acceptor.getUsername(), order.getOrderNo());
                break;
                
            case "COMPLETED":
                // 订单完成，通知接单人
                receiverId = order.getAcceptorId();
                content = String.format("订单 %s 已完成，感谢您的服务", order.getOrderNo());
                break;
                
            case "CANCELLED":
                // 订单取消，通知相关方
                if (operatorId.equals(order.getPublisherId())) {
                    // 发布者取消，通知接单人（如果已接单）
                    if (order.getAcceptorId() != null) {
                        receiverId = order.getAcceptorId();
                        content = String.format("订单 %s 已被发布者取消", order.getOrderNo());
                    }
                } else {
                    // 接单人取消，通知发布者
                    receiverId = order.getPublisherId();
                    content = String.format("订单 %s 已被接单人取消", order.getOrderNo());
                }
                break;
        }
        
        // 发送系统消息
        if (receiverId != null && content != null) {
            messageService.sendSystemMessage(receiverId, content, order.getId());
        }
    }
}
```

**系统消息发送方法**:

```java
@Service
public class MessageService {
    
    @Transactional
    public Message sendSystemMessage(String receiverId, String content, String orderId) {
        Message message = new Message();
        message.setId(generateMessageId());
        message.setSenderId("system"); // 系统ID
        message.setReceiverId(receiverId);
        message.setOrderId(orderId);
        message.setMessageType("SYSTEM");
        message.setContent(content);
        message.setIsRead(false);
        message.setCreatedAt(new Date());
        
        messageMapper.insert(message);
        
        // 更新系统消息会话
        updateSystemConversation(receiverId, message);
        
        return message;
    }
    
    private void updateSystemConversation(String userId, Message message) {
        // 系统消息使用特殊的会话ID
        String conversationId = "system_" + userId;
        
        Conversation conversation = conversationMapper.selectById(conversationId);
        
        if (conversation == null) {
            conversation = new Conversation();
            conversation.setId(conversationId);
            conversation.setUser1Id("system");
            conversation.setUser2Id(userId);
            conversation.setUnreadCountUser2(1); // 用户2是接收者
        } else {
            conversation.setUnreadCountUser2(conversation.getUnreadCountUser2() + 1);
        }
        
        conversation.setLastMessageId(message.getId());
        conversation.setLastMessageContent(truncateContent(message.getContent(), 500));
        conversation.setLastMessageTime(message.getCreatedAt());
        
        if (conversation.getId() == null) {
            conversationMapper.insert(conversation);
        } else {
            conversationMapper.updateById(conversation);
        }
    }
}
```

## 四、MyBatis Mapper 示例

### MessageMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.campus.mapper.MessageMapper">
    
    <!-- 统计未读用户消息数 -->
    <select id="countUnreadUserMessages" resultType="int">
        SELECT COUNT(*) FROM messages
        WHERE receiver_id = #{userId}
        AND is_read = 0
        AND message_type = 'USER'
    </select>
    
    <!-- 统计未读系统消息数 -->
    <select id="countUnreadSystemMessages" resultType="int">
        SELECT COUNT(*) FROM messages
        WHERE receiver_id = #{userId}
        AND is_read = 0
        AND message_type = 'SYSTEM'
    </select>
    
    <!-- 标记消息为已读 -->
    <update id="markMessagesAsRead">
        UPDATE messages
        SET is_read = 1, read_at = NOW()
        WHERE receiver_id = #{currentUserId}
        AND sender_id = #{otherUserId}
        AND is_read = 0
    </update>
    
</mapper>
```

## 五、注意事项

1. **安全性**:
   - 所有接口都需要认证（JWT Token）
   - 用户只能查看和操作自己的消息
   - 防止 XSS 攻击（前端已做 HTML 转义）
   - 限制消息长度（建议1000字符以内）

2. **性能优化**:
   - 会话列表使用分页
   - 消息列表使用分页并限制每次加载数量
   - 为常用查询字段建立索引
   - 考虑使用 Redis 缓存未读消息数

3. **实时性**:
   - 前端每30秒轮询一次未读消息数
   - 如需实时推送，可考虑 WebSocket 方案

4. **数据清理**:
   - 定期清理过期消息（如保留6个月）
   - 提供消息删除功能

5. **扩展性**:
   - 支持图片、文件等多媒体消息（需扩展表结构）
   - 支持消息撤回功能
   - 支持消息搜索功能
