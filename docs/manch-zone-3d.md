# FAZ 5.5 — MANCH ZONE (3D Galeri)

> `CLAUDE.md`'nin eki. **Önkoşul: Faz 1–9 tamamlandı, site yayında.**
> Bu faz `zone/3d-galeri` dalında yapılır, `faz-1-yeniden` dalına ancak kabul kriterleri geçince birleşir.
> **Referans prototip: `docs/reference/manch-zone-prototype.html`** — tek dosya, vanilla Three.js, tarayıcıda açılır.
> Ölçüler ve hareket katsayıları için **prototip doğruluk kaynağıdır**; bu dosya nedenini anlatır, prototip değerini verir.
>
> ⚠️ **Ama prototip eksiksiz değildir.** Değer kaynağı olması, davranış kaynağı olduğu anlamına gelmez.
> Bu dosyanın istediği bir davranışı prototip uygulamıyorsa **bu dosya kazanır**. Bilinen fark:
> **billboard (bölüm 8.3)** — prototip sprite'ı hiç döndürmüyor (`hero.rotation.y` hep 0,
> `material.side` FrontSide). Kamera sabit olduğu için prototipte sonucu görünmüyor; yön takipli
> kamerada (bölüm 3.1) karakter her 180° dönüşte **kayboluyor**. 5.5.3'te bölüm 8.3'e göre uygulandı.

---

## 0. NE YAPIYORUZ

Ana sayfanın hero'su statik kalır. Altındaki **ZONE'A GİR** blob butonu tam ekran, gezilebilir bir
3D galeri salonu açar: **MANCH Zone**.

Kullanıcı Misu veya Miyu'yu seçer, salonda yürür, tabloların önündeki zemin halkalarına basar,
tabloya girince **kamera tablonun karşısına süzülür ve içerik o çerçevenin içinde açılır** —
sayfa değişmez, Zone'dan çıkılmaz.

**İlham:** `thevertmenthe.dault-lafon.fr`. Kopyalamıyoruz; mekanikleri alıyoruz.

---

## 1. TEKNİK KARARLAR (tartışmasız)

| Karar | Değer | Gerekçe |
|---|---|---|
| Kütüphane | `@react-three/fiber` + `@react-three/drei` | App Router lifecycle uyumu, `<Html>` ile sahne içi DOM |
| Yükleme | `next/dynamic` + `{ ssr: false }` | Three.js SSR'da patlar. Sahne **asla** sunucuda render edilmez |
| Geometri | Kod içinde primitive (`boxGeometry`, `planeGeometry`) | **Blender yok, .glb yok.** Referans 3 MB indiriyor, biz ~0 indiriyoruz |
| Doku | Runtime'da `<canvas>` 2D ile üretilir | Zemin, karo duvar, duvar yazısı, ayak izi, zemin halkası — hepsi koddan |
| Karakter | 4 açılık sprite seti (bölüm 8) | 3D model + rig maliyeti yok, line-art kimliğe sadık |
| State | Zustand — `useZoneStore` **+ mevcut `useCartStore`** | Zone'daki sipariş sitedeki sepetin AYNISINA yazar |
| Sahne içi metin | `drei/<Html>` ile normal DOM | TR karakter sorunu yok, erişilebilir |

**Bağımlılık:** `pnpm add three @react-three/fiber @react-three/drei` · `pnpm add -D @types/three`

⚠️ **Bundle borcu:** Faz 8 sonunda First Load JS 214.6 kB gz, hedef 200 kB. Zone ayrı chunk olacağı
için ana sayfayı etkilemiyor — ama Zone chunk'ı kendi başına ≤ 180 kB gz kalmalı (bölüm 9).

---

## 2. DOSYA YAPISI

```
src/
  components/zone/
    ZoneCanvas.tsx        "use client" — <Canvas>, ışık, fog, resize; dynamic import
    ZoneGate.tsx          "ZONE'A GİR" butonu + tam ekran mount/unmount
    CharacterSelect.tsx   Misu / Miyu seçim ekranı
    ZoneLoader.tsx        % sayacı + dönen mesajlar
    Hall.tsx              zemin, tavan, duvarlar (ön duvar dahil), süpürgelik, ışık bantları
    Frame.tsx             çerçeve (kutu + paspartu + görsel düzlemi + spot bandı)
    FloorMarker.tsx       tablonun önündeki dönen halka + nabız (bölüm 5.1)
    Character.tsx         4 açılık sprite, bob + lean, ayak izi spawn
    Npc.tsx               seçilmeyen maskot, idle
    Footprints.tsx        18'lik havuz, sönen decal'lar
    Joystick.tsx          HER CİHAZDA görünür, fare + dokunma (bölüm 7.1)
    FramePrompt.tsx       halkanın üstünde başlık + GİR butonu
    FrameBoard.tsx        POV panosu (bölüm 6.2)
    boards/OrderBoard.tsx sipariş tahtası (bölüm 6.3)
    boards/StoryBoard.tsx crew / mascot / visit panosu
  hooks/
    useZoneControls.ts    WASD + ok + joystick → normalize yön vektörü
    useFollowCamera.ts    yön takipli kamera + POV hedefi (bölüm 3.1)
  lib/zone/
    textures.ts           canvas doku üreticileri
    frames.ts             4 çerçevenin tanımı (TEK DOĞRULUK KAYNAĞI)
  store/zone.ts           { open, character, nearFrame, pov, enter, exit, select, openFrame, closeFrame }
```

