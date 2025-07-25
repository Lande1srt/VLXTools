// 在iframe页面中动态生成按钮并控制显示逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 检测是否为移动设备
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // 创建按钮元素
    const openMenuBtn = document.createElement('button');
    openMenuBtn.id = 'opmenua'; // 按钮id
    openMenuBtn.textContent = '打开菜单'; // 按钮文字（可自定义）
    
    // 设置按钮样式（固定在左下角，仅移动端可见）
    openMenuBtn.style.cssText = `
        position: fixed;
        left: 40%;
        bottom: 20%;
        z-index: 999;
        padding: 10px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        cursor: pointer;
        display: ${isMobile() ? 'block' : 'none'}; /* 移动端显示，PC端隐藏 */
    `;

    // 添加点击事件：通知父页面打开侧边栏
    openMenuBtn.addEventListener('click', function() {
        window.parent.postMessage({ action: 'openSidebar' }, '*');
    });

    // 将按钮添加到页面中
    document.body.appendChild(openMenuBtn);

    // 监听窗口尺寸变化，动态切换显示状态
    window.addEventListener('resize', function() {
        openMenuBtn.style.display = isMobile() ? 'block' : 'none';
    });
});