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

            // 检查子菜单是否匹配
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

            // 检查当前菜单项是否匹配
            if (itemName.includes(searchTerm)) {
                hasMatch = true;
            }

            if (searchTerm) {
                if (hasMatch) {
                    item.style.display = '';
                    // 搜索模式下不显示一级菜单，只显示匹配的子菜单
                    if (subItems.length > 0) {
                        item.querySelector('button').style.display = 'none';
                        const subMenu = item.querySelector('.sub-menu');
                        subMenu.classList.remove('hidden');
                        subMenu.style.maxHeight = 'none';
                        subMenu.style.opacity = '1';
                    }
                } else {
                    item.style.display = 'none';
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

// 菜单切换按钮功能
document.getElementById('menu-toggle').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    
    // 初始化动画样式（仅首次执行）
    if (!sidebar.style.transition) {
        sidebar.style.transition = 'all 0.3s ease-in-out';
        sidebar.style.overflow = 'hidden';
        sidebar.style.width = sidebar.classList.contains('hidden') ? '0' : sidebar.offsetWidth + 'px';
        sidebar.style.transform = 'translateX(0)';
    }

    if (sidebar.classList.contains('hidden')) {
        // 展开菜单
        sidebar.classList.remove('hidden');
        sidebar.classList.add('fixed', 'z-20', 'h-full');
        // 强制重绘后设置宽度触发动画
        setTimeout(() => {
            sidebar.style.width = '280px'; // 菜单宽度
        }, 10);
        // 移动设备添加遮罩层
        if (isMobileDevice()) {
            addOverlay();
        }
    } else {
        // 收起菜单
        closeSidebar();
    }
});

// 移动设备检测
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 添加遮罩层
function addOverlay() {
    // 移除已存在的遮罩
    removeOverlay();
    
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
    
    // 触发淡入动画
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
    
    // 点击遮罩收起菜单
    overlay.addEventListener('click', closeSidebar);
}

// 移除遮罩层
function removeOverlay() {
    const overlay = document.getElementById('menu-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    }
}

// 收起菜单统一方法
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar.classList.contains('hidden')) {
        sidebar.style.width = '0';
        // 动画结束后处理
        setTimeout(() => {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('fixed', 'z-20', 'h-full');
            // 移动设备移除遮罩
            if (isMobileDevice()) {
                removeOverlay();
            }
        }, 300);
    }
}

// 初始化搜索功能
setupSearch();

// 从JSON文件加载菜单（保持不变）
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

// 递归渲染菜单项（保持不变）
function renderMenuItems(items, container) {
    items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'mb-1';

        // 菜单项按钮
        const menuButton = document.createElement('button');
        menuButton.className = 'w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between';
        menuButton.innerHTML = `
            <div class="flex items-center">
                <i class="fa ${item.icon || 'fa-cog'} mr-3"></i>
                <span>${item.name}</span>
            </div>
            ${item.children ? '<i class="fa fa-chevron-down text-xs text-gray-400 transition-transform duration-200"></i>' : ''}
        `;

        // 先添加按钮到菜单项
        menuItem.appendChild(menuButton);

        // 如果有子菜单，添加展开/折叠功能
        if (item.children && item.children.length > 0) {
            menuButton.addEventListener('click', function(e) {
                // 阻止事件冒泡，避免触发遮罩层点击
                e.stopPropagation();
                
                const subMenu = menuItem.querySelector('.sub-menu');
                if (subMenu) {
                    const menuItemEl = menuButton.closest('.mb-1');
                    if (subMenu.classList.contains('hidden')) {
                        // 显示子菜单并添加淡入动画
                        subMenu.classList.remove('hidden');
                        subMenu.style.opacity = '0';
                        // 递归计算所有子菜单的总高度
                        const calculateTotalHeight = (element) => {
                            let height = element.scrollHeight;
                            const children = element.querySelectorAll('.sub-menu:not(.hidden)');
                            children.forEach(child => {
                                height += calculateTotalHeight(child);
                            });
                            return height + 10;
                        };
                        subMenu.style.maxHeight = calculateTotalHeight(subMenu) + 'px';
                        // 强制重排后设置透明度以触发过渡
                        void subMenu.offsetHeight;
                        subMenu.style.opacity = '1';
                        const icon = menuButton.querySelector('.fa-chevron-down');
                        icon.classList.add('rotate-180');
                        // 添加一级菜单高亮
                        if (menuItemEl && menuItemEl.parentElement.id === 'menu-container' && 
                            menuItemEl.parentElement.classList.contains('menu-root')) {
                            menuItemEl.classList.add('menu-active');
                        }
                    } else {
                        // 隐藏子菜单并添加淡出动画
                        subMenu.style.opacity = '0';
                        subMenu.style.maxHeight = '0';
                        setTimeout(() => {
                            subMenu.classList.add('hidden');
                            if (menuItemEl && menuItemEl.parentElement.id === 'menu-container' && 
                                menuItemEl.parentElement.classList.contains('menu-root')) {
                                menuItemEl.classList.remove('menu-active');
                            }
                        }, 300);
                        const icon = this.querySelector('.fa-chevron-down');
                        icon.classList.remove('rotate-180');
                    }
                }
            });

            // 创建子菜单容器
            const subMenu = document.createElement('div');
            subMenu.className = 'sub-menu hidden pl-6 mt-1 space-y-1 transition-all duration-300 ease-in-out';
            subMenu.style.maxHeight = '0';
            menuItem.appendChild(subMenu);

            // 递归渲染子菜单
            renderMenuItems(item.children, subMenu);
        } else {
            // 如果是叶子节点，点击加载iframe内容
            menuButton.addEventListener('click', function(e) {
                // 阻止事件冒泡，避免触发遮罩层点击
                e.stopPropagation();
                
                // 移除其他菜单项的active状态
                document.querySelectorAll('#tool-menu .menu-active').forEach(el => {
                    el.classList.remove('menu-active');
                });
                // 添加当前菜单项的active状态
                this.classList.add('menu-active');
                // 加载iframe内容
                if (item.url) {
                    document.getElementById('tool-iframe').src = item.url;
                }
                // 移动设备下点击菜单项后自动收起菜单
                if (isMobileDevice()) {
                    closeSidebar();
                }
            });
        }

        container.appendChild(menuItem);
    });
}

// 页面加载完成后加载菜单
document.addEventListener('DOMContentLoaded', loadMenu);