---

## 3. SAHNE ÖLÇÜLERİ

**Prototipten kopyalandı. Değiştirmek gerekirse önce prototipte dene, sonra buraya yaz.**

```ts
HALF_W = 7.2          // x: -7.2 .. 7.2
HALL_LEN = 40         // z: -20 .. 20 (ön duvar z=+20'de kapalı)
CEIL_H = 6
Z_MIN = -15, Z_MAX = 15
CHAR_BOUND_X = HALF_W - 1
SPEED = 4.6
CAMERA_FOV = 48       // DİKEY. Portrede uyarlanır — aşağıdaki nota bak
CAM_DIST = 5.4
CAM_HEIGHT = 2.45
CAM_LERP = 0.09
LOOK_AHEAD = 3.0
LOOK_HEIGHT = 1.55
TURN_BASE = 0.15       // kamera dönüşü — bölüm 3.1
CHAR_TURN_BASE = 0.002 // karakter dönüşü, kameradan hızlı (ONAYLANDI 2026-09-18)
                       // 0.005 denendi, tepe sapma 65.1° — 67.5° `side` eşiğinin
                       // altında kaldığı için reddedildi.
FRAME_PROXIMITY = 2.6
MARKER_SIZE = 4.6      // görünür yarıçap 2.3 < 2.6
PROMPT_HEIGHT = 1.35
POV_DISTANCE = 3.25
POV_LERP = 0.055
POV_HEIGHT = 2.65
```

### 3.0 FOV portrede uyarlanır *(revize: 2026-09-18)*

`CAMERA_FOV` **dikey** açıdır. 48° dikey, 390×844 portrede yatayda ≈ **23°** demek — salon tünel
gibi okunuyor. Spec kusuruydu, bilinçli değildi. Yatay açı hedeflenir, dikey ondan türetilir:

```ts
const H_TARGET = 46 * Math.PI / 180
const vFov = 2 * Math.atan(Math.tan(H_TARGET / 2) / aspect)
camera.fov = clamp(vFov * 180 / Math.PI, 48, 72)
camera.updateProjectionMatrix()
```

- **Masaüstü (16:9)** → türetilen değer 27°, alt sınır 48'e takılır: **hiçbir şey değişmez.**
- **Tablet (3:4)** → 59° dikey, yatayda tam 46°.
- **Portre (390×844)** → türetilen 85°, üst sınır **72**'ye takılır; yatay 23° → **37°**.

**Üst sınır 72 şart** — olmadan portrede balık gözü olur. Uygulama: `fovForAspect()` +
`applyAdaptiveFov()` (`lib/zone/frames.ts`), `useFollowCamera` ekran boyu değişince çağırır.

### 3.1 Yön takipli 3. şahıs kamera

**Kamera sabit bakmaz — yürünen yöne döner.** Sağa basınca sağa bakarız, aşağı çekince arkamıza.
Karakter yana kaymaz; kamera arkasına geçer, o hep ileri yürür.

```ts
if (len > 0.05) {
  const want = Math.atan2(ix, iz)
  charAng = angLerp(charAng, want, 1 - Math.pow(CHAR_TURN_BASE, dt))      // hızlı
  if (!reducedMotion) camAng = angLerp(camAng, want, 1 - Math.pow(TURN_BASE, dt))  // yavaş
}
const fx = Math.sin(camAng), fz = Math.cos(camAng)
let cx = clamp(char.x - fx * CAM_DIST, -HALF_W + 0.7, HALF_W - 0.7)
let cz = clamp(char.z - fz * CAM_DIST, -19.2, 19.2)
camera.position.lerp([cx, CAM_HEIGHT, cz], CAM_LERP)
camera.lookAt([char.x + fx * LOOK_AHEAD, LOOK_HEIGHT, char.z + fz * LOOK_AHEAD])
```

**`angLerp` şart** — açılar ±π'de sarmalanır, düz `lerp` orada kamerayı ters yöne fırlatır.
Ayrıca **tam 180°'de iki dönüş yönü eşit uzaklıktadır**; taraf seçilemezse kamera titrer ya da hiç
dönmez. Aşağı çekince arkaya dönmemesinin sebebi tam olarak budur. Beraberliği bozun:

```ts
function angLerp(a: number, b: number, t: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI
  if (Math.abs(Math.abs(d) - Math.PI) < 1e-3) d = Math.PI * 0.999
  return a + d * t
}
```

**Yumuşama `1 - Math.pow(BASE, dt)` biçiminde yazılmalı**, sabit `0.08` değil — sabit katsayı kare
hızına bağımlıdır. `TURN_BASE = 0.15` ile 180° dönüş ~1.2 sn. İlk denemede 0.004 (~0.4 sn) kullanıldı,
çok hızlı bulundu.

**Girdi bittiğinde `camAng` yerinde kalır.** Kamera kendi kendine eski yönüne dönmez.

**`CHAR_TURN_BASE` neden 0.002** *(ONAYLANDI 2026-09-18, ilk değer 0.02)*: sprite'ın hangi görünümde
çizileceğini karakter–kamera **ayrışması** belirler (bölüm 8.1). Ayrışmanın tepe değeri
`dönüş açısı × max_t(TURN_BASE^t − CHAR_TURN_BASE^t)`:

