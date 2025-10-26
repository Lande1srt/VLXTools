// 搜索功能
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
                    subMenu.style.maxHeight = '300px';
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
    const contentOverlay = document.getElementById('content-overlay');
    
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
    sidebar.style.width = '0'; 
    if (toggleIcon) {
        toggleIcon.style.transition = 'transform 0.3s ease-in-out';
        toggleIcon.style.transform = 'rotate(0)';
    }

    // 强制重绘
    void sidebar.offsetWidth;

    // 执行展开动画 - PC端宽度为视口的1/4（最小320px），移动端保持280px
    setTimeout(() => {
        if (isMobileDevice()) {
            sidebar.style.width = '280px';
        } else {
            // 计算1/4视口宽度，但不小于320px
            const sidebarWidth = Math.max(window.innerWidth / 4, 320);
            sidebar.style.width = `${sidebarWidth}px`;
            // PC端显示内容区域遮罩
            if (contentOverlay) {
                contentOverlay.style.display = 'block';
            }
        }
        if (toggleIcon) toggleIcon.style.transform = 'rotate(180deg)';
        
        // 仅在PC端移动菜单按钮到侧边栏宽度位置
        if (!isMobileDevice() && toggleBtn) {
            toggleBtn.style.left = sidebar.style.width;
        }
    }, 10);

    // 移动设备添加遮罩
    if (isMobileDevice()) {
        addOverlay();
    }
}

// 窗口大小变化时调整侧边栏宽度和菜单按钮位置
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('menu-toggle');
    
    // 检查是否为移动设备
    const isMobile = isMobileDevice();
    
    // 如果侧边栏已展开且在PC端
    if (!sidebar.classList.contains('hidden') && !isMobile) {
        // 计算1/4视口宽度，但不小于320px
        const sidebarWidth = Math.max(window.innerWidth / 4, 320);
        const newWidth = `${sidebarWidth}px`;
        sidebar.style.width = newWidth;
        
        // 同步更新菜单按钮位置（仅PC端）
        if (toggleBtn) {
            toggleBtn.style.left = newWidth;
        }
    } else if (isMobile && toggleBtn) {
        // 移动端时重置按钮位置
        toggleBtn.style.left = '';
    }
});

// 页面加载时，初始化侧边栏和内容区域点击事件
document.addEventListener('DOMContentLoaded', function() {
    // 初始化内容区域点击事件
    const contentOverlay = document.getElementById('content-overlay');
    if (contentOverlay) {
        contentOverlay.addEventListener('click', () => {
            closeSidebar();
        });
    }
    
    // 根据设备类型初始化菜单按钮位置
    const toggleBtn = document.getElementById('menu-toggle');
    if (toggleBtn) {
        if (isMobileDevice()) {
            // 移动端按钮位置由CSS控制
            toggleBtn.style.left = '';
        } else {
            // PC端按钮初始位置
            toggleBtn.style.left = '0';
        }
    }
    
    // PC端默认展开侧边栏
    if (!isMobileDevice()) {
        setTimeout(() => {
            openSidebar();
        }, 100);
    }
});

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

// 键盘快捷键 ALT+A 控制侧边栏
document.addEventListener('keydown', function(event) {
    // 检查是否按下 ALT+A
    if (event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault(); // 阻止默认行为
        
        const sidebar = document.getElementById('sidebar');
        
        if (sidebar.classList.contains('hidden')) {
            // 打开侧边栏
            openSidebar();
        } else {
            // 收起侧边栏
            closeSidebar();
        }
    }
});

// 移动设备检测
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 添加遮罩层
function addOverlay() {
    removeOverlay(); // 移除已存在的
    
    const overlay = document.createElement('div');
    overlay.id = 'menu-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.3);
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
    const toggleBtn = document.getElementById('menu-toggle');
    const toggleIcon = toggleBtn?.querySelector('i');
    const contentOverlay = document.getElementById('content-overlay');
    
    if (sidebar.classList.contains('hidden')) return;

    // 执行收起动画
    sidebar.style.width = '0';
    if (toggleIcon) toggleIcon.style.transform = 'rotate(0)';
    
    // 仅在PC端重置菜单按钮位置
    if (!isMobileDevice() && toggleBtn) {
        toggleBtn.style.left = '0';
    }
    
    // 隐藏内容区域遮罩
    if (contentOverlay) {
        contentOverlay.style.display = 'none';
    }

    // 动画结束后处理
    setTimeout(() => {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('fixed', 'z-20', 'h-full');
        
        if (isMobileDevice()) {
            removeOverlay();
        }
        
        // 收起时重置所有子菜单状态
        document.querySelectorAll('.sub-menu').forEach(subMenu => {
            subMenu.classList.add('hidden');
            subMenu.style.maxHeight = '0';
            subMenu.style.opacity = '0';
        });
        document.querySelectorAll('.fa-chevron-down').forEach(icon => {
            icon.classList.remove('rotate-180');
        });
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
                        subMenu.style.maxHeight = '0'; 
                        void subMenu.offsetWidth; 
                        subMenu.style.maxHeight = '2000px';
                        subMenu.style.opacity = '1';
                        if (icon) icon.classList.add('rotate-180');
                    } else {
                        // 收起子菜单
                        subMenu.style.opacity = '0';
                        subMenu.style.maxHeight = '0';
                        if (icon) icon.classList.remove('rotate-180');
                        setTimeout(() => subMenu.classList.add('hidden'), 300);
                    }
                }
            });

            // 创建子菜单：添加垂直滚动样式（核心修复）
            const subMenu = document.createElement('div');
            subMenu.className = 'sub-menu hidden pl-6 mt-1 space-y-1 transition-all duration-300 ease-in-out';
            subMenu.style.maxHeight = '0';
            subMenu.style.overflow = 'hidden';
            subMenu.style.overflowY = 'auto'; 
            menuItem.appendChild(subMenu);
            
            // 递归渲染子菜单内容（确保子项正确显示）
            renderMenuItems(item.children, subMenu);
        } else {
            // 最后一级菜单点击逻辑
            menuButton.addEventListener('click', function(e) {
                e.stopPropagation();
                // 移除其他菜单的激活状态
                document.querySelectorAll('#tool-menu .menu-active').forEach(el => el.classList.remove('menu-active'));
                this.classList.add('menu-active');
                // 加载iframe内容
                if (item.url) {
                    document.getElementById('tool-iframe').src = item.url;
                    // 更新URL参数，避免刷新丢失当前路径
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('tool', item.url);
                    history.pushState({}, '', newUrl);
                }
                // 移动设备点击后收起侧边栏
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
        setupMenuItemClickHandlers(); // 添加点击处理函数
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

// 添加工具项点击处理函数
function setupMenuItemClickHandlers() {
    // 等待菜单渲染完成后添加事件监听
    setTimeout(() => {
        // 选择所有工具链接（包括按钮和a标签）
        const toolButtons = document.querySelectorAll('#tool-menu button');
        const toolLinks = document.querySelectorAll('#tool-menu a');
        
        // 为按钮添加点击事件（排除有下拉菜单的按钮）
        toolButtons.forEach(button => {
            if (!button.querySelector('.fa-chevron-down')) {
                button.addEventListener('click', () => {
                    closeSidebar(); // 无论PC还是移动端都收起侧边栏
                });
            }
        });
        
        // 为a标签链接添加点击事件
        toolLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeSidebar(); // 无论PC还是移动端都收起侧边栏
            });
        });
    }, 500);
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