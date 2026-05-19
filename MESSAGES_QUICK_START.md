# 私信功能 - 后端快速开始指南

## 🚀 5分钟快速上手

### 第一步：执行数据库脚本

```bash
# 连接到 MySQL 数据库
mysql -u root -p your_database_name

# 执行建表脚本
source /path/to/database_messages.sql
```

或者直接复制 `database_messages.sql` 文件内容在数据库管理工具中执行。

### 第二步：创建实体类

#### Message.java
```java
package com.campus.entity;

import lombok.Data;
import java.util.Date;

@Data
public class Message {
    private String id;
    private String senderId;
    private String receiverId;
    private String orderId;
    private String messageType; // USER, SYSTEM
    private String content;
    private Boolean isRead;
    private Date readAt;
    private Date createdAt;
    private Date updatedAt;
}
```

#### Conversation.java
```java
package com.campus.entity;

import lombok.Data;
import java.util.Date;

@Data
public class Conversation {
    private String id;
    private String user1Id;
    private String user2Id;
    private String lastMessageId;
    private String lastMessageContent;
    private Date lastMessageTime;
    private Integer unreadCountUser1;
    private Integer unreadCountUser2;
    private Date createdAt;
    private Date updatedAt;
}
```

### 第三步：创建 Mapper 接口

#### MessageMapper.java
```java
package com.campus.mapper;

import com.campus.entity.Message;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface MessageMapper {
    
    @Insert("INSERT INTO messages (id, sender_id, receiver_id, order_id, message_type, content, is_read, created_at) " +
            "VALUES (#{id}, #{senderId}, #{receiverId}, #{orderId}, #{messageType}, #{content}, #{isRead}, #{createdAt})")
    int insert(Message message);
    
    @Select("SELECT * FROM messages WHERE id = #{id}")
    Message selectById(String id);
    
    @Select("SELECT COUNT(*) FROM messages WHERE receiver_id = #{userId} AND is_read = 0 AND message_type = 'USER'")
    int countUnreadUserMessages(String userId);
    
    @Select("SELECT COUNT(*) FROM messages WHERE receiver_id = #{userId} AND is_read = 0 AND message_type = 'SYSTEM'")
    int countUnreadSystemMessages(String userId);
    
    @Update("UPDATE messages SET is_read = 1, read_at = NOW() WHERE receiver_id = #{currentUserId} AND sender_id = #{otherUserId} AND is_read = 0")
    int markMessagesAsRead(@Param("currentUserId") String currentUserId, @Param("otherUserId") String otherUserId);
    
    @Delete("DELETE FROM messages WHERE id = #{id}")
    int deleteById(String id);
}
```

#### ConversationMapper.java
```java
package com.campus.mapper;

import com.campus.entity.Conversation;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface ConversationMapper {
    
    @Insert("INSERT INTO conversations (id, user1_id, user2_id, last_message_id, last_message_content, last_message_time, unread_count_user1, unread_count_user2) " +
            "VALUES (#{id}, #{user1Id}, #{user2Id}, #{lastMessageId}, #{lastMessageContent}, #{lastMessageTime}, #{unreadCountUser1}, #{unreadCountUser2})")
    int insert(Conversation conversation);
    
    @Select("SELECT * FROM conversations WHERE id = #{id}")
    Conversation selectById(String id);
    
    @Select("SELECT * FROM conversations WHERE user1_id = #{user1Id} AND user2_id = #{user2Id}")
    Conversation selectByUsers(@Param("user1Id") String user1Id, @Param("user2Id") String user2Id);
    
    @Update("UPDATE conversations SET last_message_id = #{lastMessageId}, last_message_content = #{lastMessageContent}, " +
            "last_message_time = #{lastMessageTime}, unread_count_user1 = #{unreadCountUser1}, " +
            "unread_count_user2 = #{unreadCountUser2}, updated_at = NOW() WHERE id = #{id}")
    int updateById(Conversation conversation);
}
```

### 第四步：创建 Service

#### MessageService.java（核心方法）
```java
package com.campus.service;

import com.campus.entity.*;
import com.campus.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class MessageService {
    
    @Autowired
    private MessageMapper messageMapper;
    
    @Autowired
    private ConversationMapper conversationMapper;
    
    @Autowired
    private UserService userService;
    
    /**
     * 发送消息
     */
    @Transactional
    public Message sendMessage(String senderId, String receiverId, String content, String orderId) {
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
    
    /**
     * 发送系统消息
     */
    @Transactional
    public Message sendSystemMessage(String receiverId, String content, String orderId) {
        Message message = new Message();
        message.setId(generateMessageId());
        message.setSenderId("system");
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
    
    /**
     * 更新或创建会话
     */
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
    
    /**
     * 标记会话为已读
     */
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
    
    // 辅助方法
    private String generateMessageId() {
        return "msg_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000);
    }
    
    private String generateConversationId() {
        return "conv_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000);
    }
    
    private String truncateContent(String content, int maxLength) {
        if (content == null) return null;
        return content.length() > maxLength ? content.substring(0, maxLength) : content;
    }
}
```

