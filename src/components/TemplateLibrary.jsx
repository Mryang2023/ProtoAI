import { useState, useMemo, useEffect } from 'react';
import {
  X, Search, ShoppingBag, BarChart3, Users, Settings, MessageCircle,
  User, MessageSquare, Rocket, Building2, CreditCard, BookOpen,
  AlertTriangle, Layout, Package, List, ShoppingCart, Newspaper,
  ClipboardCheck, LogIn, GraduationCap, Heart, UtensilsCrossed,
  TrendingUp, Briefcase, FileText, Image, ShieldCheck, Layers,
  Stethoscope, Wallet, Plane, Home, Monitor, Smartphone,
} from 'lucide-react';

const ICON_MAP = {
  ShoppingBag, BarChart3, Users, Settings, MessageCircle,
  User, MessageSquare, Rocket, Building2, CreditCard, BookOpen,
  AlertTriangle, Layout, Package, List, ShoppingCart, Newspaper,
  ClipboardCheck, LogIn, GraduationCap, Heart, UtensilsCrossed,
  TrendingUp, Briefcase, FileText, Image, ShieldCheck, Layers,
  Stethoscope, Wallet, Plane, Home,
};

// ── Template Data ──────────────────────────────────────

const TEMPLATES = [
  // ── 电商/商城 ──
  {
    id: 'ecommerce-home', category: '电商/商城', type: 'page',
    name: '电商首页', icon: 'ShoppingBag',
    description: '商品展示、分类导航、搜索、推荐商品轮播',
    tags: ['首页', '导航', '推荐'],
    prompt: '生成一个电商首页，包含：顶部导航栏（logo、搜索框、购物车图标、用户头像）、轮播Banner广告区、商品分类快捷入口（图标+文字，横向滚动）、限时秒杀区、推荐商品卡片网格（商品图片、名称、价格、评分星级、已售数量）、底部导航和版权信息。',
  },
  {
    id: 'ecommerce-product-list', category: '电商/商城', type: 'page',
    name: '商品列表', icon: 'List',
    description: '筛选侧栏、商品网格卡片、排序、分页',
    tags: ['列表', '筛选', '分页'],
    prompt: '生成一个商品列表页，包含：左侧筛选栏（分类树、价格区间滑块、品牌多选、评分筛选、颜色选择）、右侧商品网格（商品卡片含图片、名称、价格、评分、已售数量）、顶部分类面包屑和排序选项（综合/销量/价格）、底部分页器。',
  },
  {
    id: 'ecommerce-product-detail', category: '电商/商城', type: 'page',
    name: '商品详情', icon: 'Package',
    description: '图片画廊、价格、规格选择、评价',
    tags: ['详情', '规格', '评价'],
    prompt: '生成一个商品详情页，包含：左侧商品图片画廊（主图+缩略图列表、放大效果）、右侧商品信息（商品名称、促销标签、价格、划线价、规格选择按钮组、数量加减控件、加入购物车和立即购买按钮）、商品描述和参数表格Tab切换、底部商品评价区域（评分、文字评价、图片评价）。',
  },
  {
    id: 'ecommerce-cart', category: '电商/商城', type: 'page',
    name: '购物车', icon: 'ShoppingCart',
    description: '商品列表、数量控制、价格汇总',
    tags: ['购物车', '结算'],
    prompt: '生成一个购物车页面，包含：购物车商品列表（商品图片、名称、规格、单价、数量加减控件、删除按钮、全选复选框）、右侧或底部价格汇总区（商品总价、优惠券输入框、运费、合计金额）、去结算按钮、推荐商品横向滚动区。',
  },
  {
    id: 'ecommerce-order', category: '电商/商城', type: 'page',
    name: '订单确认', icon: 'ClipboardCheck',
    description: '订单摘要、收货地址、物流跟踪',
    tags: ['订单', '物流'],
    prompt: '生成一个订单确认页，包含：订单成功提示（勾选动画图标、订单号）、收货地址信息卡片、订单商品清单、价格明细、物流状态跟踪时间线（已下单→已发货→运输中→已签收）、操作按钮（查看订单/继续购物）。',
  },
  {
    id: 'ecommerce-system', category: '电商/商城', type: 'project',
    name: '完整电商系统', icon: 'ShoppingBag',
    description: '包含首页、商品列表、详情、购物车、订单、用户中心等完整页面',
    tags: ['完整项目', '多页面', '电商'],
    pageCount: 8,
    prompt: '设计一个完整的电商系统原型，包含以下页面：\n1. 首页（Banner轮播、商品分类、推荐商品、搜索）\n2. 商品列表页（筛选、排序、分页）\n3. 商品详情页（图片画廊、规格选择、评价）\n4. 购物车页面（商品管理、价格汇总）\n5. 订单确认页（地址、支付、物流）\n6. 用户中心（个人信息、订单列表、收货地址管理）\n7. 登录/注册页\n8. 搜索结果页\n\n所有页面需要统一的导航栏和视觉风格。',
  },

  // ── SaaS/后台 ──
  {
    id: 'saas-dashboard', category: 'SaaS/后台', type: 'page',
    name: '数据仪表盘', icon: 'BarChart3',
    description: '统计卡片、图表区域、近期动态、侧边导航',
    tags: ['仪表盘', '图表', '后台'],
    prompt: '生成一个数据仪表盘页面，包含：左侧固定侧边导航栏（logo、菜单项含图标和badge、底部用户头像和设置）、顶部栏（搜索、通知铃铛带红点、用户头像和下拉）、主体区域包含统计卡片行（总用户数、收入、转化率、活跃用户，含趋势箭头和百分比）、折线图区域（收入趋势）、柱状图区域（用户增长）、近期活动列表和待办事项卡片。',
  },
  {
    id: 'saas-user-management', category: 'SaaS/后台', type: 'page',
    name: '用户管理', icon: 'Users',
    description: '用户表格、搜索筛选、角色标签、操作',
    tags: ['表格', 'CRUD', '管理'],
    prompt: '生成一个用户管理页面，包含：顶部标题和添加用户按钮（主色调）、搜索框和筛选器（角色下拉、状态筛选、时间范围）、用户数据表格（头像、姓名、邮箱、角色标签彩色、状态指示灯绿/灰、注册时间、操作按钮含编辑和删除）、底部批量操作栏和分页器。',
  },
  {
    id: 'saas-settings', category: 'SaaS/后台', type: 'page',
    name: '设置页面', icon: 'Settings',
    description: '标签分区、表单字段、开关切换、保存',
    tags: ['表单', '设置'],
    prompt: '生成一个设置页面，包含：左侧设置分类导航（个人资料、安全设置、通知偏好、API密钥、团队成员、账单）、右侧设置表单区域（标签页切换、表单输入框、文本域、下拉选择、开关切换控件、头像上传区域）、底部保存和取消按钮。',
  },
  {
    id: 'saas-login', category: 'SaaS/后台', type: 'page',
    name: '登录页', icon: 'LogIn',
    description: '居中表单、Logo、社交登录、记住我',
    tags: ['登录', '表单'],
    prompt: '生成一个登录页面，包含：居中卡片布局（毛玻璃背景效果）、顶部Logo和应用名称、邮箱输入框（带图标）、密码输入框（含显示/隐藏切换）、记住我复选框和忘记密码链接、登录按钮（渐变色）、分割线、社交登录按钮（Google、GitHub、微信图标）、底部注册链接。',
  },
  {
    id: 'saas-admin-system', category: 'SaaS/后台', type: 'project',
    name: '管理后台系统', icon: 'Layers',
    description: '仪表盘、用户管理、内容管理、系统设置等完整后台',
    tags: ['完整项目', '后台', '管理'],
    pageCount: 7,
    prompt: '设计一个完整的SaaS管理后台原型，包含以下页面：\n1. 数据仪表盘（统计卡片、图表、近期活动）\n2. 用户管理（表格、搜索、角色管理）\n3. 内容管理（文章列表、分类、发布状态）\n4. 系统设置（个人资料、安全、通知、API）\n5. 数据分析（多维度图表、报表导出）\n6. 登录页\n7. 权限管理（角色列表、权限树）\n\n所有页面使用统一的侧边导航+顶部栏布局。',
  },

  // ── 社交/内容 ──
  {
    id: 'social-feed', category: '社交/内容', type: 'page',
    name: '信息流', icon: 'MessageCircle',
    description: '帖子卡片、图文、点赞评论、推荐',
    tags: ['信息流', '社交'],
    prompt: '生成一个信息流页面，包含：顶部导航栏（logo、搜索、消息通知带红点、用户头像）、中间信息流（帖子卡片含用户头像、用户名、发布时间、文字内容、图片九宫格、点赞/评论/分享按钮栏）、右侧边栏（推荐关注用户列表、热门话题标签云、广告位）。',
  },
  {
    id: 'social-profile', category: '社交/内容', type: 'page',
    name: '个人主页', icon: 'User',
    description: '封面照片、头像、简介、内容标签页',
    tags: ['个人页', '社交'],
    prompt: '生成一个个人主页，包含：顶部封面图片（渐变色遮罩）、用户头像（半覆盖封面）、用户名和简介、统计数字行（帖子/粉丝/关注）、关注/消息按钮、标签页切换（帖子/回复/媒体/喜欢）、帖子网格展示（图片+文字预览）。',
  },
  {
    id: 'social-chat', category: '社交/内容', type: 'page',
    name: '聊天页面', icon: 'MessageSquare',
    description: '会话列表、消息气泡、输入框、表情',
    tags: ['聊天', '即时通讯'],
    prompt: '生成一个聊天页面，包含：左侧会话列表（头像、用户名、最近消息摘要、时间戳、未读数气泡、置顶标记、在线状态绿点）、右侧聊天窗口（顶部对方信息、消息区域含左右气泡、时间分割线、图片消息、底部输入框+表情按钮+文件附件+发送按钮）。',
  },
  {
    id: 'social-blog', category: '社交/内容', type: 'project',
    name: '博客平台', icon: 'Newspaper',
    description: '首页、文章详情、分类、作者页、关于',
    tags: ['完整项目', '博客', '内容'],
    pageCount: 6,
    prompt: '设计一个完整的博客平台原型，包含以下页面：\n1. 博客首页（精选文章Banner、最新文章列表、分类导航）\n2. 文章详情页（标题、作者、发布时间、正文、标签、评论区）\n3. 分类归档页（按分类筛选文章列表）\n4. 作者个人页（头像、简介、文章列表）\n5. 搜索页（搜索结果列表）\n6. 关于页面（站点介绍、联系方式）\n\n统一导航栏和阅读体验风格。',
  },

  // ── 教育/培训 ──
  {
    id: 'edu-home', category: '教育/培训', type: 'page',
    name: '在线教育首页', icon: 'GraduationCap',
    description: '课程推荐、讲师展示、学习路径',
    tags: ['教育', '首页', '课程'],
    prompt: '生成一个在线教育平台首页，包含：顶部导航栏（logo、课程分类、搜索、登录/注册）、Hero区域（大标题+副标题+CTA+学习插图）、热门课程推荐卡片（封面图、标题、讲师、评分、价格、学习人数）、名师推荐区域（头像、姓名、专业领域、课程数）、学习路径展示（流程图式路径选择）、底部学员评价轮播。',
  },
  {
    id: 'edu-course-detail', category: '教育/培训', type: 'page',
    name: '课程详情', icon: 'BookOpen',
    description: '课程介绍、大纲、讲师、评价、报名',
    tags: ['课程', '详情', '教育'],
    prompt: '生成一个课程详情页，包含：课程封面大图和视频预览、课程标题和副标题、讲师信息（头像、姓名、简介、评分）、课程统计（学习人数、课时数、评分星级）、价格信息和报名/试听按钮、课程介绍富文本、课程大纲（可折叠的章节+课时列表）、学员评价区域、相关课程推荐。',
  },
  {
    id: 'edu-learning', category: '教育/培训', type: 'page',
    name: '学习中心', icon: 'BookOpen',
    description: '我的课程、学习进度、笔记、证书',
    tags: ['学习', '进度', '教育'],
    prompt: '生成一个学习中心页面，包含：顶部学习统计（今日学习时长、连续学习天数、已完成课程数）、我的课程网格（封面、标题、进度条百分比、继续学习按钮）、学习日历热力图、收藏的课程和笔记列表、学习成就徽章展示区。',
  },
  {
    id: 'edu-system', category: '教育/培训', type: 'project',
    name: '在线教育平台', icon: 'GraduationCap',
    description: '首页、课程、学习中心、个人中心等完整教育平台',
    tags: ['完整项目', '教育', '多页面'],
    pageCount: 7,
    prompt: '设计一个完整的在线教育平台原型，包含以下页面：\n1. 平台首页（课程推荐、名师展示、学习路径）\n2. 课程列表页（分类筛选、搜索、排序）\n3. 课程详情页（介绍、大纲、评价、报名）\n4. 视频学习页（视频播放器、课程目录、笔记区）\n5. 学习中心（我的课程、进度、证书）\n6. 个人中心（个人信息、订单、收藏）\n7. 登录/注册页\n\n统一的教育主题风格和导航体系。',
  },

  // ── 企业/官网 ──
  {
    id: 'corp-landing', category: '企业/官网', type: 'page',
    name: '产品落地页', icon: 'Rocket',
    description: 'Hero、功能网格、评价、定价、CTA',
    tags: ['落地页', '营销', '产品'],
    prompt: '生成一个产品落地页，包含：顶部导航栏（logo、功能链接、定价、登录/注册）、Hero区域（大标题+副标题+CTA按钮+产品截图/插图+浮动装饰元素）、客户logo墙、功能特点网格（图标+标题+描述，3列布局）、用户评价轮播（头像+姓名+评价+评分）、定价卡片区域（3档定价+功能对比）、FAQ折叠问答、底部CTA横幅和页脚。',
  },
  {
    id: 'corp-about', category: '企业/官网', type: 'page',
    name: '关于我们', icon: 'Building2',
    description: '公司故事、团队、价值观、联系方式',
    tags: ['企业', '关于'],
    prompt: '生成一个关于我们页面，包含：顶部Banner（公司slogan+背景图）、公司故事区域（图文混排+时间线发展历程）、核心价值观展示（图标+标题+描述卡片）、团队成员网格（圆形头像+姓名+职位+社交链接）、数据统计展示（成立年数/客户数/项目数/员工数）、合作伙伴logo墙、联系方式和地图占位。',
  },
  {
    id: 'corp-pricing', category: '企业/官网', type: 'page',
    name: '定价页', icon: 'CreditCard',
    description: '定价卡片、功能对比表、FAQ',
    tags: ['定价', 'SaaS'],
    prompt: '生成一个定价页面，包含：顶部标题和月付/年付切换开关（年付显示折扣）、三列定价卡片（免费版/专业版/企业版，每列含价格、功能列表打勾/打叉、CTA按钮，推荐版高亮放大）、功能对比表格（完整功能矩阵）、FAQ折叠问答区域（5-6个常见问题）、底部CTA横幅。',
  },
  {
    id: 'corp-404', category: '企业/官网', type: 'page',
    name: '404页面', icon: 'AlertTriangle',
    description: '创意错误插图、搜索框、返回',
    tags: ['错误页', '404'],
    prompt: '生成一个404错误页面，包含：居中布局、大号404数字（渐变色或描边效果）或创意SVG插图、"页面未找到"标题、友好描述文字、搜索输入框（带搜索图标）、返回首页按钮和热门页面快捷链接（2-3个链接）。',
  },
  {
    id: 'corp-website', category: '企业/官网', type: 'project',
    name: '企业官网', icon: 'Building2',
    description: '首页、产品、解决方案、定价、关于等完整官网',
    tags: ['完整项目', '官网', '企业'],
    pageCount: 6,
    prompt: '设计一个完整的企业官网原型，包含以下页面：\n1. 官网首页（Hero、产品亮点、客户评价、数据统计、CTA）\n2. 产品介绍页（功能详情、截图演示、使用场景）\n3. 解决方案页（按行业分类的解决方案）\n4. 定价页（套餐对比、功能矩阵）\n5. 关于我们（公司故事、团队、联系方式）\n6. 登录/注册页\n\n统一的企业品牌风格和顶部导航。',
  },

  // ── 金融/理财 ──
  {
    id: 'finance-home', category: '金融/理财', type: 'page',
    name: '金融首页', icon: 'TrendingUp',
    description: '资产概览、行情数据、产品推荐',
    tags: ['金融', '首页', '资产'],
    prompt: '生成一个金融理财平台首页，包含：顶部导航栏（logo、产品导航、消息、用户头像）、资产概览卡片（总资产、今日收益、收益率、趋势小图表）、快捷功能区（充值、提现、转账图标按钮）、热门理财产品推荐（名称、预期收益率、期限、起投金额、购买按钮）、实时行情数据滚动条、风险提示和合作机构logo墙。',
  },
  {
    id: 'finance-wallet', category: '金融/理财', type: 'page',
    name: '钱包/账户', icon: 'Wallet',
    description: '余额、交易记录、收支分析',
    tags: ['钱包', '交易', '金融'],
    prompt: '生成一个钱包账户页面，包含：账户余额卡片（大额数字+收益趋势小图+冻结金额）、收支统计图表（月度收支柱状图、分类占比环形图）、交易记录列表（交易类型图标、交易描述、金额红/绿、时间、状态标签）、快捷操作按钮（充值/提现/转账）、筛选器（时间范围、交易类型）。',
  },

  // ── 餐饮/美食 ──
  {
    id: 'food-menu', category: '餐饮/美食', type: 'page',
    name: '餐厅点餐', icon: 'UtensilsCrossed',
    description: '菜品分类、菜品卡片、购物车、下单',
    tags: ['餐饮', '点餐', '菜单'],
    prompt: '生成一个餐厅在线点餐页面，包含：顶部餐厅信息（logo、名称、评分、配送时间）、左侧菜品分类导航（可滚动列表）、右侧菜品列表（每个菜品含图片、名称、月售数量、价格、加号添加按钮）、底部悬浮购物车栏（已选数量+合计金额+去结算按钮）、菜品详情弹窗（大图、描述、规格选择、数量选择、加入购物车）。',
  },
  {
    id: 'food-home', category: '餐饮/美食', type: 'page',
    name: '美食平台首页', icon: 'UtensilsCrossed',
    description: '餐厅推荐、分类、搜索、评价',
    tags: ['美食', '首页', '推荐'],
    prompt: '生成一个美食外卖平台首页，包含：顶部搜索栏（定位+搜索框）、分类快捷入口（横向滚动图标：汉堡/中餐/烧烤/奶茶/甜点）、Banner轮播广告、附近餐厅列表（餐厅卡片含封面图、名称、评分、月售、起送价、配送时间、距离）、热门菜品推荐网格、底部导航栏。',
  },

  // ── 医疗/健康 ──
  {
    id: 'health-home', category: '医疗/健康', type: 'page',
    name: '健康平台首页', icon: 'Stethoscope',
    description: '健康数据、预约挂号、科室导航',
    tags: ['医疗', '健康', '首页'],
    prompt: '生成一个健康管理平台首页，包含：顶部导航栏（logo、科室分类、搜索、个人中心）、Hero区域（健康slogan+快速挂号入口）、今日健康数据卡片（步数、心率、睡眠时长、消耗卡路里）、科室导航网格（图标+科室名称）、名医推荐列表（头像、姓名、科室、职称、评分、预约按钮）、健康资讯列表、底部快捷导航。',
  },

  // ── 旅游/出行 ──
  {
    id: 'travel-home', category: '旅游/出行', type: 'page',
    name: '旅游平台首页', icon: 'Plane',
    description: '目的地推荐、搜索、热门线路',
    tags: ['旅游', '首页', '推荐'],
    prompt: '生成一个旅游平台首页，包含：顶部导航栏（logo、目的地/酒店/机票Tab、搜索、登录）、Hero区域（大图背景+搜索表单含出发地/目的地/日期/人数）、热门目的地推荐（图片卡片+名称+价格+评分）、精选旅游线路（封面图+行程天数+价格+亮点标签）、用户游记精选（图文卡片）、底部服务承诺和合作伙伴。',
  },

  // ── 房产/家居 ──
  {
    id: 'realestate-home', category: '房产/家居', type: 'page',
    name: '房产平台首页', icon: 'Home',
    description: '房源搜索、地图找房、推荐楼盘',
    tags: ['房产', '首页', '搜索'],
    prompt: '生成一个房产平台首页，包含：顶部导航栏（logo、新房/二手房/租房Tab、搜索、登录）、搜索区域（城市选择+关键词+价格区间+户型筛选）、推荐楼盘卡片网格（效果图、楼盘名、均价、户型、地址、标签如"地铁旁"）、地图找房入口、二手房精选列表、房产资讯、底部导航。',
  },
];