| `CHAR_TURN_BASE` | tepe oran | 180° dönüşte | kova | karakterin %90 dönüş süresi |
|---|---|---|---|---|
| 0.02 (ilk) | %26.1 | 46.9° | `back34` | 0.59 sn |
| 0.005 | %36.2 | **65.2°** | `back34` | 0.43 sn |
| **0.002** | **%41.2** | **74.2°** | **`side`** | **0.37 sn** |

`side` kovası 67.5°'de başlıyor: **0.005 eşiğin 2.3° altında kalıyor**, `side` yine hiç tetiklenmezdi.
0.002 eşiği 6.7° payla geçiyor. `front` (≥112.5°) sürekli girdiyle ulaşılamaz — tavan %44.5 → 80°;
o görünüm `CharacterSelect` ve NPC içindir.

**0.005 denendi, tepe sapma 65.1° — 67.5° `side` eşiğinin altında kaldığı için reddedildi.**
(Ölçüm modeli doğruladı: tahmin 65.2°, sahnede ölçülen 65.1°.)

**`prefers-reduced-motion` → kamera hiç dönmez.** Ani dönüş, yavaş dönüşten daha rahatsız edicidir.

**Işık:** `ambientLight 0.85` + `directionalLight #ffffff 0.55 @(4,10,6)` + `directionalLight #C4E4F3 0.35 @(-6,6,-8)`.
Gölge haritası **kapalı** — karakterin altında canvas'tan üretilen yumuşak gölge düzlemi var.

**Fog:** `new THREE.Fog(cream, 26, 52)`.

---

## 4. MEKÂN

| Yüzey | Ne |
|---|---|
| Zemin | Bordo–krem dama (`berry`/`cream`, 128px kare), `repeat(10,26)`, %6 grain |
| Yan duvarlar | Mavi karo (`tile` + beyaz derz, 64px grid), `repeat(6,3)` |
| Arka duvar | Müze künyesi (bölüm 4.1) |
| **Ön duvar** | z=+20, "THE BURGER YOU'LL CRAVE AGAIN". **Kamera döndüğü için şart** |
| Tavan | Düz `cream`, iki tarafta `mustard` ışık bandı (x=±4) |
| Süpürgelik | `ink`, 0.12 × 0.35 kutu, iki duvar boyunca |

### 4.1 Arka duvar — müze künyesi

Salona girince tam karşıda. Sola hizalı, ince ayırıcı çizgiyle, altında künye kenarlığıyla:

```
MANCH
F E T H İ Y E   ·   P A S P A T U R   ·   2 0 2 6
───────────────
Bir smash burger, aslında bir sıkışma meselesidir. Köfte tezgâha değdiği anda
yüzeyinde ince bir kabuk oluşur ve tadın çoğunu o kısacık an taşır.

MANCH bu anı ciddiye alan bir mutfak. Brioche burada açılır, sos burada çırpılır,
köfte önceden pişmez. Hepsi aynı sebeple: acele edilen hiçbir şey iyi olmuyor.

Gerisi yendikten sonra konuşulur.

el yapımı, her katmanda
```

Metin `messages/{tr,en}.json`'a girer, canvas'a oradan çizilir.

### 4.2 Font yükleme tuzağı

Google fontları canvas'a **geç** yüklenir. Duvar yazıları ve tablo başlıkları ilk çizimde yedek
fontla çıkar ve öyle kalır. Çözüm:

```ts
await document.fonts.ready
// yazı içeren TÜM dokuları yeniden çiz, texture.needsUpdate = true
```

Prototipte bu hata yapıldı ve düzeltildi. Atlamayın.

---

## 5. ÇERÇEVELER — `lib/zone/frames.ts`

Sol duvar z = -4 ve 6, sağ duvar z = -4 ve 6. Çerçeve 1.9 × 2.7, y = 2.65,
her birinin 4.4 yüksekliğinde `mustard` spot bandı.

```ts
export const ZONE_FRAMES = [
  { id:'menu',   side:-1, z:-4, kicker:'01 · SİPARİŞ',   title:'SİPARİŞ VER', board:'order',
    art:'/burgers/on-tile/classic-manch.webp', href:'/menu' },
  { id:'crew',   side: 1, z:-4, kicker:'02 · EKİP',      title:'EL YAPIMI',   board:'story',
    art:'/images/team-kitchen.webp',           href:'/about' },
  { id:'mascot', side:-1, z: 6, kicker:'03 · MASKOTLAR', title:'MISU & MIYU', board:'story',
    art:'/images/misu-lockup.png',             href:'/about#mascots' },
  { id:'visit',  side: 1, z: 6, kicker:'04 · ZİYARET',   title:'BİZE GEL',    board:'story',
    art:'/images/social/03-flatlay.webp',      href:'/contact' },
] as const
```

Her çerçevenin **durma noktası** `pos = (side * (HALF_W - 1.6), 0, z)`. Yakınlık, prompt ve zemin
halkası buna göre hesaplanır — çerçevenin duvardaki konumuna göre değil.

`href` gezinme hedefi değil; panonun altındaki "tam sayfaya git" bağlantısı ve `sr-only` navigasyon için.

### 5.1 Zemin işaretçisi — `FloorMarker.tsx`

