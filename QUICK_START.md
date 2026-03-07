# 🚀 快速开始指南

## 5 分钟快速上手

### 1️⃣ 本地运行

```bash
# 启动本地 Web 服务器
python3 -m http.server 8000

# 打开浏览器
# 多文件版本: http://localhost:8000/src/index.html
# 单文件版本: http://localhost:8000/lt.html
```

### 2️⃣ 基础功能体验

#### 查询学生成绩
```javascript
// 系统会自动加载学生数据
// 输入班级、姓名、密码即可查询
```

#### 查看诊断报告
```javascript
// 点击"诊断"按钮
// 系统自动生成 AI 诊断报告
```

#### 查看 3D 全息球
```javascript
// 点击"3D 全息"按钮
// 查看学生的 100+ 维度数据可视化
```

---

## 核心功能演示

### 📊 数据分析

```javascript
// 1. 学生查询
const student = await searchStudent('张三', '701班');

// 2. 成绩分析
const analysis = await analyzePerformance(student);

// 3. 对比分析
const comparison = await compareStudents([student1, student2]);

// 4. 趋势分析
const trend = await analyzeTrend(student.examHistory);
```

### 🤖 AI 诊断

```javascript
// 1. 生成诊断
const diagnosis = await AIDiagnosis.diagnose(student);

// 2. 查看建议
console.log(diagnosis.suggestions);

// 3. 导出报告
AIDiagnosis.exportPDF(diagnosis, 'diagnosis.pdf');
```

### 🌐 3D 全息球

```javascript
// 1. 初始化
HolographicStudent3D.init({
  containerSelector: '#3d-container'
});

// 2. 显示学生
HolographicStudent3D.displayStudent({
  name: '张三',
  score: 85,
  subjects: { Math: 90, Chinese: 80, English: 85 },
  // ... 更多维度
});

// 3. 交互
// - 鼠标拖拽旋转
// - 滚轮缩放
// - 点击查看详情
```

### 🔮 预知实验室

```javascript
// 1. 预测未来成绩
const predictions = PredictiveSimulationLab.predict(student, 3);
console.log(predictions);
// [
//   { period: 1, score: 85, confidence: 0.85 },
//   { period: 2, score: 87, confidence: 0.82 },
//   { period: 3, score: 89, confidence: 0.78 }
// ]

// 2. 模拟干预效果
const intervention = PredictiveSimulationLab.simulateIntervention(
  student,
  'tutoring',  // 家教
  4            // 4 周
);
console.log(`预期提升: ${intervention.expectedGain} 分`);

// 3. 生成"如果分析"
const whatIf = PredictiveSimulationLab.generateWhatIf(student, [
  { type: 'intervention', intervention: 'tutoring', duration: 8 }
]);
```

### 👥 虚拟教研室

```javascript
// 1. 创建教研室
const room = MetaverseCollabSpace.createRoom('room_001', {
  name: '数学教研室'
});

// 2. 教师加入
MetaverseCollabSpace.join('room_001', 'teacher_001', {
  name: '王老师'
});

// 3. 共享数据
MetaverseCollabSpace.shareData('room_001', {
  type: 'chart',
  data: chartData
});

// 4. 添加标注
MetaverseCollabSpace.annotate('room_001', objectId, {
  type: 'text',
  content: '这个知识点需要重点讲解'
});

// 5. 生成报告
const report = MetaverseCollabSpace.generateReport('room_001');
```

### 💭 心理预警

```javascript
// 1. 评估心理健康
const assessment = EmotionalAIMonitor.assess(student);
console.log(assessment.riskLevel);  // normal, medium, high, critical

// 2. 生成谈话指南
const guide = EmotionalAIMonitor.generateGuide(student, assessment);
console.log(guide.openingStatement);  // 开场白
console.log(guide.keyTopics);         // 关键话题
console.log(guide.questions);         // 支持性问题

// 3. 识别高风险学生
const atRisk = EmotionalAIMonitor.identifyAtRisk(classData);

// 4. 生成健康报告
const report = EmotionalAIMonitor.generateReport(classData);
```

---

## 常用代码片段

### 初始化所有模块

```javascript
// 1. 性能优化
DataPagination.init(window.RAW_DATA);
PWARegister.init();
ResponsiveTable.init();

// 2. 智能分析
AIDiagnosis.init({
  model: 'gpt-4.1-mini',
  openaiApiKey: process.env.OPENAI_API_KEY
});
ChartInteractivity.init();
PredictiveSimulationLab.init(historicalData);

// 3. 协作工具
MetaverseCollabSpace.init();
VoiceAssistant.init();

// 4. 全息大脑
HolographicStudent3D.init({
  containerSelector: '#3d-container'
});
EmotionalAIMonitor.init();

// 5. 安全管理
AuditLogger.init();
DataAnonymizer.init();

console.log('✅ 所有模块初始化完成');
```

### 生成完整报告

```javascript
async function generateCompleteReport(student) {
  // 1. AI 诊断
  const diagnosis = await AIDiagnosis.diagnose(student);
  
  // 2. 成绩预测
  const predictions = PredictiveSimulationLab.predict(student, 3);
  
  // 3. 心理评估
  const assessment = EmotionalAIMonitor.assess(student);
  
  // 4. 心理指南
  const guide = EmotionalAIMonitor.generateGuide(student, assessment);
  
  // 5. 干预建议
  const recommendations = PredictiveSimulationLab.recommend(student);
  
  // 6. 组合报告
  const report = {
    student: student,
    diagnosis: diagnosis,
    predictions: predictions,
    assessment: assessment,
    guide: guide,
    recommendations: recommendations,
    generatedAt: new Date()
  };
  
  return report;
}

// 使用
const report = await generateCompleteReport(student);
console.log(report);
```

