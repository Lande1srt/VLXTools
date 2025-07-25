// 添加搜索功能
function setupSearch() {
    const searchInput = document.getElementById('tool-search');
    const menuContainer = document.getElementById('tool-menu');
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const menuItems = document.querySelectorAll('#tool-menu > .mb-1');
        
        menuItems.forEach(item => {
            const itemName = item.querySelector('button span').textContent.toLowerCase();
            const subItems = item.querySelectorAll('.sub-menu .mb-1');
            let hasMatch = false;

            if (subItems.length > 0) {
                subItems.forEach(subItem => {
                    const subItemName = subItem.querySelector('button span').textContent.toLowerCase();
                    if (subItemName.includes(searchTerm)) {
                        subItem.style.display = '';
                        hasMatch = true;
                    } else {
                        subItem.style.display = 'none';
                    }
                });
            }

            if (itemName.includes(searchTerm)) {
                hasMatch = true;
            }

            if (searchTerm) {
                item.style.display = hasMatch ? '' : 'none';
                if (subItems.length > 0 && hasMatch) {
                    item.querySelector('button').style.display = 'none';
                    const subMenu = item.querySelector('.sub-menu');
                    subMenu.classList.remove('hidden');
                    subMenu.style.maxHeight = 'none';
                    subMenu.style.opacity = '1';
                }
            } else {
                item.style.display = '';
                if (subItems.length > 0) {
                    item.querySelector('button').style.display = '';
                    const subMenu = item.querySelector('.sub-menu');
                    subMenu.classList.add('hidden');
                    subMenu.style.maxHeight = '0';
                    subMenu.style.opacity = '0';
                }
            }
        });
    });
}

// 统一打开侧边栏方法（供原生按钮和iframe调用）
function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('menu-toggle');
    const toggleIcon = toggleBtn?.querySelector('i');
    
    // 已打开则返回
    if (!sidebar.classList.contains('hidden')) return;

    // 初始化动画样式
    if (!sidebar.style.transition) {
        sidebar.style.transition = 'all 0.3s ease-in-out';
        sidebar.style.overflowY = 'auto';
        sidebar.style.width = '0';
        sidebar.style.transform = 'translateX(0)';
    }

    // 重置状态
    sidebar.classList.remove('hidden');
    sidebar.classList.add('fixed', 'z-20', 'h-full');
    sidebar.style.width = '0'; // 从0开始
    if (toggleIcon) {
        toggleIcon.style.transition = 'transform 0.3s ease-in-out';
        toggleIcon.style.transform = 'rotate(0)';
    }

    // 强制重绘
    void sidebar.offsetWidth;

    // 执行展开动画
    setTimeout(() => {
        sidebar.style.width = '280px';
        if (toggleIcon) toggleIcon.style.transform = 'rotate(180deg)';
    }, 10);

    // 移动设备添加遮罩
    if (isMobileDevice()) {
        addOverlay();
    }
}

// 菜单切换按钮功能
document.getElementById('menu-toggle').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar.classList.contains('hidden')) {
        // 打开侧边栏
        openSidebar();
    } else {
        // 收起侧边栏
        closeSidebar();
    }
});

// 移动设备检测
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 添加遮罩层
function addOverlay() {
    removeOverlay(); // 先移除已存在的
    
    const overlay = document.createElement('div');
    overlay.id = 'menu-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.2);
        z-index: 10;
        transition: opacity 0.3s ease;
        opacity: 0;
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => overlay.style.opacity = '1', 10);
    
    overlay.addEventListener('click', () => {
        closeSidebar();
        const toggleIcon = document.querySelector('#menu-toggle i');
        if (toggleIcon) toggleIcon.style.transform = 'rotate(0)';
    });
}

// 移除遮罩层
function removeOverlay() {
    const overlay = document.getElementById('menu-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    }
}

// 收起菜单方法
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.querySelector('#menu-toggle i');
    
    if (sidebar.classList.contains('hidden')) return;

    // 执行收起动画
    sidebar.style.width = '0';
    if (toggleIcon) toggleIcon.style.transform = 'rotate(0)';

    // 动画结束后处理
    setTimeout(() => {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('fixed', 'z-20', 'h-full');
        if (isMobileDevice()) {
            removeOverlay();
        }
    }, 300);
}

// 检测图片是否可访问且为图片类型
async function isImageUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
        if (!response.ok) return false;
        const contentType = response.headers.get('Content-Type');
        return contentType && contentType.startsWith('image/');
    } catch {
        return false;
    }
}

