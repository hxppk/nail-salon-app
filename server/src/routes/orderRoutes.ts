import express from 'express';
import {
  createOrder,
  payOrder,
  getOrder,
  getOrders,
  calculateOrderPreview
} from '../controllers/orderController';

const router = express.Router();

// 订单管理路由
router.post('/', createOrder);                    // 创建订单
router.post('/:id/pay', payOrder);               // 支付订单
router.get('/:id', getOrder);                    // 获取订单详情
router.get('/', getOrders);                      // 获取订单列表
router.post('/preview', calculateOrderPreview);   // 计算订单预览

export default router;