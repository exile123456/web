# 实验五 · Vue.js 基本语法和常用指令

> 完整的实验实现方案与验收说明
> 技术栈：HTML5 + 原生 CSS + JavaScript (ES2015+) + **Vue 3.4.5 全局构建**（`vue.global.js`）+ Node.js（仅静态服务器）
> 交付形态：6 个可独立打开的 HTML 页面 + 1 份零依赖静态服务器 + 1 份自动化验收脚本

---

## 0. 一分钟跑起来

```bash
# 方式一：推荐（本地 HTTP 环境，localStorage / 相对路径行为与生产一致）
node server.js            # 或双击 start-server.bat
# 浏览器打开 http://localhost:5173

# 方式二：直接双击 index.html
# 用 file:// 也能跑，但部分浏览器对本地文件的 localStorage 有限制
```

验证脚本（可选）：

```bash
node server.js            # 先起服务
node tests/cdp-check.js   # 另开一个终端，自动跑 10 条交互用例
```

---

## 1. 实验目标

实验文档给出的三条目的，我把它拆成了可勾选的能力点，避免"看懂了但写不出来"：

| 实验原文 | 拆解后的可验证能力 | 对应交付物 |
| --- | --- | --- |
| 1. 熟悉 Vue.js 开发 | 能在**不用构建工具**的前提下引入 Vue 并挂载应用；理解 CDN / 本地两种引入方式；理解 `vue.global.js` 里"编译器 + 运行时"的含义 | `vendor/vue.global.js`、全部页面的 `<script>` 引入方式 |
| 2. 熟悉 Vue 状态选项式 API 基本语法 | 能说清 `data / methods / computed / watch / mounted` 各自负责什么；能举出 computed 有缓存而 methods 没有的实证 | `01-basic.html` |
| 3. 熟悉 Vue 常用指令及其修饰符 | 能独立写出 `v-text / v-html / v-if / v-else-if / v-else / v-show / v-for / v-bind / v-on / v-model / v-cloak / v-once / v-pre`，并会用 `.prevent / .stop / .once / .enter / .esc / .trim / .number / .lazy` | `02-directives.html` |
| （实验内容 3、4）重构博客首页 | 把实验4 的 DOM 操作式页面改写成数据驱动，且**功能不减**：列表、搜索、留言增删 | `03-blog.html` |
| （实验内容 4）重构应用案例 | 完成 Todolist 的"基础版 → 增强版"两阶段演进 | `04-todolist.html`、`05-todolist-plus.html` |

**一句话目标**：从"取节点 → 改 DOM"的写法，切换到"改数据 → 框架改 DOM"的写法，并能用指令把这件事写得更短。

---

## 2. 完整技术栈

| 层次 | 技术选型 | 版本 | 在本实验中的用途 | 为什么是它 |
| --- | --- | --- | --- | --- |
| 结构 | HTML5 | — | 6 个页面骨架 | 实验要求"在 html 页面中直接引入 js" |
| 样式 | 原生 CSS + CSS 变量 | — | 设计令牌（颜色/圆角/阴影）、组件类、响应式栅格 | 零依赖、可直接随作业提交、便于逐行讲解 |
| 逻辑 | JavaScript ES2015+ | — | 数据处理、事件、`localStorage` | 不引入 TypeScript，降低环境门槛 |
| 框架 | **Vue 3** | **3.4.5** | 选项式 API、指令、响应式系统 | 与实验文档推荐的 `vue@3.4.5` 开发版一致 |
| 引入方式 | 全局构建 `vue.global.js`（IIFE） | 513 KB 开发版 | `<script src="vendor/vue.global.js">` | 含**编译器**，才能写 `template` 式的 DOM 内模板；生产环境应换 `vue.global.prod.js` |
| 运行环境 | Node.js | ≥ 16（本机 22.x） | 静态文件服务器、自动化测试 | 前端零依赖，Node 只承担"起个 http 服务" |
| 包管理 | npm | — | **未使用任何第三方包** | 保证 `node server.js` 拷到任何机器都能跑 |
| 浏览器 API | `localStorage`、`Date`、`Intl` | — | Todolist 持久化、时间格式化 | 原生能力，不引库 |
| 调试 | Chrome / Edge DevTools、Edge Headless（CDP） | — | 控制台排错、DOM 校验、交互回归 | 无头浏览器可脚本化验证 |

