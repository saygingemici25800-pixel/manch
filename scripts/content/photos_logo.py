"""Fotoğraflar (jpg/webp, uzun kenar 1600), kontak tablosu, logo kırpma + potrace, maskot kesiti.
Çalıştırma: PYTHONPATH=<scratchpad>/pylib python3 scripts/content/photos_logo.py
"""
import os
import numpy as np
from PIL import Image, ImageOps
import potrace

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "docs/source")
IMAGES = os.path.join(ROOT, "public/images")
LOGO = os.path.join(ROOT, "public/logo")
SCREENS = os.path.join(ROOT, "docs/screens")
BERRY = (0x7A, 0x1F, 0x4B)

def save_photo(src, name, long=1600):
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    im = ImageOps.exif_transpose(im)
    r = long / max(im.size)
    if r < 1: im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    im.save(os.path.join(IMAGES, f"{name}.jpg"), quality=88, optimize=True, progressive=True)
    im.save(os.path.join(IMAGES, f"{name}.webp"), quality=84)
    print(f"{name}: {im.size}")

def contact_sheet():
    slugs = ["classic-manch", "truffle-manch", "chilli-manch", "fig-jam", "manch-tiftik", "morel", "chicken-manch"]
    tile = 300; cols = 4; rows = 2
    sheet = Image.new("RGB", (cols * tile, rows * tile), BERRY)
    for i, s in enumerate(slugs):
        im = Image.open(os.path.join(ROOT, "public/burgers", f"{s}.png")).convert("RGBA").resize((tile - 20, tile - 20), Image.LANCZOS)
        x, y = (i % cols) * tile + 10, (i // cols) * tile + 10
        sheet.paste(im, (x, y), im)
    sheet.save(os.path.join(SCREENS, "icerik-burgers.png"))
    print("contact sheet ok")

def berry_mask(im: Image.Image, thr=110):
    """Koyu bordo mürekkep → True. Menü zemini krem (~245), yazı ~ (80,30,70)."""
    a = np.array(im.convert("RGB")).astype(int)
    return (a.sum(axis=2) < thr * 3) & (a[:, :, 0] > a[:, :, 1])

def bbox_of(mask, region):
    x0, y0, x1, y1 = region
    sub = mask[y0:y1, x0:x1]
    ys, xs = np.nonzero(sub)
    return (x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1)

def trace_svg(mask: np.ndarray, path: str, pad=2):
    h, w = mask.shape
    m = np.zeros((h + 2 * pad, w + 2 * pad), dtype=bool); m[pad:-pad, pad:-pad] = mask
    # potracer: dizi değeri True = BEYAZ (zemin) sayılıyor; mürekkebi ön plan yapmak için tersle
    bmp = potrace.Bitmap(~m)
    tr = bmp.trace(turdsize=6, alphamax=1.0, opttolerance=0.2)
    parts = []
    for curve in tr:
        sp = curve.start_point
        d = [f"M{sp.x:.1f},{sp.y:.1f}"]
        for seg in curve:
            if seg.is_corner:
                d.append(f"L{seg.c.x:.1f},{seg.c.y:.1f}L{seg.end_point.x:.1f},{seg.end_point.y:.1f}")
            else:
                d.append(f"C{seg.c1.x:.1f},{seg.c1.y:.1f} {seg.c2.x:.1f},{seg.c2.y:.1f} {seg.end_point.x:.1f},{seg.end_point.y:.1f}")
        d.append("Z"); parts.append("".join(d))
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {m.shape[1]} {m.shape[0]}" aria-hidden="true">'
           f'<path fill="currentColor" fill-rule="evenodd" d="{"".join(parts)}"/></svg>')
    open(path, "w").write(svg)
    print(f"{os.path.basename(path)}: viewBox {m.shape[1]}x{m.shape[0]}, {len(parts)} subpaths")

def logo_and_mascot():
    menu = Image.open(os.path.join(SRC, "menu-print.png")).convert("RGB")
    W, H = menu.size
    mask = berry_mask(menu)
    # MANCH wordmark: üst bant
    bb = bbox_of(mask, (0, 0, W, int(H * 0.16)))
    m_word = mask[bb[1]:bb[3], bb[0]:bb[2]]
    # 4x büyüt (potrace pürüz azalır)
    up = np.array(Image.fromarray((m_word * 255).astype(np.uint8)).resize((m_word.shape[1] * 4, m_word.shape[0] * 4), Image.LANCZOS)) > 128
    trace_svg(up, os.path.join(LOGO, "logo-manch.svg"))
    # bitmap yedek 1600 px şeffaf
    alpha = Image.fromarray((up * 255).astype(np.uint8))
    png = Image.new("RGBA", alpha.size, BERRY + (255,)); png.putalpha(alpha)
    r = 1600 / png.width
    png.resize((1600, round(png.height * r)), Image.LANCZOS).save(os.path.join(LOGO, "logo-manch.png"))
    # "M" harfi: wordmark'ın ilk bağlı harf bloğu — sütun projeksiyonuyla ilk boşluk
    cols = up.any(axis=0)
    x = 0
    while x < len(cols) and cols[x]: x += 1
    m_letter = up[:, :x]
    trace_svg(m_letter, os.path.join(LOGO, "logo-m.svg"))
    # MENU wordmark: alt sağ
    bb2 = bbox_of(mask, (int(W * 0.5), int(H * 0.88), W, H))
    m2 = mask[bb2[1]:bb2[3], bb2[0]:bb2[2]]
    up2 = np.array(Image.fromarray((m2 * 255).astype(np.uint8)).resize((m2.shape[1] * 4, m2.shape[0] * 4), Image.LANCZOS)) > 128
    trace_svg(up2, os.path.join(LOGO, "logo-menu.svg"))
    # Maskot: sağ alt çizim (MENU'nün üstü) — ince çizgi, threshold daha gevşek
    reg = (int(W * 0.54), int(H * 0.755), W, int(H * 0.885))  # "Tiramisu … 360 TL" satırının altından başla
    soft = (np.array(menu.convert("L")).astype(int) < 190)
    bb3 = bbox_of(soft, reg)
    crop = menu.crop(bb3).convert("RGBA")
    a = np.array(crop.convert("L")).astype(int)
    alpha = np.clip((215 - a) * 255 / 120, 0, 255).astype(np.uint8)  # krem → şeffaf, mürekkep → opak
    rgba = np.array(crop); rgba[:, :, :3] = BERRY; rgba[:, :, 3] = alpha
    out = Image.fromarray(rgba, "RGBA")
    out = out.resize((out.width * 2, out.height * 2), Image.LANCZOS)
    out.save(os.path.join(IMAGES, "misu-miyu.png"))
    print(f"misu-miyu.png: {out.size} (kaynak {crop.size}, ekran görüntüsünden — düşük çözünürlük)")

if __name__ == "__main__":
    os.makedirs(IMAGES, exist_ok=True); os.makedirs(LOGO, exist_ok=True)
    save_photo("photo-cook.png", "hero-cook")
    save_photo("photo-crispy-triangle.png", "crispy-triangle")
    save_photo("photo-tiramisu.png", "tiramisu")
    logo_and_mascot()
    contact_sheet()