Tablonun önünde yerde duran hareketli halka. İşlevi: **tıklamanın nerede açılacağını göstermek.**

İki düzlem, `rotation.x = -π/2`, `depthWrite: false`:

| katman | y | doku | davranış |
|---|---|---|---|
| halka | 0.014 | kesikli dış çember + ince iç çember + içe bakan 4 ok | `rotation.z = -t*0.18` · opaklık `0.30 + glow*0.55` |
| nabız | 0.016 | tek beyaz halka, `mustard` ile renklendirilir | ölçek `0.5→1.5`, opaklık `(1-ph)*(0.22+glow*0.5)`, hız `0.75+glow*0.85` |

`glow` = en yakın çerçeve ise 1'e, değilse 0'a yumuşar (`dt*6`).

**Ölçü ilişkisi kritik:** `MARKER_SIZE = 4.6` → görünür yarıçap 2.3, tetikleme 2.6. Halka tetikleme
alanının **içinde** kalır; "halkanın üstündeyim ama açılmadı" durumu oluşmaz. Bu ikisi birlikte değişir.

**reduced-motion** → halka dönmez, nabız atmaz; yaklaşınca sabit vurgu (`opacity = glow*0.35`).

### 5.2 Prompt konumu *(revize: 2026-09-18)*

```ts
anchor = (side * (HALF_W - 0.12 - 0.9), PROMPT_HEIGHT, frame.z)   // CSS translate(-50%, 0)
PROMPT_HEIGHT = 1.35   // değişmedi
```

**Yükseklik** ilk tasarımda 4.15'teydi (tavana yakın, bakışın dışında). 1.35'te başlık ve GİR
butonu halkayla birlikte **tek bir çağrı** olarak okunuyor.

**Yatayda çapa, durma noktası değil tablo düzlemi referans alınır:** tablo `side*(HALF_W−0.12)`'de,
prompt oradan salona doğru **0.9 birim önde** asılır. Gerekçe: prompt tablonun **üstünde değil
önünde** asılı duran bir tabela gibi durur, karakter duvara dayanınca kamera ile tablo arasına
girmez, `FloorMarker` halkasıyla dikey olarak hizalanır.

> İlk uygulamada çapa `frameStop` (HALF_W−1.6) idi; karakter duvara dayandığında kamera tabloya
> çok yaklaşıyor ve prompt görselin alt kısmının üstüne biniyordu. Uygulama: `promptAnchor()`
> (`lib/zone/frames.ts`).
>
> **CSS `-100%` → `0` (kutu aşağı sarkar) — ONAYLANDI 2026-09-18, madde kapandı.**
> Sapma değil **iyileşme**: kutunun aşağı sarkması "promptlar çok üstte, aşağı çekelim"
> talimatına da hizmet ediyor ve prompt zemin halkasına yaklaşıyor — başlık, GİR butonu ve
> halka gerçekten **tek bir çağrı** olarak okunuyor. Çapa 0.9 birim öne alındıktan SONRA bile örtüşme
> sürüyordu: tablonun alt kenarı y=1.55, çapa y=1.35 → duvara dayalı mesafede ekranda yalnızca
> **~35 px** boşluk kalıyor, kutu ise ~58 px. Yukarı büyüyünce kaçınılmaz olarak biniyordu
> (ölçüldü: masaüstü 22.6 px, portre 36.4 px). Aşağı sarkınca çapanın dünya konumu ve
> yüksekliği **aynen korunur**, kutu tablonun altında kalır: masaüstü **52 px**, portre
> **33 px** boşluk. Dört tabloda da duvara dayalı hâlde **sıfır piksel örtüşme**
> `zone-camera-check` ile denetleniyor.
>
> **Görsel materyali `transparent`** olmalı: `misu-lockup.png` alfalı; şeffaflık okunmayınca
> tablo düz bordo blok olarak çıkıyordu (Kural 59 gözle bakmada yakalandı).

---

## 6. AKIŞ — POV PANO

Tabloya girmek `router.push()` yapmaz. Kamera tablonun karşısına süzülür, çerçeve ekranı doldurur,
içerik **o çerçevenin içinde** açılır.

```
Ana sayfa → "ZONE'A GİR"
  → CharacterSelect (sessionStorage 'manch_char')
    → ZoneLoader (%0→100)
      → state:'zone' — kamera yürüdüğün yöne dönüyor, halkalar nabız atıyor
         ├─ halkaya bas → FramePrompt
         │    └─ GİR / E / tıklama → state:'pov'
         │         ├─ kamera POV hedefine lerp (.055)
         │         ├─ HUD + joystick + prompt gizlenir
         │         └─ FrameBoard belirir (opacity + scale .94→1)
         │              └─ GERİ / Esc → state:'zone'
         └─ ÇIKIŞ → ana sayfa
```

### 6.1 POV kamera

```ts
const fx = frame.side * (HALF_W - 0.12)
camTarget  = [fx - frame.side * POV_DISTANCE, POV_HEIGHT, frame.z]
lookTarget = [fx, POV_HEIGHT, frame.z]
```

POV'da hareket girdileri **tamamen kapalı**. Çıkınca `camAng` **değişmemiş olmalı**.

### 6.2 Pano görünümü — `FrameBoard.tsx`

Tam ekran DEĞİL. Ortada çerçeve gibi duran kart; kenarlarda 3D sahne görünmeye devam eder.

