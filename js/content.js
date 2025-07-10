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

        // 如果有子菜单，添加展开/折叠功能
        if (item.children && item.children.length > 0) {
            menuButton.addEventListener('click', function() {
                const subMenu = menuItem.querySelector('.sub-menu');
                if (subMenu) {
                    subMenu.classList.toggle('hidden');
                    const icon = this.querySelector('.fa-chevron-down');
                    icon.classList.toggle('rotate-180');
                }
            });

            // 创建子菜单容器
            const subMenu = document.createElement('div');
            subMenu.className = 'sub-menu hidden pl-6 mt-1 space-y-1';
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

        menuItem.appendChild(menuButton);
        container.appendChild(menuItem);
    });
}

// 页面加载完成后加载菜单
document.addEventListener('DOMContentLoaded', loadMenu);