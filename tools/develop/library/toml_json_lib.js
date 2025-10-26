// 精简版 TOML 解析与序列化库
        const TOML = (function() {
            // 解析 TOML 为 JavaScript 对象
            function parse(tomlString) {
                const result = {};
                const lines = tomlString.split('\n');
                
                let currentTable = '';
                let currentArrayTable = '';
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const trimmedLine = line.trim();
                    
                    // 跳过空行和注释
                    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
                    
                    // 处理表格部分 [table]
                    if (trimmedLine.startsWith('[') && !trimmedLine.startsWith('[[')) {
                        if (trimmedLine.endsWith(']')) {
                            currentTable = trimmedLine.substring(1, trimmedLine.length - 1).trim();
                            currentArrayTable = '';
                            
                            // 确保嵌套路径存在
                            const parts = currentTable.split('.');
                            let current = result;
                            for (let j = 0; j < parts.length; j++) {
                                const part = parts[j];
                                if (!current[part]) {
                                    current[part] = {};
                                }
                                if (j < parts.length - 1) {
                                    current = current[part];
                                }
                            }
                            continue;
                        }
                    }
                    
                    // 处理数组表格 [[array]]
                    if (trimmedLine.startsWith('[[') && trimmedLine.endsWith(']]')) {
                        currentArrayTable = trimmedLine.substring(2, trimmedLine.length - 2).trim();
                        currentTable = '';
                        
                        // 确保数组存在
                        const parts = currentArrayTable.split('.');
                        let current = result;
                        for (let j = 0; j < parts.length - 1; j++) {
                            const part = parts[j];
                            if (!current[part]) {
                                current[part] = {};
                            }
                            current = current[part];
                        }
                        
                        const lastPart = parts[parts.length - 1];
                        if (!current[lastPart]) {
                            current[lastPart] = [];
                        }
                        
                        // 添加新的对象到数组
                        current[lastPart].push({});
                        continue;
                    }
                    
                    // 查找键值对分隔符
                    const equalsIndex = trimmedLine.indexOf('=');
                    if (equalsIndex === -1) {
                        throw new Error(`第 ${i + 1} 行格式错误，缺少等号但是参数块本身无需等号的`);
                    }
                    
                    // 提取键和值
                    const key = trimmedLine.substring(0, equalsIndex).trim();
                    let value = trimmedLine.substring(equalsIndex + 1).trim();
                    
                    // 处理值的类型
                    value = parseValue(value);
                    
                    // 将键值对添加到当前上下文
                    if (currentArrayTable) {
                        // 添加到数组表格
                        const parts = currentArrayTable.split('.');
                        let current = result;
                        for (let j = 0; j < parts.length - 1; j++) {
                            current = current[parts[j]];
                        }
                        
                        const lastPart = parts[parts.length - 1];
                        const array = current[lastPart];
                        const lastItem = array[array.length - 1];
                        
                        // 处理嵌套键
                        if (key.includes('.')) {
                            const keyParts = key.split('.');
                            let currentObj = lastItem;
                            for (let j = 0; j < keyParts.length - 1; j++) {
                                const keyPart = keyParts[j];
                                if (!currentObj[keyPart]) {
                                    currentObj[keyPart] = {};
                                }
                                currentObj = currentObj[keyPart];
                            }
                            currentObj[keyParts[keyParts.length - 1]] = value;
                        } else {
                            lastItem[key] = value;
                        }
                    } else if (currentTable) {
                        // 添加到表格
                        const parts = currentTable.split('.');
                        let current = result;
                        for (let j = 0; j < parts.length - 1; j++) {
                            current = current[parts[j]];
                        }
                        
                        const lastPart = parts[parts.length - 1];
                        
                        // 处理嵌套键
                        if (key.includes('.')) {
                            const keyParts = key.split('.');
                            let currentObj = current[lastPart];
                            for (let j = 0; j < keyParts.length - 1; j++) {
                                const keyPart = keyParts[j];
                                if (!currentObj[keyPart]) {
                                    currentObj[keyPart] = {};
                                }
                                currentObj = currentObj[keyPart];
                            }
                            currentObj[keyParts[keyParts.length - 1]] = value;
                        } else {
                            current[lastPart][key] = value;
                        }
                    } else {
                        // 添加到根对象
                        if (key.includes('.')) {
                            const keyParts = key.split('.');
                            let current = result;
                            for (let j = 0; j < keyParts.length - 1; j++) {
                                const keyPart = keyParts[j];
                                if (!current[keyPart]) {
                                    current[keyPart] = {};
                                }
                                current = current[keyPart];
                            }
                            current[keyParts[keyParts.length - 1]] = value;
                        } else {
                            result[key] = value;
                        }
                    }
                }
                
                return result;
            }
            
            // 解析 TOML 值
            function parseValue(value) {
                // 处理字符串
                if ((value.startsWith("'") && value.endsWith("'")) || 
                    (value.startsWith('"') && value.endsWith('"'))) {
                    return value.substring(1, value.length - 1);
                }
                // 处理数组
                else if (value.startsWith('[') && value.endsWith(']')) {
                    try {
                        // 尝试解析为 JSON 数组
                        return JSON.parse(value.replace(/(\w+)/g, '"$1"').replace(/'([^']*)'/g, '"$1"'));
                    } catch (e) {
                        // 如果解析失败，返回原始字符串
                        return value;
                    }
                }
                // 处理布尔值和 null
                else if (value === 'true') return true;
                else if (value === 'false') return false;
                else if (value === 'null') return null;
                // 处理数字
                else if (!isNaN(value)) return Number(value);
                // 默认返回字符串
                return value;
            }
            
            // 将 JavaScript 对象序列化为 TOML
            function stringify(obj) {
                let toml = '';
                
                function processArray(array, arrayName) {
                    // 处理TOML数组表格格式
                    array.forEach((item, index) => {
                        if (typeof item === 'object' && item !== null) {
                            toml += `\n[[${arrayName}]]\n`;
                            Object.entries(item).forEach(([key, value]) => {
                                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                    // 处理嵌套对象
                                    Object.entries(value).forEach(([subKey, subValue]) => {
                                        const formattedValue = formatValue(subValue);
                                        toml += `${key}.${subKey} = ${formattedValue}\n`;
                                    });
                                } else if (Array.isArray(value)) {
                                    // 处理嵌套数组
                                    const formattedValue = formatValue(value);
                                    toml += `${key} = ${formattedValue}\n`;
                                } else {
                                    const formattedValue = formatValue(value);
                                    toml += `${key} = ${formattedValue}\n`;
                                }
                            });
                        } else {
                            // 简单值数组
                            const formattedValue = formatValue(item);
                            toml += `${arrayName}[${index}] = ${formattedValue}\n`;
                        }
                    });
                }
                
                function formatValue(value) {
                    if (typeof value === 'string') return `"${value}"`;
                    else if (typeof value === 'boolean') return value ? 'true' : 'false';
                    else if (value === null) return 'null';
                    else if (Array.isArray(value)) {
                        // 处理数组
                        const items = value.map(item => {
                            if (typeof item === 'string') return `"${item}"`;
                            if (typeof item === 'object' && item !== null) {
                                return JSON.stringify(item);
                            }
                            return item;
                        });
                        return `[${items.join(', ')}]`;
                    }
                    else return value.toString();
                }
                
                function processObject(obj, prefix = '') {
                    Object.entries(obj).forEach(([key, value]) => {
                        const fullKey = prefix ? `${prefix}.${key}` : key;
                        
                        if (Array.isArray(value)) {
                            // 处理数组
                            processArray(value, key);
                        } else if (typeof value === 'object' && value !== null) {
                            // 处理嵌套对象
                            toml += `\n[${fullKey}]\n`;
                            processObject(value, fullKey);
                        } else {
                            const formattedValue = formatValue(value);
                            toml += `${key} = ${formattedValue}\n`;
                        }
                    });
                }
                
                processObject(obj);
                return toml;
            }
            
            return { parse, stringify };
        })();