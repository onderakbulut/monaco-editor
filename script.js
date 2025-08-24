
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' } });


let htmlEditor, cssEditor;
let currentTheme = 'vs';



let isDragging = false;
let containerWidth;
let initialX;
let editorWidth;


const defaultHtml = `<!DOCTYPE html>
<html>
<head>
<style>

</style>
</head>
<body>

<h1>Monaco Tryit Editor</h1>

<div class="ornek">
  <h3>HTML ve CSS</h3>
  <p>HTML ve CSS ile web sayfaları oluşturabilirsiniz. <a href="#">Daha fazla bilgi için tıklayın</a>.</p>
</div>

<script>

</script>
</body>
</html>`;

const defaultCss = `
body {
  font-family: Arial, sans-serif;
  margin: 20px;
}

h1 {
  color: #04AA6D;
}

.ornek {
  background-color: #f1f1f1;
  padding: 15px;
  border-radius: 5px;
  margin-top: 20px;
}

a {
  color: #0000EE;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}`;

const defaultJs = `
document.addEventListener("DOMContentLoaded", function() {
  const baslik = document.querySelector("h1");
  
  baslik.addEventListener("click", function() {
    alert("Monaco Tryit Editor'e Hoş Geldiniz!");
  });
});`;


require(['vs/editor/editor.main'], function() {
    
    htmlEditor = monaco.editor.create(document.getElementById('htmlEditor'), {
        value: defaultHtml,
        language: 'html',
        theme: currentTheme,
        automaticLayout: true,
        minimap: { enabled: false }
    });

    
    cssEditor = monaco.editor.create(document.getElementById('cssEditor'), {
        value: defaultCss,
        language: 'css',
        theme: currentTheme,
        automaticLayout: true,
        minimap: { enabled: false }
    });

    
    document.getElementById('htmlEditor').classList.add('active');
    document.getElementById('cssEditor').classList.remove('active');


    
    updateResult();
    
    
    initDragbar();
});


document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        
        const tabId = button.getAttribute('data-tab');
        document.querySelectorAll('.editor').forEach(editor => editor.classList.remove('active'));
        document.getElementById(tabId + 'Editor').classList.add('active');
        

    });
});


document.getElementById('runButton').addEventListener('click', updateResult);


document.addEventListener('keydown', function(e) {
    
    if (e.altKey && e.key === 'Enter') {
        
        e.preventDefault();
        
        document.getElementById('runButton').click();
    }
});


document.getElementById('themeSelector').addEventListener('change', function() {
    currentTheme = this.value;
    monaco.editor.setTheme(currentTheme);
});


function initDragbar() {
    const dragbar = document.getElementById('dragbar');
    const editorContainer = document.querySelector('.editor-container');
    const resultContainer = document.querySelector('.result-container');
    const mainContent = document.querySelector('.main-content');
    
    
    let animationFrameId = null;
    
    
    dragbar.addEventListener('mousedown', function(e) {
        
        e.preventDefault();
        
        isDragging = true;
        dragbar.classList.add('dragging');
        
        
        initialX = e.clientX;
        containerWidth = mainContent.offsetWidth;
        editorWidth = editorContainer.offsetWidth;
        
        
        document.body.style.userSelect = 'none';
        document.body.style.pointerEvents = 'none';
        
        
        document.body.style.cursor = 'col-resize';
        
        
        document.addEventListener('mousemove', handleMouseMove, { capture: true });
        document.addEventListener('mouseup', handleMouseUp, { capture: true, once: true });
    });
    
    
    function handleMouseMove(e) {
        if (!isDragging) return;
        
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        
        animationFrameId = requestAnimationFrame(() => {
            
            const dx = e.clientX - initialX;
            
            
            const minEditorWidth = Math.max(200, containerWidth * 0.2); 
            const maxEditorWidth = Math.min(containerWidth - 200, containerWidth * 0.8); 
            
            const newEditorWidth = Math.max(minEditorWidth, Math.min(maxEditorWidth, editorWidth + dx));
            const editorPercent = (newEditorWidth / containerWidth) * 100;
            const resultPercent = 100 - editorPercent;
            
            
            editorContainer.style.width = editorPercent + '%';
            resultContainer.style.width = resultPercent + '%';
            
            
            if (htmlEditor) htmlEditor.layout();
            if (cssEditor) cssEditor.layout();
            
            
            updateResultSize();
        });
    }
    
    
    function handleMouseUp() {
        isDragging = false;
        dragbar.classList.remove('dragging');
        
        
        document.body.style.userSelect = '';
        document.body.style.pointerEvents = '';
        document.body.style.cursor = '';
        
        
        document.removeEventListener('mousemove', handleMouseMove, { capture: true });
        
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
}


function updateResult() {
    const htmlCode = htmlEditor.getValue();
    const cssCode = cssEditor.getValue();
    
    
    const combinedCode = processHtml(htmlCode, cssCode);
    
    
    const resultFrame = document.getElementById('resultFrame');
    const frameDoc = resultFrame.contentDocument || resultFrame.contentWindow.document;
    
    frameDoc.open();
    frameDoc.write(combinedCode);
    frameDoc.close();
    
    
    updateResultSize();
}


function processHtml(html, css) {
    // Eğer HTML tam bir dokument değilse, onu tamamla
    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
        // Basit HTML snippet'i tam dokumente çevir
        html = `<!DOCTYPE html>
<html>
<head>
<style>
${css}
</style>
</head>
<body>
${html}
</body>
</html>`;
    } else {
        // Tam HTML dokument ise CSS'i head'e ekle
        if (html.includes('</head>')) {
            html = html.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
        } else if (html.includes('<head>')) {
            html = html.replace('<head>', `<head>\n<style>\n${css}\n</style>`);
        } else {
            // Head yoksa body'den önce ekle
            html = html.replace('<body>', `<head>\n<style>\n${css}\n</style>\n</head>\n<body>`);
        }
    }
    
    return html;
}


function updateResultSize() {
    const resultFrame = document.getElementById('resultFrame');
    const width = resultFrame.offsetWidth;
    const height = resultFrame.offsetHeight;
    
    document.getElementById('resultSize').textContent = `${width} x ${height}`;
}


window.addEventListener('resize', updateResultSize);


