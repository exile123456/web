// ===================== 工具函数：本地存储封装 =====================
// 对应实验步骤 3：保存留言信息到本地
function saveToLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getFromLocal(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// ===================== 1. 动态加载文章列表 =====================
// 对应实验步骤 1：通过模板字符串+innerHTML实现
function renderData(data = articles) {
  const articleList = document.getElementById('article-list');
  
  // 文章为空则显示提示信息
  if (data.length === 0) {
    articleList.innerHTML = '<div class="empty-tip">暂无相关文章</div>';
    return;
  }

  let html = '';
  data.forEach(article => {
    html += `
      <article class="article-card">
        <div class="article-meta">
          <time>${article.date}</time>
          <span style="margin-left:10px;color:#3498db">${article.category}</span>
        </div>
        <h3>${article.title}</h3>
        <p>${article.summary}</p>
      </article>
    `;
  });
  articleList.innerHTML = html;
}

// ===================== 2. 显示留言信息 =====================
// 对应实验步骤 2：通过 createElement + append 方式实现
let messages = getFromLocal('blog_messages');

function renderMessage() {
  const messageList = document.getElementById('message-list');
  messageList.innerHTML = ''; // 清空原有列表

  messages.forEach(msg => {
    // 创建列表项
    const li = document.createElement('li');
    li.className = 'message-item';

    // 创建留言内容容器
    const contentDiv = document.createElement('div');
    
    const userP = document.createElement('p');
    userP.className = 'message-user';
    userP.textContent = msg.userName;

    const contentP = document.createElement('p');
    contentP.className = 'message-content';
    contentP.textContent = msg.content;

    contentDiv.appendChild(userP);
    contentDiv.appendChild(contentP);

    // 创建删除按钮（选做功能）
    const delBtn = document.createElement('button');
    delBtn.className = 'del-btn';
    delBtn.textContent = '删除';
    delBtn.onclick = function() {
      deleteMessage(msg.messageId);
    };

    li.appendChild(contentDiv);
    li.appendChild(delBtn);
    messageList.appendChild(li);
  });
}

// ===================== 留言提交逻辑 =====================
document.getElementById('messageForm').addEventListener('submit', function(e) {
  e.preventDefault(); // 阻止表单默认提交

  const userName = document.getElementById('userName').value.trim();
  const content = document.getElementById('userMessage').value.trim();

  // 非空验证
  if (!userName || !content) {
    alert('昵称和留言内容不能为空');
    return;
  }

  // 构造留言对象，生成唯一ID
  const newMsg = {
    messageId: Date.now(),
    userName: userName,
    content: content
  };

  messages.push(newMsg);
  saveToLocal('blog_messages', messages); // 保存到本地
  renderMessage(); // 重新渲染DOM

  // 清空输入框
  document.getElementById('userName').value = '';
  document.getElementById('userMessage').value = '';
});

// ===================== 选做：删除指定留言 =====================
function deleteMessage(id) {
  // 通过filter筛选掉对应id的留言
  messages = messages.filter(item => item.messageId !== id);
  saveToLocal('blog_messages', messages); // 更新本地存储
  renderMessage(); // 重新渲染
}

// ===================== 4. 文章搜索功能 =====================
document.getElementById('searchBtn').addEventListener('click', function() {
  const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
  const category = document.getElementById('categorySelect').value;

  // 联合筛选：标题关键词 + 分类
  const result = articles.filter(article => {
    const titleMatch = article.title.toLowerCase().includes(keyword);
    const categoryMatch = category ? article.category === category : true;
    return titleMatch && categoryMatch;
  });

  renderData(result); // 用筛选结果重新渲染
  document.getElementById('searchInput').value = ''; // 清空输入框
});

// 分类下拉框切换时也触发筛选
document.getElementById('categorySelect').addEventListener('change', function() {
  document.getElementById('searchBtn').click();
});

// ===================== 自行拓展：定时器实现公告轮播 =====================
const noticeList = [
  '欢迎来到我的个人博客~',
  '本站支持留言功能，欢迎交流',
  '文章支持关键词+分类搜索',
  '留言数据自动保存到本地，刷新不丢失'
];
let noticeIndex = 0;
const noticeBar = document.getElementById('noticeBar');

// setInterval 周期性执行
setInterval(() => {
  noticeIndex = (noticeIndex + 1) % noticeList.length;
  noticeBar.textContent = noticeList[noticeIndex];
}, 2000);

// ===================== 页面初始化 =====================
window.onload = function() {
  renderData();       // 渲染文章列表
  renderMessage();    // 渲染留言列表（从本地读取恢复）
};
