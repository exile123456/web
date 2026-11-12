/* ============================================================
   实验5 · js/data.js
   模拟数据文件（沿用"实验4 博客首页"的数据结构，单独抽出便于复用）
   ------------------------------------------------------------------
   设计要点：
   1) 使用 IIFE + window 挂载，避免污染全局；脚本用 <script> 引入即可
      （与 vue.global.js 的全局构建方式保持一致，无需打包工具）
   2) 数据结构刻意保留 id / title / summary / author / date / tags / content
      七个字段，方便 v-for 时演示 :key 与嵌套指令
   ============================================================ */
window.BLOG_DATA = (function () {
  'use strict';

  /** 站点元信息 */
  const site = {
    name: '山城笔记',
    subtitle: '一个用于 Vue.js 指令练习的前端博客',
    author: '陈燃',
    since: 2026
  };

  /** 博客文章（4 篇，覆盖不同标签组合） */
  const articles = [
    {
      id: 1,
      title: '从原生 DOM 到 Vue：为什么我不再手写 innerHTML',
      summary: '用实验4 的写法手动拼接字符串渲染列表，对比 Vue 的声明式渲染，理解"数据驱动视图"到底省了什么。',
      author: '陈燃',
      date: '2026-09-12',
      tags: ['Vue', '基础'],
      views: 328
    },
    {
      id: 2,
      title: '选项式 API 的五个格子：data / methods / computed / watch / mounted',
      summary: '把 createApp 的参数当成一张表格来记：谁负责状态、谁负责动作、谁负责派生、谁负责副作用。',
      author: '陈燃',
      date: '2026-09-28',
      tags: ['Vue', '选项式 API'],
      views: 512
    },
    {
      id: 3,
      title: 'v-if 与 v-show 的取舍：一次真实的渲染开销测试',
      summary: '同样切换 1000 次显示状态，v-if 反复销毁重建 DOM，v-show 只改 display，结果差了三倍。',
      author: '陈燃',
      date: '2026-10-15',
      tags: ['Vue', '指令', '性能'],
      views: 774
    },
    {
      id: 4,
      title: '用 v-model 修复一个"输入框卡顿"的老页面',
      summary: '原生 input 事件里同步状态，再回写 DOM，形成回环；换成 v-model 双向绑定后逻辑少了一半。',
      author: '陈燃',
      date: '2026-11-02',
      tags: ['Vue', '表单'],
      views: 206
    }
  ];

  /** 博客留言（含 id，便于用 filter 按 id 删除） */
  const messages = [
    {
      id: 1001,
      name: '李同学',
      content: '第三篇的对比测试很有启发，能不能补一下 v-if 在列表里频繁切换的坑？',
      time: '2026-11-03 09:24'
    },
    {
      id: 1002,
      name: '王同学',
      content: '按实验步骤跑通了，v-for 记得写 :key，不然控制台会警告。',
      time: '2026-11-05 16:40'
    },
    {
      id: 1003,
      name: '赵同学',
      content: '留言板用 @submit.prevent 之后页面终于不刷新了，之前一直以为是自己代码写错。',
      time: '2026-11-07 20:12'
    }
  ];

  /** 待办任务初始数据（Todolist 演示用，可为空数组） */
  const todos = [
    { id: 1, text: '复习 v-for 的 :key 用法', done: true },
    { id: 2, text: '完成博客首页的标题搜索', done: false },
    { id: 3, text: '把 Todolist 加上编辑功能', done: false }
  ];

  return { site, articles, messages, todos };
})();
