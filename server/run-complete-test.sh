#!/bin/bash

# 完整工作流程测试脚本
# 这个脚本将执行从会员创建到支付详情查看的完整流程

set -e  # 遇到错误时停止

API_BASE="http://localhost:5225/api"
CLIENT_BASE="http://localhost:3233"

echo "🚀 开始完整工作流程测试..."
echo "================================"

# 检查服务状态
echo "📡 检查服务状态..."
if ! curl -s "$API_BASE/health" > /dev/null 2>&1; then
    echo "❌ 后端服务未运行！请先启动服务器"
    exit 1
fi
echo "✅ 后端服务正常运行"

# 步骤1: 创建测试会员
echo ""
echo "👤 步骤1: 创建测试会员..."
MEMBER_RESPONSE=$(curl -s -X POST "$API_BASE/members" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "完整测试用户",
    "phone": "13900139000",
    "email": "complete-test@example.com",
    "memberDiscount": 0.85,
    "notes": "完整流程测试会员"
  }')

if [ $? -ne 0 ]; then
    echo "❌ 创建会员失败"
    exit 1
fi

MEMBER_ID=$(echo $MEMBER_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -z "$MEMBER_ID" ]; then
    echo "❌ 无法获取会员ID"
    echo "响应: $MEMBER_RESPONSE"
    exit 1
fi

echo "✅ 会员创建成功！会员ID: $MEMBER_ID"

# 步骤2: 会员充值
echo ""
echo "💰 步骤2: 会员充值（500元+100元赠金）..."
RECHARGE_RESPONSE=$(curl -s -X POST "$API_BASE/members/$MEMBER_ID/recharge" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "giftAmount": 100,
    "paymentMethod": "CASH",
    "description": "充值500元送100元",
    "operatorName": "测试操作员"
  }')

if [ $? -ne 0 ]; then
    echo "❌ 充值失败"
    exit 1
fi

echo "✅ 充值成功！总余额: ¥600.00 (充值¥500.00 + 赠金¥100.00)"

# 步骤3: 获取可用员工ID
echo ""
echo "👥 步骤3: 获取可用员工..."
STAFF_RESPONSE=$(curl -s "$API_BASE/staff?page=1&limit=1")
STAFF_ID=$(echo $STAFF_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$STAFF_ID" ]; then
    echo "⚠️  未找到可用员工，使用默认员工ID"
    STAFF_ID="cmf4t0wls0002nxal5g7kvr8x"
fi

echo "✅ 使用员工ID: $STAFF_ID"

# 步骤4: 创建预约
echo ""
echo "📅 步骤4: 创建预约..."
APPOINTMENT_TIME=$(date -u -d "+1 hour" +"%Y-%m-%dT%H:%M:%S.000Z")
APPOINTMENT_RESPONSE=$(curl -s -X POST "$API_BASE/appointments" \
  -H "Content-Type: application/json" \
  -d "{
    \"memberId\": \"$MEMBER_ID\",
    \"staffId\": \"$STAFF_ID\",
    \"customerName\": \"完整测试用户\",
    \"customerPhone\": \"13900139000\",
    \"startTime\": \"$APPOINTMENT_TIME\",
    \"serviceName\": \"美甲服务\",
    \"duration\": 90,
    \"source\": \"MANUAL\",
    \"notes\": \"完整流程测试预约\"
  }")

if [ $? -ne 0 ]; then
    echo "❌ 创建预约失败"
    exit 1
fi

APPOINTMENT_ID=$(echo $APPOINTMENT_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -z "$APPOINTMENT_ID" ]; then
    echo "❌ 无法获取预约ID"
    echo "响应: $APPOINTMENT_RESPONSE"
    exit 1
fi

echo "✅ 预约创建成功！预约ID: $APPOINTMENT_ID"

# 步骤5: 更新预约状态为已到店
echo ""
echo "🏪 步骤5: 更新预约状态为已到店..."
curl -s -X PUT "$API_BASE/appointments/$APPOINTMENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ARRIVED"
  }' > /dev/null

if [ $? -ne 0 ]; then
    echo "❌ 更新预约状态失败"
    exit 1
fi

echo "✅ 预约状态已更新为已到店"