### 第五步：创建 Controller

#### MessageController.java
```java
package com.campus.controller;

import com.campus.common.Result;
import com.campus.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import javax.servlet.http.HttpServletRequest;
import java.util.*;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    
    @Autowired
    private MessageService messageService;
    
    /**
     * 获取未读消息数量
     */
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
    
    /**
     * 发送消息
     */
    @PostMapping("/send")
    public Result sendMessage(@RequestBody SendMessageRequest request, HttpServletRequest httpRequest) {
        String senderId = getCurrentUserId(httpRequest);
        
        // 参数验证
        if (request.getReceiverId() == null || request.getReceiverId().isEmpty()) {
            return Result.error("接收者不能为空");
        }
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
    
    /**
     * 标记会话为已读
     */
    @PostMapping("/conversation/{userId}/read")
    public Result markConversationAsRead(@PathVariable String userId, HttpServletRequest request) {
        String currentUserId = getCurrentUserId(request);
        messageService.markConversationAsRead(currentUserId, userId);
        return Result.success();
    }
    
    // 辅助方法
    private String getCurrentUserId(HttpServletRequest request) {
        // 从 JWT Token 中获取用户ID
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        // TODO: 解析 Token 获取用户ID
        return "user_001"; // 示例
    }
}
```

### 第六步：集成到订单服务

在订单状态变更时自动发送系统消息：

```java
@Service
public class OrderService {
    
    @Autowired
    private MessageService messageService;
    
    @Transactional
    public void updateOrderStatus(String orderId, String newStatus, String operatorId) {
        Order order = orderMapper.selectById(orderId);
        String oldStatus = order.getStatus();
        
        // 更新订单状态
        order.setStatus(newStatus);
        orderMapper.updateById(order);
        
        // 发送系统消息
        sendStatusChangeNotification(order, oldStatus, newStatus, operatorId);
    }
    
    private void sendStatusChangeNotification(Order order, String oldStatus, 
                                             String newStatus, String operatorId) {
        String content = null;
        String receiverId = null;
        
        switch (newStatus.toUpperCase()) {
            case "ACCEPTED":
                receiverId = order.getPublisherId();
                User acceptor = userService.getUserById(order.getAcceptorId());
                content = String.format("您的订单 %s 已被 %s 接取", 
                    order.getOrderNo(), acceptor.getUsername());
                break;
            case "DELIVERING":
                receiverId = order.getPublisherId();
                User acceptor = userService.getUserById(order.getAcceptorId());
                content = String.format("%s 已开始配送您的订单 %s", 
                    acceptor.getUsername(), order.getOrderNo());
                break;
            case "DELIVERED":
                receiverId = order.getPublisherId();
                User acceptor = userService.getUserById(order.getAcceptorId());
                content = String.format("%s 已完成配送订单 %s，请确认收货", 
                    acceptor.getUsername(), order.getOrderNo());
                break;
            case "COMPLETED":
                receiverId = order.getAcceptorId();
                content = String.format("订单 %s 已完成，感谢您的服务", order.getOrderNo());
                break;
            case "CANCELLED":
                if (operatorId.equals(order.getPublisherId())) {
                    if (order.getAcceptorId() != null) {
                        receiverId = order.getAcceptorId();
                        content = String.format("订单 %s 已被发布者取消", order.getOrderNo());
                    }
                } else {
                    receiverId = order.getPublisherId();
                    content = String.format("订单 %s 已被接单人取消", order.getOrderNo());
                }
                break;
        }
        
        if (receiverId != null && content != null) {
            messageService.sendSystemMessage(receiverId, content, order.getId());
        }
    }
}
```

## ✅ 验证清单

完成以上步骤后，验证以下功能：

- [ ] 数据库表创建成功
- [ ] 可以发送用户私信
- [ ] 可以接收消息
- [ ] 未读消息数正确统计
- [ ] 标记已读功能正常
- [ ] 会话列表正确显示
- [ ] 系统消息自动推送
- [ ] 订单状态变更触发系统消息

## 📝 下一步

1. 完善其他接口（获取会话列表、获取消息列表等）
2. 添加分页功能
3. 添加权限验证
4. 进行完整测试
5. 性能优化

## 🆘 常见问题

**Q: 消息发送成功但前端收不到？**
A: 检查 CORS 配置，确保允许前端域名访问。

**Q: 未读数不准确？**
A: 检查会话表的未数字段是否正确更新。

**Q: 系统消息没有自动推送？**
A: 检查订单服务中是否正确调用了 messageService.sendSystemMessage()。

---

**提示**: 详细实现请参考 `MESSAGES_BACKEND_GUIDE.md` 文档。