**不使用的技术及原因**：

- ❌ Vue CLI / Vite / webpack —— 实验明确要求"直接引入 js"，构建工具会把 `template` 预编译成 render 函数，反而看不清指令的编译过程；
- ❌ Element Plus / Bootstrap —— 会掩盖"自己写模板"的练习目的；
- ❌ axios / fetch 后端 —— 本次实验无接口需求，数据全部来自 `js/data.js`。

> 说明：题面提到"全栈"，但**实验5 本身是纯前端实验**（实验目的三条全部围绕 Vue 语法）。因此本方案的后端只保留一个零依赖静态服务器，负责提供正确的 HTTP 环境；如果后续要把数据换成真实接口，只需把 `js/data.js` 换成 `fetch('/api/articles')`，页面逻辑一行都不用改（见 §6.8 扩展说明）。

---

## 3. 期望交付的功能模块

| 模块 | 文件 | 对应实验步骤 | 覆盖的指令 / 选项 | 核心验收点 |
| --- | --- | --- | --- | --- |
| 实验导航台 | `index.html` | 总览 | `v-for`、`:class`、`v-model`（checkbox） | 5 个演示页入口、指令对照表、可勾选的自检清单（含完成度） |
| ① 选项式 API | `01-basic.html` | 三.2(1)(2) | `data` `methods` `computed` `watch` `mounted` | 计数器；computed 求值次数不随无关重渲染增长；watch 新旧值；挂载后可读尺寸 |
| ② 常用指令全集 | `02-directives.html` | 三.2(3)、三.3 | 11 个指令 + 全部修饰符 | `v-if` 移除节点 / `v-show` 只改 display（DOM 实证）；`v-html` 与 `v-text` 差异；`.prevent/.stop/.once/.enter/.esc`；`.trim/.number/.lazy` |
| ③ 博客首页重构 | `03-blog.html` | 三.4 (1)(2)(3) | `v-for` `v-model` `@keydown.enter` `@submit.prevent` `filter` `computed` `watch` | 文章列表渲染；标题搜索（回车 + 点击，无结果空状态）；留言增删与搜索；重构前后写法对照表 |
| ④ Todolist 基础版 | `04-todolist.html` | 三.4【范例】 | `v-for` `v-model` `@submit.prevent` `@click` `v-if` | 回车添加、点击删除、`共 N 项任务` 统计、空状态 |
| ⑤ Todolist 增强版 | `05-todolist-plus.html` | 实验要求新增 1—4 | 同上 + `computed` 派生统计 + `deep watch` | 完成状态与删除线；编辑按钮 → input；blur/回车保存、Esc 取消；未完成/已完成分类统计；附加筛选、全选、清除已完成、`localStorage` |
| 模拟数据 | `js/data.js` | 三.4 数据来源 | — | 文章 4 篇、留言 3 条、待办 3 条，结构与实验4 一致 |
| 样式系统 | `css/common.css` | — | — | 设计令牌 + 组件类，全站统一 |
| 静态服务器 | `server.js` | 三.1(3) 环境准备 | — | 零依赖、防目录穿越、正确 MIME、禁用缓存 |
| 自动化验收 | `tests/cdp-check.js` | — | — | 驱动真实浏览器跑 10 条交互断言 |

---

## 4. 验收标准

每条都写成"**打开哪个页面 → 做什么 → 看到什么**"，可直接照着打分。

### A. 环境与引入（对应实验三.1）

- [ ] A1 `vendor/vue.global.js` 存在且首行为 `var Vue = (function (exports) {`
- [ ] A2 控制台输出 `[实验5] Vue 版本： 3.4.5`，与 `Vue.version` 一致
- [ ] A3 断网后刷新页面，功能仍正常（证明是本地引入，不是 CDN 兜底）

### B. 选项式 API（对应实验三.2(1)）

- [ ] B1 `01-basic.html` 点 `+ / −` 数字变化，且「最近一次操作」同步显示 `count: 0 → 1`
- [ ] B2 「getter 实际求值次数」= 1；反复点「只触发重渲染」该数字**不增长**（computed 缓存）
- [ ] B3 修改单价/数量后该数字 +1（依赖变化才重算）
- [ ] B4 标题输入框每敲一个字，「触发次数」+1 且 `newTitle/oldTitle` 正确
- [ ] B5 修改「昵称」也能触发深层侦听（`deep: true`），次数增长
- [ ] B6 手机生命周期日志出现 `created → beforeMount → mounted` 三条，`mounted` 时高度 > 0

