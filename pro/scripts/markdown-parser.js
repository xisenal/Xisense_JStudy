// Markdown Parser for JavaScript Learning Website
// Converts Markdown to Material Design styled HTML

// Simple markdown parser
class MarkdownParser {
    constructor() {
        this.rules = [
            // Headers
            { pattern: /^### (.*$)/gim, replacement: '<h3>$1</h3>' },
            { pattern: /^## (.*$)/gim, replacement: '<h2>$1</h2>' },
            { pattern: /^# (.*$)/gim, replacement: '<h1>$1</h1>' },
            
            // Bold and Italic
            { pattern: /\*\*\*(.*?)\*\*\*/g, replacement: '<strong><em>$1</em></strong>' },
            { pattern: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
            { pattern: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
            
            // Code blocks
            { pattern: /```([\s\S]*?)```/g, replacement: '<pre><code>$1</code></pre>' },
            { pattern: /`([^`]+)`/g, replacement: '<code>$1</code>' },
            
            // Links
            { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2" target="_blank">$1</a>' },
            
            // Images
            { pattern: /!\[([^\]]*)\]\(([^)]+)\)/g, replacement: '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0;">' },
            
            // Blockquotes
            { pattern: /^> (.*$)/gim, replacement: '<blockquote>$1</blockquote>' },
            
            // Horizontal rules
            { pattern: /^---$/gim, replacement: '<hr style="border: none; border-top: 2px solid #eee; margin: 2rem 0;">' },
            
            // Line breaks
            { pattern: /\n\n/g, replacement: '</p><p>' },
            { pattern: /\n/g, replacement: '<br>' }
        ];
    }
    
    parse(markdown) {
        let html = markdown;
        
        // Handle tables
        html = this.parseTables(html);
        
        // Handle lists
        html = this.parseLists(html);
        
        // Apply other rules
        this.rules.forEach(rule => {
            html = html.replace(rule.pattern, rule.replacement);
        });
        
        // Wrap in paragraphs
        html = '<p>' + html + '</p>';
        
        // Clean up empty paragraphs and fix nested elements
        html = this.cleanupHtml(html);
        
        return html;
    }
    
    parseTables(markdown) {
        const tableRegex = /^\|(.+)\|\s*\n\|([\s\S]*?)\|\s*\n((?:\|.*\|\s*\n?)*)/gm;
        
        return markdown.replace(tableRegex, (match, header, separator, rows) => {
            const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell);
            const rowLines = rows.trim().split('\n').filter(line => line.trim());
            
            let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">';
            
            // Header
            tableHtml += '<thead><tr>';
            headerCells.forEach(cell => {
                tableHtml += `<th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5; font-weight: 500;">${cell}</th>`;
            });
            tableHtml += '</tr></thead>';
            
            // Body
            tableHtml += '<tbody>';
            rowLines.forEach(row => {
                const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    tableHtml += `<td style="border: 1px solid #ddd; padding: 0.75rem;">${cell}</td>`;
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</tbody></table>';
            
            return tableHtml;
        });
    }
    
    parseLists(markdown) {
        // Unordered lists
        markdown = markdown.replace(/^(\s*)[\*\-\+] (.+)$/gm, (match, indent, content) => {
            const level = Math.floor(indent.length / 2);
            return `<li data-level="${level}">${content}</li>`;
        });
        
        // Ordered lists
        markdown = markdown.replace(/^(\s*)\d+\. (.+)$/gm, (match, indent, content) => {
            const level = Math.floor(indent.length / 2);
            return `<li data-level="${level}" data-ordered="true">${content}</li>`;
        });
        
        // Wrap lists
        markdown = this.wrapLists(markdown);
        
        return markdown;
    }
    
    wrapLists(html) {
        const lines = html.split('\n');
        const result = [];
        let inList = false;
        let listType = null;
        let currentLevel = 0;
        let listStack = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const liMatch = line.match(/<li data-level="(\d+)"(?: data-ordered="true")?>(.*)<\/li>/);
            
            if (liMatch) {
                const level = parseInt(liMatch[1]);
                const isOrdered = line.includes('data-ordered="true"');
                const content = liMatch[2];
                
                if (!inList) {
                    // Start new list
                    inList = true;
                    listType = isOrdered ? 'ol' : 'ul';
                    currentLevel = level;
                    listStack = [{ type: listType, level: level }];
                    result.push(`<${listType} style="margin: 1rem 0; padding-left: 2rem;">`);
                    result.push(`<li>${content}</li>`);
                } else {
                    if (level > currentLevel) {
                        // Nested list
                        const nestedType = isOrdered ? 'ol' : 'ul';
                        listStack.push({ type: nestedType, level: level });
                        result.push(`<${nestedType} style="margin: 0.5rem 0; padding-left: 1.5rem;">`);
                        result.push(`<li>${content}</li>`);
                        currentLevel = level;
                    } else if (level < currentLevel) {
                        // Close nested lists
                        while (listStack.length > 0 && listStack[listStack.length - 1].level > level) {
                            const closingList = listStack.pop();
                            result.push(`</${closingList.type}>`);
                        }
                        result.push(`<li>${content}</li>`);
                        currentLevel = level;
                    } else {
                        // Same level
                        result.push(`<li>${content}</li>`);
                    }
                }
            } else {
                if (inList) {
                    // Close all open lists
                    while (listStack.length > 0) {
                        const closingList = listStack.pop();
                        result.push(`</${closingList.type}>`);
                    }
                    inList = false;
                }
                result.push(line);
            }
        }
        
        // Close any remaining open lists
        if (inList) {
            while (listStack.length > 0) {
                const closingList = listStack.pop();
                result.push(`</${closingList.type}>`);
            }
        }
        
        return result.join('\n');
    }
    
    cleanupHtml(html) {
        // Remove empty paragraphs
        html = html.replace(/<p>\s*<\/p>/g, '');
        html = html.replace(/<p>\s*<br>\s*<\/p>/g, '');
        
        // Fix paragraphs around block elements
        const blockElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'blockquote', 'ul', 'ol', 'table', 'hr'];
        blockElements.forEach(tag => {
            html = html.replace(new RegExp(`<p>\s*<${tag}`, 'g'), `</p><${tag}`);
            html = html.replace(new RegExp(`</${tag}>\s*</p>`, 'g'), `</${tag}><p>`);
        });
        
        // Fix multiple consecutive br tags
        html = html.replace(/(<br>\s*){3,}/g, '</p><p>');
        
        // Remove leading/trailing empty paragraphs
        html = html.replace(/^<p>\s*<\/p>/, '');
        html = html.replace(/<p>\s*<\/p>$/, '');
        
        return html;
    }
}

// Enhanced markdown parser with syntax highlighting
class EnhancedMarkdownParser extends MarkdownParser {
    constructor() {
        super();
        this.codeLanguages = {
            'javascript': 'JavaScript',
            'js': 'JavaScript',
            'html': 'HTML',
            'css': 'CSS',
            'python': 'Python',
            'java': 'Java',
            'cpp': 'C++',
            'c': 'C',
            'json': 'JSON',
            'xml': 'XML',
            'sql': 'SQL',
            'bash': 'Bash',
            'shell': 'Shell'
        };
    }
    