### 导出数据

```javascript
// 导出为 JSON
function exportJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

// 导出为 CSV
function exportCSV(data, filename) {
  let csv = 'Name,Score,Class\n';
  data.forEach(item => {
    csv += `${item.name},${item.score},${item.class}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

// 导出为 PDF
async function exportPDF(report, filename) {
  const pdf = await AutomatedReports.exportPDF(report);
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
```

### 实时监控

```javascript
// 监控学生成绩变化
function monitorStudentProgress(studentId) {
  const checkInterval = setInterval(async () => {
    const student = await getStudent(studentId);
    const assessment = EmotionalAIMonitor.assess(student);
    
    // 如果风险等级升高，发出警告
    if (assessment.riskLevel === 'critical') {
      console.warn(`⚠️ ${student.name} 处于危机状态`);
      // 发送通知
      notifyTeacher(student);
    }
  }, 60000); // 每分钟检查一次
  
  return checkInterval;
}

// 监控班级整体情况
function monitorClassHealth(classData) {
  const report = EmotionalAIMonitor.generateReport(classData);
  
  console.log(`班级总人数: ${report.totalStudents}`);
  console.log(`高风险学生: ${report.atRiskCount}`);
  console.log(`高风险比例: ${report.atRiskPercentage.toFixed(2)}%`);
  
  if (report.atRiskPercentage > 20) {
    console.warn('⚠️ 班级高风险学生比例过高，建议采取措施');
  }
}
```

---

## 配置选项

### 全局配置

```javascript
// 在 app.js 中修改
const CONFIG = {
  // 性能配置
  PAGINATION_SIZE: 50,           // 每页加载数量
  CACHE_SIZE: 100,               // 缓存大小
  
  // AI 配置
  AI_MODEL: 'gpt-4.1-mini',      // AI 模型
  AI_TIMEOUT: 30000,             // AI 超时时间
  
  // 3D 配置
  3D_SPHERE_RADIUS: 100,         // 3D 球体半径
  3D_PARTICLE_COUNT: 5000,       // 粒子数量
  
  // 心理预警配置
  STRESS_THRESHOLD: 0.7,         // 压力阈值
  BURNOUT_THRESHOLD: 0.75,       // 倦怠阈值
  DEPRESSION_THRESHOLD: 0.8,     // 抑郁阈值
  ANXIETY_THRESHOLD: 0.65,       // 焦虑阈值
  
  // 虚拟教研室配置
  MAX_USERS_PER_ROOM: 10,        // 每个房间最多用户数
  ENABLE_VOICE_CHAT: true,       // 启用语音聊天
  ENABLE_SCREEN_SHARE: true      // 启用屏幕共享
};
```

### 主题配置

```javascript
// 切换深色模式
document.body.classList.add('dark-mode');

// 自定义颜色
const theme = {
  primary: '#0f1419',
  secondary: '#536471',
  success: '#00ba7c',
  danger: '#f4212e',
  warning: '#ffd400'
};
```

---

## 故障排查

### 问题 1: 数据加载缓慢

**原因**: 数据量过大，分片加载未启用

**解决方案**:
```javascript
// 启用分片加载
DataPagination.init(window.RAW_DATA);

// 或者减少首屏加载数据
const PAGINATION_SIZE = 20;  // 改小一些
```

### 问题 2: 3D 全息球不显示

**原因**: 浏览器不支持 WebGL 或 Three.js 未加载

**解决方案**:
```javascript
// 检查 WebGL 支持
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
if (!gl) {
  console.error('浏览器不支持 WebGL');
}

// 确保 Three.js 已加载
console.log(typeof THREE);  // 应该是 'object'
```

### 问题 3: AI 诊断超时

**原因**: OpenAI API 响应慢或网络不稳定

**解决方案**:
```javascript
// 增加超时时间
AIDiagnosis.init({
  timeout: 60000  // 改为 60 秒
});

// 或者使用本地模型
AIDiagnosis.init({
  useLocalModel: true
});
```

### 问题 4: 虚拟教研室连接失败

**原因**: WebSocket 连接问题

**解决方案**:
```javascript
// 检查网络连接
if (!navigator.onLine) {
  console.error('网络连接失败');
}

// 重新连接
MetaverseCollabSpace.reconnect();
```

---

## 性能优化建议

### 1. 启用缓存

```javascript
// 启用 IndexedDB 缓存
DataPagination.init(data, {
  enableCache: true,
  cacheSize: 100
});

// 启用 PWA 离线支持
PWARegister.init();
```

### 2. 懒加载模块

```javascript
// 按需加载模块
function loadModule(moduleName) {
  const script = document.createElement('script');
  script.src = `./assets/js/${moduleName}.js`;
  document.head.appendChild(script);
}

// 用户点击时加载
document.getElementById('3d-button').addEventListener('click', () => {
  loadModule('holographic-student-3d');
});
```

### 3. 优化数据传输

```javascript
// 使用数据压缩
const compressed = LZString.compress(JSON.stringify(data));

// 只传输必要的字段
const minimalData = {
  id: student.id,
  name: student.name,
  score: student.score
};
```

### 4. 使用 CDN

```html
<!-- 使用 CDN 加速库文件 -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

---

## 下一步

- 📖 阅读 [完整文档](./OPTIMIZATION_GUIDE.md)
- 🏗️ 查看 [系统架构](./SYSTEM_ARCHITECTURE.md)
- 💻 浏览 [源代码](./public/assets/js/)
- 🐛 报告 [问题](https://github.com/loru12321/school-system/issues)

---

**祝您使用愉快！** 🎉