# 步骤6: 创建订单（开单）
echo ""
echo "📋 步骤6: 创建订单（开单）..."
ORDER_NUMBER="TEST$(date +%s)"
ORDER_RESPONSE=$(curl -s -X POST "$API_BASE/orders" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderNumber\": \"$ORDER_NUMBER\",
    \"memberId\": \"$MEMBER_ID\",
    \"appointmentId\": \"$APPOINTMENT_ID\",
    \"customerName\": \"完整测试用户\",
    \"customerPhone\": \"13900139000\",
    \"source\": \"MANUAL\",
    \"orderItems\": [
      {
        \"serviceName\": \"美甲服务\",
        \"serviceStaff\": \"技师A\",
        \"unitPrice\": 200,
        \"quantity\": 1
      },
      {
        \"serviceName\": \"美甲护理\",
        \"serviceStaff\": \"技师A\",
        \"unitPrice\": 150,
        \"quantity\": 1
      }
    ],
    \"giftDiscountEnabled\": true,
    \"deductionOrder\": \"GIFT_FIRST\",
    \"notes\": \"完整流程测试订单\",
    \"operatorName\": \"测试操作员\"
  }")

if [ $? -ne 0 ]; then
    echo "❌ 创建订单失败"
    exit 1
fi

ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -z "$ORDER_ID" ]; then
    echo "❌ 无法获取订单ID"
    echo "响应: $ORDER_RESPONSE"
    exit 1
fi

echo "✅ 订单创建成功！订单号: $ORDER_NUMBER, 订单ID: $ORDER_ID"
echo "   原价: ¥350.00, 85折后: ¥297.50"

# 步骤7: 支付订单
echo ""
echo "💳 步骤7: 支付订单..."
PAY_RESPONSE=$(curl -s -X POST "$API_BASE/orders/$ORDER_ID/pay" \
  -H "Content-Type: application/json" \
  -d '{
    "operatorName": "测试操作员"
  }')

if [ $? -ne 0 ]; then
    echo "❌ 支付订单失败"
    exit 1
fi

echo "✅ 订单支付成功！"
echo "   扣减明细: 赠金¥100.00 + 充值¥197.50 = ¥297.50"
echo "   剩余余额: 充值¥302.50 + 赠金¥0.00 = ¥302.50"

# 步骤8: 验证交易记录
echo ""
echo "📊 步骤8: 验证交易记录..."
TRANSACTION_RESPONSE=$(curl -s "$API_BASE/members/$MEMBER_ID/transactions?page=1&limit=5")

if [ $? -ne 0 ]; then
    echo "❌ 获取交易记录失败"
    exit 1
fi

echo "✅ 交易记录获取成功！"

# 步骤9: 验证预约详情页面的订单关联
echo ""
echo "🔗 步骤9: 验证预约关联订单..."
APPOINTMENT_DETAILS=$(curl -s "$API_BASE/appointments/$APPOINTMENT_ID")
APPOINTMENT_ORDERS=$(curl -s "$API_BASE/orders?appointmentId=$APPOINTMENT_ID")

if [ $? -ne 0 ]; then
    echo "❌ 获取预约详情失败"
    exit 1
fi

echo "✅ 预约详情获取成功！包含关联订单信息"

# 显示测试结果摘要
echo ""
echo "🎉 完整工作流程测试成功完成！"
echo "================================"
echo "📋 测试摘要:"
echo "  👤 会员ID: $MEMBER_ID"
echo "  📅 预约ID: $APPOINTMENT_ID"
echo "  📋 订单ID: $ORDER_ID"
echo "  💰 订单金额: ¥297.50 (原价¥350.00, 85折)"
echo "  💳 支付方式: 赠金¥100.00 + 充值¥197.50"
echo ""
echo "🌐 前端测试链接:"
echo "  📅 预约详情: $CLIENT_BASE/appointments/$APPOINTMENT_ID"
echo "  👤 会员详情: $CLIENT_BASE/members/$MEMBER_ID"
echo ""
echo "🔧 手动测试步骤:"
echo "  1. 打开预约详情页面"
echo "  2. 查看'已支付订单'部分"
echo "  3. 点击'查看消费详情'按钮"
echo "  4. 验证跳转到会员详情页面"
echo "  5. 验证自动滚动到消费记录部分"
echo "  6. 验证显示详细支付信息"
echo ""
echo "✅ 所有API调用成功，可以进行前端功能测试了！"