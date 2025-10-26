// 监听iframe消息（带域名验证和设备判断）
window.addEventListener('message', function(event) {
    // 验证消息来源域名
    const allowedOrigins = ['http://localhost:7700','https://vl-x.vip','https://vlx.isea.dev','http://127.0.0.1:5500'];
    if (!allowedOrigins.includes(event.origin)) {
        console.warn('忽略来自未授权域名的消息:', event.origin);
        return;
    }

    if (!isMobileDevice()) {
        return; // PC端不响应
    }

    // 3. 验证消息并执行操作
    if (event.data && event.data.action === 'openSidebar') {
        openSidebar(); // 调用统一打开方法
    }
});