from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
from werkzeug.utils import secure_filename
from gerador_placas import GeradorPlacas
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configurações
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')
ASSETS_FOLDER = os.path.join(BASE_DIR, 'assets')
PERFIS_FOLDER = os.path.join(BASE_DIR, 'perfis')
BARCODES_FOLDER = os.path.join(BASE_DIR, 'barcodes')

# Criar diretórios necessários
for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER, PERFIS_FOLDER, BARCODES_FOLDER]:
    os.makedirs(folder, exist_ok=True)

os.makedirs(os.path.join(ASSETS_FOLDER, 'fonts'), exist_ok=True)
os.makedirs(os.path.join(ASSETS_FOLDER, 'backgrounds'), exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Endpoint para gerar código de barras
@app.route('/api/gerar_codigo_barras', methods=['POST'])
def gerar_codigo_barras():
    try:
        data = request.json
        codigo = data.get('codigo')
        
        if not codigo:
            return jsonify({'error': 'Código é obrigatório'}), 400
        
        # Validar código EAN13 (13 dígitos)
        if len(codigo) != 13 or not codigo.isdigit():
            return jsonify({'error': 'Código deve ter 13 dígitos numéricos para EAN13'}), 400
        
        # Usar o gerador do GeradorPlacas
        gerador = GeradorPlacas(BASE_DIR)
        barcode_filename = gerador.gerar_codigo_barras(codigo)
        
        if barcode_filename:
            return jsonify({
                'message': 'Código de barras gerado com sucesso',
                'filename': barcode_filename
            }), 200
        else:
            return jsonify({'error': 'Erro ao gerar código de barras'}), 500
        
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar código de barras: {str(e)}'}), 500

# Endpoint para verificar código de barras
@app.route('/api/verificar_codigo_barras/<codigo>')
def verificar_codigo_barras(codigo):
    filepath = os.path.join(BARCODES_FOLDER, f"barcode_{codigo}.png")
    if os.path.exists(filepath):
        return jsonify({'existe': True}), 200
    else:
        return jsonify({'existe': False}), 200

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            gerador = GeradorPlacas(BASE_DIR)
            df = gerador.ler_arquivo(filepath)
            
            # Validar dados e identificar problemas
            problemas = gerador.validar_dados(df)
            preview = df.head(10).to_dict('records')
            
            return jsonify({
                'message': 'Arquivo enviado com sucesso',
                'filename': filename,
                'preview': preview,
                'total_produtos': len(df),
                'problemas': problemas,
                'total_problemas': len(problemas)
            }), 200
        except Exception as e:
            return jsonify({'error': f'Erro ao ler arquivo: {str(e)}'}), 500
    
    return jsonify({'error': 'Tipo de arquivo não permitido'}), 400

@app.route('/api/perfis', methods=['GET', 'POST'])
def gerenciar_perfis():
    if request.method == 'GET':
        perfis = []
        for file in os.listdir(PERFIS_FOLDER):
            if file.endswith('.json'):
                with open(os.path.join(PERFIS_FOLDER, file), 'r', encoding='utf-8') as f:
                    perfil_data = json.load(f)
                    perfis.append(perfil_data)
        
        return jsonify({'perfis': perfis}), 200
    
    elif request.method == 'POST':
        data = request.json
        nome_perfil = data.get('nome')
        config = data.get('config')
        
        if not nome_perfil:
            return jsonify({'error': 'Nome do perfil é obrigatório'}), 400
        
        perfil_data = {
            'nome': nome_perfil,
            'config': config,
            'criado_em': datetime.now().isoformat()
        }
        
        filename = secure_filename(nome_perfil + '.json')
        filepath = os.path.join(PERFIS_FOLDER, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(perfil_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({'message': 'Perfil salvo com sucesso'}), 200

@app.route('/api/perfis/<nome_perfil>', methods=['GET', 'DELETE'])
def gerenciar_perfil(nome_perfil):
    filename = secure_filename(nome_perfil + '.json')
    filepath = os.path.join(PERFIS_FOLDER, filename)
    
    if request.method == 'GET':
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                perfil_data = json.load(f)
            return jsonify(perfil_data), 200
        else:
            return jsonify({'error': 'Perfil não encontrado'}), 404
    
    elif request.method == 'DELETE':
        if os.path.exists(filepath):
            os.remove(filepath)
            return jsonify({'message': 'Perfil excluído com sucesso'}), 200
        else:
            return jsonify({'error': 'Perfil não encontrado'}), 404

@app.route('/api/preview_placa', methods=['POST'])
def preview_placa():
    try:
        data = request.json
        produto = data.get('produto')
        config = data.get('config', {})
        
        if not produto:
            return jsonify({'error': 'Dados do produto são obrigatórios'}), 400
        
        gerador = GeradorPlacas(BASE_DIR)
        preview_path = gerador.gerar_preview_placa(produto, config)
        
        return jsonify({
            'preview_url': f'/api/preview_image/{os.path.basename(preview_path)}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar preview: {str(e)}'}), 500

@app.route('/api/preview_image/<filename>')
def serve_preview_image(filename):
    previews_folder = os.path.join(BASE_DIR, 'previews')
    filepath = os.path.join(previews_folder, filename)
    
    if os.path.exists(filepath):
        return send_file(filepath, mimetype='image/png')
    else:
        return jsonify({'error': 'Imagem não encontrada'}), 404

@app.route('/api/gerar_placas', methods=['POST'])
def gerar_placas():
    try:
        data = request.json
        filename = data.get('filename')
        config = data.get('config', {})
        produtos_selecionados = data.get('produtos_selecionados', [])
        
        if not filename:
            return jsonify({'error': 'Nome do arquivo é obrigatório'}), 400
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Arquivo não encontrado'}), 404
        
        gerador = GeradorPlacas(BASE_DIR)
        output_file, relatorio = gerador.processar_arquivo(filepath, config, produtos_selecionados)
        
        return jsonify({
            'message': 'PDF gerado com sucesso',
            'pdf_url': f'/api/download/{os.path.basename(output_file)}',
            'relatorio': relatorio
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar PDF: {str(e)}'}), 500

@app.route('/api/gerar_placas_confirmacao', methods=['POST'])
def gerar_placas_confirmacao():
    try:
        data = request.json
        filename = data.get('filename')
        config = data.get('config', {})
        produto_index = data.get('produto_index')
        
        if not filename:
            return jsonify({'error': 'Nome do arquivo é obrigatório'}), 400
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Arquivo não encontrado'}), 404
        
        gerador = GeradorPlacas(BASE_DIR)
        produtos_df = gerador.ler_arquivo(filepath)
        
        if produto_index >= len(produtos_df):
            return jsonify({'error': 'Índice do produto inválido'}), 400
        
        produto = produtos_df.iloc[produto_index].to_dict()
        
        # Validar produto individual
        problemas = gerador.validar_produto(produto)
        if problemas:
            return jsonify({
                'valido': False,
                'problemas': problemas,
                'produto': produto
            }), 200
        
        # Gerar preview
        preview_path = gerador.gerar_preview_placa(produto, config)
        
        return jsonify({
            'valido': True,
            'preview_url': f'/api/preview_image/{os.path.basename(preview_path)}',
            'produto': produto,
            'total_produtos': len(produtos_df),
            'produto_atual': produto_index + 1
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Erro ao processar produto: {str(e)}'}), 500

@app.route('/api/download/<filename>')
def download_file(filename):
    filepath = os.path.join(OUTPUT_FOLDER, filename)
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    else:
        return jsonify({'error': 'Arquivo não encontrado'}), 404

@app.route('/api/backgrounds', methods=['GET'])
def list_backgrounds():
    backgrounds_path = os.path.join(ASSETS_FOLDER, 'backgrounds')
    backgrounds = []
    
    if os.path.exists(backgrounds_path):
        for file in os.listdir(backgrounds_path):
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                backgrounds.append(file)
    
    return jsonify({'backgrounds': backgrounds})

@app.route('/api/fonts', methods=['GET'])
def list_fonts():
    fonts_path = os.path.join(ASSETS_FOLDER, 'fonts')
    fonts = ['Helvetica-Bold', 'Courier', 'Times-Roman']
    
    if os.path.exists(fonts_path):
        for file in os.listdir(fonts_path):
            if file.lower().endswith('.ttf'):
                fonts.append(file.replace('.ttf', ''))
    
    return jsonify({'fonts': fonts})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint para verificar se a API está funcionando"""
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'directories': {
            'uploads': os.path.exists(UPLOAD_FOLDER),
            'outputs': os.path.exists(OUTPUT_FOLDER),
            'perfis': os.path.exists(PERFIS_FOLDER),
            'barcodes': os.path.exists(BARCODES_FOLDER)
        }
    }), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint não encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Erro interno do servidor'}), 500

if __name__ == '__main__':
    print("Iniciando servidor Flask...")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Output folder: {OUTPUT_FOLDER}")
    print(f"Barcodes folder: {BARCODES_FOLDER}")
    print("Servidor rodando em http://localhost:5000")
    
    app.run(debug=True, port=5000)