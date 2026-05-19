-- ============================================
-- 校园快递代取系统 - 私信功能数据库脚本
-- 创建时间: 2026-05-15
-- 说明: 包含消息表和会话表的完整建表语句
-- ============================================

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. 消息表 (messages)
-- 用途: 存储所有消息记录（用户私信 + 系统消息）
-- ============================================
DROP TABLE IF EXISTS `messages`;
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
  KEY `idx_is_read` (`is_read`),
  KEY `idx_receiver_is_read` (`receiver_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- ============================================
-- 2. 会话表 (conversations)
-- 用途: 优化消息列表展示，记录最后一条消息和未读数
-- ============================================
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id` VARCHAR(50) NOT NULL COMMENT '会话ID',
  `user1_id` VARCHAR(50) NOT NULL COMMENT '用户1 ID（按字母顺序较小者）',
  `user2_id` VARCHAR(50) NOT NULL COMMENT '用户2 ID（按字母顺序较大者）',
  `last_message_id` VARCHAR(50) DEFAULT NULL COMMENT '最后一条消息ID',
  `last_message_content` VARCHAR(500) DEFAULT NULL COMMENT '最后一条消息内容预览',
  `last_message_time` TIMESTAMP NULL DEFAULT NULL COMMENT '最后一条消息时间',
  `unread_count_user1` INT NOT NULL DEFAULT 0 COMMENT '用户1的未读数',
  `unread_count_user2` INT NOT NULL DEFAULT 0 COMMENT '用户2的未读数',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_pair` (`user1_id`, `user2_id`),
  KEY `idx_last_message_time` (`last_message_time`),
  KEY `idx_user1_unread` (`user1_id`, `unread_count_user1`),
  KEY `idx_user2_unread` (`user2_id`, `unread_count_user2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表';

-- ============================================
-- 3. 插入测试数据（可选）
-- ============================================

-- 测试用户私信
INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `order_id`, `message_type`, `content`, `is_read`, `created_at`) VALUES
('msg_test_001', 'user_001', 'user_002', 'order_001', 'USER', '你好，请问什么时候可以取件？', 1, '2024-01-15 10:30:00'),
('msg_test_002', 'user_002', 'user_001', 'order_001', 'USER', '我下午3点过去取', 1, '2024-01-15 10:35:00'),
('msg_test_003', 'user_001', 'user_002', 'order_001', 'USER', '好的，谢谢！', 0, '2024-01-15 10:40:00');

-- 测试系统消息
INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `order_id`, `message_type`, `content`, `is_read`, `created_at`) VALUES
('msg_sys_001', 'system', 'user_001', 'order_001', 'SYSTEM', '您的订单 ORD20240115001 已被 李四 接取', 0, '2024-01-15 10:00:00'),
('msg_sys_002', 'system', 'user_001', 'order_001', 'SYSTEM', '李四 已开始配送您的订单 ORD20240115001', 0, '2024-01-15 14:00:00');

-- 测试会话数据
INSERT INTO `conversations` (`id`, `user1_id`, `user2_id`, `last_message_id`, `last_message_content`, `last_message_time`, `unread_count_user1`, `unread_count_user2`) VALUES
('conv_test_001', 'user_001', 'user_002', 'msg_test_003', '好的，谢谢！', '2024-01-15 10:40:00', 1, 0),
('conv_sys_001', 'system', 'user_001', 'msg_sys_002', '李四 已开始配送您的订单 ORD20240115001', '2024-01-15 14:00:00', 2, 0);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 常用查询示例
-- ============================================

-- 1. 获取用户的未读消息数
-- SELECT COUNT(*) FROM messages WHERE receiver_id = 'user_001' AND is_read = 0;

-- 2. 获取用户的所有会话（需要联表查询）
-- SELECT c.*, 
--        CASE WHEN c.user1_id = 'user_001' THEN c.user2_id ELSE c.user1_id END as other_user_id
-- FROM conversations c
-- WHERE c.user1_id = 'user_001' OR c.user2_id = 'user_001'
-- ORDER BY c.last_message_time DESC;

-- 3. 获取某个会话的消息列表
-- SELECT m.*, u.username as sender_name
-- FROM messages m
-- LEFT JOIN users u ON m.sender_id = u.id
-- WHERE (m.sender_id = 'user_001' AND m.receiver_id = 'user_002')
--    OR (m.sender_id = 'user_002' AND m.receiver_id = 'user_001')
-- ORDER BY m.created_at ASC;

-- 4. 标记消息为已读
-- UPDATE messages SET is_read = 1, read_at = NOW() 
-- WHERE receiver_id = 'user_001' AND sender_id = 'user_002' AND is_read = 0;

-- 5. 清理过期消息（保留6个月）
-- DELETE FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
