// Main JavaScript for JavaScript Learning Website

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeUploadArea();
    loadStoredNotes();
    initializeCodeEditor();
    
    // Show home section by default
    showSection('home');
});

// Navigation functionality
function initializeNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
            updateActiveNavLink(this);
        });
    });
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update URL hash
    window.location.hash = sectionId;
    
    // Update navigation
    const targetNavLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (targetNavLink) {
        updateActiveNavLink(targetNavLink);
    }
}

// Update active navigation link
function updateActiveNavLink(activeLink) {
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Initialize upload area with drag and drop
function initializeUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (!uploadArea || !fileInput) return;
    
    // Click to upload
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        handleFileUpload(files);
    });
    
    // File input change
fileInput.addEventListener('change', function(e) {
    const files = e.target.files;
    handleFileUpload(files);
    
    // 清空input的值，避免重复选择同一文件时不触发change事件
    this.value = '';
});
}

// Handle file upload
function handleFileUpload(files) {
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
        if (file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
            processMarkdownFile(file);
        } else {
            showNotification('请上传Markdown文件（.md或.markdown）', 'error');
        }
    });
}

// Process markdown file
function processMarkdownFile(file) {
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        const content = e.target.result;
        const noteId = generateId();
        const title = extractTitle(content) || file.name.replace(/\.[^/.]+$/, "");
        const htmlFileName = `note_${noteId}.html`;
        
        const note = {
            id: noteId,
            title: title,
            content: content,
            preview: generatePreview(content),
            fileName: file.name,
            htmlFile: `src/${htmlFileName}`,
            uploadDate: new Date().toISOString(),
            lastModified: new Date(file.lastModified).toISOString()
        };
        
        // 生成HTML文件内容
        const htmlContent = generateNoteHTML(note);
        
        try {
            // 创建HTML文件
            await createHTMLFile(htmlFileName, htmlContent);
            
            saveNote(note);
            displayNote(note);
            showNotification(`成功上传笔记：${note.title}，HTML文件已处理`, 'success');
        } catch (error) {
            console.error('处理文件时出错:', error);
            showNotification('文件处理过程中出现错误', 'error');
        }
    };
    
    reader.onerror = function() {
        showNotification('文件读取失败', 'error');
    };
    
    reader.readAsText(file);
}

// Extract title from markdown content
function extractTitle(content) {
    const lines = content.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('# ')) {
            return line.substring(2).trim();
        }
    }
    return null;
}

// Generate preview text
function generatePreview(content, maxLength = 150) {
    // Remove markdown syntax for preview
    let preview = content
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`(.*?)`/g, '$1') // Remove inline code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();
    
    if (preview.length > maxLength) {
        preview = preview.substring(0, maxLength) + '...';
    }
    
    return preview;
}

