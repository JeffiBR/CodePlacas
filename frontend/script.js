class PlacasOfertasApp {
    constructor() {
        this.currentFile = null;
        this.produtos = [];
        this.perfis = [];
        this.perfilAtual = null;
        this.previewIndice = 0;
        
        this.config = {
            tamanho: 'A4',
            fundo: 'padrao',
            bordas: true,
            
            // Configurações dos elementos
            nome_visivel: true,
            nome_x: 20,
            nome_y: 50,
            nome_largura: 300,
            nome_altura: 100,
            fonte_nome: 'Helvetica-Bold',
            fonte_tamanho_nome: 20,
            nome_cor: '#2D3748',
            
            valor_visivel: true,
            valor_x: 20,
            valor_y: 100,
            valor_largura: 200,
            valor_altura: 50,
            fonte_valor: 'Helvetica-Bold',
            fonte_tamanho_valor: 28,
            valor_cor: '#E53E3E',
            
            data_visivel: true,
            data_x: 20,
            data_y: 150,
            data_largura: 250,
            data_altura: 30,
            fonte_data: 'Helvetica-Bold',
            fonte_tamanho_data: 14,
            data_cor: '#4A5568',
            
            codigo_visivel: true,
            codigo_x: 20,
            codigo_y: 180,
            codigo_largura: 200,
            fonte_codigo: 'Helvetica-Bold',
            fonte_tamanho_codigo: 12,
            codigo_cor: '#718096',
            usar_imagem_codigo: false,
            codigo_largura_imagem: 120,
            codigo_altura_imagem: 30
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.loadBackgrounds();
        this.loadFonts();
        this.carregarPerfis();
        this.setupNavigation();
    }
    
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                
                // Atualizar navegação
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Mostrar seção correspondente
                document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
                document.getElementById(section).classList.add('active');
            });
        });
    }
    
    setupEventListeners() {
        // Upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#6366F1';
            uploadArea.style.background = '#1E293B';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#475569';
            uploadArea.style.background = '#1E293B';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#475569';
            uploadArea.style.background = '#1E293B';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
        
        // Perfis
        document.getElementById('novoPerfilBtn').addEventListener('click', () => {
            this.novoPerfil();
        });
        
        document.getElementById('salvarPerfilBtn').addEventListener('click', () => {
            this.salvarPerfil();
        });
        
        document.getElementById('excluirPerfilBtn').addEventListener('click', () => {
            this.excluirPerfil();
        });
        
        // Tabs do painel
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.ativarTab(tabName);
            });
        });
        
        // Accordion
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const item = header.parentElement;
                item.classList.toggle('active');
            });
        });
        
        // Controles gerais
        document.getElementById('tamanhoPlaca').addEventListener('change', (e) => {
            this.config.tamanho = e.target.value;
            this.atualizarTamanhoPlaca();
        });
        
        // Controles de elementos
        this.setupElementControls();
        
        // Pré-visualização
        document.getElementById('btnVisualizar').addEventListener('click', () => {
            this.gerarPreviewIndividual();
        });
        
        document.getElementById('btnPreviewAnterior').addEventListener('click', () => {
            this.previewAnterior();
        });
        
        document.getElementById('btnPreviewProximo').addEventListener('click', () => {
            this.previewProximo();
        });
        
        document.getElementById('selectPreviewProduto').addEventListener('change', (e) => {
            this.previewIndice = parseInt(e.target.value);
            this.gerarPreviewIndividual();
        });
        
        // Geração
        document.getElementById('gerarTodasPlacasBtn').addEventListener('click', () => {
            this.gerarPlacas();
        });
        
        // Código de barras
        document.getElementById('gerarCodigoBarrasBtn').addEventListener('click', () => {
            this.gerarCodigoBarrasParaTodos();
        });
        
        // Toggle limites
        document.getElementById('btnToggleLimites').addEventListener('click', () => {
            this.toggleVisualizacaoLimites();
        });
        
        // Confirmação de impressão
        document.getElementById('btnImprimirPlaca').addEventListener('click', () => {
            this.confirmarImpressao();
        });
        
        document.getElementById('btnPularPlaca').addEventListener('click', () => {
            this.pularPlaca();
        });
        
        document.getElementById('btnImprimirTodas').addEventListener('click', () => {
            this.imprimirTodasValidas();
        });
        
        document.getElementById('btnCancelarConfirmacao').addEventListener('click', () => {
            this.cancelarConfirmacao();
        });
    }
    
    setupElementControls() {
        const elementos = ['nome', 'valor', 'data', 'codigo'];
        
        elementos.forEach(elemento => {
            // Visibilidade
            document.getElementById(`${elemento}Visivel`).addEventListener('change', (e) => {
                this.config[`${elemento}_visivel`] = e.target.checked;
                this.atualizarVisibilidadeElemento(elemento, e.target.checked);
            });
            
            // Dimensões
            document.getElementById(`${elemento}Largura`).addEventListener('change', (e) => {
                this.config[`${elemento}_largura`] = parseInt(e.target.value);
                this.atualizarDimensoesElemento(elemento);
            });
            
            document.getElementById(`${elemento}Altura`).addEventListener('change', (e) => {
                this.config[`${elemento}_altura`] = parseInt(e.target.value);
                this.atualizarDimensoesElemento(elemento);
            });
            
            // Fontes
            document.getElementById(`fonte${this.capitalize(elemento)}`).addEventListener('change', (e) => {
                this.config[`fonte_${elemento}`] = e.target.value;
                this.atualizarFonteElemento(elemento, e.target.value);
            });
            
            // Tamanhos de fonte
            const slider = document.getElementById(`tamanho${this.capitalize(elemento)}`);
            const valueSpan = document.getElementById(`tamanho${this.capitalize(elemento)}Value`);
            
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.config[`fonte_tamanho_${elemento}`] = value;
                valueSpan.textContent = value;
                this.atualizarTamanhoElemento(elemento, value);
            });
            
            // Cores
            document.getElementById(`cor${this.capitalize(elemento)}`).addEventListener('change', (e) => {
                this.config[`${elemento}_cor`] = e.target.value;
                this.atualizarCorElemento(elemento, e.target.value);
                
                // Atualizar valor da cor
                const colorValue = e.target.parentElement.querySelector('.color-value');
                if (colorValue) {
                    colorValue.textContent = e.target.value.toUpperCase();
                }
            });
        });
        
        // Configuração específica do código
        document.getElementById('usarImagemCodigo').addEventListener('change', (e) => {
            this.config.usar_imagem_codigo = e.target.checked;
        });
        
        document.getElementById('codigoLarguraImagem').addEventListener('change', (e) => {
            this.config.codigo_largura_imagem = parseInt(e.target.value);
        });
        
        document.getElementById('codigoAlturaImagem').addEventListener('change', (e) => {
            this.config.codigo_altura_imagem = parseInt(e.target.value);
        });
    }
    
    setupDragAndDrop() {
        const elementos = document.querySelectorAll('.elemento-draggable');
        
        elementos.forEach(elemento => {
            const elementoNome = elemento.dataset.elemento;
            
            interact(elemento)
                .draggable({
                    modifiers: [
                        interact.modifiers.restrictRect({
                            restriction: 'parent',
                            endOnly: true
                        })
                    ],
                    listeners: {
                        start: (event) => {
                            elemento.classList.add('dragging');
                        },
                        move: (event) => {
                            const x = (parseFloat(elemento.getAttribute('data-x')) || 0) + event.dx;
                            const y = (parseFloat(elemento.getAttribute('data-y')) || 0) + event.dy;
                            
                            elemento.style.transform = `translate(${x}px, ${y}px)`;
                            elemento.setAttribute('data-x', x);
                            elemento.setAttribute('data-y', y);
                            
                            // Atualizar configuração
                            this.config[`${elementoNome}_x`] = x + 20;
                            this.config[`${elementoNome}_y`] = y + 50;
                        },
                        end: (event) => {
                            elemento.classList.remove('dragging');
                        }
                    }
                })
                .resizable({
                    edges: { left: true, right: true, bottom: true, top: true },
                    modifiers: [
                        interact.modifiers.restrictSize({
                            min: { width: 100, height: 40 }
                        })
                    ],
                    listeners: {
                        move: (event) => {
                            let { x, y } = event.deltaRect;
                            
                            Object.assign(elemento.style, {
                                width: `${event.rect.width}px`,
                                height: `${event.rect.height}px`,
                                transform: `translate(${(parseFloat(elemento.getAttribute('data-x')) || 0) + x}px, ${(parseFloat(elemento.getAttribute('data-y')) || 0) + y}px)`
                            });
                            
                            elemento.setAttribute('data-x', (parseFloat(elemento.getAttribute('data-x')) || 0) + x);
                            elemento.setAttribute('data-y', (parseFloat(elemento.getAttribute('data-y')) || 0) + y);
                            
                            // Atualizar configurações de dimensão
                            this.config[`${elementoNome}_largura`] = event.rect.width;
                            this.config[`${elementoNome}_altura`] = event.rect.height;
                            
                            // Atualizar controles
                            document.getElementById(`${elementoNome}Largura`).value = Math.round(event.rect.width);
                            document.getElementById(`${elementoNome}Altura`).value = Math.round(event.rect.height);
                            
                            this.atualizarDimensoesInfo(elemento);
                        }
                    }
                });
                
            this.atualizarDimensoesInfo(elemento);
        });
    }
    
    atualizarDimensoesInfo(elemento) {
        const info = elemento.querySelector('.dimensoes-info');
        const width = elemento.offsetWidth;
        const height = elemento.offsetHeight;
        info.textContent = `${width} × ${height}px`;
    }
    
    async handleFileSelect(file) {
        if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
            this.showStatus('Por favor, selecione um arquivo CSV ou Excel.', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            this.showStatus('Carregando arquivo...', 'success');
            
            const response = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.currentFile = data.filename;
                this.produtos = data.preview;
                this.showFileInfo(data);
                this.showPreview(data.preview);
                this.prepararPreviews();
                this.showStatus('Arquivo carregado com sucesso!', 'success');
                
                // Mostrar alerta se houver problemas
                if (data.total_problemas > 0) {
                    this.showStatus(`${data.total_problemas} produtos com problemas encontrados. Verifique a tabela.`, 'warning');
                }
                
                // Navegar para a seção de editor
                document.querySelector('[data-section="editor"]').click();
                
                // Gerar códigos de barras se necessário
                this.gerarCodigosBarrasParaProdutos();
            } else {
                this.showStatus(`Erro: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showStatus('Erro de conexão com o servidor.', 'error');
        }
    }
    
    showFileInfo(data) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const totalProdutos = document.getElementById('totalProdutos');
        const previewCount = document.getElementById('previewCount');
        
        fileName.textContent = data.filename;
        totalProdutos.textContent = data.total_produtos;
        previewCount.textContent = data.preview.length;
        
        fileInfo.style.display = 'block';
    }
    
    showPreview(previewData) {
        const previewSection = document.getElementById('previewSection');
        const tbody = document.querySelector('#previewTable tbody');
        
        tbody.innerHTML = '';
        previewData.forEach((produto, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${produto['Nome do produto']}</td>
                <td>R$ ${produto['Preço']}</td>
                <td>${produto['Data da Oferta']}</td>
                <td>${produto['Codigo de Barras'] || ''}</td>
                <td>
                    <button class="btn-small" onclick="app.visualizarProduto(${index})">👁️ Visualizar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        previewSection.style.display = 'block';
    }
    
    prepararPreviews() {
        const select = document.getElementById('selectPreviewProduto');
        select.innerHTML = '';
        
        this.produtos.forEach((produto, index) => {
            const option = document.createElement('option');
            option.value = index;
            const nome = produto['Nome do produto'].length > 30 
                ? produto['Nome do produto'].substring(0, 30) + '...' 
                : produto['Nome do produto'];
            option.textContent = `Produto ${index + 1}: ${nome}`;
            select.appendChild(option);
        });
        
        this.atualizarIndicePreview();
    }
    
    async carregarPerfis() {
        try {
            const response = await fetch('http://localhost:5000/api/perfis');
            const data = await response.json();
            
            this.perfis = data.perfis;
            this.atualizarListaPerfis();
        } catch (error) {
            console.error('Erro ao carregar perfis:', error);
        }
    }
    
    atualizarListaPerfis() {
        const container = document.getElementById('perfisList');
        container.innerHTML = '';
        
        this.perfis.forEach(perfil => {
            const card = document.createElement('div');
            card.className = 'perfil-card';
            card.innerHTML = `
                <div class="perfil-icon">💾</div>
                <h3>${perfil.nome}</h3>
                <p>Criado em: ${new Date(perfil.criado_em).toLocaleDateString()}</p>
            `;
            
            card.addEventListener('click', () => {
                this.carregarPerfil(perfil.nome);
            });
            
            container.appendChild(card);
        });
    }
    
    async carregarPerfil(nomePerfil) {
        try {
            const response = await fetch(`http://localhost:5000/api/perfis/${encodeURIComponent(nomePerfil)}`);
            const data = await response.json();
            
            if (response.ok) {
                this.perfilAtual = data;
                this.config = { ...this.config, ...data.config };
                this.aplicarConfiguracao();
                
                this.showStatus(`Perfil "${nomePerfil}" carregado com sucesso!`, 'success');
            } else {
                this.showStatus(`Erro: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showStatus('Erro ao carregar perfil.', 'error');
        }
    }
    
    novoPerfil() {
        this.perfilAtual = null;
        document.getElementById('editorPerfil').style.display = 'block';
        document.getElementById('salvarPerfilBtn').style.display = 'inline-block';
        document.getElementById('excluirPerfilBtn').style.display = 'none';
        document.getElementById('nomePerfil').value = '';
        document.getElementById('nomePerfil').focus();
    }
    
    async salvarPerfil() {
        const nomePerfil = document.getElementById('nomePerfil').value.trim();
        
        if (!nomePerfil) {
            this.showStatus('Digite um nome para o perfil.', 'error');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/perfis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome: nomePerfil,
                    config: this.config
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showStatus(`Perfil "${nomePerfil}" salvo com sucesso!`, 'success');
                document.getElementById('editorPerfil').style.display = 'none';
                this.carregarPerfis();
            } else {
                this.showStatus(`Erro: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showStatus('Erro ao salvar perfil.', 'error');
        }
    }
    
    async excluirPerfil() {
        if (!this.perfilAtual) return;
        
        if (!confirm(`Tem certeza que deseja excluir o perfil "${this.perfilAtual.nome}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:5000/api/perfis/${encodeURIComponent(this.perfilAtual.nome)}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showStatus(`Perfil "${this.perfilAtual.nome}" excluído com sucesso!`, 'success');
                this.perfilAtual = null;
                document.getElementById('editorPerfil').style.display = 'none';
                this.carregarPerfis();
            } else {
                this.showStatus(`Erro: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showStatus('Erro ao excluir perfil.', 'error');
        }
    }
    
    aplicarConfiguracao() {
        // Aplicar configurações visuais
        this.updatePreviewBackground();
        
        // Aplicar configurações dos elementos
        const elementos = ['nome', 'valor', 'data', 'codigo'];
        
        elementos.forEach(elemento => {
            // Visibilidade
            const visivel = this.config[`${elemento}_visivel`];
            document.getElementById(`${elemento}Visivel`).checked = visivel;
            this.atualizarVisibilidadeElemento(elemento, visivel);
            
            // Dimensões
            const largura = this.config[`${elemento}_largura`] || 300;
            const altura = this.config[`${elemento}_altura`] || 100;
            
            document.getElementById(`${elemento}Largura`).value = largura;
            document.getElementById(`${elemento}Altura`).value = altura;
            
            this.atualizarDimensoesElemento(elemento);
            
            // Fontes
            const fonte = this.config[`fonte_${elemento}`] || 'Helvetica-Bold';
            document.getElementById(`fonte${this.capitalize(elemento)}`).value = fonte;
            
            // Tamanhos de fonte
            const tamanhoFonte = this.config[`fonte_tamanho_${elemento}`] || 12;
            document.getElementById(`tamanho${this.capitalize(elemento)}`).value = tamanhoFonte;
            document.getElementById(`tamanho${this.capitalize(elemento)}Value`).textContent = tamanhoFonte;
            this.atualizarTamanhoElemento(elemento, tamanhoFonte);
            
            // Cores
            const cor = this.config[`${elemento}_cor`] || '#000000';
            document.getElementById(`cor${this.capitalize(elemento)}`).value = cor;
            this.atualizarCorElemento(elemento, cor);
            
            // Atualizar valores de cor
            const colorValue = document.querySelector(`#cor${this.capitalize(elemento)}`).parentElement.querySelector('.color-value');
            if (colorValue) {
                colorValue.textContent = cor.toUpperCase();
            }
            
            // Posição
            const elementoDom = document.getElementById(`elemento${this.capitalize(elemento)}`);
            const x = this.config[`${elemento}_x`] - 20 || 0;
            const y = this.config[`${elemento}_y`] - 50 || 0;
            
            elementoDom.style.transform = `translate(${x}px, ${y}px)`;
            elementoDom.setAttribute('data-x', x);
            elementoDom.setAttribute('data-y', y);
        });
        
        // Configurações específicas do código
        document.getElementById('usarImagemCodigo').checked = this.config.usar_imagem_codigo || false;
        document.getElementById('codigoLarguraImagem').value = this.config.codigo_largura_imagem || 120;
        document.getElementById('codigoAlturaImagem').value = this.config.codigo_altura_imagem || 30;
        
        // Tamanho da placa
        document.getElementById('tamanhoPlaca').value = this.config.tamanho || 'A4';
    }
    
    atualizarVisibilidadeElemento(elemento, visivel) {
        const elementoDom = document.getElementById(`elemento${this.capitalize(elemento)}`);
        elementoDom.style.display = visivel ? 'block' : 'none';
    }
    
    atualizarDimensoesElemento(elemento) {
        const elementoDom = document.getElementById(`elemento${this.capitalize(elemento)}`);
        const largura = this.config[`${elemento}_largura`] || 300;
        const altura = this.config[`${elemento}_altura`] || 100;
        
        elementoDom.style.width = `${largura}px`;
        elementoDom.style.minWidth = `${largura}px`;
        elementoDom.style.height = `${altura}px`;
        elementoDom.style.minHeight = `${altura}px`;
        
        this.atualizarDimensoesInfo(elementoDom);
    }
    
    atualizarTamanhoElemento(elemento, tamanho) {
        const content = document.getElementById(`content${this.capitalize(elemento)}`);
        content.style.fontSize = `${tamanho}px`;
    }
    
    atualizarCorElemento(elemento, cor) {
        const content = document.getElementById(`content${this.capitalize(elemento)}`);
        content.style.color = cor;
    }
    
    atualizarFonteElemento(elemento, fonte) {
        const content = document.getElementById(`content${this.capitalize(elemento)}`);
        content.style.fontFamily = fonte;
    }
    
    atualizarTamanhoPlaca() {
        const tamanho = this.config.tamanho;
        const placaEditor = document.getElementById('placaEditor');
        
        switch(tamanho) {
            case 'A4':
                placaEditor.style.width = '595px';
                placaEditor.style.height = '842px';
                break;
            case 'A5':
                placaEditor.style.width = '420px';
                placaEditor.style.height = '595px';
                break;
            case 'A6':
                placaEditor.style.width = '297px';
                placaEditor.style.height = '420px';
                break;
            case 'A3':
                placaEditor.style.width = '842px';
                placaEditor.style.height = '1191px';
                break;
        }
    }
    
    updatePreviewBackground() {
        const placaEditor = document.getElementById('placaEditor');
        
        if (this.config.fundo && this.config.fundo !== 'padrao') {
            placaEditor.style.backgroundImage = `url('/assets/backgrounds/${this.config.fundo}')`;
        } else {
            placaEditor.style.backgroundImage = 'none';
            placaEditor.style.backgroundColor = 'white';
        }
    }
    
    ativarTab(tabNome) {
        document.querySelectorAll('.panel-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-pane').forEach(content => {
            content.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabNome}"]`).classList.add('active');
        document.getElementById(`tab${this.capitalize(tabNome)}`).classList.add('active');
    }
    
    toggleVisualizacaoLimites() {
        const btn = document.getElementById('btnToggleLimites');
        const ativo = btn.classList.toggle('active');
        
        const elementos = document.querySelectorAll('.elemento-draggable');
        elementos.forEach(el => {
            if (ativo) {
                el.style.outline = '2px dashed #6366F1';
            } else {
                el.style.outline = 'none';
            }
        });
    }
    
    async gerarPreviewIndividual() {
        if (this.previewIndice >= this.produtos.length) return;
        
        const produto = this.produtos[this.previewIndice];
        
        try {
            const response = await fetch('http://localhost:5000/api/preview_placa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    produto: produto,
                    config: this.config
                })
            });

            const data = await response.json();

            if (response.ok) {
                const previewContainer = document.getElementById('previewIndividual');
                previewContainer.innerHTML = `
                    <img src="http://localhost:5000${data.preview_url}" 
                         alt="Preview da placa" 
                         style="max-width: 100%; height: auto; border-radius: 8px;">
                `;
                this.atualizarIndicePreview();
            } else {
                this.showStatus(`Erro: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showStatus('Erro ao gerar preview.', 'error');
        }
    }
    
    previewAnterior() {
        if (this.previewIndice > 0) {
            this.previewIndice--;
            this.gerarPreviewIndividual();
        }
    }
    
    previewProximo() {
        if (this.previewIndice < this.produtos.length - 1) {
            this.previewIndice++;
            this.gerarPreviewIndividual();
        }
    }
    
    atualizarIndicePreview() {
        document.getElementById('previewIndice').textContent = 
            `Produto ${this.previewIndice + 1} de ${this.produtos.length}`;
        document.getElementById('previewTotal').textContent = 
            `${this.produtos.length} produtos no total`;
        document.getElementById('selectPreviewProduto').value = this.previewIndice;
    }
    
    visualizarProduto(index) {
        this.previewIndice = index;
        this.gerarPreviewIndividual();
        
        // Navegar para a seção de preview
        document.querySelector('[data-section="preview"]').click();
    }
    
    async gerarCodigosBarrasParaProdutos() {
        for (let produto of this.produtos) {
            const codigo = produto['Codigo de Barras'];
            if (codigo && codigo.length === 13 && /^\d+$/.test(codigo)) {
                await this.gerarCodigoBarras(codigo);
            }
        }
    }
    
    async gerarCodigoBarras(codigo) {
        try {
            const response = await fetch('http://localhost:5000/api/gerar_codigo_barras', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    codigo: codigo
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log(`Código de barras gerado para ${codigo}`);
                return true;
            } else {
                console.error(`Erro ao gerar código de barras: ${data.error}`);
                return false;
            }
        } catch (error) {
            console.error('Erro de conexão ao gerar código de barras:', error);
            return false;
        }
    }
    
    async gerarCodigoBarrasParaTodos() {
        this.showStatus('Gerando códigos de barras...', 'success');
        
        let sucessos = 0;
        for (let produto of this.produtos) {
            const codigo = produto['Codigo de Barras'];
            if (codigo && codigo.length === 13 && /^\d+$/.test(codigo)) {
                if (await this.gerarCodigoBarras(codigo)) {
                    sucessos++;
                }
            }
        }
        
        this.showStatus(`Códigos de barras gerados: ${sucessos} de ${this.produtos.length}`, 'success');
    }
    
    async iniciarConfirmacaoImpressao() {
        if (!this.currentFile) {
            this.showStatus('Por favor, faça upload de um arquivo primeiro.', 'error');
            return;
        }

        this.produtoIndexConfirmacao = 0;
        this.produtosConfirmados = [];
        this.produtosPulados = [];
        
        // Navegar para a seção de confirmação
        this.mostrarSecao('confirmacao');
        
        // Iniciar processo
        await this.carregarProximaPlaca();
    }

    async carregarProximaPlaca() {
        if (this.produtoIndexConfirmacao >= this.produtos.length) {
            await this.finalizarConfirmacao();
            return;
        }

        const produto = this.produtos[this.produtoIndexConfirmacao];
        
        // Atualizar informações do produto
        document.getElementById('produtoNomeConfirmacao').textContent = produto['Nome do produto'];
        document.getElementById('produtoPrecoConfirmacao').textContent = `R$ ${produto['Preço']}`;
        
        // Mostrar loading
        const previewContainer = document.getElementById('previewConfirmacao');
        previewContainer.innerHTML = `
            <div class="loading-preview">
                <div class="loading-spinner"></div>
                <p>Carregando pré-visualização...</p>
            </div>
        `;

        // Atualizar progresso
        this.atualizarProgressoConfirmacao();

        try {
            const response = await fetch('http://localhost:5000/api/gerar_placas_confirmacao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: this.currentFile,
                    config: this.config,
                    produto_index: this.produtoIndexConfirmacao
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.valido) {
                    // Produto válido - mostrar preview
                    previewContainer.innerHTML = `
                        <img src="http://localhost:5000${data.preview_url}" 
                             alt="Preview da placa" 
                             style="max-width: 100%; height: auto; border-radius: 8px;">
                    `;
                    document.getElementById('problemasAlerta').style.display = 'none';
                } else {
                    // Produto inválido - mostrar problemas
                    previewContainer.innerHTML = `
                        <div class="preview-placeholder">
                            <div class="placeholder-icon">❌</div>
                            <h3>Placa Não Pode Ser Gerada</h3>
                            <p>Este produto possui problemas que impedem a geração da placa.</p>
                        </div>
                    `;
                    this.mostrarProblemas(data.problemas);
                }
            } else {
                this.showStatus(`Erro: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showStatus('Erro de conexão com o servidor.', 'error');
            previewContainer.innerHTML = `
                <div class="preview-placeholder">
                    <div class="placeholder-icon">❌</div>
                    <h3>Erro ao Carregar</h3>
                    <p>Não foi possível carregar a pré-visualização.</p>
                </div>
            `;
        }
    }

    mostrarProblemas(problemas) {
        const problemasAlerta = document.getElementById('problemasAlerta');
        const problemasLista = document.getElementById('problemasLista');
        
        problemasLista.innerHTML = '';
        problemas.forEach(problema => {
            const div = document.createElement('div');
            div.className = 'problema-item';
            div.textContent = `• ${problema}`;
            problemasLista.appendChild(div);
        });
        
        problemasAlerta.style.display = 'block';
    }

    atualizarProgressoConfirmacao() {
        document.getElementById('progressoAtual').textContent = this.produtoIndexConfirmacao + 1;
        document.getElementById('progressoTotal').textContent = this.produtos.length;
        
        const progresso = ((this.produtoIndexConfirmacao) / this.produtos.length) * 100;
        document.getElementById('progressoFill').style.width = `${progresso}%`;
    }

    confirmarImpressao() {
        this.produtosConfirmados.push(this.produtoIndexConfirmacao);
        this.produtoIndexConfirmacao++;
        this.carregarProximaPlaca();
    }

    pularPlaca() {
        this.produtosPulados.push({
            index: this.produtoIndexConfirmacao,
            produto: this.produtos[this.produtoIndexConfirmacao]
        });
        this.produtoIndexConfirmacao++;
        this.carregarProximaPlaca();
    }

    async imprimirTodasValidas() {
        // Coletar todos os produtos válidos restantes
        for (let i = this.produtoIndexConfirmacao; i < this.produtos.length; i++) {
            try {
                const response = await fetch('http://localhost:5000/api/gerar_placas_confirmacao', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        filename: this.currentFile,
                        config: this.config,
                        produto_index: i
                    })
                });

                const data = await response.json();
                if (response.ok && data.valido) {
                    this.produtosConfirmados.push(i);
                } else {
                    this.produtosPulados.push({
                        index: i,
                        produto: this.produtos[i],
                        problemas: data.problemas || ['Erro desconhecido']
                    });
                }
            } catch (error) {
                this.produtosPulados.push({
                    index: i,
                    produto: this.produtos[i],
                    problemas: ['Erro de conexão']
                });
            }
        }

        await this.finalizarConfirmacao();
    }

    async finalizarConfirmacao() {
        if (this.produtosConfirmados.length === 0) {
            this.showStatus('Nenhuma placa selecionada para impressão.', 'warning');
            this.mostrarSecao('gerar');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/gerar_placas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: this.currentFile,
                    config: this.config,
                    produtos_selecionados: this.produtosConfirmados
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showDownloadLink(data.pdf_url);
                this.mostrarRelatorioFinal(data.relatorio);
                this.showStatus(`PDF gerado com ${this.produtosConfirmados.length} placas!`, 'success');
            } else {
                this.showStatus(`Erro: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showStatus('Erro de conexão com o servidor.', 'error');
        }
    }

    mostrarRelatorioFinal(relatorio) {
        const relatorioSection = document.getElementById('relatorioSection');
        const relatorioContent = document.getElementById('relatorioContent');
        
        let html = `
            <div class="relatorio-stats">
                <span class="relatorio-number total">${relatorio.total_produtos}</span>
                <span class="relatorio-label">Total de Produtos</span>
            </div>
            <div class="relatorio-stats">
                <span class="relatorio-number validos">${relatorio.produtos_validos}</span>
                <span class="relatorio-label">Placas Geradas</span>
            </div>
            <div class="relatorio-stats">
                <span class="relatorio-number invalidos">${relatorio.produtos_invalidos}</span>
                <span class="relatorio-label">Placas Puladas</span>
            </div>
        `;
        
        if (relatorio.erros.length > 0) {
            html += `
                <div class="erros-lista">
                    <h4>📋 Produtos com Problemas</h4>
            `;
            
            relatorio.erros.forEach(erro => {
                html += `
                    <div class="erro-item">
                        <div class="erro-produto">${erro.produto}</div>
                        <div class="erro-motivos">
                            ${erro.problemas.map(p => `<div class="erro-motivo">• ${p}</div>`).join('')}
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        relatorioContent.innerHTML = html;
        relatorioSection.style.display = 'block';
    }

    cancelarConfirmacao() {
        this.mostrarSecao('gerar');
    }

    mostrarSecao(secao) {
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(secao).classList.add('active');
        
        // Atualizar navegação
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        document.querySelector(`[data-section="${secao}"]`).classList.add('active');
    }

    // Modificar o método gerarPlacas para usar a confirmação
    gerarPlacas() {
        this.iniciarConfirmacaoImpressao();
    }

    showDownloadLink(pdfUrl) {
        const downloadSection = document.getElementById('downloadSection');
        const downloadLink = document.getElementById('downloadLink');
        
        downloadLink.href = `http://localhost:5000${pdfUrl}`;
        downloadSection.style.display = 'block';
    }
    
    async loadBackgrounds() {
        try {
            const response = await fetch('http://localhost:5000/api/backgrounds');
            const data = await response.json();
            
            const select = document.getElementById('imagemFundo');
            data.backgrounds.forEach(background => {
                const option = document.createElement('option');
                option.value = background;
                option.textContent = background.replace('.png', '').replace('.jpg', '');
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar backgrounds:', error);
        }
    }
    
    async loadFonts() {
        try {
            const response = await fetch('http://localhost:5000/api/fonts');
            const data = await response.json();
            
            const fontSelects = document.querySelectorAll('select[id^="fonte"]');
            fontSelects.forEach(select => {
                // Salvar valor atual
                const currentValue = select.value;
                select.innerHTML = '';
                
                data.fonts.forEach(fonte => {
                    const option = document.createElement('option');
                    option.value = fonte;
                    option.textContent = fonte;
                    select.appendChild(option);
                });
                
                // Restaurar valor se ainda existir
                if (data.fonts.includes(currentValue)) {
                    select.value = currentValue;
                }
            });
        } catch (error) {
            console.error('Erro ao carregar fontes:', error);
        }
    }
    
    showStatus(message, type) {
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = message;
        statusElement.className = `status-modern ${type}`;
        statusElement.style.display = 'block';
        
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Inicializar a aplicação
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PlacasOfertasApp();
});