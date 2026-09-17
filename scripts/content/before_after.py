"""Eski/yeni kesit karşılaştırması: docs/screens/cutouts-compare/_old/ (üst satır) vs public/burgers/ (alt satır), berry zemin.
Kullanım: <python> scripts/content/before_after.py [docs/screens/cutouts-before-after.png]
"""
import os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OLD = os.path.join(ROOT, "docs/screens/cutouts-compare/_old")
NEW = os.path.join(ROOT, "public/burgers")
SLUGS = ["classic-manch", "truffle-manch", "chilli-manch", "fig-jam", "manch-tiftik", "morel", "chicken-manch"]
BERRY = (0x7A, 0x1F, 0x4B)
TILE, LABEL = 260, 34

def row(sheet, folder, y, title):
    d = ImageDraw.Draw(sheet)
    d.text((10, y + 8), title, fill=(0xF4, 0xEE, 0xE6))
    for i, s in enumerate(SLUGS):
        f = os.path.join(folder, f"{s}.png")
        if not os.path.exists(f): continue
        im = Image.open(f).convert("RGBA").resize((TILE - 16, TILE - 16), Image.LANCZOS)
        sheet.paste(im, (i * TILE + 8, y + LABEL + 8), im)

def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "docs/screens/cutouts-before-after.png")
    sheet = Image.new("RGB", (len(SLUGS) * TILE, 2 * (TILE + LABEL)), BERRY)
    row(sheet, OLD, 0, "ESKİ (isnet + matting + bölgesel/renk filtreleri)")
    row(sheet, NEW, TILE + LABEL, "YENİ (seçilen pipeline)")
    sheet.save(out); print("written", out)

if __name__ == "__main__":
    main()
