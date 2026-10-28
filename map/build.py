"""Turn the painted map (map/painted-map.jpg) into the world fields the game reads.

Run from the repository root:  python3 map/build.py
Needs numpy, scipy and Pillow. It measures the painting (sea, lakes, mountains, snow, forest,
marsh, sand, red mesas and dunes), stores the fields on a coarse grid and writes them into the
<script id="mapData"> block of index.html. A preview, map/fields.png, shows what it found.
Rivers are not measured here: they are traced by hand in RIVERS in index.html.
"""
import json, re, zlib, base64, numpy as np
from PIL import Image
from scipy import ndimage as nd
src = Image.open('map/painted-map.jpg').convert('RGB')
im = np.asarray(src).astype(float); Hh, Ww = im.shape[:2]
R,G,B = im[...,0], im[...,1], im[...,2]
mx, mn = im.max(-1), im.min(-1); lum = im.mean(-1); sat = (mx - mn) / np.maximum(mx, 1)
yy, xx = np.mgrid[0:Hh, 0:Ww]
water = (B - R > 12) & (B > G - 18)
water = nd.binary_opening(water, iterations=2)
edge = np.zeros_like(water); m = 28; edge[:m] = edge[-m:] = True; edge[:, :m] = edge[:, -m:] = True
lab, n = nd.label(water | edge)
ocean = lab == lab[0, 0]
others = (lab > 0) & ~ocean
sizes = nd.sum(others, lab, range(n + 1))
with np.errstate(invalid='ignore'): cy = nd.center_of_mass(others, lab, range(n + 1))
keep = np.array([sizes[i] > 400 and cy[i][0] > 300 for i in range(n + 1)])
lake = others & keep[lab]
land = ~ocean & ~lake
ll, k = nd.label(land)
s = nd.sum(land, ll, range(k + 1))
near = np.zeros_like(land); M = 50; near[:M] = near[-M:] = True; near[:, :M] = near[:, -M:] = True
nearc = nd.sum(near & land, ll, range(k + 1))
okc = (s >= 25) & (nearc < .3 * s); okc[0] = False
land = okc[ll]
land = nd.binary_closing(land, iterations=1) | land
ocean = ~land & ~lake
snow = (lum > 165) & (sat < .22)
rock = (sat < .42) & (lum > 70) & (lum < 175) & ~snow & (yy < 360) & (G < R - 4)
red = (G / np.maximum(R, 1) < .70) & (R > 70)
sand = (R > 160) & (G / np.maximum(R, 1) >= .70) & (B < 140) & ((yy > 330) | (xx > 900))
greenish = (G >= R - 4) & ~snow
marsh = greenish & (sat < .47) & (lum < 75)
forest = greenish & (lum < 62) & ~marsh
dunes = red & (yy > 790) & (xx < 1180)
mesa = red & ~dunes
def g(a, s): return nd.gaussian_filter(a.astype(float), s)
landf = land.astype(float)
f = dict(
  mountain=np.clip(g(snow | rock, 5) * 1.5, 0, 1) * (yy < 380),
  cold=np.clip(g(snow, 7) * 1.6, 0, 1),
  forest=np.clip(g(forest & land, 5) * 1.8, 0, 1),
  marsh=np.clip((g(marsh & land & (yy > 560) & (xx < 640), 16) - .12) * 4, 0, 1) * land,
  desert=np.clip(g((sand | red) & land, 6) * 1.5, 0, 1),
  mesa=np.clip(g(mesa & land, 6) * 1.6, 0, 1),
  dunes=np.clip(g(dunes & land, 6) * 1.6, 0, 1),
)
S = 6       # blocks per image pixel (MAP_SCALE in index.html)
din = nd.distance_transform_edt(~ocean); dout = nd.distance_transform_edt(ocean)
coast = (din - dout) * S                      # blocks, + on land (lakes count as land)
lin = nd.distance_transform_edt(lake); lout = nd.distance_transform_edt(~lake)
lakeD = (lout - lin) * S                      # blocks, - inside lakes
D = 4       # one grid cell = D image pixels
def down(a): return a[:Hh//D*D, :Ww//D*D].reshape(Hh//D, D, Ww//D, D).mean((1, 3))
gh, gw = Hh // D, Ww // D
chans = [np.clip(down(coast) / 8 + 128, 0, 255), np.clip(down(lakeD) / 4 + 128, 0, 255)] + [down(v) * 255 for v in f.values()]
raw = bytearray()
for c in chans:
    c = np.rint(c).astype(np.int16)
    d = np.diff(c, axis=1, prepend=0) & 255          # delta along rows
    raw += d.astype(np.uint8).tobytes()
comp = zlib.compress(bytes(raw), 9)
b64 = base64.b64encode(comp).decode()
meta = dict(w=gw, h=gh, cell=D * S, chans=['coast', 'lake'] + list(f))
page = open('index.html').read()
blk = '<script type="text/plain" id="mapData" data-grid=\'%s\'>\n%s\n</script>\n' % (json.dumps(meta, separators=(',', ':')), b64)
i = page.index('<script type="text/plain" id="mapData"'); j = page.index('</script>\n', i) + len('</script>\n')
open('index.html', 'w').write(page[:i] + blk + page[j:])
print('wrote %d x %d grid, %d KB of map data' % (gw, gh, len(b64) // 1024))
viz = np.zeros((Hh, Ww, 3)); viz[ocean] = (20, 40, 120); viz[lake] = (40, 90, 200)
base = np.array([140, 170, 60.]); L = land[..., None]
col = base
for k_, c_ in [('forest', (20, 100, 20)), ('marsh', (90, 100, 70)), ('desert', (225, 195, 110)), ('mesa', (180, 80, 40)), ('dunes', (210, 110, 50)), ('mountain', (120, 120, 120)), ('cold', (250, 250, 250))]:
    a = f[k_][..., None]; col = col * (1 - a) + np.array(c_) * a
viz = np.where(L, col, viz)
Image.fromarray(viz.astype(np.uint8)).save('map/fields.png')
print('land %.1f km2, world %d x %d blocks' % (land.sum() * S * S / 1e6, Ww * S, Hh * S))
