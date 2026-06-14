/**
 * Pre-generated template pages — ready-to-view HTML prototypes.
 * Each entry maps a template ID to an array of { name, html } page objects.
 * Templates not listed here will fall back to AI generation.
 */

// ── Shared CSS (embedded in each page) ─────────────
const RESET = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB',sans-serif;color:#1a1a1a;background:#f5f5f5;-webkit-font-smoothing:antialiased;line-height:1.5}img{max-width:100%;display:block}a{text-decoration:none;color:inherit}`;

function page(css, body) {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${RESET}${css}</style></head><body>${body}</body></html>`;
}

// ── 电商首页 ─────────────────────────────────────
const ecommerceHome = page(`
.ec-nav{display:flex;align-items:center;justify-content:space-between;padding:12px 32px;background:#fff;border-bottom:1px solid #f0f0f0;position:sticky;top:0;z-index:10}
.ec-logo{font-size:18px;font-weight:800;color:#6366f1;display:flex;align-items:center;gap:8px}
.ec-logo-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#818cf8)}
.ec-search{display:flex;align-items:center;gap:8px;padding:8px 16px;border:1px solid #e5e5e5;border-radius:20px;background:#f9f9f9;width:320px}
.ec-search input{border:none;background:none;outline:none;font-size:13px;color:#999;flex:1}
.ec-nav-right{display:flex;align-items:center;gap:16px}
.ec-nav-item{font-size:13px;color:#666;cursor:pointer}
.ec-badge{background:#ef4444;color:#fff;font-size:10px;padding:1px 5px;border-radius:10px;margin-left:2px}
.ec-banner{margin:16px 32px;border-radius:12px;height:200px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;align-items:center;padding:0 48px;color:#fff}
.ec-banner-text h1{font-size:28px;margin-bottom:8px}
.ec-banner-text p{font-size:14px;opacity:0.85;margin-bottom:16px}
.ec-banner-btn{display:inline-block;padding:10px 24px;background:#fff;color:#6366f1;border-radius:8px;font-weight:600;font-size:13px}
.ec-section{padding:24px 32px}
.ec-section-title{font-size:18px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between}
.ec-section-title span{font-size:12px;color:#999;font-weight:400}
.ec-cats{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px}
.ec-cat{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:64px}
.ec-cat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px}
.ec-cat span{font-size:11px;color:#666}
.ec-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.ec-card{background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f0f0f0;transition:box-shadow .2s}
.ec-card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.08)}
.ec-card-img{height:160px;position:relative;overflow:hidden}
.ec-card-body{padding:12px}
.ec-card-name{font-size:13px;font-weight:500;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ec-card-price{font-size:18px;font-weight:700;color:#ef4444}
.ec-card-price small{font-size:11px;color:#bbb;text-decoration:line-through;font-weight:400;margin-left:6px}
.ec-card-meta{font-size:11px;color:#999;margin-top:4px}
.ec-flash{display:flex;gap:12px;overflow-x:auto}
.ec-flash-item{min-width:120px;text-align:center;background:#fff;border-radius:10px;padding:12px;border:1px solid #f0f0f0}
.ec-flash-item .img{height:80px;background:#f5f5f5;border-radius:8px;margin-bottom:8px}
.ec-flash-item .price{font-size:16px;font-weight:700;color:#ef4444}
.ec-flash-item .old{font-size:11px;color:#bbb;text-decoration:line-through}
`, `
<nav class="ec-nav">
  <div class="ec-logo"><div class="ec-logo-icon"></div>优品商城</div>
  <div class="ec-search"><span>🔍</span><input placeholder="搜索商品、品牌、分类..."></div>
  <div class="ec-nav-right">
    <span class="ec-nav-item">消息<span class="ec-badge">3</span></span>
    <span class="ec-nav-item">🛒 购物车</span>
    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#c7d2fe,#a5b4fc)"></div>
  </div>
</nav>
<div class="ec-banner">
  <div class="ec-banner-text">
    <h1>夏日焕新季</h1>
    <p>精选好物低至3折，满299减50</p>
    <a class="ec-banner-btn">立即抢购 →</a>
  </div>
</div>
<div class="ec-section">
  <div class="ec-section-title">商品分类 <span>查看全部 →</span></div>
  <div class="ec-cats">
    ${['👗 女装','👔 男装','📱 数码','💄 美妆','🍎 食品','🏠 家居','⚽ 运动','👶 母婴'].map(c => {
      const colors = ['#fef3c7','#dbeafe','#ede9fe','#fce7f3','#dcfce7','#f0f0ff','#fee2e2','#e0f2fe'];
      const i = ['👗 女装','👔 男装','📱 数码','💄 美妆','🍎 食品','🏠 家居','⚽ 运动','👶 母婴'].indexOf(c);
      return `<div class="ec-cat"><div class="ec-cat-icon" style="background:${colors[i]}">${c.split(' ')[0]}</div><span>${c.split(' ')[1]}</span></div>`;
    }).join('')}
  </div>
</div>
<div class="ec-section">
  <div class="ec-section-title">限时秒杀 <span style="color:#ef4444">02:34:56 后结束</span></div>
  <div class="ec-flash">
    ${[1,2,3,4,5].map(i => `<div class="ec-flash-item"><div class="img"></div><div class="price">¥${[49,99,149,199,29][i-1]}</div><div class="old">¥${[199,399,599,799,99][i-1]}</div></div>`).join('')}
  </div>
</div>
<div class="ec-section">
  <div class="ec-section-title">为你推荐 <span>根据你的浏览记录</span></div>
  <div class="ec-grid">
    ${['简约时尚手提包 2024新款真皮女包','无线蓝牙耳机 降噪运动跑步专用','轻薄羽绒服女 中长款白鸭绒','智能手表 多功能心率血氧监测','北欧风格落地灯 客厅卧室装饰','机械键盘 cherry轴 RGB背光','进口牛排套餐 澳洲安格斯西冷','儿童益智积木 拼装恐龙玩具'].map((n,i) => {
      const prices = [259,199,599,349,189,459,168,89];
      const olds = [699,499,1299,699,399,899,399,199];
      const sales = [2341,892,1567,445,234,3210,567,1890];
      const bgs = ['#fef3c7','#dbeafe','#fce7f3','#dcfce7','#ede9fe','#f0f0ff','#fee2e2','#e0f2fe'];
      return `<div class="ec-card"><div class="ec-card-img" style="background:${bgs[i%8]}"></div><div class="ec-card-body"><div class="ec-card-name">${n}</div><div class="ec-card-price">¥${prices[i]} <small>¥${olds[i]}</small></div><div class="ec-card-meta">已售${sales[i]}件</div></div></div>`;
    }).join('')}
  </div>
</div>
<div style="text-align:center;padding:32px;color:#bbb;font-size:12px;border-top:1px solid #f0f0f0;margin-top:16px">© 2024 优品商城 · 品质生活从这里开始</div>
`);

// ── SaaS 数据仪表盘 ───────────────────────────
const saasDashboard = page(`
.dash{display:flex;min-height:100vh}
.sidebar{width:220px;background:#1e1b4b;color:#fff;padding:20px 0;flex-shrink:0}
.sidebar-logo{padding:0 20px;font-size:16px;font-weight:700;margin-bottom:28px;display:flex;align-items:center;gap:8px}
.sidebar-logo-icon{width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,#818cf8,#6366f1)}
.sidebar-item{display:flex;align-items:center;gap:10px;padding:10px 20px;font-size:13px;color:rgba(255,255,255,0.6);cursor:pointer;transition:all .15s}
.sidebar-item:hover{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.9)}
.sidebar-item.active{background:rgba(99,102,241,0.2);color:#fff;font-weight:600;border-right:3px solid #818cf8}
.sidebar-item .icon{width:18px;text-align:center}
.sidebar-badge{background:#ef4444;color:#fff;font-size:9px;padding:1px 5px;border-radius:8px;margin-left:auto}
.main{flex:1;padding:24px 32px;overflow-y:auto}
.topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
.topbar h1{font-size:22px;font-weight:700;color:#1a1a1a}
.topbar-right{display:flex;align-items:center;gap:14px}
.topbar-search{padding:7px 14px;border:1px solid #e5e5e5;border-radius:8px;font-size:12px;color:#999;background:#fff}
.topbar-bell{position:relative;font-size:16px}
.topbar-dot{position:absolute;top:-2px;right:-4px;width:8px;height:8px;border-radius:50%;background:#ef4444}
.topbar-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#818cf8,#c7d2fe)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.stat{background:#fff;border-radius:12px;padding:20px;border:1px solid #f0f0f0}
.stat-label{font-size:12px;color:#888;margin-bottom:6px}
.stat-value{font-size:26px;font-weight:700;color:#1a1a1a}
.stat-trend{font-size:11px;margin-top:4px;display:flex;align-items:center;gap:4px}
.stat-trend.up{color:#22c55e}
.stat-trend.down{color:#ef4444}
.charts{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:24px}
.chart-card{background:#fff;border-radius:12px;padding:20px;border:1px solid #f0f0f0}
.chart-title{font-size:14px;font-weight:600;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}
.chart-title span{font-size:11px;color:#999;font-weight:400}
.chart-placeholder{height:180px;background:linear-gradient(180deg,rgba(99,102,241,0.08) 0%,rgba(99,102,241,0.02) 100%);border-radius:8px;position:relative;overflow:hidden}
.chart-placeholder::after{content:'';position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(180deg,transparent,rgba(99,102,241,0.06));clip-path:polygon(0 40%,10% 35%,20% 50%,30% 30%,40% 45%,50% 25%,60% 38%,70% 20%,80% 35%,90% 15%,100% 28%,100% 100%,0 100%)}
.bar-chart{display:flex;align-items:flex-end;gap:8px;height:180px;padding:0 8px}
.bar{flex:1;border-radius:4px 4px 0 0;transition:height .3s}
.activity{background:#fff;border-radius:12px;padding:20px;border:1px solid #f0f0f0}
.activity-item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f5f5f5}
.activity-item:last-child{border:none}
.activity-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.activity-text{flex:1;font-size:12px;color:#555}
.activity-time{font-size:11px;color:#bbb;flex-shrink:0}
`, `
<div class="dash">
  <aside class="sidebar">
    <div class="sidebar-logo"><div class="sidebar-logo-icon"></div>DataFlow</div>
    <div class="sidebar-item active"><span class="icon">📊</span>数据仪表盘</div>
    <div class="sidebar-item"><span class="icon">👥</span>用户管理<span class="sidebar-badge">12</span></div>
    <div class="sidebar-item"><span class="icon">📝</span>内容管理</div>
    <div class="sidebar-item"><span class="icon">📈</span>数据分析</div>
    <div class="sidebar-item"><span class="icon">💬</span>消息中心<span class="sidebar-badge">5</span></div>
    <div class="sidebar-item"><span class="icon">📦</span>订单管理</div>
    <div class="sidebar-item"><span class="icon">⚙️</span>系统设置</div>
  </aside>
  <main class="main">
    <div class="topbar">
      <h1>数据概览</h1>
      <div class="topbar-right">
        <div class="topbar-search">🔍 搜索功能...</div>
        <div class="topbar-bell">🔔<div class="topbar-dot"></div></div>
        <div class="topbar-avatar"></div>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><div class="stat-label">总用户数</div><div class="stat-value">24,589</div><div class="stat-trend up">↑ 12.5% 较上月</div></div>
      <div class="stat"><div class="stat-label">月活跃用户</div><div class="stat-value">8,432</div><div class="stat-trend up">↑ 8.2% 较上月</div></div>
      <div class="stat"><div class="stat-label">转化率</div><div class="stat-value">3.24%</div><div class="stat-trend down">↓ 0.3% 较上月</div></div>
      <div class="stat"><div class="stat-label">月收入</div><div class="stat-value">¥128.5万</div><div class="stat-trend up">↑ 23.1% 较上月</div></div>
    </div>
    <div class="charts">
      <div class="chart-card"><div class="chart-title">收入趋势 <span>最近30天</span></div><div class="chart-placeholder"></div></div>
      <div class="chart-card"><div class="chart-title">用户增长 <span>本周</span></div><div class="bar-chart">${['一','二','三','四','五','六','日'].map((d,i) => {const h = [65,45,80,55,90,70,85][i];const c = ['#818cf8','#a5b4fc','#6366f1','#818cf8','#4f46e5','#a5b4fc','#6366f1'][i];return `<div style="text-align:center;flex:1"><div class="bar" style="height:${h}%;background:${c}"></div><div style="font-size:10px;color:#999;margin-top:4px">${d}</div></div>`}).join('')}</div></div>
    </div>
    <div class="activity">
      <div class="chart-title">近期活动</div>
      ${[{c:'#22c55e',t:'新用户 张小明 完成注册',time:'2分钟前'},{c:'#6366f1',t:'订单 #20240315 已完成支付 ¥2,580',time:'15分钟前'},{c:'#f59e0b',t:'系统检测到3条异常数据，已自动修复',time:'1小时前'},{c:'#ef4444',t:'服务器 CPU 使用率超过80%预警阈值',time:'2小时前'},{c:'#22c55e',t:'营销活动「春季促销」已上线',time:'3小时前'}].map(a => `<div class="activity-item"><div class="activity-dot" style="background:${a.c}"></div><div class="activity-text">${a.t}</div><div class="activity-time">${a.time}</div></div>`).join('')}
    </div>
  </main>
</div>
`);

// ── 登录页 ─────────────────────────────────────
const saasLogin = page(`
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px}
.login-card{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-radius:20px;padding:40px;width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
.login-logo{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:8px}
.login-logo-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#818cf8)}
.login-logo span{font-size:20px;font-weight:800;color:#1a1a1a}
.login-subtitle{text-align:center;font-size:13px;color:#888;margin-bottom:28px}
.login-field{margin-bottom:16px}
.login-label{display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:6px}
.login-input{width:100%;padding:11px 14px;border:1px solid #e5e5e5;border-radius:10px;font-size:13px;background:#f9f9f9;outline:none;transition:all .2s}
.login-input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,0.1);background:#fff}
.login-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.login-check{display:flex;align-items:center;gap:6px;font-size:12px;color:#666}
.login-link{font-size:12px;color:#6366f1}
.login-btn{width:100%;padding:12px;background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s}
.login-btn:hover{filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 4px 14px rgba(99,102,241,0.3)}
.login-divider{display:flex;align-items:center;gap:12px;margin:24px 0;color:#bbb;font-size:12px}
.login-divider::before,.login-divider::after{content:'';flex:1;height:1px;background:#e5e5e5}
.login-social{display:flex;gap:12px;justify-content:center}
.login-social-btn{padding:10px 24px;border:1px solid #e5e5e5;border-radius:10px;font-size:12px;color:#555;background:#fff;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px}
.login-social-btn:hover{border-color:#6366f1;color:#6366f1}
.login-footer{text-align:center;margin-top:24px;font-size:12px;color:#888}
.login-footer a{color:#6366f1;font-weight:600}
`, `
<div class="login-wrap">
  <div class="login-card">
    <div class="login-logo"><div class="login-logo-icon"></div><span>DataFlow</span></div>
    <p class="login-subtitle">登录以管理您的数据和应用</p>
    <div class="login-field"><label class="login-label">邮箱地址</label><input class="login-input" placeholder="请输入邮箱" value="user@example.com"></div>
    <div class="login-field"><label class="login-label">密码</label><input class="login-input" type="password" placeholder="请输入密码" value="••••••••"></div>
    <div class="login-row">
      <label class="login-check"><input type="checkbox" checked> 记住我</label>
      <a class="login-link">忘记密码？</a>
    </div>
    <button class="login-btn">登 录</button>
    <div class="login-divider">或</div>
    <div class="login-social">
      <div class="login-social-btn">🔵 Google</div>
      <div class="login-social-btn">⚫ GitHub</div>
      <div class="login-social-btn">🟢 微信</div>
    </div>
    <div class="login-footer">还没有账号？ <a>立即注册</a></div>
  </div>
</div>
`);

// ── 产品落地页 ─────────────────────────────────
const corpLanding = page(`
.hero-nav{display:flex;align-items:center;justify-content:space-between;padding:16px 48px;background:#fff}
.hero-nav-logo{font-size:18px;font-weight:800;color:#6366f1}
.hero-nav-links{display:flex;gap:24px;font-size:13px;color:#666}
.hero-nav-links a{cursor:pointer}
.hero-nav-btn{padding:8px 20px;background:#6366f1;color:#fff;border-radius:8px;font-size:13px;font-weight:600}
.hero{padding:80px 48px;text-align:center;background:linear-gradient(180deg,#f0f0ff 0%,#fff 100%)}
.hero h1{font-size:42px;font-weight:800;color:#1a1a1a;line-height:1.25;margin-bottom:16px}
.hero h1 em{font-style:normal;color:#6366f1}
.hero p{font-size:16px;color:#888;max-width:520px;margin:0 auto 28px;line-height:1.7}
.hero-btns{display:flex;gap:12px;justify-content:center}
.hero-btn-primary{padding:12px 28px;background:#6366f1;color:#fff;border-radius:10px;font-size:14px;font-weight:600}
.hero-btn-secondary{padding:12px 28px;background:#fff;color:#6366f1;border-radius:10px;font-size:14px;font-weight:600;border:1px solid #c7d2fe}
.hero-img{max-width:720px;margin:48px auto 0;height:300px;background:#e8e8ff;border-radius:16px;box-shadow:0 20px 60px rgba(99,102,241,0.15)}
.features{padding:64px 48px;background:#fff}
.features h2{text-align:center;font-size:28px;font-weight:700;margin-bottom:8px}
.features .sub{text-align:center;font-size:14px;color:#888;margin-bottom:48px}
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto}
.feature{padding:24px;border-radius:12px;border:1px solid #f0f0f0;transition:all .2s}
.feature:hover{border-color:#c7d2fe;box-shadow:0 4px 20px rgba(99,102,241,0.08)}
.feature-icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:12px}
.feature h3{font-size:15px;font-weight:600;margin-bottom:6px}
.feature p{font-size:12px;color:#888;line-height:1.6}
.pricing{padding:64px 48px;background:#f9f9ff}
.pricing h2{text-align:center;font-size:28px;font-weight:700;margin-bottom:8px}
.pricing .sub{text-align:center;font-size:14px;color:#888;margin-bottom:48px}
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:800px;margin:0 auto}
.price-card{background:#fff;border-radius:14px;padding:28px;border:1px solid #eee;text-align:center;transition:all .2s}
.price-card.featured{border-color:#6366f1;transform:scale(1.04);box-shadow:0 8px 30px rgba(99,102,241,0.12)}
.price-card h3{font-size:16px;font-weight:600;margin-bottom:4px}
.price-card .amount{font-size:36px;font-weight:800;color:#1a1a1a;margin:12px 0}
.price-card .amount span{font-size:14px;color:#888;font-weight:400}
.price-card ul{list-style:none;text-align:left;margin:16px 0}
.price-card li{font-size:12px;color:#666;padding:5px 0;display:flex;align-items:center;gap:6px}
.price-card li::before{content:'✓';color:#22c55e;font-weight:700}
.price-card .btn{display:block;padding:10px;border-radius:8px;font-size:13px;font-weight:600;margin-top:16px;cursor:pointer;text-align:center}
.price-card .btn-primary{background:#6366f1;color:#fff}
.price-card .btn-secondary{background:#f5f5f5;color:#555}
.cta{padding:64px 48px;text-align:center;background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff}
.cta h2{font-size:28px;font-weight:700;margin-bottom:12px}
.cta p{font-size:14px;opacity:0.85;margin-bottom:24px}
.cta .btn{display:inline-block;padding:12px 32px;background:#fff;color:#6366f1;border-radius:10px;font-weight:600;font-size:14px}
.footer{padding:32px 48px;background:#1a1a2e;color:rgba(255,255,255,0.5);text-align:center;font-size:12px}
`, `
<nav class="hero-nav">
  <div class="hero-nav-logo">ProtoAI</div>
  <div class="hero-nav-links"><a>功能</a><a>方案</a><a>定价</a><a>文档</a><a>博客</a></div>
  <div class="hero-nav-btn">免费试用</div>
</nav>
<section class="hero">
  <h1>用 AI 让 <em>原型设计</em><br>快人一步</h1>
  <p>输入你的想法，AI 自动规划页面结构并生成高质量可交互的 UI 原型，节省 80% 的设计时间。</p>
  <div class="hero-btns">
    <div class="hero-btn-primary">免费开始使用 →</div>
    <div class="hero-btn-secondary">观看演示视频</div>
  </div>
  <div class="hero-img"></div>
</section>
<section class="features">
  <h2>核心功能</h2>
  <p class="sub">为产品团队打造的智能原型工具</p>
  <div class="features-grid">
    ${[{icon:'🤖',bg:'#ede9fe',t:'AI 智能规划',d:'自然语言描述需求，AI 自动分析并规划最优页面结构'},{icon:'🎨',bg:'#dbeafe',t:'高保真原型',d:'生成接近最终产品的高保真 UI 原型，支持实时预览'},{icon:'📱',bg:'#fce7f3',t:'多端适配',d:'自动适配 PC 和移动端布局，一次生成多端可用'},{icon:'⚡',bg:'#fef3c7',t:'秒级生成',d:'平均 30 秒完成一个完整页面的原型生成'},{icon:'🔄',bg:'#dcfce7',t:'迭代优化',d:'支持对话式修改，持续优化直到满意为止'},{icon:'📦',bg:'#fee2e2',t:'一键导出',d:'支持导出为 React、Vue 等主流框架的可维护代码'}].map(f => `<div class="feature"><div class="feature-icon" style="background:${f.bg}">${f.icon}</div><h3>${f.t}</h3><p>${f.d}</p></div>`).join('')}
  </div>
</section>
<section class="pricing">
  <h2>简单透明的定价</h2>
  <p class="sub">选择适合你的方案</p>
  <div class="pricing-grid">
    <div class="price-card"><h3>免费版</h3><div class="amount">¥0<span>/月</span></div><ul><li>每月 5 个页面</li><li>基础模板库</li><li>社区支持</li></ul><div class="btn btn-secondary">开始使用</div></div>
    <div class="price-card featured"><h3>专业版</h3><div class="amount">¥99<span>/月</span></div><ul><li>无限页面生成</li><li>全部高级模板</li><li>代码导出</li><li>优先支持</li></ul><div class="btn btn-primary">升级专业版</div></div>
    <div class="price-card"><h3>企业版</h3><div class="amount">¥299<span>/月</span></div><ul><li>团队协作</li><li>私有部署</li><li>定制模型</li><li>专属顾问</li></ul><div class="btn btn-secondary">联系销售</div></div>
  </div>
</section>
<section class="cta"><h2>准备好提升效率了吗？</h2><p>加入 10,000+ 产品团队，用 AI 重新定义原型设计</p><div class="btn">免费试用 ProtoAI →</div></section>
<footer class="footer">© 2024 ProtoAI · 让设计更智能</footer>
`);

// ── 社交信息流 ─────────────────────────────────
const socialFeed = page(`
.sf-nav{display:flex;align-items:center;justify-content:space-between;padding:12px 32px;background:#fff;border-bottom:1px solid #f0f0f0;position:sticky;top:0;z-index:10}
.sf-logo{font-size:18px;font-weight:800;color:#6366f1}
.sf-search{padding:8px 16px;border:1px solid #e5e5e5;border-radius:20px;font-size:12px;color:#999;background:#f5f5f5;width:240px}
.sf-nav-right{display:flex;gap:14px;align-items:center}
.sf-layout{display:flex;gap:24px;max-width:960px;margin:20px auto;padding:0 20px}
.sf-main{flex:1;min-width:0}
.sf-compose{background:#fff;border-radius:12px;padding:16px;border:1px solid #f0f0f0;margin-bottom:16px}
.sf-compose-top{display:flex;gap:10px;align-items:flex-start}
.sf-avatar{width:40px;height:40px;border-radius:50%;flex-shrink:0}
.sf-compose-input{flex:1;padding:10px 14px;border:1px solid #e5e5e5;border-radius:20px;font-size:13px;color:#999;background:#f5f5f5}
.sf-compose-actions{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-left:50px}
.sf-compose-tools{display:flex;gap:12px;font-size:13px;color:#888}
.sf-compose-btn{padding:6px 16px;background:#6366f1;color:#fff;border-radius:20px;font-size:12px;font-weight:600}
.sf-post{background:#fff;border-radius:12px;border:1px solid #f0f0f0;margin-bottom:16px;overflow:hidden}
.sf-post-header{display:flex;align-items:center;gap:10px;padding:14px 16px}
.sf-post-name{font-size:13px;font-weight:600}
.sf-post-time{font-size:11px;color:#999}
.sf-post-body{padding:0 16px 12px;font-size:13px;color:#444;line-height:1.6}
.sf-post-img{width:100%;height:200px;margin-top:10px;border-radius:8px}
.sf-post-actions{display:flex;border-top:1px solid #f5f5f5;padding:4px 0}
.sf-post-action{flex:1;text-align:center;padding:8px;font-size:12px;color:#888;cursor:pointer;transition:color .15s}
.sf-post-action:hover{color:#6366f1}
.sf-side{width:280px;flex-shrink:0}
.sf-side-card{background:#fff;border-radius:12px;border:1px solid #f0f0f0;padding:16px;margin-bottom:16px}
.sf-side-title{font-size:14px;font-weight:600;margin-bottom:12px}
.sf-suggest{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.sf-suggest-info{flex:1;min-width:0}
.sf-suggest-name{font-size:12px;font-weight:500}
.sf-suggest-desc{font-size:10px;color:#999}
.sf-suggest-btn{padding:4px 12px;border:1px solid #c7d2fe;color:#6366f1;border-radius:14px;font-size:11px;font-weight:500}
.sf-trending{display:flex;flex-wrap:wrap;gap:6px}
.sf-tag{padding:4px 10px;background:#f5f5ff;border-radius:14px;font-size:11px;color:#6366f1}
`, `
<nav class="sf-nav">
  <div class="sf-logo">ShareHub</div>
  <div class="sf-search">🔍 搜索用户、话题...</div>
  <div class="sf-nav-right">
    <span style="font-size:16px;position:relative">🔔<span style="position:absolute;top:-4px;right:-6px;background:#ef4444;color:#fff;font-size:8px;padding:1px 4px;border-radius:8px">5</span></span>
    <span style="font-size:16px">✉️</span>
    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#818cf8,#c7d2fe)"></div>
  </div>
</nav>
<div class="sf-layout">
  <div class="sf-main">
    <div class="sf-compose">
      <div class="sf-compose-top">
        <div class="sf-avatar" style="background:linear-gradient(135deg,#818cf8,#c7d2fe)"></div>
        <div class="sf-compose-input">分享你的想法...</div>
      </div>
      <div class="sf-compose-actions">
        <div class="sf-compose-tools"><span>📷 图片</span><span>📹 视频</span><span>📊 投票</span></div>
        <div class="sf-compose-btn">发布</div>
      </div>
    </div>
    ${[{name:'李思远',time:'30分钟前',text:'今天尝试了 ProtoAI 的新功能，AI 生成的原型质量真的惊艳！从需求描述到可交互原型只用了不到一分钟，设计师说可以直接用。强烈推荐产品团队试试。',bg:'#dbeafe',likes:42,comments:8,shares:3},{name:'王小雨',time:'2小时前',text:'周末去了趟杭州西湖，秋天的断桥真的太美了 🍂 分享几张照片给大家~',bg:'#fce7f3',likes:128,comments:23,shares:5,hasImg:true},{name:'陈大伟',time:'5小时前',text:'分享一个前端性能优化的实战经验：通过 React.memo + useMemo + 虚拟滚动，我们的列表页渲染性能提升了 300%。详细方案已整理成文档，需要的同学可以私信我。',bg:'#dcfce7',likes:67,comments:15,shares:12}].map(p => `
    <div class="sf-post">
      <div class="sf-post-header">
        <div class="sf-avatar" style="background:${p.bg}"></div>
        <div><div class="sf-post-name">${p.name}</div><div class="sf-post-time">${p.time}</div></div>
      </div>
      <div class="sf-post-body">${p.text}${p.hasImg ? '<div class="sf-post-img" style="background:linear-gradient(135deg,#e8e8ff,#f0e8ff)"></div>' : ''}</div>
      <div class="sf-post-actions">
        <div class="sf-post-action">❤️ ${p.likes}</div>
        <div class="sf-post-action">💬 ${p.comments}</div>
        <div class="sf-post-action">🔗 分享 ${p.shares}</div>
      </div>
    </div>`).join('')}
  </div>
  <div class="sf-side">
    <div class="sf-side-card">
      <div class="sf-side-title">推荐关注</div>
      ${[{n:'张三丰',d:'UI设计师 · 12篇'},{n:'AI实验室',d:'科技博主 · 89篇'},{n:'前端日报',d:'技术资讯 · 256篇'}].map(u => `<div class="sf-suggest"><div class="sf-avatar" style="width:34px;height:34px;background:linear-gradient(135deg,#c7d2fe,#e8e8ff)"></div><div class="sf-suggest-info"><div class="sf-suggest-name">${u.n}</div><div class="sf-suggest-desc">${u.d}</div></div><div class="sf-suggest-btn">关注</div></div>`).join('')}
    </div>
    <div class="sf-side-card">
      <div class="sf-side-title">热门话题</div>
      <div class="sf-trending">${['#AI工具','#产品设计','#前端开发','#效率提升','#远程办公','#开源项目'].map(t => `<span class="sf-tag">${t}</span>`).join('')}</div>
    </div>
  </div>
</div>
`);

// ── 404 页面 ───────────────────────────────────
const corp404 = page(`
.e404{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;text-align:center;padding:40px}
.e404-num{font-size:120px;font-weight:900;background:linear-gradient(135deg,#6366f1,#c7d2fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1}
.e404 h2{font-size:22px;font-weight:600;color:#333;margin:16px 0 8px}
.e404 p{font-size:14px;color:#888;margin-bottom:28px;max-width:360px}
.e404-search{display:flex;gap:8px;margin-bottom:20px}
.e404-search input{padding:10px 16px;border:1px solid #e5e5e5;border-radius:10px;font-size:13px;width:260px;outline:none}
.e404-search input:focus{border-color:#6366f1}
.e404-search button{padding:10px 20px;background:#6366f1;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600}
.e404-links{display:flex;gap:12px}
.e404-links a{padding:8px 16px;background:#f5f5f5;border-radius:8px;font-size:12px;color:#555}
`, `
<div class="e404">
  <div class="e404-num">404</div>
  <h2>页面未找到</h2>
  <p>抱歉，您访问的页面不存在或已被移除。试试搜索或点击下方链接。</p>
  <div class="e404-search"><input placeholder="搜索你需要的内容..."><button>搜索</button></div>
  <div class="e404-links"><a>返回首页</a><a>产品中心</a><a>帮助中心</a></div>
</div>
`);

// ── 聊天页面 ───────────────────────────────────
const socialChat = page(`
.chat{display:flex;height:100vh}
.chat-side{width:280px;background:#fafafa;border-right:1px solid #eee;display:flex;flex-direction:column}
.chat-side-header{padding:16px;border-bottom:1px solid #eee}
.chat-side-header h3{font-size:16px;font-weight:700;margin-bottom:8px}
.chat-side-search{width:100%;padding:7px 12px;border:1px solid #e5e5e5;border-radius:8px;font-size:12px;background:#fff}
.chat-list{flex:1;overflow-y:auto}
.chat-item{display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer;transition:background .15s;border-bottom:1px solid #f5f5f5}
.chat-item:hover{background:#f0f0ff}
.chat-item.active{background:#ede9fe}
.chat-item-avatar{width:40px;height:40px;border-radius:50%;flex-shrink:0;position:relative}
.chat-item-online{position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid #fafafa}
.chat-item-info{flex:1;min-width:0}
.chat-item-name{font-size:13px;font-weight:600;display:flex;justify-content:space-between}
.chat-item-time{font-size:10px;color:#bbb;font-weight:400}
.chat-item-msg{font-size:11px;color:#999;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.chat-item-badge{background:#ef4444;color:#fff;font-size:9px;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;flex-shrink:0}
.chat-main{flex:1;display:flex;flex-direction:column}
.chat-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #eee}
.chat-header-left{display:flex;align-items:center;gap:10px}
.chat-header-name{font-size:15px;font-weight:600}
.chat-header-status{font-size:11px;color:#22c55e}
.chat-header-actions{display:flex;gap:12px;font-size:16px}
.chat-messages{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px}
.chat-msg{display:flex;gap:8px;max-width:70%}
.chat-msg.sent{align-self:flex-end;flex-direction:row-reverse}
.chat-msg-avatar{width:32px;height:32px;border-radius:50%;flex-shrink:0}
.chat-msg-bubble{padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5}
.chat-msg.received .chat-msg-bubble{background:#f0f0ff;border-top-left-radius:4px}
.chat-msg.sent .chat-msg-bubble{background:#6366f1;color:#fff;border-top-right-radius:4px}
.chat-msg-time{font-size:10px;color:#bbb;text-align:center;padding:4px 0}
.chat-input-area{padding:12px 20px;border-top:1px solid #eee;display:flex;align-items:center;gap:10px}
.chat-input{flex:1;padding:10px 14px;border:1px solid #e5e5e5;border-radius:20px;font-size:13px;outline:none}
.chat-input:focus{border-color:#6366f1}
.chat-send{padding:8px 20px;background:#6366f1;color:#fff;border:none;border-radius:20px;font-size:13px;font-weight:600}
`, `
<div class="chat">
  <div class="chat-side">
    <div class="chat-side-header"><h3>消息</h3><input class="chat-side-search" placeholder="搜索联系人..."></div>
    <div class="chat-list">
      ${[{n:'产品设计组',m:'张三：新版原型已经上传了',t:'刚刚',badge:3,active:true,bg:'#ede9fe'},{n:'李思远',m:'那个方案你看一下',t:'10:23',badge:0,bg:'#dbeafe',online:true},{n:'王小雨',m:'周末有空一起吃饭吗？',t:'昨天',badge:1,bg:'#fce7f3'},{n:'前端技术群',m:'陈大伟：分享一篇优化文章',t:'昨天',badge:0,bg:'#dcfce7'},{n:'AI工具讨论',m:'有人试过新的AI原型工具吗',t:'周二',badge:0,bg:'#fef3c7'}].map(c => `
      <div class="chat-item${c.active ? ' active' : ''}">
        <div class="chat-item-avatar" style="background:${c.bg}">${c.online ? '<div class="chat-item-online"></div>' : ''}</div>
        <div class="chat-item-info"><div class="chat-item-name">${c.n}<span class="chat-item-time">${c.t}</span></div><div class="chat-item-msg">${c.m}</div></div>
        ${c.badge ? `<div class="chat-item-badge">${c.badge}</div>` : ''}
      </div>`).join('')}
    </div>
  </div>
  <div class="chat-main">
    <div class="chat-header">
      <div class="chat-header-left">
        <div style="width:36px;height:36px;border-radius:50%;background:#ede9fe"></div>
        <div><div class="chat-header-name">产品设计组</div><div class="chat-header-status">5位成员 · 3位在线</div></div>
      </div>
      <div class="chat-header-actions"><span>📞</span><span>📹</span><span>⋯</span></div>
    </div>
    <div class="chat-messages">
      <div class="chat-msg-time">今天 09:15</div>
      <div class="chat-msg received"><div class="chat-msg-avatar" style="background:#dbeafe"></div><div class="chat-msg-bubble">大家早上好！昨天的评审结果出来了，整体方案通过了 👍</div></div>
      <div class="chat-msg received"><div class="chat-msg-avatar" style="background:#fce7f3"></div><div class="chat-msg-bubble">太好了！那我们需要调整哪些细节？</div></div>
      <div class="chat-msg sent"><div class="chat-msg-avatar" style="background:#c7d2fe"></div><div class="chat-msg-bubble">我整理了修改清单，稍后发出来大家确认一下</div></div>
      <div class="chat-msg-time">10:42</div>
      <div class="chat-msg received"><div class="chat-msg-avatar" style="background:#dbeafe"></div><div class="chat-msg-bubble">新版原型已经上传到共享文件夹了，大家有空看一下效果</div></div>
    </div>
    <div class="chat-input-area">
      <span style="font-size:18px;cursor:pointer">😊</span>
      <span style="font-size:18px;cursor:pointer">📎</span>
      <input class="chat-input" placeholder="输入消息...">
      <button class="chat-send">发送</button>
    </div>
  </div>
</div>
`);

// ── 教育首页 ───────────────────────────────────
const eduHome = page(`
.edu-nav{display:flex;align-items:center;justify-content:space-between;padding:12px 32px;background:#fff;border-bottom:1px solid #f0f0f0}
.edu-logo{font-size:18px;font-weight:800;color:#6366f1;display:flex;align-items:center;gap:8px}
.edu-nav-links{display:flex;gap:20px;font-size:13px;color:#666;align-items:center}
.edu-nav-btn{padding:7px 18px;background:#6366f1;color:#fff;border-radius:8px;font-size:12px;font-weight:600}
.edu-hero{display:flex;align-items:center;gap:48px;padding:48px;background:linear-gradient(135deg,#f0f0ff 0%,#e8f4e8 100%)}
.edu-hero-text{flex:1}
.edu-hero h1{font-size:32px;font-weight:800;line-height:1.3;margin-bottom:12px}
.edu-hero h1 em{font-style:normal;color:#6366f1}
.edu-hero p{font-size:14px;color:#666;line-height:1.7;margin-bottom:20px}
.edu-hero-stats{display:flex;gap:24px;margin-bottom:24px}
.edu-hero-stat .num{font-size:22px;font-weight:700;color:#6366f1}
.edu-hero-stat .label{font-size:11px;color:#888}
.edu-hero-btns{display:flex;gap:10px}
.edu-hero-img{width:360px;height:240px;background:#e8e8ff;border-radius:16px;flex-shrink:0}
.edu-section{padding:40px 48px}
.edu-section-title{font-size:22px;font-weight:700;margin-bottom:6px}
.edu-section-sub{font-size:13px;color:#888;margin-bottom:24px}
.edu-courses{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.edu-card{background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f0f0f0;transition:all .2s}
.edu-card:hover{box-shadow:0 6px 20px rgba(0,0,0,0.06)}
.edu-card-cover{height:140px;position:relative}
.edu-card-badge{position:absolute;top:10px;left:10px;padding:3px 10px;background:rgba(0,0,0,0.5);color:#fff;border-radius:4px;font-size:10px}
.edu-card-body{padding:14px}
.edu-card-name{font-size:14px;font-weight:600;margin-bottom:6px}
.edu-card-teacher{display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:11px;color:#888}
.edu-card-teacher-avatar{width:18px;height:18px;border-radius:50%;background:#e5e5e5}
.edu-card-footer{display:flex;justify-content:space-between;align-items:center}
.edu-card-price{font-size:16px;font-weight:700;color:#ef4444}
.edu-card-price small{font-size:11px;color:#bbb;font-weight:400;text-decoration:line-through}
.edu-card-count{font-size:11px;color:#999}
.edu-paths{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.edu-path{padding:20px;border-radius:12px;text-align:center;border:1px solid #f0f0f0;background:#fff;transition:all .2s}
.edu-path:hover{border-color:#c7d2fe}
.edu-path-icon{font-size:28px;margin-bottom:8px}
.edu-path-name{font-size:13px;font-weight:600;margin-bottom:4px}
.edu-path-count{font-size:11px;color:#999}
`, `
<nav class="edu-nav">
  <div class="edu-logo">🎓 学堂在线</div>
  <div class="edu-nav-links"><span>课程分类</span><span>学习路径</span><span>名师堂</span><span>企业培训</span><div class="edu-nav-btn">免费注册</div><span style="color:#999">登录</span></div>
</nav>
<section class="edu-hero">
  <div class="edu-hero-text">
    <h1>让学习成为一种<em>习惯</em></h1>
    <p>汇聚万名优质讲师，覆盖IT、设计、商业等200+热门领域。随时随地，按自己的节奏学习。</p>
    <div class="edu-hero-stats">
      <div class="edu-hero-stat"><div class="num">50,000+</div><div class="label">优质课程</div></div>
      <div class="edu-hero-stat"><div class="num">2,000+</div><div class="label">专业讲师</div></div>
      <div class="edu-hero-stat"><div class="num">100万+</div><div class="label">学员信赖</div></div>
    </div>
    <div class="edu-hero-btns">
      <div class="edu-nav-btn" style="padding:10px 24px;font-size:14px">免费体验 →</div>
      <div style="padding:10px 24px;border:1px solid #c7d2fe;border-radius:8px;font-size:13px;color:#6366f1;font-weight:500">查看课程目录</div>
    </div>
  </div>
  <div class="edu-hero-img"></div>
</section>
<div class="edu-section">
  <div class="edu-section-title">热门课程</div>
  <div class="edu-section-sub">根据你的兴趣和行业趋势推荐</div>
  <div class="edu-courses">
    ${[{n:'React 18 从入门到精通',t:'张三丰',p:129,op:299,c:8234,bg:'linear-gradient(135deg,#dbeafe,#e8e8ff)'},{n:'Python 数据分析实战',t:'李教授',p:99,op:199,c:12567,bg:'linear-gradient(135deg,#dcfce7,#e8f4e8)'},{n:'UI/UX 设计系统搭建',t:'王设计',p:199,op:499,c:5678,bg:'linear-gradient(135deg,#fce7f3,#f0e8ff)'},{n:'TypeScript 高级编程',t:'陈大伟',p:149,op:349,c:4321,bg:'linear-gradient(135deg,#fef3c7,#fefce8)'},{n:'AI 提示工程实战',t:'AI实验室',p:299,op:599,c:9876,bg:'linear-gradient(135deg,#ede9fe,#e8e8ff)'},{n:'产品经理入门课',t:'周产品',p:79,op:199,c:15432,bg:'linear-gradient(135deg,#fee2e2,#fef2f2)'}].map(c => `
    <div class="edu-card">
      <div class="edu-card-cover" style="background:${c.bg}"><div class="edu-card-badge">${Math.floor(Math.random()*20+8)}课时</div></div>
      <div class="edu-card-body">
        <div class="edu-card-name">${c.n}</div>
        <div class="edu-card-teacher"><div class="edu-card-teacher-avatar"></div>${c.t}</div>
        <div class="edu-card-footer"><div class="edu-card-price">¥${c.p} <small>¥${c.op}</small></div><div class="edu-card-count">${c.c}人学过</div></div>
      </div>
    </div>`).join('')}
  </div>
</div>
<div class="edu-section" style="background:#f9f9ff">
  <div class="edu-section-title">学习路径</div>
  <div class="edu-section-sub">系统化的学习计划，从零基础到专业水平</div>
  <div class="edu-paths">
    ${[{i:'💻',n:'前端开发',c:'12门课程'},{i:'🎨',n:'UI设计',c:'8门课程'},{i:'📊',n:'数据分析',c:'10门课程'},{i:'🤖',n:'人工智能',c:'15门课程'}].map(p => `<div class="edu-path"><div class="edu-path-icon">${p.i}</div><div class="edu-path-name">${p.n}</div><div class="edu-path-count">${p.c}</div></div>`).join('')}
  </div>
</div>
<div style="text-align:center;padding:32px;color:#bbb;font-size:12px">© 2024 学堂在线 · 让每个人都能享受优质教育</div>
`);


// ── Exports ────────────────────────────────────
// Map template ID → array of pre-generated { name, html } pages
export const TEMPLATE_PAGES = {
  'ecommerce-home': [{ name: '电商首页', html: ecommerceHome }],
  'saas-dashboard': [{ name: '数据仪表盘', html: saasDashboard }],
  'saas-login': [{ name: '登录页', html: saasLogin }],
  'corp-landing': [{ name: '产品落地页', html: corpLanding }],
  'corp-404': [{ name: '404页面', html: corp404 }],
  'social-feed': [{ name: '信息流', html: socialFeed }],
  'social-chat': [{ name: '聊天页面', html: socialChat }],
  'edu-home': [{ name: '在线教育首页', html: eduHome }],
};

/**
 * Get pre-generated pages for a template.
 * For project templates, generates pages based on the template's page list.
 */
export function getTemplatePages(template) {
  const pages = TEMPLATE_PAGES[template.id];
  if (pages) return pages;

  // For project templates, try to build pages from sub-page templates
  if (template.type === 'project') {
    const projectPages = parseProjectPagesFromPrompt(template.prompt);
    return projectPages.map((p) => {
      // Try to find a matching single-page template
      const match = findMatchingTemplate(p.name);
      if (match && TEMPLATE_PAGES[match]) {
        return { name: p.name, html: TEMPLATE_PAGES[match][0].html };
      }
      // Generate a placeholder page
      return { name: p.name, html: generatePlaceholderPage(p.name, p.desc) };
    });
  }

  return null; // No pre-generated pages available
}

function parseProjectPagesFromPrompt(prompt) {
  if (!prompt) return [];
  const lines = prompt.split('\n');
  const pages = [];
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s*(.+?)(?:（(.+?)）)?\s*$/);
    if (match) {
      pages.push({ name: match[2].trim(), desc: match[3] || '' });
    }
  }
  return pages;
}

// Map page names to template IDs for project templates
const PAGE_NAME_MAP = {
  '首页': 'ecommerce-home', '电商首页': 'ecommerce-home',
  '数据仪表盘': 'saas-dashboard', '仪表盘': 'saas-dashboard',
  '登录页': 'saas-login', '登录': 'saas-login', '登录/注册页': 'saas-login',
  '信息流': 'social-feed',
  '聊天页面': 'social-chat',
  '在线教育首页': 'edu-home', '平台首页': 'edu-home',
  '产品落地页': 'corp-landing', '官网首页': 'corp-landing',
  '404页面': 'corp-404',
};

function findMatchingTemplate(pageName) {
  if (PAGE_NAME_MAP[pageName]) return PAGE_NAME_MAP[pageName];
  for (const [key, id] of Object.entries(PAGE_NAME_MAP)) {
    if (pageName.includes(key) || key.includes(pageName)) return id;
  }
  return null;
}

function generatePlaceholderPage(name, desc) {
  return page(`
.ph{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;text-align:center;padding:40px}
.ph-icon{width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#c7d2fe,#a5b4fc);margin-bottom:20px}
.ph h2{font-size:20px;font-weight:700;color:#333;margin-bottom:8px}
.ph p{font-size:13px;color:#888;max-width:360px;line-height:1.6}
.ph-badge{margin-top:16px;padding:6px 16px;background:#f5f5ff;color:#6366f1;border-radius:8px;font-size:12px;font-weight:500}
  `, `
<div class="ph">
  <div class="ph-icon"></div>
  <h2>${name}</h2>
  <p>${desc || '此页面的详细原型将在生成时创建'}</p>
  <div class="ph-badge">📋 模板预设页面</div>
</div>`);
}