### C. 指令与修饰符（对应实验三.2(3)、三.3）

- [ ] C1 `v-text` 面板把 `<b>` 当文字显示；`v-html` 面板把它渲染成加粗
- [ ] C2 `v-once` 面板内容在修改输入框后**不再变化**；`v-pre` 面板原样显示 `{{ rawHtml }}`
- [ ] C3 分数滑块拉到 95 → 只显示「优秀」；拉到 30 → 只显示「不及格」；同一时刻只有一个分支在 DOM 里
- [ ] C4 点「切换显示」后：`#box-if 存在` 变 false，`#box-show 存在` 仍为 true（检查结果面板可自证）
- [ ] C5 四种 `v-for`（数组/对象/数字/过滤后数组）都能正确渲染
- [ ] C6 `:class` 对象语法切换 ok/warn/bad 时右侧标签颜色随之变化；`:style` 颜色选择器实时改色块
- [ ] C7 点「点我不会跳转」页面不跳转，事件日志出现记录
- [ ] C8 点内层方块，日志只出现"内层 .stop"一条（外层没收到）
- [ ] C9 `.once` 按钮连点三次，日志只增加一条
- [ ] C10 表单面板：`姓名` 输入 `  张三  ` 后值被 trim；`年龄` 输入框的值类型为 `number`；`v-model.lazy` 的 textarea 失焦后才同步

### D. 博客首页重构（对应实验三.4）

- [ ] D1 文章区渲染 4 张卡片，头部显示「4 篇文章 / 3 条留言 / 1820 次阅读」
- [ ] D2 搜索框输入 `v-if` 回车 → 只剩 1 篇，标题中命中处高亮为黄底
- [ ] D3 搜索 `zzz` → 显示「没有匹配「zzz」的文章」空状态
- [ ] D4 点「清空」→ 恢复 4 篇；搜索历史标签点一下可复用该关键词
- [ ] D5 留言表单：填姓名+内容后回车 → 列表顶部新增一条，计数 +1，输入框清空，出现绿色成功提示
- [ ] D6 只填姓名提交 → 出现红色「留言内容不能为空，不能发空留言」，列表不变
- [ ] D7 内容超过 100 字 → 出现「不能超过 100 字，当前 N 字」拦截
- [ ] D8 点某条留言的「删除」→ 该条消失，`共 N 条` 同步 −1
- [ ] D9 留言搜索框输入「王」→ 只剩王同学的留言
- [ ] D10 查看「实验4 与实验5 写法对照」表，7 组操作都能在页面上找到对应位置

### E. Todolist（对应实验三.4【范例】与新增功能 1—4）

- [ ] E1 输入内容回车 → 新任务出现在列表顶部，输入框清空（`04` 与 `05` 都要满足）
- [ ] E2 输入为空直接回车 → 不产生空任务
- [ ] E3 `04` 点「删除」→ 对应行消失，`共 N 项任务` 同步变化；删空后显示空状态
- [ ] E4 `05` 勾选复选框 → 文字变浅 + 删除线，顶部进度条与「已完成 N」同步
- [ ] E5 `05` 点「编辑」→ 该行 `p/span` 变为 `input` 且自动聚焦全选；改内容后失焦 → 文字更新
- [ ] E6 `05` 编辑时按回车 → 保存；按 Esc → 放弃修改（原值不变）
- [ ] E7 `05` 底部统计同时显示「共 N 项 / 未完成 M / 已完成 K」，且 `M + K = N`
- [ ] E8 `05` 筛选「未完成 / 已完成」只显示对应项，按钮上的数字与统计一致
- [ ] E9 `05` 刷新页面，任务与完成状态保持不变（`localStorage` 键 `lab5-todos`）
- [ ] E10 `05` 点「恢复初始数据」→ 回到 3 条初始任务并清除本地存储

### F. 代码质量

