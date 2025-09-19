# 完整工作流程测试案例

本测试案例展示了从预约创建到通过预约详情页面查看支付明细的完整流程。

## 测试流程概述

1. **添加会员** - 创建测试会员账户
2. **充值（含赠金）** - 为会员充值并获得赠金
3. **添加预约** - 创建预约
4. **完成到店** - 更新预约状态为已到店
5. **完成开单** - 创建订单
6. **完成支付** - 使用会员余额支付订单
7. **预约详情跳转** - 通过预约详情页面查看支付明细

## 详细测试步骤

### 步骤1: 添加会员

```bash
curl -X POST "http://localhost:5225/api/members" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试用户",
    "phone": "13800138999",
    "email": "test@example.com",
    "memberDiscount": 0.85,
    "notes": "完整流程测试会员"
  }'
```

**预期结果**: 返回创建的会员信息，包含会员ID

### 步骤2: 会员充值（含赠金）

```bash
# 使用上一步得到的会员ID
curl -X POST "http://localhost:5225/api/members/{MEMBER_ID}/recharge" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "giftAmount": 100,
    "paymentMethod": "CASH",
    "description": "充值500元送100元",
    "operatorName": "测试操作员"
  }'
```

**预期结果**:
- 会员充值余额: ¥500.00
- 会员赠金余额: ¥100.00
- 总余额: ¥600.00

### 步骤3: 添加预约

```bash
curl -X POST "http://localhost:5225/api/appointments" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "{MEMBER_ID}",
    "staffId": "cmf4t0wls0002nxal5g7kvr8x",
    "customerName": "测试用户",
    "customerPhone": "13800138999",
    "startTime": "2025-09-19T14:00:00.000Z",
    "serviceName": "美甲服务",
    "duration": 90,
    "source": "MANUAL",
    "notes": "完整流程测试预约"
  }'
```

**预期结果**: 返回创建的预约信息，包含预约ID

### 步骤4: 更新预约状态为已到店

```bash
curl -X PUT "http://localhost:5225/api/appointments/{APPOINTMENT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ARRIVED"
  }'
```

**预期结果**: 预约状态更新为 "ARRIVED"

### 步骤5: 创建订单（开单）

```bash
curl -X POST "http://localhost:5225/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "TEST001",
    "memberId": "{MEMBER_ID}",
    "appointmentId": "{APPOINTMENT_ID}",
    "customerName": "测试用户",
    "customerPhone": "13800138999",
    "source": "MANUAL",
    "orderItems": [
      {
        "serviceName": "美甲服务",
        "serviceStaff": "技师A",
        "unitPrice": 200,
        "quantity": 1
      },
      {
        "serviceName": "美甲护理",
        "serviceStaff": "技师A",
        "unitPrice": 150,
        "quantity": 1
      }
    ],
    "giftDiscountEnabled": true,
    "deductionOrder": "GIFT_FIRST",
    "notes": "完整流程测试订单",
    "operatorName": "测试操作员"
  }'
```

**预期结果**:
- 总金额: ¥350.00
- 会员折扣: 85折
- 折扣金额: ¥52.50
- 实际金额: ¥297.50
- 返回订单ID

### 步骤6: 支付订单

```bash
curl -X POST "http://localhost:5225/api/orders/{ORDER_ID}/pay" \
  -H "Content-Type: application/json" \
  -d '{
    "operatorName": "测试操作员"
  }'
```

**预期结果**:
- 订单状态: "PAID"
- 支付详情:
  - 赠金扣减: ¥100.00
  - 充值余额扣减: ¥197.50
  - 总扣减: ¥297.50
- 会员余额:
  - 充值余额: ¥302.50
  - 赠金余额: ¥0.00
  - 总余额: ¥302.50

### 步骤7: 验证交易记录详情

```bash
curl "http://localhost:5225/api/members/{MEMBER_ID}/transactions?page=1&limit=5"
```

**预期结果**:
- 包含充值记录（type: "RECHARGE"）
- 包含消费记录（type: "CONSUME"）
- 消费记录包含详细支付信息:
  - 原价金额: ¥350.00
  - 会员折扣: 0.85
  - 折扣金额: ¥52.50
  - 赠金扣减: ¥100.00
  - 充值余额扣减: ¥197.50
  - 服务项目: JSON格式的服务列表
  - 预约时间: ISO时间字符串

### 步骤8: 通过预约详情页面查看消费详情

1. **前端操作**: 在浏览器中访问 `http://localhost:3233/appointments/{APPOINTMENT_ID}`
2. **查看关联订单**: 页面应显示"已支付订单"部分
3. **点击跳转按钮**: 点击"查看消费详情"按钮
4. **验证跳转**: 应跳转到会员详情页面 `/members/{MEMBER_ID}`
5. **验证滚动**: 页面应自动滚动到"消费记录"部分
6. **验证详情**: 消费记录应显示详细的支付信息

## 前端测试验证要点

### 预约详情页面验证
- [ ] 页面正确显示预约信息
- [ ] "已支付订单"部分正确显示
- [ ] "查看消费详情"按钮可点击
- [ ] 点击按钮正确导航到会员详情页

### 会员详情页面验证
- [ ] 页面正确显示会员信息
- [ ] 余额显示正确（充值余额: ¥302.50, 赠金余额: ¥0.00）
- [ ] 自动滚动到消费记录部分
- [ ] 消费记录显示详细支付信息:
  - [ ] 显示"消费"类型
  - [ ] 显示原价 ¥350.00
  - [ ] 显示85折折扣
  - [ ] 显示折扣金额 ¥52.50
  - [ ] 显示服务项目列表
  - [ ] 显示预约时间
  - [ ] 显示支付详情（赠金¥100.00 + 充值¥197.50）
  - [ ] 显示扣减顺序（赠金优先）

## API响应格式示例

### 消费交易记录响应格式
```json
{
  "id": "transaction_id",
  "type": "CONSUME",
  "amount": 297.50,
  "originalAmount": 350.00,
  "memberDiscount": 0.85,
  "discountAmount": 52.50,
  "giftDiscountEnabled": true,
  "deductionOrder": "GIFT_FIRST",
  "rechargePaid": 197.50,
  "giftPaid": 100.00,
  "serviceItems": "[{\"serviceName\":\"美甲服务\",\"serviceStaff\":\"技师A\",\"unitPrice\":200,\"quantity\":1,\"subtotal\":200},{\"serviceName\":\"美甲护理\",\"serviceStaff\":\"技师A\",\"unitPrice\":150,\"quantity\":1,\"subtotal\":150}]",
  "appointmentTime": "2025-09-19T14:00:00.000Z",
  "balanceBefore": 600.00,
  "balanceAfter": 302.50,
  "paymentMethod": "BALANCE",
  "description": "消费订单 TEST001",
  "operatorName": "测试操作员",
  "createdAt": "2025-09-19T..."
}
```

## 测试成功标准

1. **数据一致性**: 所有金额计算正确
2. **状态流转**: 预约和订单状态正确更新
3. **记录完整性**: 交易记录包含所有必要信息
4. **页面跳转**: 预约详情到会员详情的导航正常
5. **UI显示**: 所有支付详情正确显示在前端界面

此测试案例验证了整个系统的完整工作流程，确保所有功能模块之间的集成正常工作。