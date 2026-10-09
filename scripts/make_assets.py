#!/usr/bin/env python3
"""Generate the Open Nshipyard favicon set: burnt-orange rounded square, white N.
Matches the family style. Also builds the OG social card (1200x630)."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")
ORANGE = (213, 99, 51)  # family orange sampled from sibling favicon
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def rounded_square(size, radius_ratio=0.22):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=ORANGE + (255,))
    return im

def draw_n(im):
    size = im.size[0]
    d = ImageDraw.Draw(im)
    fs = int(size * 0.62)
    font = ImageFont.truetype(FONT, fs)
    bb = d.textbbox((0, 0), "N", font=font)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.text(((size - w) / 2 - bb[0], (size - h) / 2 - bb[1] - size * 0.02),
           "N", font=font, fill=(255, 255, 255, 255))
    return im

for name, size in [("favicon-16x16.png", 16), ("favicon-32x32.png", 32), ("apple-touch-icon.png", 180)]:
    draw_n(rounded_square(size)).save(os.path.join(OUT, name))
    print("wrote", name)

# favicon.ico with 16/32/48
base = draw_n(rounded_square(48))
base.save(os.path.join(OUT, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
print("wrote favicon.ico")

# OG card: paper background, red accents, headline figures
W, H = 1200, 630
og = Image.new("RGB", (W, H), (255, 255, 255))
d = ImageDraw.Draw(og)
RED = (216, 6, 33)
INK = (10, 15, 30)
d.rectangle([0, 0, W, 14], fill=RED)
f_title = ImageFont.truetype(FONT, 72)
f_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 34)
f_kick = ImageFont.truetype(FONT, 26)
f_fig = ImageFont.truetype(FONT, 88)
d.text((70, 70), "OPEN NSHIPYARD", font=f_kick, fill=(120, 120, 120))
d.text((70, 110), "The Montreal Premium", font=f_title, fill=INK)
d.text((70, 210), "What the same GPU costs in Canada vs the US", font=f_sub, fill=(80, 80, 80))
# headline figures
d.text((70, 320), "+23.1%", font=f_fig, fill=RED)
d.text((70, 420), "Azure H100 80GB /hr, Canada Central vs East US", font=f_sub, fill=(80, 80, 80))
d.text((70, 480), "+11.0%", font=f_fig, fill=RED)
d.text((70, 580 - 20), "AWS A10G /hr, Canada Central vs US East", font=f_sub, fill=(80, 80, 80))
d.text((70, 596 - 40), "Snapshot Oct 9, 2026 · gpu.canada.nshipyard.com", font=f_kick, fill=(150, 150, 150))
og.save(os.path.join(OUT, "og-card.png"))
print("wrote og-card.png")
