import express from 'express';
import { getStaff, getStaffMember } from '../controllers/staffController';

const router = express.Router();

// 员工管理路由
router.get('/', getStaff);          // 获取员工列表
router.get('/:id', getStaffMember); // 获取员工详情

export default router;