```
Genişlik    min(92vw, 720px) · max-height: min(86vh, 900px) · dikey scroll
Çerçeve     14px ink kenarlık + 6px ink %25 outline
Gölge       0 40px 90px ink %45
Giriş       opacity 0→1, scale .94→1, .45s cubic-bezier(.4,1.4,.7,.95)
Üst şerit   sticky · berry · solda Modak başlık · sağda "← GERİ"
```

### 6.3 Sipariş tahtası — `boards/OrderBoard.tsx`

| grup | içerik |
|---|---|
| SMASH BURGERS | 7 burger |
| YANINDA | `classic-fries`, `truffle-fries`, `chicken-tenders`, `mushroom-arancini` |
| İÇECEK & TATLI | limonata, soft drink, ayran, tiramisu |

**Kapsam:** 15 satır, 25 değil. Çerçeve içinde 25 satır mobilde kullanılamaz. Altta
"TÜM MENÜYÜ GÖR →" → `/menu` (Zone kapanır, R2 perdesi).

**İçecekler `menu.ts`'te yok** — eklenecek. Fiyatlar teyit bekliyor: limonata 120 / soft drink 90 /
ayran 80 TL örnek değer, `menu.disclaimer` tahtanın üstünde görünür.

**Adet:** `−` ve `+`, `−` adet 0 iken `disabled`. Her değişiklik **mevcut `useCartStore`'a** yazar.

**Alt şerit** (sticky, `paper`, 3px ink üst kenarlık): solda TOPLAM, sağda hardal gönder
düğmesi. Toplam 0 iken `disabled`.

> **Gönderme adaptör arkasında (Kural 66, 2026-09-18).** Tahta WhatsApp'ı bilmez: tek çağrı
> `submitOrder(lines, locale, t)`. Düğmenin **metni de** adaptörden gelir
> (`orderChannel().labelKey` → `Order.send`); bileşene gömülmez, çünkü "WHATSAPP'TAN GÖNDER"
> yarın "SİPARİŞİ GÖNDER" olacak. Site sepeti **aynı** adaptörü kullanır — ikinci bir
> gönderme yolu yoktur. Gerçek sipariş sistemi geldiğinde değişecek tek dosya: `lib/order/submit.ts`.

**Yeniden çizim:** adet değişince `scrollTop` korunmalı, yoksa liste başa sarar. Prototipte bu hata
yapıldı ve düzeltildi.

### 6.4 Hikâye panosu — `boards/StoryBoard.tsx`

`frame.art` üstte, altında başlık + iki paragraf + "TAM SAYFAYA GİT →". Metinler i18n'den.

---

## 7. KONTROLLER

### 7.1 Joystick — her cihazda görünür

**`pointer:coarse` koşulu YOK.** Masaüstünde de görünür ve fareyle sürüklenir.

```
Konum   sağ alt · right: 22px + env(safe-area-inset-right)
                 · bottom: 30px + env(safe-area-inset-bottom)
Taban   112px daire · 2px ink %55 kenarlık · krem %35 dolgu · backdrop-blur 2px
Topuz   50px daire · ink dolgu · transform: translate(x,y)
Etiket  altında pixel fontla "SÜRÜKLE" (mobilde gizli)
```

- `mousedown`/`touchstart` **joystick üzerinde** başlar → `dragging`, imleç `grabbing`
- `mousemove`/`touchmove` ve `mouseup`/`touchend` **`window` üzerinde** dinlenir — sürükleme pedin
  dışına çıkınca kopmaz. Elemanın kendi üzerinde dinlemek klasik hatadır.
- Topuz en fazla `yarıçap − 18px`: `d = min(hypot(dx,dy), r-18)`, `a = atan2(dy,dx)`
- Çıkış: `joy.x = cos(a)*d/(r-18)`, `joy.y = sin(a)*d/(r-18)` → −1..1
- Bırakınca merkeze döner; `dragging` sırasında `transition:none`, sonra `.12s ease-out`
- `window` `blur` → sürükleme biter
- POV'da gizlenir, `zone`'a dönünce gelir
- `touch-action: none`, `mousemove` `{ passive:false }` + `preventDefault()`

**Erişilebilirlik — REVİZE (2026-09-18, kullanıcı):** joystick **`aria-hidden`**'dır ve
odaklanabilir DEĞİLDİR. Klavye zaten WASD/ok tuşlarıyla **global olarak** çalışıyor; ekran
okuyucuya aynı işi yapan ikinci bir kontrol sunmak yalnızca kafa karıştırır. (Spec'in ilk
hâlindeki `role="application"` + `tabindex="0"` önerisi bu maddeyle değişti.)