- [ ] F1 每个页面**只有一个** `createApp(...).mount('#app')`
- [ ] F2 根节点带 `v-cloak`，首次加载不出现 `{{ }}` 闪烁
- [ ] F3 控制台**无** `[Vue warn]`、无未捕获异常
- [ ] F4 所有 `v-for` 都带 `:key`，且 key 唯一稳定（用 `id` 而非下标）
- [ ] F5 `03`、`04`、`05` 的删除操作都用 `filter` 生成新数组，而不是操作 DOM

> **自动核对**：`node tests/cdp-check.js` 覆盖了 A2、B2、C4、D2、D3、D5、D8、E1、E5、E7 共 10 个可脚本化的点，当前结果为 **10/10 通过**。

---

## 5. 输出格式

### 5.1 目录结构

```
新建文件夹/
├── index.html                 # 实验导航台（总览 + 指令对照表 + 自检清单）
├── 01-basic.html              # 选项式 API：data / methods / computed / watch / mounted
├── 02-directives.html         # 11 个常用指令 + 修饰符
├── 03-blog.html               # 博客首页三步重构
├── 04-todolist.html           # Todolist 基础版
├── 05-todolist-plus.html      # Todolist 增强版
├── css/
│   └── common.css             # 全站样式（设计令牌 + 组件类）
├── js/
│   └── data.js                # 模拟数据（沿用实验4）
├── vendor/
│   └── vue.global.js          # Vue 3.4.5 开发版（本地引入，513 KB）
├── tests/
│   └── cdp-check.js           # 自动化验收脚本（CDP，零依赖）
├── server.js                  # 零依赖静态服务器
├── start-server.bat           # 一键启动（Windows 双击）
├── README.md                  # 本文件：方案与验收说明
└── 实验报告.md                 # 可直接提交的实验报告
```

### 5.2 命名与编码约定

| 项 | 约定 | 理由 |
| --- | --- | --- |
| 页面文件 | `两位序号-语义名.html` | 与实验步骤同序，答辩时按序号讲 |
| 变量命名 | 状态用名词（`keyword`/`todos`），动作动词开头（`add` / `del` / `saveEdit`） | 模板里一眼能读懂 `@click="del(todo)"` |
| CSS 类名 | 短横线小写，语义化（`.todo-list` / `.msg-item`），状态类用 `.done` `.editing` `.on` | `:class` 绑定时不用拼字符串 |
| 编码 | UTF-8（HTML 已声明 `<meta charset="UTF-8">`） | 避免中文乱码 |
| 缩进 | 2 空格 | 与 Vue 官方风格一致 |
| 注释 | 每段逻辑前用 `/* ---------- 分节 ---------- */`，关键坑位写"为什么" | 便于老师抽查理解深度 |

### 5.3 提交物清单

1. 源码目录（上表全部文件，含 `vendor/`，保证离线可跑）；
2. `实验报告.md`（或转成 PDF）；
3. 运行截图建议 5 张：首页、`02` 指令页、`03` 搜索命中、`05` 编辑态、`05` 分类统计；
4. 控制台截图 1 张（证明无警告 + 打印了 Vue 版本）。

---

## 6. 关键逻辑说明

### 6.1 为什么"直接引一个 js 就能写 Vue"

`vue.global.js` 是 **IIFE 格式的全局构建**，文件第一行就是：

```js
var Vue = (function (exports) { 'use strict'; ... })({})
```

它做了两件事：把 **运行时（runtime）** 和 **编译器（compiler）** 一起打包，执行完挂到 `window.Vue` 上。所以浏览器里能直接：

```js
const { createApp } = Vue
createApp({ ... }).mount('#app')
```

`createApp` 传进去的 `template` 之所以能写 `<div>{{ msg }}</div>` 这种"DOM 内模板"，是因为**编译器在浏览器里现场把 HTML 字符串编译成了 render 函数**。这也是为什么生产环境推荐 `vue.global.prod.js`：生产版仍带编译器，但去掉了警告、体积更小；如果再进一步用 `.runtime.global.js`，就必须配合构建工具预编译模板。

挂载过程：`createApp(options)` 创建应用实例 → `.mount('#app')` 用 `#app` 的 `innerHTML` 作为模板编译 → 生成 render 函数 → 首次渲染 → 建立响应式依赖 → 之后数据变，render 重跑，patch 出最小 DOM 变更。

### 6.2 五个选项的分工（最容易混的地方）