// Generate unique ID
function generateId() {
    return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate HTML file content for note
function generateNoteHTML(note) {
    const parser = new EnhancedMarkdownParser();
    const htmlContent = parser.parse(note.content);
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(note.title)} - JavaScript学习网站</title>
    <link rel="stylesheet" href="../styles/main.css">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        .note-container {
            max-width: 900px;
            margin: 2rem auto;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .note-header {
            border-bottom: 2px solid #667eea;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }
        .note-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: #333;
            margin: 0;
        }
        .note-meta {
            color: #666;
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }
        .note-content {
            line-height: 1.8;
            color: #444;
        }
        .back-btn {
            position: fixed;
            top: 20px;
            left: 20px;
            background: #667eea;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            transition: all 0.3s ease;
        }
        .back-btn:hover {
            background: #5a6fd8;
            transform: scale(1.1);
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            transition: all 0.3s ease;
        }
        .print-btn:hover {
            background: #45a049;
            transform: scale(1.1);
        }
    </style>
</head>
<body>
    <button class="back-btn" onclick="history.back()" title="返回">
        <i class="material-icons">arrow_back</i>
    </button>
    
    <button class="print-btn" onclick="window.print()" title="打印">
        <i class="material-icons">print</i>
    </button>
    
    <div class="note-container">
        <div class="note-header">
            <h1 class="note-title">${escapeHtml(note.title)}</h1>
            <div class="note-meta">
                <span><i class="material-icons" style="font-size: 16px; vertical-align: middle;">description</i> ${escapeHtml(note.fileName)}</span>
                <span style="margin-left: 1rem;"><i class="material-icons" style="font-size: 16px; vertical-align: middle;">schedule</i> ${new Date(note.uploadDate).toLocaleString('zh-CN')}</span>
            </div>
        </div>
        
        <div class="note-content">
            ${htmlContent}
        </div>
    </div>
    
    <script>
        // 添加代码高亮
        document.addEventListener('DOMContentLoaded', function() {
            // 为代码块添加复制功能
            const codeBlocks = document.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
                const pre = block.parentElement;
                const copyBtn = document.createElement('button');
                copyBtn.innerHTML = '<i class="material-icons">content_copy</i>';
                copyBtn.className = 'copy-btn';
                copyBtn.style.cssText = 'position: absolute; top: 8px; right: 8px; background: #667eea; color: white; border: none; padding: 4px; border-radius: 4px; cursor: pointer; font-size: 12px;';
                
                copyBtn.onclick = function() {
                    navigator.clipboard.writeText(block.textContent).then(() => {
                        copyBtn.innerHTML = '<i class="material-icons">check</i>';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="material-icons">content_copy</i>';
                        }, 2000);
                    });
                };
                
                pre.style.position = 'relative';
                pre.appendChild(copyBtn);
            });
        });
    </script>
