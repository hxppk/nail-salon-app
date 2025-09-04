# 美甲店会员管理系统

一个完整的美甲店会员管理系统，包含会员管理、预约管理、服务管理、积分系统等功能。

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **状态管理**: React Query + Context API
- **UI样式**: Tailwind CSS
- **路由**: React Router v6
- **表单**: React Hook Form + Zod
- **图标**: Lucide React

### 后端
- **运行时**: Node.js
- **框架**: Express.js + TypeScript
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: JWT + bcrypt
- **验证**: Zod

### 部署
- **容器化**: Docker + Docker Compose
- **开发工具**: ESLint, Prettier

## 项目结构

```
nail-salon-app/
├── client/                 # 前端应用
│   ├── public/            
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── services/      # API服务
│   │   ├── types/         # TypeScript类型定义
│   │   ├── utils/         # 工具函数
│   │   ├── store/         # 状态管理
│   │   └── assets/        # 静态资源
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── server/                 # 后端API
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── middlewares/    # 中间件
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由定义
│   │   ├── services/      # 业务逻辑
│   │   ├── types/         # TypeScript类型
│   │   ├── utils/         # 工具函数
│   │   └── config/        # 配置文件
│   ├── prisma/
│   │   └── schema.prisma  # 数据库模式
│   ├── package.json
│   └── tsconfig.json
│
├── database/               # 数据库相关
│   ├── migrations/        # 数据库迁移
│   └── seeds/            # 种子数据
│
├── docs/                  # 文档
├── docker-compose.yml     # Docker编排
├── .env.example          # 环境变量示例
└── README.md
```

## 主要功能

### 会员管理
- 会员信息管理（姓名、电话、生日等）
- 会员等级系统（铜牌、银牌、金牌、白金）
- 积分系统
- 消费记录

### 预约管理
- 预约创建和编辑
- 预约状态管理
- 员工排班
- 时间冲突检测

### 服务管理
- 服务项目管理
- 价格管理
- 服务分类

### 员工管理
- 员工信息管理
- 专业技能记录
- 工作状态管理

### 产品管理
- 产品库存管理
- 产品销售记录

### 交易管理
- 消费记录
- 积分记录
- 收入统计

## 数据库设计

### 主要表结构

- `users` - 用户表（管理员、员工、客户）
- `members` - 会员表
- `staff` - 员工表
- `services` - 服务项目表
- `appointments` - 预约表
- `appointment_services` - 预约服务关联表
- `transactions` - 交易记录表
- `products` - 产品表

### 关键关系

- 一个预约可以包含多个服务项目
- 会员可以有多个预约和交易记录
- 员工可以处理多个预约
- 交易记录关联会员和预约

## 开发指南

### 本地开发环境设置

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd nail-salon-app
   ```

2. **环境配置**
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```

3. **启动数据库**
   ```bash
   docker-compose up postgres -d
   ```

4. **安装依赖并启动后端**
   ```bash
   cd server
   npm install
   npm run db:generate
   npm run db:migrate
   npm run dev:5225
   ```
   - 默认运行端口：后端 API `http://localhost:5225`
   - 必要环境变量（可在 `server/.env` 设置）：
     - `PORT=5225`
     - `CORS_ORIGIN=http://localhost:3233`

5. **安装依赖并启动前端**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   - 默认运行端口：前端 `http://localhost:3233`
   - 开发代理：`/api` 代理到 `http://localhost:5225`
   - 建议的前端环境变量（开发）位于 `client/.env`：
     - `VITE_API_BASE_URL=/api`（使用 Vite 代理到后端）
     - 如需直连后端：`VITE_API_BASE_URL=http://localhost:5225/api`

### 使用Docker

```bash
# 启动整个系统
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止系统
docker-compose down
```

运行端口（Docker）：
- 前端：`http://localhost:3233`
- 后端 API：`http://localhost:5225`

如需自定义端口：
- 前端：修改 `client/vite.config.ts` 中 `server.port`
- 后端：设置环境变量 `PORT`（默认 5225）并相应更新 `CORS_ORIGIN`

## 端口与环境变量约定

- 前端开发端口：`3233`
- 后端开发端口：`5225`
- Vite 代理：将前端的相对路径 `/api` 转发到 `http://localhost:5225`
- 推荐 `.env` 配置：
  - `client/.env`：`VITE_API_BASE_URL=/api`
  - `server/.env`：`PORT=5225`、`CORS_ORIGIN=http://localhost:3233`

## 常见问题（Troubleshooting）

- 命中 AirPlay（端口 5000）导致 403：
  - Network 中看到 `Server: AirTunes` 且 URL 指向 `http://localhost:5000`，请将 `client/.env` 改为 `VITE_API_BASE_URL=/api` 或 `http://localhost:5225/api` 并重启前端。
- 浏览器跨域（CORS）报错：
  - 开发环境优先使用 Vite 代理（`/api` 相对路径），即可避免 CORS。
  - 如需直连后端，请在 `server/.env` 设置 `CORS_ORIGIN=http://localhost:3233` 并重启后端。
-
  快速联通性验证：在浏览器控制台执行
  `fetch('/api').then(r=>r.json()).then(console.log)` 应返回 API 信息 JSON。

## API接口

### 认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出

### 会员管理
- `GET /api/members` - 获取会员列表
- `POST /api/members` - 创建会员
- `GET /api/members/:id` - 获取会员详情
- `PUT /api/members/:id` - 更新会员信息
- `DELETE /api/members/:id` - 删除会员

### 预约管理
- `GET /api/appointments` - 获取预约列表
- `POST /api/appointments` - 创建预约
- `GET /api/appointments/:id` - 获取预约详情
- `PUT /api/appointments/:id` - 更新预约
- `DELETE /api/appointments/:id` - 取消预约

### 其他接口
- 服务管理：`/api/services`
- 员工管理：`/api/staff`
- 产品管理：`/api/products`
- 交易记录：`/api/transactions`

## 部署

### 生产环境部署

1. 配置生产环境变量
2. 构建Docker镜像
3. 使用Docker Compose部署
4. 配置反向代理（Nginx）
5. 设置SSL证书

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License
