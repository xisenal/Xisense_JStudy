// JavaScript学习网站的笔记管理器
// 处理笔记存储、搜索和管理功能

class NotesManager {
    constructor() {
        this.storageKey = 'jsLearningNotes';
        this.searchIndex = new Map();
        this.initializeSearchIndex();
    }
    
    // 初始化搜索索引以提高性能
    initializeSearchIndex() {
        const notes = this.getAllNotes();
        notes.forEach(note => {
            this.addToSearchIndex(note);
        });
    }
    
    // 将笔记添加到搜索索引
    addToSearchIndex(note) {
        const searchableText = (
            note.title + ' ' + 
            note.content + ' ' + 
            note.fileName + ' ' +
            (note.tags ? note.tags.join(' ') : '')
        ).toLowerCase();
        
        const words = searchableText.split(/\s+/).filter(word => word.length > 2);
        
        words.forEach(word => {
            if (!this.searchIndex.has(word)) {
                this.searchIndex.set(word, new Set());
            }
            this.searchIndex.get(word).add(note.id);
        });
    }
    
    // 从搜索索引中移除笔记
    removeFromSearchIndex(noteId) {
        this.searchIndex.forEach((noteIds, word) => {
            noteIds.delete(noteId);
            if (noteIds.size === 0) {
                this.searchIndex.delete(word);
            }
        });
    }
    
    // 保存笔记
    saveNote(note) {
        try {
            const notes = this.getAllNotes();
            
            // Check if note already exists
            const existingIndex = notes.findIndex(n => n.id === note.id);
            
            if (existingIndex >= 0) {
                // Update existing note
                this.removeFromSearchIndex(note.id);
                notes[existingIndex] = { ...notes[existingIndex], ...note, lastModified: new Date().toISOString() };
            } else {
                // Add new note
                note.createdAt = new Date().toISOString();
                note.lastModified = new Date().toISOString();
                notes.push(note);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(notes));
            this.addToSearchIndex(note);
            
            return true;
        } catch (error) {
            console.error('Error saving note:', error);
            return false;
        }
    }
    
