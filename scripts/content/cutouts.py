"""Burger kesitleri: rembg → en büyük bağlı bileşen → (opsiyonel) soğuk alt kesim → %6 pad → kare 1200 PNG + 600 WebP.

Kullanım (venv):  scripts/content/.venv/bin/python scripts/content/cutouts.py [--model isnet-general-use] [--matting] [--preclean]
                  [--out public/burgers] [--only classic-manch,...] [--no-trim]
Varsayılan: preclean KAPALI (rembg dokunulmamış orijinale uygulanır), matting kapalı, model isnet-general-use.
ÜRETİM (matris kararı 2026-09-17, Kural 41):  --matting --preclean   (isnet-general-use; CPU sağlayıcı)
Kaynaklar (docs/source) asla yazılmaz.
"""
import argparse, os, sys, time
import numpy as np
from PIL import Image
from rembg import remove, new_session

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "docs/source")
BURGERS = {
    "classic-manch": "burger-classic.png",
    "truffle-manch": "burger-truffle.png",
    "chilli-manch": "burger-chilli.png",
    "fig-jam": "burger-fig-jam.png",
    "manch-tiftik": "burger-tiftik.png",
    "morel": "burger-morel.png",
    "chicken-manch": "burger-chicken.png",
}
BERRY = (0x7A, 0x1F, 0x4B)


def preclean(src: Image.Image) -> Image.Image:
    """(--preclean) Kaynak KOPYASINDA, matting'den önce: bordo kağıt + pembe kırışık/harf çizgileri ve beyaz/mavimsi
    ok/derz pikselleri karo rengiyle boyanır. Burger tonları 15°–40° → dokunulmaz."""
    a = np.array(src).astype(float)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    val = mx / 255
    d = np.maximum(mx - mn, 1)
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    paper = (((hue > 0.80) | (hue < 0.03)) & (sat > 0.18) & (val > 0.45)) | ((r > g + 25) & (b > g + 5) & (sat > 0.3))
    arrow = (mn > 190) & (b >= r - 6)
    tile = np.median(a[: a.shape[0] // 10, : a.shape[1] // 10].reshape(-1, 3), axis=0)
    out = a.copy(); out[paper | arrow] = tile
    return Image.fromarray(out.astype(np.uint8), "RGB")


def largest_component(alpha: np.ndarray, thr=40) -> np.ndarray:
    """4-komşuluk flood fill ile en büyük bağlı bileşen (scipy yok)."""
    h, w = alpha.shape
    mask = alpha > thr
    seen = np.zeros_like(mask, dtype=bool)
    best = None; best_n = 0
    ys, xs = np.nonzero(mask)
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
    """En geniş satırın altında, ortalama rengi sıcak olmayan (R-B < 12) ilk satırdan itibaren kes."""
    widths = keep.sum(axis=1)
    if widths.max() == 0: return keep
    widest = int(np.argmax(widths))
    r, b = rgba[:, :, 0].astype(int), rgba[:, :, 2].astype(int)
    for y in range(widest, keep.shape[0]):
        row = keep[y]
        if row.sum() < 8: continue
        if (r[y][row] - b[y][row]).mean() < 12:
            keep[y:] = False; break
    return keep


def crop_pad_square(img: Image.Image, pad=0.06, size=1200) -> Image.Image:
    a = np.array(img.split()[-1])
    ys, xs = np.nonzero(a > 8)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    p = int(max(x1 - x0, y1 - y0) * pad)
    c = img.crop((max(0, x0 - p), max(0, y0 - p), min(img.width, x1 + p), min(img.height, y1 + p)))
    side = max(c.width, c.height)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(c, ((side - c.width) // 2, (side - c.height) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


def contact_sheet(out_dir: str, path: str, tile=300, cols=4):
    slugs = list(BURGERS)
    rows = (len(slugs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tile, rows * tile), BERRY)
    for i, s in enumerate(slugs):
        f = os.path.join(out_dir, f"{s}.png")
        if not os.path.exists(f): continue
        im = Image.open(f).convert("RGBA").resize((tile - 20, tile - 20), Image.LANCZOS)
        sheet.paste(im, ((i % cols) * tile + 10, (i // cols) * tile + 10), im)
    sheet.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="isnet-general-use")
    ap.add_argument("--matting", action="store_true", help="alpha matting (pymatting)")
    ap.add_argument("--preclean", action="store_true", help="kaynak kopyasında kağıt/ok ön-temizliği")
    ap.add_argument("--no-trim", action="store_true", help="soğuk alt kesimi kapat")
    ap.add_argument("--out", default=os.path.join(ROOT, "public/burgers"))
    ap.add_argument("--only", default="", help="virgülle slug listesi")
    ap.add_argument("--sheet", default="", help="kontak tablosu yolu (varsayılan: <out>/contact.png)")
    args = ap.parse_args()

    out = args.out if os.path.isabs(args.out) else os.path.join(ROOT, args.out)
    os.makedirs(out, exist_ok=True)
    only = [s for s in args.only.split(",") if s]
    # onnxruntime 1.19: CoreML sağlayıcısı ISNet için dakikalarca derliyor/askıda kalıyor → CPU sağlayıcısı zorunlu (Kural 41)
    session = new_session(args.model, providers=["CPUExecutionProvider"])
    report = []
    for slug, fname in BURGERS.items():
        if only and slug not in only: continue
        t0 = time.time()
        src = Image.open(os.path.join(SRC, fname)).convert("RGB")   # orijinal sadece okunur
        if args.preclean: src = preclean(src)
        kw = dict(alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=15,
                  alpha_matting_erode_size=8) if args.matting else {}
        cut = remove(src, session=session, **kw)
        rgba = np.array(cut.convert("RGBA"))
        keep = largest_component(rgba[:, :, 3])
        if not args.no_trim:
            keep = trim_cold_bottom(rgba, keep)
            keep = largest_component(np.where(keep, rgba[:, :, 3], 0))
        rgba[:, :, 3] = np.where(keep, rgba[:, :, 3], 0)
        img = crop_pad_square(Image.fromarray(rgba, "RGBA"))
        img.save(os.path.join(out, f"{slug}.png"), optimize=True)
        img.resize((600, 600), Image.LANCZOS).save(os.path.join(out, f"{slug}.webp"), quality=86)
        cov = float((np.array(img.split()[-1]) > 8).mean())
        report.append((slug, cov, time.time() - t0))
        print(f"{slug:<16} ok  coverage={cov:.2f}  {time.time() - t0:5.1f}s", flush=True)
    contact_sheet(out, args.sheet or os.path.join(out, "contact.png"))
    print("contact sheet:", args.sheet or os.path.join(out, "contact.png"))


if __name__ == "__main__":
    main()