| 选项 | 定位 | 何时执行 | 能否写异步 / 副作用 | 典型误用 |
| --- | --- | --- | --- | --- |
| `data()` | **状态源**：唯一可变数据的产地 | 组件创建时一次 | 返回新对象，不要在这里做请求 | 用外部变量做状态（不是响应式） |
| `methods` | **动作**：由事件或其它方法调用 | 每次调用都执行 | 可以 | 把"派生值"写成方法，导致每次渲染都重算 |
| `computed` | **派生状态**：由已有状态算出 | 依赖变化时才算，结果被缓存 | **不应有副作用** | 在 getter 里改 `data`（本实验用 `setTimeout` 记录次数专门绕开了这个坑） |
| `watch` | **副作用**：数据变了要"额外做点事" | 被侦听的值变化后，异步批处理 | 可以（发请求、存本地） | 用 watch 去算派生值，多维护一份状态 |
| `mounted` | **生命周期**：DOM 已就绪 | 挂载完成后 | 可以（读尺寸、起定时器） | 在 `created` 里读 DOM 尺寸（拿不到） |

`01-basic.html` 里 `computed` 与 `methods` 的对照就是这条结论的证据：两者都返回 `price * qty`，但只有 computed 的求值次数不随"无关变量变化引起的重渲染"增长。

### 6.3 指令的本质：编译期语法糖

| 写法 | 编译后大致等价于 | 说明 |
| --- | --- | --- |
| `v-bind:title="x"` / `:title="x"` | `el.setAttribute('title', x)` | 属性值变则 patch 更新 |
| `v-on:click="fn"` / `@click="fn"` | `el.addEventListener('click', fn)` | 修饰符在编译期被转成包裹逻辑 |
| `@click.prevent` | `e => { e.preventDefault(); fn(e) }` | 所以不需要自己写 `e.preventDefault()` |
| `@click.stop` | `e => { e.stopPropagation(); fn(e) }` | 阻止冒泡，等价"事件不再往外传" |
| `@keyup.enter` | 带 `key === 'Enter'` 判断的 handler | 按键修饰符是 keyCode/键名的语法糖 |
| `v-model="msg"` | `:value="msg"` + `@input="msg = $event.target.value"` | 本质是"单向绑定 + 事件回写"的组合糖；checkbox 绑定的是 `checked` |
| `v-if` | 三元表达式 + `createBlock`，假值时**销毁节点** | 切换有创建/销毁成本 |
| `v-show` | `style.display = cond ? '' : 'none'` | 节点一直在，首屏渲染成本更高 |
| `v-for` | `renderList(list, item => ...)` | `:key` 参与 diff，决定节点复用 |

理解了这一层，`02-directives.html` 里所有面板就不需要死记，都是同一套机制的排列组合。

### 6.4 博客搜索：为什么要 `keyword` + `activeKeyword` 两个变量

实验文档的写法是"输入框绑 `keyword`，回车后过滤"。如果直接让 `computed` 依赖 `keyword`，输入第一个字列表就变了，回车反而没意义。所以拆成：

```
输入框 ──v-model──> keyword          （用户正在打的字，每敲一下都变，watch 负责记录）
                        │
                        │ @keydown.enter / @click → search()
                        ▼
                   activeKeyword     （真正生效的筛选词，只在"提交"时被赋值）
                        │
                        ▼
              computed filteredArticles  →  v-for 渲染
```

三层职责清晰：**data 存状态 → methods 处理交互 → computed 算派生 → watch 记日志**。这也解释了"为什么 watch 里不直接过滤"：watch 适合做副作用（写日志、发请求），不适合承担渲染数据源。

### 6.5 留言：`@submit.prevent` 与 `filter` 删除

```html
<form @submit.prevent="addMessage">   <!-- 拦住默认提交，页面不刷新 -->
```

`<form>` 里按回车会触发原生 submit（等价点击 submit 按钮），所以**不需要额外监听键盘**，这是最省事的"回车提交"写法。

删除用不可变方式：

```js
this.messages = this.messages.filter(m => m.id !== id)
```

对比"找到 DOM 节点再 `removeChild`"：前者只改数据，Vue 自己 diff 出要删的节点；后者一旦数据和 DOM 不同步（比如同时有筛选），就会出现"删了 A 显示 B"。

### 6.6 Todolist 编辑态：三个必须处理的细节

