# Changelog

## 2025-09-04

前后端对齐与功能增强，聚焦会员与预约模块。

### 后端
- 数据库与种子
  - 切换本地开发数据库为 SQLite：`server/.env` → `DATABASE_URL="file:./dev.db"`。
  - 新增 `server/src/utils/seed.ts`，串行执行员工与演示数据种子。
  - 修正 `seedData.ts` 以匹配当前 Prisma 模型（新增预约必填字段，移除已废弃字段）。
- 会员接口
  - `createMember` 校验支持“无折扣(1)”以及 `0.9/0.88/0.85/0.8/0.75/0.7`。
  - `updateMember` 对入参进行清洗/类型规范：日期字符串转 `Date`，空字符串字段清除，避免 Prisma 报错。

### 前端
- 基础配置
  - `client/.env` 使用 `VITE_API_BASE_URL=/api` 走 Vite 代理，`client/vite.config.ts` 将代理目标改为 `http://127.0.0.1:5225` 以避免全局代理干扰。
- 会员模块
  - 类型重构：以 `memberDiscount/rechargeBalance/bonusBalance/balance` 为主，移除 `membershipLevel/points/debtAmount`。
  - API 兼容层：`memberApi` 统一 normalize（计算 balance，规范时间字段），`create/update/get` 返回结构对齐。
  - 会员列表（`MemberList.tsx`）：
    - 展示会员折扣徽章（含“无折扣”），移除积分与欠款显示。
    - 筛选改为 `discountLevel`（保留位，当前可不重要）。
  - 会员详情（`MemberDetail.tsx`）：
    - 顶部信息展示“会员折扣”，新增“充值余额/赠金余额/总余额”三卡；下方统计卡保留“现金消费/消费次数/最近消费时间”。
    - 新增“编辑资料”弹窗（`MemberEditModal.tsx`），可修改基础信息与折扣。
    - 充值弹窗（`RechargeModal.tsx`）支持“赠金金额（可为 0）”。
    - “消费记录”重命名为“会员记录”，移除 `POINTS_REDEEM` 筛选 Tab（`TransactionList.tsx`）。
- 预约模块
  - 预约日历页（`Appointments.tsx`）新增“返回上一页”按钮。
  - 新建/编辑预约：
    - 会员支持模糊搜索（姓名/手机号），选中后自动填充姓名与手机号。
    - “服务项目”输入支持下拉选择“服务管理”中已有项目（`serviceApi.getServices`），选中即填充项目名与时长。
  - 详情/编辑展示：会员折扣支持“无折扣”文案。

### 其他
- 文案调整：将“管理会员信息、等级和积分”改为“管理会员信息、折扣与余额”。

---

如需回滚到旧的“会员等级/积分”展示，可基于本次改动将 UI 与类型还原；当前代码已在 API 层做好兼容处理。

