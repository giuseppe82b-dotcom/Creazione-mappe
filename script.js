document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('canvas');
    let zoomLevel = 1.0;
    let translateX = 0;
    let translateY = 0;
    let nodeIdCounter = 0;

    const instance = jsPlumb.getInstance({
        Container: canvas,
        Connector: ['Flowchart', { cornerRadius: 5 }],
        Anchor: ['Top', 'Bottom', 'Left', 'Right'],
        Endpoint: 'Blank',
        PaintStyle: { stroke: '#007bff', strokeWidth: 2 },
        Arrow: ['Arrow', { width: 8, length: 8, location: 1 }]
    });

    function updateCanvasTransform() {
        canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
    }

    function createNode(x, y, content = 'Nuovo Argomento') {
        const nodeId = 'node-' + nodeIdCounter++;
        const node = document.createElement('div');
        node.id = nodeId;
        node.className = 'node';
        node.style.left = x + 'px';
        node.style.top = y + 'px';
        
        node.innerHTML = `
            <button class="delete-btn">×</button>
            <button class="edit-btn">✎</button> 
            <button class="image-btn">🖼️</button> 
            <div class="node-content">${content}</div> 
            <button class="add-btn top" data-direction="top">+</button>
            <button class="add-btn bottom" data-direction="bottom">+</button>
            <button class="add-btn left" data-direction="left">+</button>
            <button class="add-btn right" data-direction="right">+</button>
            <input type="color" class="color-picker" value="#007bff">
        `;
        canvas.appendChild(node);
        
        const contentDiv = node.querySelector('.node-content');

        node.querySelector('.edit-btn').addEventListener('click', () => {
            contentDiv.setAttribute('contenteditable', 'true');
            contentDiv.focus();
        });
        contentDiv.addEventListener('blur', () => {
            contentDiv.setAttribute('contenteditable', 'false');
        });

        node.querySelector('.image-btn').addEventListener('click', () => {
            const imageUrl = prompt("Inserisci l'URL dell'immagine:");
            if (imageUrl) {
                const existingImage = node.querySelector('.node-image');
                if (existingImage) existingImage.remove();
                const img = document.createElement('img');
                img.src = imageUrl;
                img.className = 'node-image';
                node.insertBefore(img, contentDiv);
                instance.revalidate(node);
            }
        });

        node.querySelector('.delete-btn').addEventListener('click', () => {
            instance.remove(node);
        });

        instance.draggable(node, { containment: 'parent' });
        instance.makeTarget(node, { allowLoopback: false });

        node.querySelector('.add-btn.top').addEventListener('click', () => addNewNode(node, 'top'));
        node.querySelector('.add-btn.bottom').addEventListener('click', () => addNewNode(node, 'bottom'));
        node.querySelector('.add-btn.left').addEventListener('click', () => addNewNode(node, 'left'));
        node.querySelector('.add-btn.right').addEventListener('click', () => addNewNode(node, 'right'));

        const colorPicker = node.querySelector('.color-picker');
        colorPicker.addEventListener('input', (event) => {
            node.style.borderColor = event.target.value;
            instance.select({ source: nodeId }).setPaintStyle({ stroke: event.target.value });
        });
        
        return node;
    }

    function addNewNode(parentNode, direction) {
        let x = parentNode.offsetLeft;
        let y = parentNode.offsetTop;
        
        const spacing = 200;
        switch (direction) {
            case 'top':    y -= spacing; break;
            case 'bottom': y += spacing; break;
            case 'left':   x -= spacing; break;
            case 'right':  x += spacing; break;
        }

        const newNode = createNode(x, y);
        instance.connect({
            source: parentNode,
            target: newNode,
            paintStyle: { stroke: parentNode.style.borderColor || '#007bff', strokeWidth: 2 }
        });
    }

    document.getElementById('zoom-in-btn').addEventListener('click', () => {
        zoomLevel = Math.min(2.0, zoomLevel + 0.1);
        updateCanvasTransform();
    });

    document.getElementById('zoom-out-btn').addEventListener('click', () => {
        zoomLevel = Math.max(0.3, zoomLevel - 0.1);
        updateCanvasTransform();
    });

    document.getElementById('fit-to-screen-btn').addEventListener('click', () => {
        const nodes = document.querySelectorAll('.node');
        if (nodes.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        nodes.forEach(node => {
            const x1 = node.offsetLeft;
            const y1 = node.offsetTop;
            const x2 = x1 + node.offsetWidth;
            const y2 = y1 + node.offsetHeight;

            if (x1 < minX) minX = x1;
            if (y1 < minY) minY = y1;
            if (x2 > maxX) maxX = x2;
            if (y2 > maxY) maxY = y2;
        });

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        
        if(contentWidth === 0 || contentHeight === 0) return;

        const padding = 100;
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;

        const scaleX = viewWidth / (contentWidth + padding * 2);
        const scaleY = viewHeight / (contentHeight + padding * 2);
        zoomLevel = Math.min(scaleX, scaleY, 1.5);

        const contentCenterX = minX + contentWidth / 2;
        const contentCenterY = minY + contentHeight / 2;
        
        translateX = (viewWidth / 2) - (contentCenterX * zoomLevel);
        translateY = (viewHeight / 2) - (contentCenterY * zoomLevel);
        
        updateCanvasTransform();
    });

    document.getElementById('export-btn').addEventListener('click', () => {
        document.querySelectorAll('.add-btn, .color-picker, .delete-btn, .edit-btn, .image-btn').forEach(el => el.style.opacity = '0');
        
        html2canvas(canvas, {
            backgroundColor: '#f0f2f5',
            useCORS: true, // <-- MODIFICA CHIAVE: Aggiungi questa opzione
            onclone: (doc) => {
                doc.getElementById('canvas').style.transform = 'translate(0, 0) scale(1)';
            }
        }).then(canvasImage => {
            const link = document.createElement('a');
            link.download = 'mappa-concettuale.png';
            link.href = canvasImage.toDataURL('image/png');
            link.click();
            document.querySelectorAll('.add-btn, .color-picker, .delete-btn, .edit-btn, .image-btn').forEach(el => el.style.opacity = '');
        });
    });

    createNode(window.innerWidth / 2 - 100, window.innerHeight / 2 - 50, 'Argomento Principale');
});