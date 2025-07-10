// 菜单切换按钮功能
document.getElementById('menu-toggle').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
    sidebar.classList.toggle('fixed');
    sidebar.classList.toggle('z-20');
    sidebar.classList.toggle('h-full');
});

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

// 递归渲染菜单项
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
            menuButton.addEventListener('click', function() {
                const subMenu = menuItem.querySelector('.sub-menu');
                if (subMenu) {
                    const menuItem = menuButton.closest('.mb-1');
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
                            // 添加额外间距防止内容被裁剪
                            return height + 10;
                        };
                        subMenu.style.maxHeight = calculateTotalHeight(subMenu) + 'px';
                        // 强制重排后设置透明度以触发过渡
                        void subMenu.offsetHeight;
                        subMenu.style.opacity = '1';
                        const icon = menuButton.querySelector('.fa-chevron-down');
                        icon.classList.add('rotate-180');
                        // 添加一级菜单高亮
                        // 确保只有一级菜单项获得高亮
                        if (menuItem && menuItem.parentElement.id === 'menu-container' && 
                            menuItem.parentElement.classList.contains('menu-root')) {
                            menuItem.classList.add('menu-active');
                        }
                    } else {
                        // 隐藏子菜单并添加淡出动画
                        subMenu.style.opacity = '0';
                        subMenu.style.maxHeight = '0';
                        setTimeout(() => {
                            subMenu.classList.add('hidden');
                            // 移除一级菜单高亮
                            if (menuItem && menuItem.parentElement.id === 'menu-container' && 
                                menuItem.parentElement.classList.contains('menu-root')) {
                                menuItem.classList.remove('menu-active');
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
            menuButton.addEventListener('click', function() {
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
            });
        }

        container.appendChild(menuItem);
    });
}

// 页面加载完成后加载菜单
document.addEventListener('DOMContentLoaded', loadMenu);