</body>
</html>`;
}

// Create HTML file using modern File System Access API or fallback to download
async function createHTMLFile(fileName, content) {
    try {
        // 检查浏览器支持并询问用户偏好
        if ('showDirectoryPicker' in window) {
            // 检查用户是否设置了保存偏好
            const savePreference = localStorage.getItem('fileSavePreference');
            
            if (savePreference === 'download') {
                downloadHTMLFile(fileName, content);
                return;
            }
            
            if (savePreference === 'directory' || !savePreference) {
                try {
                    await createFileWithDirectoryPicker(fileName, content);
                    // 如果成功且没有设置偏好，询问用户
                    if (!savePreference) {
                        const useDirectoryNext = confirm('文件保存成功！\n\n是否希望以后都使用目录选择方式保存文件？\n\n点击确定：使用目录选择（推荐）\n点击取消：使用下载方式');
                        localStorage.setItem('fileSavePreference', useDirectoryNext ? 'directory' : 'download');
                    }
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('目录保存失败，降级到下载方式:', error);
                        downloadHTMLFile(fileName, content);
                    }
                }
            }
        } else {
            // 降级到下载方式
            downloadHTMLFile(fileName, content);
        }
    } catch (error) {
        console.error('文件创建失败:', error);
        // 降级到下载方式
        downloadHTMLFile(fileName, content);
    }
}

// 使用File System Access API创建文件
async function createFileWithDirectoryPicker(fileName, content) {
    try {
        // 检查是否已经有保存的目录句柄
        let dirHandle = window.savedDirHandle;
        
        if (!dirHandle) {
            // 首次使用，请求用户选择src目录
            dirHandle = await window.showDirectoryPicker({
                id: 'src-folder',
                startIn: 'documents'
            });
            
            // 保存目录句柄供后续使用
            window.savedDirHandle = dirHandle;
            
            // 询问用户是否记住此目录
            const remember = confirm('是否记住此目录，以便后续自动保存文件？\n（点击确定将记住目录，点击取消每次都会询问）');
            if (!remember) {
                window.savedDirHandle = null;
            }
        }
        
        // 创建文件
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        
        showNotification(`HTML文件 ${fileName} 已成功保存到选择的文件夹中`, 'success');
    } catch (error) {
        if (error.name === 'AbortError') {
            showNotification('用户取消了文件保存操作', 'warning');
            // 如果用户取消，清除保存的目录句柄
            window.savedDirHandle = null;
        } else {
            throw error;
        }
    }
}

// 降级方案：下载文件
function downloadHTMLFile(fileName, content) {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // 清理URL对象
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    // 显示提示信息
    showNotification(`HTML文件 ${fileName} 已下载，请手动保存到 src 文件夹中`, 'info');
}

// Save note to localStorage
function saveNote(note) {
    let notes = getStoredNotes();
    notes.push(note);
    localStorage.setItem('jsLearningNotes', JSON.stringify(notes));
}

// Get stored notes
function getStoredNotes() {
    const stored = localStorage.getItem('jsLearningNotes');
    return stored ? JSON.parse(stored) : [];
}

// Load and display stored notes
function loadStoredNotes() {
    const notes = getStoredNotes();
    const notesList = document.getElementById('notesList');
    
    if (!notesList) return;
    
    if (notes.length === 0) {
        showEmptyState();
        return;
    }
    
    notesList.innerHTML = '';
    notes.forEach(note => {
        displayNote(note, false);
    });
}

// Display a note in the list
function displayNote(note, prepend = true) {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;
    
    // Remove empty state if it exists
    const emptyState = notesList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const noteElement = createNoteElement(note);
    
    if (prepend) {
        notesList.insertBefore(noteElement, notesList.firstChild);
    } else {
        notesList.appendChild(noteElement);
    }
}

// Create note element
function createNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-item';
    noteDiv.setAttribute('data-note-id', note.id);
    
    const uploadDate = new Date(note.uploadDate).toLocaleDateString('zh-CN');
    
    noteDiv.innerHTML = `
        <div class="note-content-area">
            <div class="note-title">${escapeHtml(note.title)}</div>
            <div class="note-preview">${escapeHtml(note.preview)}</div>
            <div class="note-meta">
                <span>文件名: ${escapeHtml(note.fileName)}</span>
                <span>上传时间: ${uploadDate}</span>
            </div>
        </div>
        <div class="note-actions">
            <button class="btn-icon btn-delete" onclick="deleteNote('${note.id}', event)" title="删除笔记">
                <i class="material-icons">delete</i>
            </button>
        </div>
    `;
    
    // 只为内容区域添加点击事件，避免删除按钮触发
    const contentArea = noteDiv.querySelector('.note-content-area');
    contentArea.addEventListener('click', function() {
        viewNote(note);
    });
    
    return noteDiv;
}

// View note in full
function viewNote(note) {
    // 如果有HTML文件，直接打开
    if (note.htmlFile) {
        window.open(note.htmlFile, '_blank');
        return;
    }
    
    // 否则使用模态框显示
    const modal = createNoteModal(note);
    document.body.appendChild(modal);
    
    // Parse and display markdown
    const contentDiv = modal.querySelector('.modal-content .markdown-content');
    if (contentDiv && window.parseMarkdown) {
        contentDiv.innerHTML = window.parseMarkdown(note.content);
    } else {
        contentDiv.innerHTML = `<pre>${escapeHtml(note.content)}</pre>`;
    }
}

// Create note modal
function createNoteModal(note) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>${escapeHtml(note.title)}</h2>
                <button class="modal-close">
                    <i class="material-icons">close</i>
                </button>
            </div>
            <div class="markdown-content">
                <!-- Content will be inserted here -->
            </div>
        </div>
    `;
    
    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
        }
        .modal-content {
            background: white;
            border-radius: 12px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #eee;
            background: #f8f9fa;
        }
        .modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
            color: #333;
        }
        .modal-close {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 50%;
            transition: background-color 0.3s ease;
        }
        .modal-close:hover {
            background: rgba(0, 0, 0, 0.1);
        }
        .modal .markdown-content {
            flex: 1;
            overflow-y: auto;
            margin: 0;
            border-radius: 0;
            box-shadow: none;
        }
    `;
    modal.appendChild(style);
    
    // Close modal events
    const overlay = modal.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.modal-close');
    
    overlay.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // ESC key to close
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    return modal;
}

// Show empty state
function showEmptyState() {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;
    
    notesList.innerHTML = `
        <div class="empty-state">
            <i class="material-icons">description</i>
            <h3>还没有笔记</h3>
            <p>上传您的第一个Markdown文件开始学习之旅</p>
        </div>
    `;
}

// Search notes
function searchNotes() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase().trim();
    const notes = getStoredNotes();
    
    if (!query) {
        loadStoredNotes();
        return;
    }
    
    const filteredNotes = notes.filter(note => {
        return note.title.toLowerCase().includes(query) ||
               note.content.toLowerCase().includes(query) ||
               note.fileName.toLowerCase().includes(query);
    });
    
    displaySearchResults(filteredNotes, query);
}

// Open notes index page
function openNotesIndex() {
    window.open('src/index.html', '_blank');
}

// Reset file save preference
function resetSavePreference() {
    localStorage.removeItem('fileSavePreference');
    window.savedDirHandle = null;
    showNotification('文件保存偏好已重置，下次上传时将重新询问保存方式', 'success');
}

// Delete note function
function deleteNote(noteId, event) {
    // 阻止事件冒泡，避免触发笔记打开
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    // 确认删除
    if (!confirm('确定要删除这个笔记吗？此操作不可撤销。')) {
        return;
    }
    
    try {
        // 从localStorage中删除
        const notes = getStoredNotes();
        const noteIndex = notes.findIndex(note => note.id === noteId);
        
        if (noteIndex === -1) {
            showNotification('笔记不存在', 'error');
            return;
        }
        
        const noteToDelete = notes[noteIndex];
        
        // 从数组中移除
        notes.splice(noteIndex, 1);
        localStorage.setItem('jsLearningNotes', JSON.stringify(notes));
        
        // 从DOM中移除
        const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
        if (noteElement) {
            noteElement.remove();
        }
        
        // 如果删除后没有笔记了，显示空状态
        if (notes.length === 0) {
            showEmptyState();
        }
        
        // 提示用户手动删除HTML文件
        if (noteToDelete.htmlFile) {
            showNotification(`笔记已删除。请手动删除HTML文件：${noteToDelete.htmlFile}`, 'warning');
        } else {
            showNotification('笔记已成功删除', 'success');
        }
        
    } catch (error) {
        console.error('删除笔记时出错:', error);
        showNotification('删除笔记时出现错误', 'error');
    }
}

// Delete all notes function
function deleteAllNotes() {
    if (!confirm('确定要删除所有笔记吗？此操作不可撤销。')) {
        return;
    }
    
    try {
        const notes = getStoredNotes();
        const htmlFiles = notes.filter(note => note.htmlFile).map(note => note.htmlFile);
        
        // 清空localStorage
        localStorage.removeItem('jsLearningNotes');
        
        // 清空DOM
        const notesList = document.getElementById('notesList');
        if (notesList) {
            notesList.innerHTML = '';
            showEmptyState();
        }
        
        // 提示用户手动删除HTML文件
        if (htmlFiles.length > 0) {
            showNotification(`所有笔记已删除。请手动删除以下HTML文件：\n${htmlFiles.join('\n')}`, 'warning');
        } else {
            showNotification('所有笔记已成功删除', 'success');
        }
        
    } catch (error) {
        console.error('删除所有笔记时出错:', error);
        showNotification('删除笔记时出现错误', 'error');
    }
}

// Display search results
function displaySearchResults(notes, query) {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;
    
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <i class="material-icons">search_off</i>
                <h3>没有找到相关笔记</h3>
                <p>尝试使用其他关键词搜索</p>
            </div>
        `;
        return;
    }
    
    notes.forEach(note => {
        displayNote(note, false);
    });
}