    parse(markdown) {
        let html = markdown;
        
        // Handle code blocks with language specification
        html = this.parseCodeBlocks(html);
        
        // Handle tables
        html = this.parseTables(html);
        
        // Handle lists
        html = this.parseLists(html);
        
        // Apply other rules (excluding the basic code block rule)
        const filteredRules = this.rules.filter(rule => 
            !rule.pattern.toString().includes('```')
        );
        
        filteredRules.forEach(rule => {
            html = html.replace(rule.pattern, rule.replacement);
        });
        
        // Wrap in paragraphs
        html = '<p>' + html + '</p>';
        
        // Clean up
        html = this.cleanupHtml(html);
        
        return html;
    }
    
    parseCodeBlocks(markdown) {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        
        return markdown.replace(codeBlockRegex, (match, language, code) => {
            const lang = language ? language.toLowerCase() : '';
            const langName = this.codeLanguages[lang] || (lang ? lang.toUpperCase() : 'Code');
            
            const escapedCode = this.escapeHtml(code.trim());
            
            return `
                <div class="code-block" style="margin: 1.5rem 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${language ? `<div class="code-header" style="background: #f5f5f5; padding: 0.5rem 1rem; border-bottom: 1px solid #ddd; font-size: 0.9rem; color: #666; font-weight: 500;">${langName}</div>` : ''}
                    <pre style="background: #f8f9fa; padding: 1.5rem; margin: 0; overflow-x: auto; border-left: 4px solid #667eea;"><code class="language-${lang}">${escapedCode}</code></pre>
                </div>
            `;
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize parser
const markdownParser = new EnhancedMarkdownParser();

// Global function to parse markdown
window.parseMarkdown = function(markdown) {
    return markdownParser.parse(markdown);
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MarkdownParser, EnhancedMarkdownParser };
}

// Add syntax highlighting styles
function addSyntaxHighlightingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .code-block {
            font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
        }
        
        .code-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .code-header::before {
            content: '';
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ff5f56;
            box-shadow: 18px 0 0 #ffbd2e, 36px 0 0 #27ca3f;
        }
        
        .language-javascript code,
        .language-js code {
            color: #f7df1e;
        }
        
        .language-html code {
            color: #e34c26;
        }
        
        .language-css code {
            color: #1572b6;
        }
        
        .language-python code {
            color: #3776ab;
        }
        
        .language-java code {
            color: #ed8b00;
        }
        
        /* Basic syntax highlighting */
        .code-block .keyword {
            color: #d73a49;
            font-weight: bold;
        }
        
        .code-block .string {
            color: #032f62;
        }
        
        .code-block .comment {
            color: #6a737d;
            font-style: italic;
        }
        
        .code-block .number {
            color: #005cc5;
        }
        
        .code-block .function {
            color: #6f42c1;
        }
    `;
    
    document.head.appendChild(style);
}

// Add styles when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addSyntaxHighlightingStyles);
} else {
    addSyntaxHighlightingStyles();
}

// Simple syntax highlighting for common patterns
function applySyntaxHighlighting(codeElement) {
    if (!codeElement) return;
    
    let html = codeElement.innerHTML;
    
    // JavaScript keywords
    const jsKeywords = ['function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return', 'class', 'extends', 'import', 'export', 'default', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'static', 'get', 'set'];
    
    jsKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        html = html.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    // Strings
    html = html.replace(/(['"`])([^'"\`]*?)\1/g, '<span class="string">$1$2$1</span>');
    
    // Comments
    html = html.replace(/\/\/.*$/gm, '<span class="comment">$&</span>');
    html = html.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
    
    // Numbers
    html = html.replace(/\b\d+(\.\d+)?\b/g, '<span class="number">$&</span>');
    
    // Function names
    html = html.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '<span class="function">$1</span>(');
    
    codeElement.innerHTML = html;
}

// Auto-apply syntax highlighting to code blocks
document.addEventListener('DOMContentLoaded', function() {
    // Apply to existing code blocks
    document.querySelectorAll('pre code').forEach(applySyntaxHighlighting);
    
    // Observer for dynamically added code blocks
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    const codeBlocks = node.querySelectorAll ? node.querySelectorAll('pre code') : [];
                    codeBlocks.forEach(applySyntaxHighlighting);
                    
                    if (node.tagName === 'CODE' && node.parentElement && node.parentElement.tagName === 'PRE') {
                        applySyntaxHighlighting(node);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});