// ── Category Config ────────────────────────────────────

const CATEGORIES = [
  { key: 'all', label: '全部', icon: Layout },
  { key: '电商/商城', label: '电商/商城', icon: ShoppingBag },
  { key: 'SaaS/后台', label: 'SaaS/后台', icon: BarChart3 },
  { key: '社交/内容', label: '社交/内容', icon: MessageCircle },
  { key: '教育/培训', label: '教育/培训', icon: GraduationCap },
  { key: '企业/官网', label: '企业/官网', icon: Building2 },
  { key: '金融/理财', label: '金融/理财', icon: TrendingUp },
  { key: '餐饮/美食', label: '餐饮/美食', icon: UtensilsCrossed },
  { key: '医疗/健康', label: '医疗/健康', icon: Stethoscope },
  { key: '旅游/出行', label: '旅游/出行', icon: Plane },
  { key: '房产/家居', label: '房产/家居', icon: Home },
];

// ── Component ──────────────────────────────────────────

export default function TemplateLibrary({ onSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredId, setHoveredId] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'page' | 'project'

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSelect = (template) => {
    onSelect(template);
    onClose();
  };

  const filteredTemplates = useMemo(() => {
    let result = TEMPLATES;
    if (activeCategory !== 'all') {
      result = result.filter(t => t.category === activeCategory);
    }
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, typeFilter, searchQuery]);

  const projectCount = TEMPLATES.filter(t => t.type === 'project').length;
  const pageCount = TEMPLATES.filter(t => t.type === 'page').length;

  return (
    <div
      className="tl-overlay"
      onClick={onClose}
    >
      <div
        className="tl-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="template-library-title"
      >
        {/* Header */}
        <div className="tl-header">
          <div className="tl-header-text">
            <h2 id="template-library-title" className="tl-title">模板库</h2>
            <p className="tl-subtitle">
              {TEMPLATES.length} 个模板 · {projectCount} 个完整项目 · {pageCount} 个单页面
            </p>
          </div>
          <button className="tl-close" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="tl-search-wrap">
          <Search size={15} className="tl-search-icon" />
          <input
            type="text"
            className="tl-search-input"
            placeholder="搜索模板名称、描述、标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button className="tl-search-clear" onClick={() => setSearchQuery('')}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Type filter (page vs project) */}
        <div className="tl-type-filter">
          <button
            className={`tl-type-btn${typeFilter === 'all' ? ' active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            全部 <span className="tl-type-count">{TEMPLATES.length}</span>
          </button>
          <button
            className={`tl-type-btn${typeFilter === 'project' ? ' active' : ''}`}
            onClick={() => setTypeFilter('project')}
          >
            <Layers size={12} /> 完整项目 <span className="tl-type-count">{projectCount}</span>
          </button>
          <button
            className={`tl-type-btn${typeFilter === 'page' ? ' active' : ''}`}
            onClick={() => setTypeFilter('page')}
          >
            <FileText size={12} /> 单页面 <span className="tl-type-count">{pageCount}</span>
          </button>
        </div>

        {/* Category tabs */}
        <div className="tl-categories">
          {CATEGORIES.map(({ key, label, icon: Icon }) => {
            const count = key === 'all'
              ? TEMPLATES.length
              : TEMPLATES.filter(t => t.category === key).length;
            if (count === 0 && key !== 'all') return null;
            return (
              <button
                key={key}
                className={`tl-cat-tab${activeCategory === key ? ' active' : ''}`}
                onClick={() => setActiveCategory(key)}
              >
                <Icon size={13} />
                <span>{label}</span>
                {count > 0 && <span className="tl-cat-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Template grid */}
        <div className="tl-body">
          {filteredTemplates.length === 0 ? (
            <div className="tl-empty">
              <Search size={28} style={{ opacity: 0.3 }} />
              <p>未找到匹配的模板</p>
              <span>试试其他关键词或分类</span>
            </div>
          ) : (
            <div className="tl-grid">
              {filteredTemplates.map((template) => {
                const Icon = ICON_MAP[template.icon] || Layout;
                const isHovered = hoveredId === template.id;
                const isProject = template.type === 'project';

                return (
                  <div
                    key={template.id}
                    className={`tl-card${isHovered ? ' hovered' : ''}${isProject ? ' project' : ''}`}
                    onClick={() => handleSelect(template)}
                    onMouseEnter={() => setHoveredId(template.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(template);
                      }
                    }}
                  >
                    {/* Type badge */}
                    {isProject && (
                      <div className="tl-badge-project">
                        <Layers size={10} />
                        {template.pageCount || '?'} 页
                      </div>
                    )}

                    {/* Icon + Title */}
                    <div className="tl-card-top">
                      <div className="tl-card-icon">
                        <Icon size={18} />
                      </div>
                      <div className="tl-card-info">
                        <span className="tl-card-name">{template.name}</span>
                        <span className="tl-card-category">{template.category}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="tl-card-desc">{template.description}</p>

                    {/* Tags */}
                    {template.tags?.length > 0 && (
                      <div className="tl-card-tags">
                        {template.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="tl-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="tl-footer">
          <Layout size={12} />
          <span>选择模板后，AI 将根据模板描述自动生成原型</span>
        </div>
      </div>
    </div>
  );
}