// Add search on enter key
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchNotes();
            }
        });
        
        // Real-time search
        searchInput.addEventListener('input', function() {
            if (this.value.trim() === '') {
                loadStoredNotes();
            }
        });
    }
});

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${escapeHtml(message)}</span>
        <button class="notification-close">
            <i class="material-icons">close</i>
        </button>
    `;
    
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 1rem;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        }
        .notification-success {
            border-left: 4px solid #4caf50;
        }
        .notification-error {
            border-left: 4px solid #f44336;
        }
        .notification-info {
            border-left: 4px solid #2196f3;
        }
        .notification-close {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 50%;
            transition: background-color 0.3s ease;
        }
        .notification-close:hover {
            background: rgba(0, 0, 0, 0.1);
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    notification.appendChild(style);
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle browser back/forward
window.addEventListener('hashchange', function() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        showSection(hash);
    }
});

// Initialize from URL hash on load
window.addEventListener('load', function() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        showSection(hash);
    }
});

// JavaScript代码编辑器功能
let codeEditor;
let autocompleteContainer;
let autocompleteSuggestions;
let selectedSuggestionIndex = -1;

// JavaScript关键词和内置对象
const jsKeywords = [
    'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
    'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface',
    'let', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static',
    'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var',
    'void', 'volatile', 'while', 'with', 'yield', 'async', 'of'
];

const jsBuiltins = [
    'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math', 'Number', 'Object', 'RegExp', 'String',
    'console', 'document', 'window', 'alert', 'confirm', 'prompt', 'setTimeout', 'setInterval', 'clearTimeout',
    'clearInterval', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
    'Promise', 'Set', 'Map', 'WeakSet', 'WeakMap', 'Symbol', 'Proxy', 'Reflect', 'ArrayBuffer', 'DataView',
    'Int8Array', 'Uint8Array', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array',
    'localStorage', 'sessionStorage', 'fetch', 'XMLHttpRequest', 'FormData', 'URLSearchParams', 'URL', 'Blob', 'File'
];

const jsMethods = [
    'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'join', 'concat', 'indexOf', 'lastIndexOf',
    'forEach', 'map', 'filter', 'reduce', 'find', 'findIndex', 'some', 'every', 'sort', 'reverse',
    'charAt', 'charCodeAt', 'substring', 'substr', 'toLowerCase', 'toUpperCase', 'trim', 'split',
    'replace', 'match', 'search', 'test', 'exec', 'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf',
    'includes', 'startsWith', 'endsWith', 'padStart', 'padEnd', 'repeat', 'localeCompare', 'normalize',
    'reduceRight', 'flatMap', 'flat', 'fill', 'copyWithin', 'entries', 'keys', 'values', 'from', 'of',
    'add', 'delete', 'has', 'clear', 'size', 'get', 'set', 'then', 'catch', 'finally', 'resolve', 'reject',
    'all', 'race', 'allSettled', 'any', 'log', 'warn', 'error', 'info', 'debug', 'table', 'group', 'groupEnd',
    'time', 'timeEnd', 'count', 'countReset', 'trace', 'assert', 'dir', 'dirxml', 'clear'
];

// 初始化代码编辑器
function initializeCodeEditor() {
    codeEditor = document.getElementById('codeEditor');
    if (!codeEditor) return;

    // 创建textarea元素
    const textarea = document.createElement('textarea');
    textarea.className = 'code-editor';
    textarea.placeholder = '在这里输入JavaScript代码...\n\n示例：\nconsole.log("Hello, World!");\n\nlet numbers = [1, 2, 3, 4, 5];\nlet doubled = numbers.map(n => n * 2);\nconsole.log(doubled);';
    textarea.spellcheck = false;
    
    // 创建自动补全容器
    autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'autocomplete-container';
    autocompleteContainer.style.position = 'relative';
    autocompleteContainer.style.height = '100%';
    
    autocompleteSuggestions = document.createElement('div');
    autocompleteSuggestions.className = 'autocomplete-suggestions';
    autocompleteSuggestions.style.display = 'none';
    
    autocompleteContainer.appendChild(textarea);
    autocompleteContainer.appendChild(autocompleteSuggestions);
    codeEditor.appendChild(autocompleteContainer);
    
    // 绑定事件
    textarea.addEventListener('input', handleCodeInput);
    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('blur', hideSuggestions);
    
    // 绑定按钮事件
    document.getElementById('runCode').addEventListener('click', runCode);
    document.getElementById('clearCode').addEventListener('click', clearCode);
    document.getElementById('saveCode').addEventListener('click', saveCode);
    document.getElementById('loadCode').addEventListener('click', loadCode);
    document.getElementById('clearOutput').addEventListener('click', clearOutput);
    
    // 加载保存的代码
    loadSavedCode();
}

// 处理代码输入
function handleCodeInput(e) {
    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const currentWord = getCurrentWord(textBeforeCursor);
    
    if (currentWord.length >= 1) {
        showSuggestions(currentWord, textarea);
    } else {
        hideSuggestions();
    }
}

// 获取当前单词
function getCurrentWord(text) {
    const words = text.split(/[\s\(\)\{\}\[\];,\.]+/);
    return words[words.length - 1] || '';
}

// 显示自动补全建议
function showSuggestions(word, textarea) {
    const suggestions = getSuggestions(word);
    
    if (suggestions.length === 0) {
        hideSuggestions();
        return;
    }
    
    // 计算光标位置
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length;
    const lineHeight = 20; // 估算行高
    const topPosition = Math.min((currentLine - 1) * lineHeight + 25, textarea.offsetHeight - 150);
    
    autocompleteSuggestions.style.top = topPosition + 'px';
    autocompleteSuggestions.innerHTML = '';
    selectedSuggestionIndex = -1;
    
    suggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.innerHTML = `
            <div class="autocomplete-icon">${suggestion.type.charAt(0).toUpperCase()}</div>
            <div class="autocomplete-text">${suggestion.text}</div>
            <div class="autocomplete-type">${suggestion.type}</div>
        `;
        
        item.addEventListener('click', () => {
            insertSuggestion(suggestion.text, textarea);
            hideSuggestions();
        });
        
        autocompleteSuggestions.appendChild(item);
    });
    
    autocompleteSuggestions.style.display = 'block';
}

// 获取建议列表
function getSuggestions(word) {
    const suggestions = [];
    const lowerWord = word.toLowerCase();
    
    // 关键词建议
    jsKeywords.forEach(keyword => {
        if (keyword.toLowerCase().startsWith(lowerWord)) {
            suggestions.push({ text: keyword, type: 'keyword' });
        }
    });
    
    // 内置对象建议
    jsBuiltins.forEach(builtin => {
        if (builtin.toLowerCase().startsWith(lowerWord)) {
            suggestions.push({ text: builtin, type: 'builtin' });
        }
    });
    
    // 方法建议
    jsMethods.forEach(method => {
        if (method.toLowerCase().startsWith(lowerWord)) {
            suggestions.push({ text: method, type: 'method' });
        }
    });
    
    return suggestions.slice(0, 10); // 限制显示数量
}

// 插入建议
function insertSuggestion(suggestion, textarea) {
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const textAfterCursor = textarea.value.substring(cursorPos);
    const currentWord = getCurrentWord(textBeforeCursor);
    
    const newTextBefore = textBeforeCursor.substring(0, textBeforeCursor.length - currentWord.length) + suggestion;
    textarea.value = newTextBefore + textAfterCursor;
    textarea.selectionStart = textarea.selectionEnd = newTextBefore.length;
    textarea.focus();
}

// 处理键盘事件
function handleKeyDown(e) {
    if (autocompleteSuggestions.style.display === 'none') return;
    
    const items = autocompleteSuggestions.querySelectorAll('.autocomplete-item');
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, items.length - 1);
            updateSelectedSuggestion(items);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
            updateSelectedSuggestion(items);
            break;
            
        case 'Enter':
        case 'Tab':
            if (selectedSuggestionIndex >= 0) {
                e.preventDefault();
                const selectedItem = items[selectedSuggestionIndex];
                const suggestion = selectedItem.querySelector('.autocomplete-text').textContent;
                insertSuggestion(suggestion, e.target);
                hideSuggestions();
            }
            break;
            
        case 'Escape':
            hideSuggestions();
            break;
    }
}

// 更新选中的建议
function updateSelectedSuggestion(items) {
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === selectedSuggestionIndex);
    });
}

// 隐藏建议
function hideSuggestions() {
    autocompleteSuggestions.style.display = 'none';
    selectedSuggestionIndex = -1;
}

// 运行代码
function runCode() {
    const textarea = document.querySelector('#codeEditor textarea');
    const code = textarea.value;
    const output = document.getElementById('codeOutput');
    
    // 清空输出
    output.innerHTML = '';
    
    if (!code.trim()) {
        addOutput('请输入要运行的JavaScript代码', 'warn');
        return;
    }
    
    // 重写console方法以捕获输出
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
    };
    
    console.log = (...args) => {
        addOutput(args.map(arg => formatValue(arg)).join(' '), 'log');
        originalConsole.log(...args);
    };
    
    console.error = (...args) => {
        addOutput(args.map(arg => formatValue(arg)).join(' '), 'error');
        originalConsole.error(...args);
    };
    
    console.warn = (...args) => {
        addOutput(args.map(arg => formatValue(arg)).join(' '), 'warn');
        originalConsole.warn(...args);
    };
    
    console.info = (...args) => {
        addOutput(args.map(arg => formatValue(arg)).join(' '), 'info');
        originalConsole.info(...args);
    };
    
    try {
        // 执行代码
        const result = eval(code);
        if (result !== undefined) {
            addOutput(`返回值: ${formatValue(result)}`, 'info');
        }
        addOutput('代码执行完成', 'info');
    } catch (error) {
        addOutput(`错误: ${error.message}`, 'error');
    } finally {
        // 恢复console方法
        Object.assign(console, originalConsole);
    }
}

// 格式化值
function formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return value.toString();
        }
    }
    return value.toString();
}

// 添加输出
function addOutput(text, type = 'log') {
    const output = document.getElementById('codeOutput');
    const line = document.createElement('div');
    line.className = `output-line output-${type}`;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

// 清空代码
function clearCode() {
    const textarea = document.querySelector('#codeEditor textarea');
    if (confirm('确定要清空所有代码吗？')) {
        textarea.value = '';
        textarea.focus();
    }
}

// 清空输出
function clearOutput() {
    const output = document.getElementById('codeOutput');
    output.innerHTML = '';
}

// 保存代码
function saveCode() {
    const textarea = document.querySelector('#codeEditor textarea');
    const code = textarea.value;
    
    if (!code.trim()) {
        showNotification('没有代码可以保存', 'warn');
        return;
    }
    
    localStorage.setItem('savedJSCode', code);
    showNotification('代码已保存到本地存储', 'success');
}

// 加载代码
function loadCode() {
    const savedCode = localStorage.getItem('savedJSCode');
    
    if (!savedCode) {
        showNotification('没有找到保存的代码', 'warn');
        return;
    }
    
    const textarea = document.querySelector('#codeEditor textarea');
    if (textarea.value.trim() && !confirm('当前有未保存的代码，确定要加载保存的代码吗？')) {
        return;
    }
    
    textarea.value = savedCode;
    showNotification('代码已加载', 'success');
}

// 加载保存的代码（初始化时）
function loadSavedCode() {
    const savedCode = localStorage.getItem('savedJSCode');
    if (savedCode) {
        const textarea = document.querySelector('#codeEditor textarea');
        textarea.value = savedCode;
    }
}

// Export functions for use in other scripts
window.JSLearningApp = {
    showSection,
    searchNotes,
    showNotification,
    getStoredNotes,
    saveNote,
    runCode,
    clearCode,
    saveCode,
    loadCode
};