**Yığın sırası:** sitenin sepet düğmesi `fixed z-60` ve tam aynı köşede duruyor. Joystick z-70,
`FrameBoard` z-75 — yoksa joystick sepetin altında kalıyor ve görünmüyor (5.5.7'de yaşandı).

### 7.2 Klavye

`WASD` + ok = yürüme · `E` = gir · `Esc` = POV'dan çık, POV'da değilse Zone'dan çık.
Space ve ok tuşlarında `preventDefault()`.

### 7.3 Vektör birleştirme

```ts
let ix = (right?1:0) - (left?1:0) + joy.x
let iz = (down?1:0)  - (up?1:0)   + joy.y
const len = Math.hypot(ix, iz)
if (len > 1) { ix /= len; iz /= len }
```

### 7.4 Girdi kameraya göre DEĞİL, dünyaya göre

`W` her zaman −z, `D` her zaman +x. Girdiyi `camAng` ile döndürmeyin.
Bu bir oyun değil, bir galeri; kullanıcı iki saniyede bir yön değiştiriyor ve kameraya göreli kontrol,
kamera dönerken yönü kaydırıp kafa karıştırıyor. Kamera yönü sadece **görüntüyü** belirler.

**İpucu:** dokunmatikte `JOYSTICK İLE YÜRÜ · TABLOYA YAKLAŞ`,
farede `JOYSTICK'İ SÜRÜKLE VEYA WASD · TABLOYA YAKLAŞ`.

---

## 8. KARAKTERLER — 4 açılık sprite seti

**Misu kulaklıklı. Miyu güneş gözlüklü.** İkisi de kapibara.
(`public/images/misu-lockup.png` içindeki gözlüklü figür **Miyu**'dur — logoda o var.)

### 8.1 Açı → görünüm

Karakterin kendi yönü (`charAng`) kameradan hızlı döner. İkisi arasındaki fark hangi açıdan
bakıldığını verir:

```ts
const rel = normalizeAngle(charAng - camAng)          // -π .. π
const i = Math.min(4, Math.round(Math.abs(rel) / (Math.PI/4)))
const view = ['back','back34','side','front','front'][i]
sprite.material.map = SET[who][view]
sprite.scale.x = (rel < 0 && view !== 'back' && view !== 'front') ? -1 : 1   // aynala
```

Sol taraf için ayrı çizim YOK — `scale.x = -1` ile aynalanır.

### 8.2 Görsel varlıklar

```
public/images/mascots/misu-back.png    misu-back34.png    misu-side.png    misu-front.png
public/images/mascots/miyu-back.png    miyu-back34.png    miyu-side.png    miyu-front.png
```

Kurallar: aynı line-art stili, bordo kontur, dolgu yok, şeffaf PNG, ≥1000 px yükseklik.
**Dört çizimde de karakter aynı boyda ve aynı zemin çizgisinde** olmalı — yoksa dönerken zıplar.
Ellerinde yiyecek yok, kollar serbest. `back34` ve `side` **sola** baksın (sağı kod aynalıyor).
Misu: kulaklık + oversize tişört. Miyu: güneş gözlüğü kafasının üstünde + tişört.

**Çizimler gelmeden:** prototipteki `drawCapy()` geçici sprite üretir. Sahne kodu çizimlerin
gelmesini beklemez; dosyalar düşünce `TextureLoader` devreye girer, başka hiçbir şey değişmez.

> **Uygulandı (5.5.3).** `createCharacterSet()` çizilmiş sprite'ı **senkron** döndürür, PNG'leri arka
> planda dener ve **dördü birden** yüklenince alanları yerinde değiştirir (yarım set dönerken zıplayan
> karakter demek olurdu). Anahtar: `character.ts` içindeki `MASCOT_SPRITE_BASE` sabiti. Şu an `null` —
> **otomatik yoklama bilerek yok**, olmayan PNG'ye atılan istek 404 üretir, Kural 53'ün ağ denetimine
> takılır ve Zone ana sayfaya bağlanınca (5.5.10) her açılışta 8 boş istek olur. Çizimler gelince sabit
> `"/images/mascots"` yapılır. Yükleyici ölü kod değil: dev'de `?sprites=<yol>` ile aynı yol denenir ve
> 8 geçici PNG ile uçtan uca doğrulandı (`spriteSource` → `png`, doku sayısı sabit, ölü doku bağı 0).

### 8.3 Animasyon

- Sprite **billboard**: her karede kameraya döner. **Atlanamaz:** `PlaneGeometry` normali +z ve
  `MeshBasicMaterial` varsayılanı `FrontSide` olduğu için, kamera karakterin öbür yanına geçtiği anda
  (yön takipli kamerada her 180° dönüşte) sprite arka yüzden görünür ve **kırpılır — karakter kaybolur**.
  Prototipte bu adım yazılmamış (`hero.rotation.y` hep 0); kamera sabit olduğu için ortaya çıkmamış.
  Yalnız Y ekseninde döndürülür (karakter dik kalır); Euler XYZ sırasında `rotation.z` (lean) önce
  yerel düzlemde uygulanır, billboard açısı sonra gelir
- Yürürken `bob += dt*11`, `y = 0.83 + |sin(bob)|*0.07`, `rotation.z = sin(bob)*0.05`
- Dururken y ve rotation lerp ile sıfıra döner
- Ayak izi: her 0.26 s, sağ/sol dönüşümlü, 18'lik havuz, `opacity` saniyede 0.28 azalır.
  İzin dönüşü **hareket yönüne** göre, kamera yönüne göre değil.

  > **Uygulama notları (5.5.4).**
  > · İzin **konumu** da hareket yönünden türetilir: karakterin 0.25 arkasına, adımı atan ayağın
  >   tarafına 0.18 kayarak. (Prototip izi sabit `z + 0.25`'e koyuyor — yalnızca −z yönünde
  >   yürürken doğru; kamera dönmeye başlayınca yan yürüyüşte iz yanlış tarafa düşüyor.)
  > · Sayaç **girdiye değil, gerçekten alınan yola** bakar; yoksa duvara dayanmışken izler aynı
  >   noktada üst üste yığılıyor.
  > · **Görünürlük ölçüldü:** yürürken 8–11 iz canlı, ama kamera karakterin ÖNÜNE baktığı için
  >   aynı anda **yalnızca 1–2'si kadrajda** (portrede 2–3). İzler doğru basılıyor/dönüyor/sönüyor;
  >   sınırlayan şey kamera geometrisi (CAM_DIST 5.4 arkada, LOOK_AHEAD 3.0 önde).
  > · **KARAR (2026-09-18, kullanıcı): değişiklik yok.** Boyut **0.22 × 0.3**, opaklık **0.85**
  >   kalır. Az görünmeleri kusur değil, kamera geometrisinin sonucu; **dekoratif bir öğe için
  >   izi büyütmek karakterle ölçek ilişkisini bozar.** Bu madde kapandı, yeniden açılmasın.
- `prefers-reduced-motion` → bob, lean, ayak izi ve kamera dönüşü kapalı

**Seçilmeyen maskot** salonun dibinde (x=-3.2, z=-12) NPC, `front` görünümüyle durur, hafif idle.

> **Uygulama notu (5.5.4).** NPC de **billboard yapar** — kamera salonda dolaşıp arkasına
> geçebiliyor. Ayrıca sahnede artık İKİ sprite seti var: `acquireCharacterSet` karakter başına
> önbelleğe alır (tekil olsaydı NPC ile oyuncu birbirinin dokusunu bırakırdı). Toplam 8 sprite
> dokusu; `zone-leak-check` sayıyı sabit tutar.

**Serbest gezinmede hangi görünümler çıkıyor** (ölçüldü, 5.5.4): 180° dönüş → `back`, `back34`,
`side` · 90° dönüşler → `back`, `back34` · düz yürüyüş → `back`. **`front` serbest gezinmede
ulaşılmaz** (tepe ayrışma %44.5 → 80°, eşik 112.5°) — `CharacterSelect` ve NPC onun yeri.

---

## 9. PERFORMANS (kabul kriteri)

- Zone bundle'ı ana sayfaya **dahil değil** — `next/dynamic` ile ayrı chunk
- Zone chunk'ı gzip **< 260 KB** (three + fiber + drei dahil) *(revize: 2026-09-18, ilk değer 180)*

  > **Neden 180 → 260.** 180, gerçek maliyet bilinmeden yazılmış bir tahmindi; three + fiber +
  > drei için **241.5 kB gz normal**. Chunk ana sayfaya dokunmuyor (`/tr` ilk yükleme 218.4 kB gz,
  > three imzası yok), ana sayfa LCP'sini bozmuyor (796 → 772 ms mobil) ve kullanıcı **kapıya
  > basıp yükleyiciyi gördükten sonra** iniyor: bedeli 3D'yi bilerek isteyen ödüyor.
  >
  > **Kırılım (ölçüldü 2026-09-18, fark-build yöntemiyle).** Yöntem: aynı üretim build'i üç kez
  > alınıp three imzası taşıyan chunk'ların gz toplamı karşılaştırıldı.
  >
  > | ölçüm | gz | çıkarım |
  > |---|---|---|
  > | three + fiber + drei (mevcut) | **241.5 kB** | — |
  > | drei `<Html>` çıkarılmış | 238.8 kB | **drei ≈ 2.7 kB** |
  > | yalnız three (namespace import) | **245.4 kB** | three tek başına zaten tüm chunk kadar |
  >
  > **Sonuç: yük neredeyse tamamen three.** `drei`'nin payı **2.7 kB** — tek kullanıcısı `<Html>`
  > ve ağaç budaması işini yapıyor; **drei'yi atmak hiçbir şey kazandırmaz.** `fiber`'ın bu
  > chunk içindeki artışı ölçülebilir düzeyde değil (ince bir reconciler katmanı).
  >
  > ⚠️ **Yöntemin sınırı:** yalnızca **three imzası taşıyan** chunk'lar sayılıyor; fiber/React
  > reconciler kodunun başka chunk'a düşen kısmı bu toplamın dışında kalır. Ayrıca "yalnız three"
  > ölçümü `import * as THREE` ile yapıldığı için budamaya dirençli — gerçek three yükü
  > **~236–240 kB** aralığında.
  >
  > **İleride mobilde takılırsa kesilecek tek yer three'nin kendisidir** (özel/ince build,
  > kullanılmayan renderer özelliklerinin dışlanması). fiber ve drei'de kesecek bir şey yok.
- Ana sayfa LCP'si Zone'dan **etkilenmez** (mevcut: mobil 2310 ms, masaüstü ~230 ms)
- Sahne mobilde 60 fps; düşerse önce `setPixelRatio` 1.5
- `dpr = Math.min(devicePixelRatio, 2)`
- Zone kapanınca `renderer.dispose()`, tüm geometry/material/texture dispose, rAF iptal.
  **Aç-kapa-aç'ta bellek artmamalı**
- POV'da sahne render'ı durmaz (kenarlarda görünüyor) ama karakter animasyonu, ayak izi ve halka
  nabzı durur.
  **"Ayak izi durur" = YENİ iz basılmaz** (netleştirme 2026-09-18, kullanıcı; 5.5.11'de ölçüldü).
  Havuzdaki mevcut izlerin **sönmesi sürer** — yarı sönmüş bir izi dondurmak ekranda yanlış
  görünür, POV'dan çıkınca da bayat bir iz izi bırakırdı. Ölçülen davranış zaten budur:
  POV'da `lastStepRot` değişmiyor (yeni iz yok), `footprints.max` 0.253 → 0 (sönme sürüyor).

---

## 10. ERİŞİLEBİLİRLİK

- Zone açılınca `role="dialog"` + `aria-modal="true"`, focus trap, `Esc`
- POV panosu açılınca odak panonun içine taşınır; kapanınca GİR butonuna döner.
  **`focus({ preventScroll: true })` şart** — kart zaten kadrajın ortasında; odak vermek
  tarayıcıyı sayfayı kaydırmaya itiyor ve kartın üstü kadrajdan çıkıyor (5.5.6'da ölçüldü).
  `drei/<Html>` içeriği DOM'a sonradan portal edildiği için geri dönüşte odak birkaç kare
  denenir, yoksa `body`'de kalır.
- Sipariş tahtasındaki `+`/`−` klavyeyle erişilebilir, `aria-label` taşır, toplam `aria-live="polite"`
- Joystick ve GİR klavyeyle erişilebilir, `mustard` focus ring
- `prefers-reduced-motion` → perde, POV lerp'i, kamera dönüşü, halka ve karakter animasyonları kapalı
- **Zone SEO'ya dahil değil.** `/menu`, `/about`, `/contact` normal sayfalar olarak crawl edilir;
  4 hedef sahne dışında `sr-only` `<Link>` ile de erişilebilir. POV panosu bu sayfaların yerine geçmez.

---

## 11. ADIMLAR

- [x] **5.5.1** Bağımlılıklar + `store/zone.ts` + `lib/zone/frames.ts` + `lib/zone/textures.ts`
      + `menu.ts`'e içecek kategorisi
- [x] **5.5.2** `ZoneCanvas` + `Hall` (ön duvar + künye + `document.fonts.ready`) — `/lab/zone`
- [x] **5.5.3** `Character` (4 açılık sprite + **billboard**) + `useZoneControls` + **yön takipli kamera** — `lib/zone/{angles,character,runtime}.ts`, `hooks/{useZoneControls,useFollowCamera}.ts`, `scripts/zone-camera-check.mjs` (32/32)
- [x] **5.5.4** `Footprints` + `Npc` + ışık bantları — 18'lik havuz, ikinci sprite seti, prototip ölçüsünde bantlar
- [x] **5.5.5** `Frame` × 4 + **`FloorMarker`** + `FramePrompt` + yakınlık — halkanın üstündeki 8 nokta da tetikliyor
- [x] **5.5.7** `Joystick` + reduced-motion + erişilebilirlik  *(öne alındı)*
- [x] **5.5.6** POV geçişi — `state:'pov'`, kamera lerp, HUD gizleme, `FrameBoard` kabuğu (odak gidiş-dönüşü dahil)
- [x] **5.5.8** `OrderBoard` — 15 satır, `useCartStore`, toplam, **`submitOrder` adaptörü**, scroll korunması
- [x] **5.5.9** `ZoneGate` + `CharacterSelect` + `ZoneLoader` — ana sayfaya bağlandı
- [x] **5.5.10** `StoryBoard` × 3 + "TAM SAYFAYA GİT" (Zone'u kapatıp gezdirir)
- [x] **5.5.11** Performans + Kural 59 gözle bakma (mobil + masaüstü ekran görüntüleri)
- [x] ✅ **Kabul:** build temiz · Zone chunk < 260 KB gz *(revize: 2026-09-18 — bölüm 9'da 180 → 260 yapılmıştı, bu satır güncellenmemişti; ölçülen 241.6)* · ana sayfa LCP bozulmadı ·
      aç-kapa-aç'ta bellek sabit · joystick masaüstünde fareyle çalışıyor, sürükleme pedin dışına
      çıkınca kopmuyor · **kamera yürünen yöne dönüyor, aşağı çekince 180° dönüyor, fırlamıyor,
      duvara girmiyor** · **halkaya basınca prompt kesin açılıyor** · **POV'a girip çıkmak
      kamerayı bozmuyor** · **adet değiştirince liste başa sarmıyor** · **Zone'da eklenen ürün
      site sepetinde görünüyor** · 4 pano doğru içeriği açıyor

---

## 12. AÇIK TODO'LAR

> **Kapanan madde — rakam tipografisi (karar 2026-09-18).** Fiyat, adet ve toplam `font-ui`
> (Mouse Memoirs) ile yazılır; Modak'ın sıfırı okunmuyor. `About.timeline.eyebrow`'daki
> "EST. 2026" **Modak kalır**: `SectionHeader` eyebrow ortak bileşendir, tek başına değiştirmek
> tüm bölüm kickerlarını etkilerdi. Rakam-font kuralı **fiyat/adet/toplam içindir.**
> **Madde kapandı, yeniden açılmayacak.**

- Misu ve Miyu'nun 4 açılık çizimleri (8 dosya) — çizerde
- Orijinal vektör logo + marka renk kılavuzu
- İçecek fiyatları — şimdilik örnek değer
- NPC maskotun replikleri
