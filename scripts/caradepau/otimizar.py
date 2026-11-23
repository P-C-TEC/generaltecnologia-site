# Prepara as imagens da página /caradepau (e as da home) a partir das capturas e da marca do jogo.
#   python scripts/caradepau/otimizar.py [pasta-do-jogo]   (padrão: ../../JOGO-BLEFE)
# Entradas: capturas/caradepau-*.png (scripts/caradepau/capturar-jogo.mjs) e a logo/ícone do repositório do jogo.
import sys
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
JOGO = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ.parents[1] / 'JOGO-BLEFE'
CAP = RAIZ / 'capturas'
OUT = RAIZ / 'public' / 'caradepau'
TELAS = OUT / 'telas'
TELAS.mkdir(parents=True, exist_ok=True)

def webp(src, dst, largura, q=80):
    im = Image.open(src).convert('RGB')
    if im.width > largura:
        im = im.resize((largura, round(im.height * largura / im.width)), Image.LANCZOS)
    im.save(dst, 'WEBP', quality=q, method=6)
    print(dst.relative_to(RAIZ), im.size, dst.stat().st_size // 1024, 'KB')

for nome in ['cel-anuncio', 'cel-vez']:
    webp(CAP / f'caradepau-{nome}.png', TELAS / f'{nome}.webp', 640)
for nome in ['desk-anuncio', 'desk-cyber', 'desk-medieval']:
    webp(CAP / f'caradepau-{nome}.png', TELAS / f'{nome}.webp', 1440, 78)
# home (rolagem de produtos): mesmo padrão das outras telas em public/telas
webp(CAP / 'caradepau-desk-anuncio.png', RAIZ / 'public' / 'telas' / 'caradepau-desk-1.webp', 1440, 78)
webp(CAP / 'caradepau-desk-cyber.png', RAIZ / 'public' / 'telas' / 'caradepau-desk-2.webp', 1440, 78)
webp(CAP / 'caradepau-cel-vez.png', RAIZ / 'public' / 'telas' / 'caradepau-cel-1.webp', 640)

# marca: logo (fundo transparente), ícones e imagem de compartilhamento — já gerados no repositório do jogo
pub = JOGO / 'client' / 'public'
Image.open(pub / 'logo.webp').save(OUT / 'logo.webp', 'WEBP', quality=88, method=6)
Image.open(pub / 'logo-sm.webp').save(OUT / 'logo-sm.webp', 'WEBP', quality=88, method=6)
ic = Image.open(pub / 'icon-512.png').convert('RGB')
ic.resize((180, 180), Image.LANCZOS).save(OUT / 'icone-180.png', optimize=True)
ic.resize((64, 64), Image.LANCZOS).save(OUT / 'icone-64.png', optimize=True)
Image.open(pub / 'og-image.jpg').save(OUT / 'og-caradepau.jpg', quality=86, optimize=True)
print('marca ok')
