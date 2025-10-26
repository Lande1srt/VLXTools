// 精简版 YAML 解析库
        const jsyaml = (function(){
            const YAMLException = function(message) {
                this.name = 'YAMLException';
                this.message = message;
            };
            YAMLException.prototype = Object.create(Error.prototype);
            
            function load(str) {
                try {
                    const lines = str.split('\n');
                    const result = {};
                    let currentObj = result;
                    let indentLevel = 0;
                    const stack = [];
                    
                    lines.forEach((line, index) => {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith('#')) return;
                        
                        // 计算缩进
                        const indent = line.search(/\S|$/);
                        
                        // 处理嵌套
                        if (indent > indentLevel) {
                            stack.push({ obj: currentObj, level: indentLevel });
                            const lastKey = Object.keys(currentObj).pop();
                            currentObj[lastKey] = currentObj[lastKey] || {};
                            currentObj = currentObj[lastKey];
                            indentLevel = indent;
                        } else if (indent < indentLevel) {
                            while (stack.length && stack[stack.length - 1].level >= indent) {
                                const prev = stack.pop();
                                currentObj = prev.obj;
                                indentLevel = prev.level;
                            }
                        }
                        
                        // 解析键值对
                        const colonIndex = trimmed.indexOf(':');
                        if (colonIndex === -1) throw new Error(`第${index+1}行缺少冒号`);
                        
                        const key = trimmed.substring(0, colonIndex).trim();
                        let value = trimmed.substring(colonIndex + 1).trim();
                        
                        // 转换值类型
                        if (value === 'true') value = true;
                        else if (value === 'false') value = false;
                        else if (!isNaN(value)) value = Number(value);
                        else if (value === 'null') value = null;
                        
                        currentObj[key] = value;
                    });
                    
                    return result;
                } catch (e) {
                    throw new YAMLException(e.message);
                }
            }
            
            function dump(obj, { indent = 2 } = {}) {
                const indentStr = ' '.repeat(indent);
                let yaml = '';
                
                function serialize(obj, level = 0) {
                    const currentIndent = indentStr.repeat(level);
                    Object.entries(obj).forEach(([key, value]) => {
                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                            yaml += `${currentIndent}${key}:\n`;
                            serialize(value, level + 1);
                        } else {
                            let valueStr;
                            if (typeof value === 'boolean') valueStr = value ? 'true' : 'false';
                            else if (value === null) valueStr = 'null';
                            else if (typeof value === 'number') valueStr = value.toString();
                            else valueStr = value;
                            
                            yaml += `${currentIndent}${key}: ${valueStr}\n`;
                        }
                    });
                }
                
                serialize(obj);
                return yaml;
            }
            
            return { load, dump, YAMLException };
        })();

        // 精简版 TOML 解析库
        const TOML = (function(){
            function parse(str) {
                const result = {};
                const lines = str.split('\n');
                
                lines.forEach((line, index) => {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) return;
                    
                    const equalsIndex = trimmed.indexOf('=');
                    if (equalsIndex === -1) throw new Error(`第${index+1}行缺少等号`);
                    
                    const key = trimmed.substring(0, equalsIndex).trim();
                    let value = trimmed.substring(equalsIndex + 1).trim();
                    
                    // 处理字符串引号
                    if ((value.startsWith("'") && value.endsWith("'")) || 
                        (value.startsWith('"') && value.endsWith('"'))) {
                        value = value.substring(1, value.length - 1);
                    }
                    // 转换值类型
                    else if (value === 'true') value = true;
                    else if (value === 'false') value = false;
                    else if (!isNaN(value)) value = Number(value);
                    else if (value === 'null') value = null;
                    
                    result[key] = value;
                });
                
                return result;
            }
            
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