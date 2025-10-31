import pandas as pd
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A3, A4, A5, mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from PIL import Image, ImageDraw
from datetime import datetime
import json
import textwrap
import re
import math

class GeradorPlacas:
    def __init__(self, base_path):
        self.base_path = base_path
        # Definir tamanhos customizados
        self.pagesizes = {
            'A3': A3,
            'A3+': (329 * mm, 483 * mm),
            'A4': A4,
            'A5': (A4[1]/2, A4[0]/2),  # A5 landscape em A4
            'A6': (A4[0]/2, A4[1]/4)   # A6 - 4 por folha A4
        }
        
        self.previews_folder = os.path.join(base_path, 'previews')
        self.barcodes_folder = os.path.join(base_path, 'barcodes')
        os.makedirs(self.previews_folder, exist_ok=True)
        os.makedirs(self.barcodes_folder, exist_ok=True)
    
    def ler_arquivo(self, arquivo_path):
        """Lê arquivo CSV ou Excel com tratamento para diferentes formatos de coluna"""
        if arquivo_path.endswith('.csv'):
            df = pd.read_csv(arquivo_path, encoding='utf-8')
        elif arquivo_path.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(arquivo_path)
        else:
            raise ValueError("Formato não suportado")
        
        # Normalizar nomes de colunas (case insensitive e remove espaços)
        df.columns = [col.strip().lower() for col in df.columns]
        
        # Mapear colunas possíveis
        mapeamento_colunas = {
            'nome do produto': 'Nome do produto',
            'produto': 'Nome do produto',
            'descrição': 'Nome do produto',
            'descricao': 'Nome do produto',
            
            'preço': 'Preço',
            'preco': 'Preço',
            'valor': 'Preço',
            'price': 'Preço',
            
            'data da oferta': 'Data da Oferta',
            'data': 'Data da Oferta',
            'validade': 'Data da Oferta',
            'data validade': 'Data da Oferta',
            
            'codigo de barras': 'Codigo de Barras',
            'código de barras': 'Codigo de Barras',
            'ean': 'Codigo de Barras',
            'upc': 'Codigo de Barras',
            'barcode': 'Codigo de Barras'
        }
        
        # Renomear colunas
        df.rename(columns=mapeamento_colunas, inplace=True)
        
        return df
    
    def validar_dados(self, df):
        """Valida todos os dados do dataframe e retorna lista de problemas"""
        problemas = []
        
        for index, row in df.iterrows():
            produto_problemas = self.validar_produto(row.to_dict())
            if produto_problemas:
                problemas.append({
                    'linha': index + 2,  # +2 porque a primeira linha é cabeçalho
                    'produto': row.get('Nome do produto', 'N/A'),
                    'problemas': produto_problemas
                })
        
        return problemas
    
    def validar_produto(self, produto):
        """Valida um produto individual e retorna lista de problemas"""
        problemas = []
        
        # Verificar nome do produto
        nome = produto.get('Nome do produto')
        if pd.isna(nome) or not nome or str(nome).strip() == '':
            problemas.append("Nome do produto está em branco")
        elif len(str(nome).strip()) < 2:
            problemas.append("Nome do produto muito curto")
        
        # Verificar preço
        preco = produto.get('Preço')
        if pd.isna(preco) or not preco or str(preco).strip() == '':
            problemas.append("Preço está em branco")
        else:
            try:
                float(str(preco).replace(',', '.'))
            except ValueError:
                problemas.append("Preço inválido")
        
        # Verificar data
        data = produto.get('Data da Oferta')
        if pd.isna(data) or not data or str(data).strip() == '':
            problemas.append("Data da oferta está em branco")
        else:
            data_str = str(data).strip()
            # Verificar formato dd/mm/aaaa
            if not re.match(r'^\d{2}/\d{2}/\d{4}$', data_str):
                problemas.append("Data da oferta deve estar no formato dd/mm/aaaa")
            else:
                try:
                    dia, mes, ano = map(int, data_str.split('/'))
                    datetime(ano, mes, dia)  # Tenta criar uma data para validar
                except ValueError:
                    problemas.append("Data da oferta inválida")
        
        # Verificar código de barras (opcional)
        codigo = produto.get('Codigo de Barras')
        if not pd.isna(codigo) and codigo and str(codigo).strip() != '':
            codigo_str = str(codigo).strip()
            if len(codigo_str) != 13 or not codigo_str.isdigit():
                problemas.append("Código de barras deve ter 13 dígitos para EAN13")
        
        return problemas
    
    def configurar_fonte(self, canvas_obj, fonte, tamanho):
        """Configura a fonte no canvas"""
        try:
            if fonte and fonte not in ['Helvetica-Bold', 'Courier', 'Times-Roman']:
                font_path = os.path.join(self.base_path, 'assets', 'fonts', f"{fonte}.ttf")
                if os.path.exists(font_path):
                    pdfmetrics.registerFont(TTFont(fonte, font_path))
                    canvas_obj.setFont(fonte, tamanho)
                else:
                    canvas_obj.setFont("Helvetica-Bold", tamanho)
            else:
                canvas_obj.setFont(fonte, tamanho)
        except:
            canvas_obj.setFont("Helvetica-Bold", tamanho)
    
    def gerar_codigo_barras(self, codigo):
        """Gera código de barras simples usando PIL (sem dependência externa)"""
        try:
            if len(codigo) != 13 or not codigo.isdigit():
                return None
            
            # Configurações do código de barras
            largura = 200
            altura = 80
            margem = 10
            
            # Criar imagem
            img = Image.new('RGB', (largura, altura), 'white')
            draw = ImageDraw.Draw(img)
            
            # Desenhar código de barras simulado
            comprimento_barra = largura - 2 * margem
            pos_x = margem
            
            # Desenhar barras baseadas no código
            for i, char in enumerate(codigo):
                # Usar o dígito para determinar a altura da barra
                altura_barra = 20 + (int(char) * 4)
                
                # Alternar entre preto e branco para simular barras
                if i % 2 == 0:
                    draw.rectangle([pos_x, margem, pos_x + 3, margem + altura_barra], fill='black')
                
                pos_x += comprimento_barra / len(codigo)
            
            # Adicionar texto do código
            draw.text((largura/2 - 30, altura - 20), f"EAN-13: {codigo}", fill='black')
            
            # Salvar imagem
            filename = f"barcode_{codigo}.png"
            filepath = os.path.join(self.barcodes_folder, filename)
            img.save(filepath)
            
            return filename
            
        except Exception as e:
            print(f"Erro ao gerar código de barras: {e}")
            return None
    
    def gerar_codigo_barras_reportlab(self, canvas_obj, x, y, codigo, largura=120, altura=30):
        """Gera código de barras diretamente no PDF usando ReportLab"""
        try:
            if len(codigo) != 13:
                return
            
            # Configurações
            comprimento_barra = largura
            espacamento = comprimento_barra / len(codigo)
            
            # Desenhar barras
            for i, char in enumerate(codigo):
                # Usar o dígito para determinar a altura da barra
                altura_barra = altura * (0.3 + (int(char) * 0.05))
                
                # Alternar entre barras pretas e brancas
                if i % 2 == 0:
                    canvas_obj.setFillColorRGB(0, 0, 0)  # Preto
                    canvas_obj.rect(x + i * espacamento, y, espacamento - 1, altura_barra, fill=1)
            
            # Adicionar texto do código
            canvas_obj.setFillColorRGB(0, 0, 0)
            canvas_obj.setFont("Helvetica", 8)
            canvas_obj.drawString(x, y - 10, codigo)
            
        except Exception as e:
            print(f"Erro ao gerar código de barras com ReportLab: {e}")
    
    def quebrar_texto(self, texto, largura_maxima, tamanho_fonte):
        """Quebra texto em múltiplas linhas baseado na largura máxima"""
        palavras = str(texto).split()
        linhas = []
        linha_atual = ""
        
        for palavra in palavras:
            teste_linha = f"{linha_atual} {palavra}".strip()
            # Estimativa simples de largura
            largura_estimada = len(teste_linha) * (tamanho_fonte * 0.6)
            
            if largura_estimada <= largura_maxima:
                linha_atual = teste_linha
            else:
                if linha_atual:
                    linhas.append(linha_atual)
                linha_atual = palavra
                
                # Se uma palavra individual for muito longa, quebra ela
                if len(palavra) * (tamanho_fonte * 0.6) > largura_maxima:
                    for i in range(0, len(palavra), int(largura_maxima/(tamanho_fonte * 0.6))):
                        linhas.append(palavra[i:i+int(largura_maxima/(tamanho_fonte * 0.6))])
                    linha_atual = ""
        
        if linha_atual:
            linhas.append(linha_atual)
        
        return linhas
    
    def desenhar_elemento(self, canvas_obj, x, y, texto, config, elemento):
        """Desenha um elemento individual na placa"""
        if not config.get(f'{elemento}_visivel', True):
            return y
        
        # Configurar fonte específica do elemento
        fonte = config.get(f'fonte_{elemento}', 'Helvetica-Bold')
        tamanho_fonte = config.get(f'fonte_tamanho_{elemento}', 12)
        self.configurar_fonte(canvas_obj, fonte, tamanho_fonte)
        
        # Configurar cor
        cor = config.get(f'{elemento}_cor', '#000000')
        if cor.startswith('#'):
            r = int(cor[1:3], 16) / 255.0
            g = int(cor[3:5], 16) / 255.0
            b = int(cor[5:7], 16) / 255.0
            canvas_obj.setFillColorRGB(r, g, b)
        
        # Quebrar texto se necessário (especialmente para nomes longos)
        largura_maxima = config.get(f'{elemento}_largura', 300)
        texto_str = str(texto)
        
        if elemento == 'nome' and len(texto_str) > 20:
            # Para nomes longos, quebrar em múltiplas linhas
            linhas = self.quebrar_texto(texto_str, largura_maxima, tamanho_fonte)
            espacamento = tamanho_fonte + 2
            
            for i, linha in enumerate(linhas):
                if i < 3:  # Máximo 3 linhas
                    canvas_obj.drawString(x, y - (i * espacamento), linha)
            
            return y - (min(len(linhas), 3) * espacamento)
        else:
            # Para outros elementos, desenhar normalmente
            if len(texto_str) * (tamanho_fonte * 0.6) > largura_maxima:
                # Truncar se muito longo
                chars_max = int(largura_maxima / (tamanho_fonte * 0.6))
                texto_str = texto_str[:chars_max-3] + "..."
            
            canvas_obj.drawString(x, y, texto_str)
            return y - (tamanho_fonte + 10)
    
    def desenhar_placa(self, canvas_obj, produto, pos_x, pos_y, largura, altura, config):
        """Desenha uma placa individual com layout personalizado"""
        
        # Fundo personalizado
        if config.get('fundo') and config['fundo'] != 'padrao':
            fundo_path = os.path.join(self.base_path, 'assets', 'backgrounds', config['fundo'])
            if os.path.exists(fundo_path):
                img = ImageReader(fundo_path)
                canvas_obj.drawImage(img, pos_x, pos_y, largura, altura, mask='auto')
        
        # Ajustar coordenadas relativas
        x_base = pos_x
        y_base = pos_y + altura
        
        current_y = y_base - 50  # Margem superior
        
        # Nome do Produto
        nome = str(produto['Nome do produto'])
        nome_x = x_base + config.get('nome_x', 20)
        nome_y = current_y
        current_y = self.desenhar_elemento(canvas_obj, nome_x, nome_y, nome, config, 'nome')
        
        # Valor
        try:
            valor = float(str(produto['Preço']).replace(',', '.'))
            valor_str = f"R$ {valor:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        except:
            valor_str = str(produto['Preço'])
        
        valor_x = x_base + config.get('valor_x', 20)
        valor_y = current_y - config.get('valor_espacamento', 10)
        current_y = self.desenhar_elemento(canvas_obj, valor_x, valor_y, valor_str, config, 'valor')
        
        # Data da Oferta
        data = str(produto['Data da Oferta'])
        data_str = f"Válido até: {data}"
        data_x = x_base + config.get('data_x', 20)
        data_y = current_y - config.get('data_espacamento', 10)
        current_y = self.desenhar_elemento(canvas_obj, data_x, data_y, data_str, config, 'data')
        
        # Código de Barras
        codigo = str(produto.get('Codigo de Barras', ''))
        if codigo and config.get('codigo_visivel', True):
            codigo_x = x_base + config.get('codigo_x', 20)
            codigo_y = current_y - config.get('codigo_espacamento', 20)
            
            # Tentar usar imagem do código de barras
            if config.get('usar_imagem_codigo', False) and len(codigo) == 13:
                barcode_filename = self.gerar_codigo_barras(codigo)
                if barcode_filename:
                    barcode_path = os.path.join(self.barcodes_folder, barcode_filename)
                    if os.path.exists(barcode_path):
                        img = ImageReader(barcode_path)
                        largura_imagem = config.get('codigo_largura_imagem', 120)
                        altura_imagem = config.get('codigo_altura_imagem', 30)
                        canvas_obj.drawImage(img, codigo_x, codigo_y - altura_imagem, largura_imagem, altura_imagem)
                        codigo_y -= altura_imagem + 5
                else:
                    # Fallback: gerar código de barras diretamente
                    self.gerar_codigo_barras_reportlab(
                        canvas_obj, 
                        codigo_x, 
                        codigo_y - 30,
                        codigo,
                        config.get('codigo_largura_imagem', 120),
                        config.get('codigo_altura_imagem', 30)
                    )
            else:
                # Gerar código de barras diretamente no PDF
                self.gerar_codigo_barras_reportlab(
                    canvas_obj, 
                    codigo_x, 
                    codigo_y - 30,
                    codigo,
                    config.get('codigo_largura_imagem', 120),
                    config.get('codigo_altura_imagem', 30)
                )
            
            # Desenhar código como texto
            codigo_str = f"Cód: {codigo}"
            self.desenhar_elemento(canvas_obj, codigo_x, codigo_y, codigo_str, config, 'codigo')
        
        # Bordas
        if config.get('bordas', True):
            canvas_obj.setStrokeColorRGB(0, 0, 0)
            canvas_obj.setLineWidth(1)
            canvas_obj.rect(pos_x, pos_y, largura, altura)
    
    def gerar_pdf(self, produtos, output_file, config):
        tamanho = config['tamanho']
        
        if tamanho == 'A5':
            # 2 placas A5 por folha A4
            page_size = A4
            placas_por_pagina = 2
            placa_width = A4[0] / 2
            placa_height = A4[1]
        elif tamanho == 'A6':
            # 4 placas A6 por folha A4
            page_size = A4
            placas_por_pagina = 4
            placa_width = A4[0] / 2
            placa_height = A4[1] / 2
        else:
            page_size = self.pagesizes[tamanho]
            placas_por_pagina = 1
            placa_width = page_size[0]
            placa_height = page_size[1]
        
        c = canvas.Canvas(output_file, pagesize=page_size)
        
        for i, (_, produto) in enumerate(produtos.iterrows()):
            if i > 0 and i % placas_por_pagina == 0:
                c.showPage()
            
            if tamanho == 'A5':
                # 2 placas lado a lado
                coluna = i % 2
                pos_x = coluna * placa_width
                pos_y = 0
            elif tamanho == 'A6':
                # 4 placas em grid 2x2
                coluna = i % 2
                linha = (i // 2) % 2
                pos_x = coluna * placa_width
                pos_y = (1 - linha) * placa_height  # Inverter para começar de cima
            else:
                pos_x = 0
                pos_y = 0
            
            self.desenhar_placa(c, produto, pos_x, pos_y, placa_width, placa_height, config)
        
        c.save()
    
    def processar_arquivo(self, arquivo_path, config, produtos_selecionados=None):
        """Processa arquivo e gera PDF, retornando relatório"""
        produtos_df = self.ler_arquivo(arquivo_path)
        
        # Filtrar produtos selecionados se especificado
        if produtos_selecionados is not None:
            produtos_df = produtos_df.iloc[produtos_selecionados]
        
        # Validar produtos e filtrar apenas os válidos
        produtos_validos = []
        relatorio = {
            'total_produtos': len(produtos_df),
            'produtos_validos': 0,
            'produtos_invalidos': 0,
            'erros': []
        }
        
        for index, produto in produtos_df.iterrows():
            problemas = self.validar_produto(produto.to_dict())
            if not problemas:
                produtos_validos.append(produto)
                relatorio['produtos_validos'] += 1
            else:
                relatorio['produtos_invalidos'] += 1
                relatorio['erros'].append({
                    'indice': index,
                    'produto': produto.get('Nome do produto', 'N/A'),
                    'problemas': problemas
                })
        
        if not produtos_validos:
            raise ValueError("Nenhum produto válido para gerar placas")
        
        produtos_validos_df = pd.DataFrame(produtos_validos)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = os.path.join(self.base_path, 'outputs', f'placas_{timestamp}.pdf')
        
        self.gerar_pdf(produtos_validos_df, output_file, config)
        
        return output_file, relatorio
    
    def gerar_preview_placa(self, produto, config):
        """Gera uma imagem de preview individual para uma placa"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        preview_path = os.path.join(self.previews_folder, f'preview_{timestamp}.png')
        
        try:
            # Criar imagem de preview
            largura, altura = 400, 300
            img = Image.new('RGB', (largura, altura), color='white')
            d = ImageDraw.Draw(img)
            
            # Simular elementos
            elementos = [
                {
                    'nome': 'nome',
                    'texto': produto['Nome do produto'],
                    'x': config.get('nome_x', 20),
                    'y': config.get('nome_y', 50),
                    'tamanho': config.get('fonte_tamanho_nome', 20),
                    'cor': config.get('nome_cor', '#000000')
                },
                {
                    'nome': 'valor',
                    'texto': f"R$ {produto['Preço']}",
                    'x': config.get('valor_x', 20),
                    'y': config.get('valor_y', 100),
                    'tamanho': config.get('fonte_tamanho_valor', 28),
                    'cor': config.get('valor_cor', '#FF0000')
                }
            ]
            
            for elemento in elementos:
                if config.get(f"{elemento['nome']}_visivel", True):
                    # Simular quebra de texto para preview
                    texto = elemento['texto']
                    if elemento['nome'] == 'nome' and len(texto) > 30:
                        linhas = self.quebrar_texto(texto, 300, elemento['tamanho'])
                        for i, linha in enumerate(linhas[:2]):  # Máximo 2 linhas no preview
                            d.text((elemento['x'], elemento['y'] + i * 25), linha, fill=elemento['cor'])
                    else:
                        d.text((elemento['x'], elemento['y']), texto, fill=elemento['cor'])
            
            img.save(preview_path)
            return preview_path
            
        except Exception as e:
            print(f"Erro ao gerar preview: {e}")
            # Fallback
            img = Image.new('RGB', (400, 300), color='white')
            d = ImageDraw.Draw(img)
            d.text((50, 150), "Preview da Placa", fill='black')
            img.save(preview_path)
            return preview_path