    // 获取所有笔记
    getAllNotes() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading notes:', error);
            return [];
        }
    }
    
    // 根据ID获取笔记
    getNoteById(id) {
        const notes = this.getAllNotes();
        return notes.find(note => note.id === id);
    }
    
    // 删除笔记
    deleteNote(id) {
        try {
            const notes = this.getAllNotes();
            const filteredNotes = notes.filter(note => note.id !== id);
            
            localStorage.setItem(this.storageKey, JSON.stringify(filteredNotes));
            this.removeFromSearchIndex(id);
            
            return true;
        } catch (error) {
            console.error('Error deleting note:', error);
            return false;
        }
    }
    
    // 搜索笔记
    searchNotes(query, options = {}) {
        if (!query || query.trim().length === 0) {
            return this.getAllNotes();
        }
        
        const {
            caseSensitive = false,
            exactMatch = false,
            searchFields = ['title', 'content', 'fileName', 'tags']
        } = options;
        
        const searchQuery = caseSensitive ? query : query.toLowerCase();
        const notes = this.getAllNotes();
        
        if (exactMatch) {
            return this.exactSearch(notes, searchQuery, searchFields, caseSensitive);
        } else {
            return this.fuzzySearch(notes, searchQuery, searchFields, caseSensitive);
        }
    }
    
    // 精确搜索
    exactSearch(notes, query, searchFields, caseSensitive) {
        return notes.filter(note => {
            return searchFields.some(field => {
                let fieldValue = note[field];
                
                if (field === 'tags' && Array.isArray(fieldValue)) {
                    fieldValue = fieldValue.join(' ');
                }
                
                if (typeof fieldValue === 'string') {
                    const searchValue = caseSensitive ? fieldValue : fieldValue.toLowerCase();
                    return searchValue.includes(query);
                }
                
                return false;
            });
        });
    }
    
    // 使用搜索索引进行模糊搜索
    fuzzySearch(notes, query, searchFields, caseSensitive) {
        const queryWords = query.split(/\s+/).filter(word => word.length > 0);
        const matchingNoteIds = new Set();
        
        queryWords.forEach(word => {
            // Find partial matches in search index
            this.searchIndex.forEach((noteIds, indexWord) => {
                if (indexWord.includes(word)) {
                    noteIds.forEach(id => matchingNoteIds.add(id));
                }
            });
        });
        
        // Get notes and calculate relevance scores
        const matchingNotes = notes
            .filter(note => matchingNoteIds.has(note.id))
            .map(note => ({
                ...note,
                relevanceScore: this.calculateRelevanceScore(note, queryWords, searchFields, caseSensitive)
            }))
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        return matchingNotes;
    }
    
    // 计算搜索结果的相关性分数
    calculateRelevanceScore(note, queryWords, searchFields, caseSensitive) {
        let score = 0;
        const fieldWeights = {
            title: 3,
            fileName: 2,
            tags: 2,
            content: 1
        };
        
        searchFields.forEach(field => {
            let fieldValue = note[field];
            
            if (field === 'tags' && Array.isArray(fieldValue)) {
                fieldValue = fieldValue.join(' ');
            }
            
            if (typeof fieldValue === 'string') {
                const searchValue = caseSensitive ? fieldValue : fieldValue.toLowerCase();
                const weight = fieldWeights[field] || 1;
                
                queryWords.forEach(word => {
                    const occurrences = (searchValue.match(new RegExp(word, 'g')) || []).length;
                    score += occurrences * weight;
                    
                    // Bonus for exact word matches
                    if (searchValue.includes(` ${word} `) || searchValue.startsWith(`${word} `) || searchValue.endsWith(` ${word}`)) {
                        score += weight * 2;
                    }
                });
            }
        });
        
        return score;
    }
    
    // 根据标签获取笔记
    getNotesByTag(tag) {
        const notes = this.getAllNotes();
        return notes.filter(note => 
            note.tags && note.tags.includes(tag)
        );
    }
    
    // 获取所有标签
    getAllTags() {
        const notes = this.getAllNotes();
        const tags = new Set();
        
        notes.forEach(note => {
            if (note.tags && Array.isArray(note.tags)) {
                note.tags.forEach(tag => tags.add(tag));
            }
        });
        
        return Array.from(tags).sort();
    }
    
    // 为笔记添加标签
    addTagToNote(noteId, tag) {
        const note = this.getNoteById(noteId);
        if (!note) return false;
        
        if (!note.tags) {
            note.tags = [];
        }
        
        if (!note.tags.includes(tag)) {
            note.tags.push(tag);
            return this.saveNote(note);
        }
        
        return true;
    }
    
    // 从笔记中移除标签
    removeTagFromNote(noteId, tag) {
        const note = this.getNoteById(noteId);
        if (!note || !note.tags) return false;
        
        note.tags = note.tags.filter(t => t !== tag);
        return this.saveNote(note);
    }
    
    // 导出笔记
    exportNotes(format = 'json') {
        const notes = this.getAllNotes();
        
        switch (format.toLowerCase()) {
            case 'json':
                return this.exportAsJSON(notes);
            case 'markdown':
                return this.exportAsMarkdown(notes);
            case 'html':
                return this.exportAsHTML(notes);
            default:
                throw new Error('Unsupported export format');
        }
    }
    
    // 导出为JSON格式
    exportAsJSON(notes) {
        return {
            data: JSON.stringify(notes, null, 2),
            filename: `js-learning-notes-${new Date().toISOString().split('T')[0]}.json`,
            mimeType: 'application/json'
        };
    }
    
    // 导出为Markdown格式
    exportAsMarkdown(notes) {
        let markdown = '# JavaScript学习笔记\n\n';
        markdown += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
        
        notes.forEach((note, index) => {
            markdown += `## ${note.title}\n\n`;
            markdown += `**文件名:** ${note.fileName}\n\n`;
            markdown += `**创建时间:** ${new Date(note.createdAt || note.uploadDate).toLocaleString('zh-CN')}\n\n`;
            
            if (note.tags && note.tags.length > 0) {
                markdown += `**标签:** ${note.tags.join(', ')}\n\n`;
            }
            
            markdown += '**内容:**\n\n';
            markdown += note.content + '\n\n';
            
            if (index < notes.length - 1) {
                markdown += '---\n\n';
            }
        });
        
        return {
            data: markdown,
            filename: `js-learning-notes-${new Date().toISOString().split('T')[0]}.md`,
            mimeType: 'text/markdown'
        };
    }
    
    // 导出为HTML格式
    exportAsHTML(notes) {
        let html = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>JavaScript学习笔记</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #333; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
                h2 { color: #667eea; margin-top: 2rem; }
                .note-meta { background: #f8f9fa; padding: 1rem; border-radius: 5px; margin: 1rem 0; }
                .note-content { background: #fff; padding: 1.5rem; border-left: 4px solid #667eea; margin: 1rem 0; }
                .tags { margin: 0.5rem 0; }
                .tag { background: #e3f2fd; color: #1976d2; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem; margin-right: 0.5rem; }
                hr { border: none; border-top: 2px solid #eee; margin: 2rem 0; }
                pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
                code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>JavaScript学习笔记</h1>
                <p><strong>导出时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
        `;
        
        notes.forEach((note, index) => {
            html += `
                <h2>${this.escapeHtml(note.title)}</h2>
                <div class="note-meta">
                    <p><strong>文件名:</strong> ${this.escapeHtml(note.fileName)}</p>
                    <p><strong>创建时间:</strong> ${new Date(note.createdAt || note.uploadDate).toLocaleString('zh-CN')}</p>
            `;
            
            if (note.tags && note.tags.length > 0) {
                html += '<div class="tags"><strong>标签:</strong> ';
                note.tags.forEach(tag => {
                    html += `<span class="tag">${this.escapeHtml(tag)}</span>`;
                });
                html += '</div>';
            }
            
            html += `
                </div>
                <div class="note-content">
                    ${window.parseMarkdown ? window.parseMarkdown(note.content) : `<pre>${this.escapeHtml(note.content)}</pre>`}
                </div>
            `;
            
            if (index < notes.length - 1) {
                html += '<hr>';
            }
        });
        
        html += `
            </div>
        </body>
        </html>
        `;
        
        return {
            data: html,
            filename: `js-learning-notes-${new Date().toISOString().split('T')[0]}.html`,
            mimeType: 'text/html'
        };
    }
    
    // 导入笔记
    importNotes(data, format = 'json') {
        try {
            let importedNotes = [];
            
            switch (format.toLowerCase()) {
                case 'json':
                    importedNotes = JSON.parse(data);
                    break;
                default:
                    throw new Error('Unsupported import format');
            }
            
            if (!Array.isArray(importedNotes)) {
                throw new Error('Invalid data format');
            }
            
            const existingNotes = this.getAllNotes();
            const mergedNotes = [...existingNotes];
            let importCount = 0;
            
            importedNotes.forEach(note => {
                // 检查笔记是否已存在
                const exists = existingNotes.some(existing => 
                    existing.title === note.title && existing.fileName === note.fileName
                );
                
                if (!exists) {
                    // 生成新ID并添加导入时间戳
                    note.id = this.generateId();
                    note.importedAt = new Date().toISOString();
                    mergedNotes.push(note);
                    this.addToSearchIndex(note);
                    importCount++;
                }
            });
            
            localStorage.setItem(this.storageKey, JSON.stringify(mergedNotes));
            
            return {
                success: true,
                importCount,
                totalCount: importedNotes.length
            };
        } catch (error) {
            console.error('Error importing notes:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // 获取统计信息
    getStatistics() {
        const notes = this.getAllNotes();
        const tags = this.getAllTags();
        
        const totalWords = notes.reduce((sum, note) => {
            return sum + (note.content ? note.content.split(/\s+/).length : 0);
        }, 0);
        
        const averageWordsPerNote = notes.length > 0 ? Math.round(totalWords / notes.length) : 0;
        
        return {
            totalNotes: notes.length,
            totalTags: tags.length,
            totalWords,
            averageWordsPerNote,
            oldestNote: notes.length > 0 ? new Date(Math.min(...notes.map(n => new Date(n.createdAt || n.uploadDate)))) : null,
            newestNote: notes.length > 0 ? new Date(Math.max(...notes.map(n => new Date(n.createdAt || n.uploadDate)))) : null
        };
    }
    
    // 工具方法
    generateId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 清除所有笔记（需要确认）
    clearAllNotes() {
        try {
            localStorage.removeItem(this.storageKey);
            this.searchIndex.clear();
            return true;
        } catch (error) {
            console.error('Error clearing notes:', error);
            return false;
        }
    }
}

// 初始化全局笔记管理器
const notesManager = new NotesManager();

// 导出供全局使用
window.NotesManager = NotesManager;
window.notesManager = notesManager;

// 增强的搜索功能
function performAdvancedSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    const results = notesManager.searchNotes(query, {
        caseSensitive: false,
        exactMatch: false,
        searchFields: ['title', 'content', 'fileName', 'tags']
    });
    
    displaySearchResults(results, query);
}

// 下载功能
function downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

// 导出笔记功能
function exportNotes(format = 'json') {
    try {
        const exportData = notesManager.exportNotes(format);
        downloadFile(exportData.data, exportData.filename, exportData.mimeType);
        
        if (window.JSLearningApp && window.JSLearningApp.showNotification) {
            window.JSLearningApp.showNotification(`笔记已导出为 ${format.toUpperCase()} 格式`, 'success');
        }
    } catch (error) {
        console.error('Export error:', error);
        if (window.JSLearningApp && window.JSLearningApp.showNotification) {
            window.JSLearningApp.showNotification('导出失败: ' + error.message, 'error');
        }
    }
}

// 导入笔记功能
function importNotes(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = e.target.result;
        const result = notesManager.importNotes(data, 'json');
        
        if (result.success) {
            if (window.JSLearningApp && window.JSLearningApp.showNotification) {
                window.JSLearningApp.showNotification(
                    `成功导入 ${result.importCount} 个笔记（共 ${result.totalCount} 个）`, 
                    'success'
                );
            }
            // 刷新笔记显示
            if (window.loadStoredNotes) {
                window.loadStoredNotes();
            }
        } else {
            if (window.JSLearningApp && window.JSLearningApp.showNotification) {
                window.JSLearningApp.showNotification('导入失败: ' + result.error, 'error');
            }
        }
    };
    
    reader.onerror = function() {
        if (window.JSLearningApp && window.JSLearningApp.showNotification) {
            window.JSLearningApp.showNotification('文件读取失败', 'error');
        }
    };
    
    reader.readAsText(file);
}

// 使函数全局可用
window.performAdvancedSearch = performAdvancedSearch;
window.exportNotes = exportNotes;
window.importNotes = importNotes;
window.downloadFile = downloadFile;