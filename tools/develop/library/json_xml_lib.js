        // 精简版 XML 解析与序列化库
        const XML = (function() {
            // 将 JavaScript 对象转换为 XML 字符串
            function stringify(obj, rootName = 'root') {
                let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
                
                function serialize(value, indentLevel = 1) {
                    const indent = '  '.repeat(indentLevel);
                    let xml = '';
                    
                    if (typeof value === 'object' && value !== null) {
                        Object.entries(value).forEach(([key, val]) => {
                            // 处理数组
                            if (Array.isArray(val)) {
                                val.forEach(item => {
                                    xml += `${indent}<${key}>\n`;
                                    xml += serialize(item, indentLevel + 1);
                                    xml += `${indent}</${key}>\n`;
                                });
                            } 
                            // 处理嵌套对象
                            else if (typeof val === 'object' && val !== null) {
                                xml += `${indent}<${key}>\n`;
                                xml += serialize(val, indentLevel + 1);
                                xml += `${indent}</${key}>\n`;
                            } 
                            // 处理基本类型
                            else {
                                const valStr = val === null ? '' : val.toString();
                                xml += `${indent}<${key}>${escapeXml(valStr)}</${key}>\n`;
                            }
                        });
                    } 
                    // 处理基本类型（直接作为文本节点）
                    else {
                        xml += `${indent}${value}\n`;
                    }
                    
                    return xml;
                }
                
                xml += serialize(obj);
                xml += `</${rootName}>`;
                return xml;
            }
            
            // 将 XML 字符串转换为 JavaScript 对象
            function parse(xmlString) {
                // 创建简易 XML 解析器（处理基本结构）
                const result = {};
                const parser = new DOMParser();
                let doc;
                
                try {
                    doc = parser.parseFromString(xmlString, 'text/xml');
                    
                    // 检查解析错误
                    const error = doc.querySelector('parsererror');
                    if (error) {
                        throw new Error(`XML 解析错误: ${error.textContent.trim()}`);
                    }
                } catch (e) {
                    throw new Error(`解析失败: ${e.message}`);
                }
                
                // 递归解析 XML 节点
                function parseNode(node, parentObj) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const nodeName = node.nodeName;
                        const children = Array.from(node.childNodes).filter(
                            child => child.nodeType === Node.ELEMENT_NODE || 
                                   (child.nodeType === Node.TEXT_NODE && child.textContent.trim() !== '')
                        );
                        
                        // 处理只有文本内容的节点
                        if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
                            const value = children[0].textContent.trim();
                            // 转换基本类型
                            if (value === 'true') return true;
                            if (value === 'false') return false;
                            if (!isNaN(value)) return Number(value);
                            if (value === 'null') return null;
                            return unescapeXml(value);
                        }
                        
                        // 处理包含子元素的节点
                        const obj = {};
                        children.forEach(child => {
                            const childValue = parseNode(child, obj);
                            const childName = child.nodeName;
                            
                            // 处理重复节点（视为数组）
                            if (obj.hasOwnProperty(childName)) {
                                if (!Array.isArray(obj[childName])) {
                                    obj[childName] = [obj[childName]];
                                }
                                obj[childName].push(childValue);
                            } else {
                                obj[childName] = childValue;
                            }
                        });
                        
                        return obj;
                    }
                    
                    // 处理文本节点
                    if (node.nodeType === Node.TEXT_NODE) {
                        const value = node.textContent.trim();
                        if (value === '') return null;
                        if (value === 'true') return true;
                        if (value === 'false') return false;
                        if (!isNaN(value)) return Number(value);
                        return value;
                    }
                    
                    return null;
                }
                
                // 从根节点开始解析
                const rootNode = doc.documentElement;
                result[rootNode.nodeName] = parseNode(rootNode, result);
                
                // 如果根节点只有一个属性，直接返回该属性值
                if (Object.keys(result).length === 1) {
                    return result[rootNode.nodeName];
                }
                
                return result;
            }
            
            // XML 转义特殊字符
            function escapeXml(unsafe) {
                return unsafe.replace(/[&<>"']/g, char => {
                    switch (char) {
                        case '&': return '&amp;';
                        case '<': return '&lt;';
                        case '>': return '&gt;';
                        case '"': return '&quot;';
                        case "'": return '&#039;';
                        default: return char;
                    }
                });
            }
            
            // 反转义 XML 特殊字符
            function unescapeXml(safe) {
                return safe.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, entity => {
                    switch (entity) {
                        case '&amp;': return '&';
                        case '&lt;': return '<';
                        case '&gt;': return '>';
                        case '&quot;': return '"';
                        case '&#039;': return "'";
                        default: return entity;
                    }
                });
            }
            
            return { parse, stringify };
        })();