1. **不要直接 `v-model` 绑 `todo.text`**，否则用户改到一半按 Esc，原值已经被改了。正确做法是绑临时副本 `editingText`，保存时才写回。
2. **`blur` 与 `enter` 会双触发**：回车保存后 `input` 被销毁，浏览器仍会派发一次 `blur`。所以 `saveEdit` 必须幂等 —— 先判断 `editingId === todo.id`，处理过一次就把 `editingId` 置空，第二次直接 return。
3. **`input` 是渲染后才存在的**，所以聚焦要放在 `$nextTick` 里：

```js
this.editingId = todo.id
this.$nextTick(() => {
  const el = this.$el.querySelector('.edit-input')
  el && el.focus()
})
```

统计同理，不额外维护 `doneCount`，而是 `computed` 从 `todos` 派生 `{ total, done, active }`，从根上消灭"删了任务但统计没减"的 bug。

### 6.7 踩过的坑（都在代码注释里标注了）

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| 整页空白，控制台报 `Cannot read properties of undefined (reading 'text')` | `<pre><code>` 里演示用的 `{{ todo.text }}` **没被转义**，被模板编译器当成真实插值，在 `v-for` 作用域外执行 | 给代码块加 `v-pre`，让编译器整体跳过 |
| `el.getBoundingClientRect is not a function` | 组件有多个根节点时 `this.$el` 是 **Fragment 的首个节点（可能是注释占位）**，不是元素 | 用 `document.getElementById('app')` 取挂载容器 |
| `Maximum recursive updates exceeded` | 在 `computed` getter 或 `updated` 钩子里**同步修改响应式数据**，形成 求值→更新→再求值 的循环 | computed 里用 `setTimeout` 异步登记计数；DOM 更新后的日志改用 `$nextTick` |
| `{{ }}` 在页面上闪一下才消失 | 模板未编译前就显示了原始文本 | 根节点加 `v-cloak`，CSS `[v-cloak]{display:none}` |
| `v-for` 出来的输入框输入内容会"串行" | 没写 `:key` 或用下标做 key，diff 时就地复用 | `:key="item.id"`，key 唯一且稳定 |
| 修改对象属性 watch 不触发 | 侦听的是对象引用，引用没变 | `deep: true` |

### 6.8 如果想继续扩展（超出本次实验要求）

- **换成真实接口**：把 `js/data.js` 改为 `fetch('/api/articles')`，`data()` 里先给空数组，`mounted` 里拉取；页面模板完全不用改。
- **后端化**：`server.js` 加 3 个路由即可成为 REST 雏形（`GET /api/articles`、`POST /api/messages`、`DELETE /api/messages/:id`），持久化换成 MySQL/SQLite；
- **组件化**：把文章卡片、留言项抽成 `components/ArticleCard.js`（`app.component('article-card', {...})`），体会"组件是可复用的 Vue 实例"；
- **组合式 API**：同一份逻辑用 `setup() + ref/computed/watch` 重写一遍，对比两种 API 的可读性 —— 这也是下一个实验的天然衔接点。

---

## 7. 验证记录

| 检查项 | 方法 | 结果 |
| --- | --- | --- |
| 6 个页面可访问 | `curl` 逐页请求 | 全部 200 |
| Vue 是否真的挂载 | Edge Headless `--dump-dom` | 各页渲染出真实数据（4 篇文章 / 3 条留言 / 3 条待办） |
| 控制台是否有警告 | `--enable-logging=stderr` | 除各页 `console.log` 外**无 Vue warn、无异常** |
| 交互是否正确 | `tests/cdp-check.js`（CDP 驱动真实点击/输入） | **10 / 10 通过** |
| 视觉是否正常 | 1280px 视口截图逐页目检 | 无重叠、无溢出、无错位 |

**已知限制**（如实说明）：

1. 数据是内存 + `localStorage`，清缓存即丢失，没有后端；
2. 留言/文章没有分页、没有路由，属于单页多文件结构，不是 SPA 路由方案；
3. 引入了 513 KB 的开发版 Vue，仅适合教学；生产应换 `vue.global.prod.js` 或用构建工具预编译；
4. 自动化脚本依赖本机 Edge 路径，换机器需改 `tests/cdp-check.js` 顶部的 `EDGE` 常量。
