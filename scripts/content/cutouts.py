"""Burger kesitleri: kaynak ön-temizlik (kağıt/ok → karo rengi) → rembg (isnet-general-use, alpha matting) → en büyük bileşen → pad → kare 1200 PNG + 600 WebP.
Çalıştırma: PYTHONPATH=<scratchpad>/pylib python3 scripts/content/cutouts.py
"""
import os, sys
import numpy as np
from PIL import Image
from rembg import remove, new_session

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "docs/source")
OUT = os.path.join(ROOT, "public/burgers")
BURGERS = {
    "classic-manch": "burger-classic.png",
    "truffle-manch": "burger-truffle.png",
    "chilli-manch": "burger-chilli.png",
    "fig-jam": "burger-fig-jam.png",
    "manch-tiftik": "burger-tiftik.png",
    "morel": "burger-morel.png",
    "chicken-manch": "burger-chicken.png",
}

def largest_component(alpha: np.ndarray, thr=40) -> np.ndarray:
    """4-komşuluk flood fill ile en büyük bağlı bileşen (scipy yok)."""
    h, w = alpha.shape
    mask = alpha > thr
    seen = np.zeros_like(mask, dtype=bool)
    best = None; best_n = 0
    ys, xs = np.nonzero(mask)
    # hız: sadece maskeli piksellerden başla, iteratif stack
    for y0, x0 in zip(ys[::7], xs[::7]):
        if seen[y0, x0]: continue
        stack = [(y0, x0)]; seen[y0, x0] = True; comp = []
        while stack:
            y, x = stack.pop(); comp.append((y, x))
            for ny, nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; stack.append((ny, nx))
        if len(comp) > best_n:
            best_n = len(comp); best = comp
    keep = np.zeros_like(mask, dtype=bool)
    if best:
        cy, cx = zip(*best); keep[cy, cx] = True
    return keep

def trim_cold_bottom(rgba: np.ndarray, keep: np.ndarray) -> np.ndarray:
    """En geniş satırın altında, satır ortalama rengi 'sıcak' olmayan (R-B < 12: karo/derz/kağıt) ilk satırdan
    itibaren her şeyi at. Burger satırları (ekmek, köfte, sos) her zaman sıcaktır."""
    widths = keep.sum(axis=1)
    if widths.max() == 0: return keep
    widest = int(np.argmax(widths))
    r, b = rgba[:, :, 0].astype(int), rgba[:, :, 2].astype(int)
    for y in range(widest, keep.shape[0]):
        row = keep[y]
        if row.sum() < 8: continue
        warm = (r[y][row] - b[y][row]).mean()
        if warm < 12:
            keep[y:] = False
            break
    return keep

def crop_pad_square(img: Image.Image, pad=0.06, size=1200) -> Image.Image:
    a = np.array(img.split()[-1])
    ys, xs = np.nonzero(a > 8)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    bw, bh = x1 - x0, y1 - y0
    p = int(max(bw, bh) * pad)
    box = (max(0, x0 - p), max(0, y0 - p), min(img.width, x1 + p), min(img.height, y1 + p))
    c = img.crop(box)
    side = max(c.width, c.height)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(c, ((side - c.width) // 2, (side - c.height) // 2))
    return canvas.resize((size, size), Image.LANCZOS)

def preclean(src: Image.Image) -> Image.Image:
    """Kaynakta (matting'den ÖNCE) bordo kağıt ve mavimsi-beyaz ok/çizgileri karo rengiyle boya:
    rembg bunları hiç görmez, burgere bağlı artık kalmaz. Burgerde magenta yok; krem sos R > B olduğundan korunur."""
    a = np.array(src).astype(float)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    val = mx / 255
    # ton (0..1): kağıt bordo/pembe 288°–11° (0.80–1.0 ∪ 0–0.03); burger tonları 15°–40° (0.04–0.11) → dokunulmaz
    d = np.maximum(mx - mn, 1)
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    # kağıt tabanı + pembe kırışık/harf çizgileri: ton bandı + AÇIK (val > 0.45; koyu patty gölgeleri 0.2–0.45'te kalır)
    # gölgeli kağıt: katı magenta kuralı (B > G — kahverengi patty'de B < G)
    paper = (((hue > 0.80) | (hue < 0.03)) & (sat > 0.18) & (val > 0.45)) | ((r > g + 25) & (b > g + 5) & (sat > 0.3))
    arrow = (mn > 190) & (b >= r - 6)                                    # beyaz/mavimsi beyaz ok, çizgi, karo derzi
    tile = np.median(a[: a.shape[0] // 10, : a.shape[1] // 10].reshape(-1, 3), axis=0)  # sol üst köşe karo rengi
    out = a.copy(); out[paper | arrow] = tile
    return Image.fromarray(out.astype(np.uint8), "RGB")

def main():
    os.makedirs(OUT, exist_ok=True)
    session = new_session("isnet-general-use")
    for slug, fname in BURGERS.items():
        src = preclean(Image.open(os.path.join(SRC, fname)).convert("RGB"))
        cut = remove(src, session=session, alpha_matting=True, alpha_matting_foreground_threshold=240,
                     alpha_matting_background_threshold=15, alpha_matting_erode_size=8)
        rgba = np.array(cut.convert("RGBA"))
        keep = largest_component(rgba[:, :, 3])
        keep = trim_cold_bottom(rgba, keep)
        keep = largest_component(np.where(keep, rgba[:, :, 3], 0))
        rgba[:, :, 3] = np.where(keep, rgba[:, :, 3], 0)
        img = crop_pad_square(Image.fromarray(rgba, "RGBA"))
        img.save(os.path.join(OUT, f"{slug}.png"), optimize=True)
        img.resize((600, 600), Image.LANCZOS).save(os.path.join(OUT, f"{slug}.webp"), quality=86)
        cov = (np.array(img.split()[-1]) > 8).mean()
        print(f"{slug:<16} ok  coverage={cov:.2f}")

if __name__ == "__main__":
    main()