// 生成图标HTML
function getIconHtml(icon) {
    const baseStyle = 'width:22px;height:22px;flex-shrink:0;background-color:#ffe2ff;border-radius:4px;padding:2px;border:1px solid #00e2ff';
    
    if (!icon) {
        return `<i class="fa fa-cog" style="${baseStyle}"></i>`;
    }
    
    if (typeof icon === 'string' && (icon.startsWith('http://') || icon.startsWith('https://'))) {
        const tempId = 'icon-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const loadingHtml = `<i class="fa fa-spinner fa-spin" style="${baseStyle}"></i>`;
        
        isImageUrl(icon).then(isValidImage => {
            const container = document.getElementById(tempId);
            if (container) {
                container.outerHTML = isValidImage 
                    ? `<img src="${icon}" style="${baseStyle} object-fit:contain;" onError="this.outerHTML='<i class=\'fa fa-cog\' style=\'${baseStyle}\'></i>'" alt="icon">`
                    : `<i class="fa fa-cog" style="${baseStyle}"></i>`;
            }
        });
        
        return `<span id="${tempId}">${loadingHtml}</span>`;
    }
    
    if (typeof icon === 'string' && icon.startsWith('fa-')) {
        return `<i class="fa ${icon}" style="${baseStyle}"></i>`;
    }
    
    return `<div style="${baseStyle}">${icon}</div>`;
}

// 递归渲染菜单项
function renderMenuItems(items, container) {
    items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'mb-1';

        const menuButton = document.createElement('button');
        menuButton.className = 'w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between';
        
        menuButton.innerHTML = `
            <div class="flex items-center">
                ${getIconHtml(item.icon)}
                <span class="ml-3">${item.name}</span>
            </div>
            ${item.children ? '<i class="fa fa-chevron-down text-xs text-gray-400 transition-transform duration-200"></i>' : ''}
        `;

        menuItem.appendChild(menuButton);

        if (item.children && item.children.length > 0) {
            menuButton.addEventListener('click', function(e) {
                e.stopPropagation();
                const subMenu = menuItem.querySelector('.sub-menu');
                const icon = menuButton.querySelector('.fa-chevron-down');
                
                if (subMenu) {
                    if (subMenu.classList.contains('hidden')) {
                        subMenu.classList.remove('hidden');
                        subMenu.style.opacity = '0';
                        const height = subMenu.scrollHeight + 10;
                        subMenu.style.maxHeight = height + 'px';
                        void subMenu.offsetWidth;
                        subMenu.style.opacity = '1';
                        if (icon) icon.classList.add('rotate-180');
                    } else {
                        subMenu.style.opacity = '0';
                        subMenu.style.maxHeight = '0';
                        if (icon) icon.classList.remove('rotate-180');
                        setTimeout(() => subMenu.classList.add('hidden'), 300);
                    }
                }
            });

            const subMenu = document.createElement('div');
            subMenu.className = 'sub-menu hidden pl-6 mt-1 space-y-1 transition-all duration-300 ease-in-out';
            subMenu.style.maxHeight = '0';
            subMenu.style.overflow = 'hidden';
            menuItem.appendChild(subMenu);
            renderMenuItems(item.children, subMenu);
        } else {
            menuButton.addEventListener('click', function(e) {
                e.stopPropagation();
                document.querySelectorAll('#tool-menu .menu-active').forEach(el => el.classList.remove('menu-active'));
                this.classList.add('menu-active');
                if (item.url) document.getElementById('tool-iframe').src = item.url;
                if (isMobileDevice()) closeSidebar();
            });
        }

        container.appendChild(menuItem);
    });
}

// 初始化搜索功能
setupSearch();

// 从JSON文件加载菜单
async function loadMenu() {
    try {
        const response = await fetch('menu.json');
        const menuItems = await response.json();
        const menuContainer = document.getElementById('tool-menu');
        menuContainer.innerHTML = '';
        renderMenuItems(menuItems, menuContainer);
    } catch (error) {
        console.error('加载菜单失败:', error);
        document.getElementById('tool-menu').innerHTML = `
            <div class="text-center py-10 text-red-500">
                <i class="fa fa-exclamation-circle text-2xl mb-2"></i>
                <p>菜单加载失败</p>
            </div>
        `;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadMenu();
    
    // 初始化侧边栏样式
    const sidebar = document.getElementById('sidebar');
    sidebar.style.height = '100vh';
    sidebar.style.overflowY = 'auto';
    sidebar.style.scrollbarWidth = 'thin';
    sidebar.style.scrollbarColor = '#ccc transparent';
});