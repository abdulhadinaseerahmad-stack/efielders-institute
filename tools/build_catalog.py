"""Build the Seller Program product catalogue from a Nova Bazaar export.

Usage:
    python3 -I tools/build_catalog.py "<path to 'Nova Bazaar Leather' folder>" <site root> [--reuse-images]

--reuse-images keeps image files that already exist in <site root> (fast rebuild of the data only).

Reads every <Main>/<Sub>/<SKU - title>/product-data.json (+ images/) in the export and writes:
    members/data/catalog.php             product data, served to members by members/api.php
    assets/img/catalog/t/<SKU>.webp      480px card image
    assets/img/catalog/l/<SKU>-<n>.webp  1100px quick-view images (up to 4)
    assets/img/catalog/charts/<id>.webp  size charts shared between products
"""
import glob
import hashlib
import json
import os
import re
import sys
from collections import Counter

from PIL import Image, ImageOps

THUMB_PX, LARGE_PX, CHART_PX, GALLERY_MAX = 480, 1100, 1400, 4
# products visitors can see before logging in
PREVIEW_COUNT = 8
# first line of private data files, see members/lib.php
GUARD_LINE = "<?php http_response_code(404); exit; ?>\n"
# images shared by this many products are size charts, not product photos
SHARED_IMAGE_LIMIT = 3
# added to every supplier price before it is shown on the site
PRICE_MARKUP_PKR = 2000

# categories whose export has no size chart borrow the chart of a similar category
CHART_FROM_CATEGORY = {"Leather Pants": "Hair On Pants", "Hair On Shorts": "Hair On Pants"}

# display order on the page (main category -> sub categories)
CATEGORY_ORDER = {
    "Leather": ["Leather Jackets", "Leather Vests", "Leather Coats", "Leather Pants", "Leather Chaps",
                "Suede Chaps", "Leather Belts", "Leather Top Hat", "Dog Collars & Harnesses"],
    "Cowhide Hair On Leather": ["Hair On Jackets", "Hair On Vest", "Hair On Coats", "Hair On Pants",
                                "Hair On Shorts", "Hair On Chaps", "Hair On Belts", "Hair On Bags",
                                "Hair On Rugs", "Hair On Cushion Cover", "Cowhide Hair On Leather"],
    "Corset": ["Leather Corset"],
}

# character / trademark names must not appear in titles shown on the site
NAME_FIXES = [
    (r"\bMad Hatter Willy Wonka Costume\b", "Costume"),
    (r"\bWilly Wonka Mad Hatter Costume\b", "Costume"),
    (r"\bClassic Mad Hatter Hat\b", "Classic Costume Top Hat"),
    (r"\bSteampunk Mad Hatter Hat\b", "Steampunk Top Hat"),
    (r"\bMad Hatter Cosplay\b", "Cosplay"),
    (r"\b(Willy Wonka|Mad Hatter)\b", ""),
]
DETAIL_SKIP_KEYS = {"product type", "suitable for", "care", "available sizes"}


def clean_name(name):
    for pattern, repl in NAME_FIXES:
        name = re.sub(pattern, repl, name, flags=re.I)
    name = re.sub(r"\s{2,}", " ", name)
    name = re.sub(r"\s+,", ",", name)
    return name.strip(" ,|-–")


def details_from(dimensions):
    """'Colour: Red | Closure: Zip | ...' -> [['Colour', 'Red'], ...] (max 5, no placeholders)."""
    out = []
    for part in (dimensions or "").split("|"):
        part = part.strip()
        if not part or "confirmation required" in part.lower():
            continue
        key, sep, val = part.partition(":")
        if sep and key.strip().lower() in DETAIL_SKIP_KEYS:
            continue
        out.append([key.strip(), val.strip()[:140]] if sep else ["", part[:140]])
        if len(out) == 5:
            break
    return out


def sizes_from(options):
    for opt in options or []:
        if "size" in (opt.get("label") or "").lower() and opt.get("values"):
            return ", ".join(opt["values"])
    return ""


def save_webp(src, dest, px, reuse=False):
    if reuse and os.path.exists(dest):
        return
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if "transparency" in im.info else "RGB")
        if im.mode == "RGBA":  # flatten onto white so cards stay clean
            bg = Image.new("RGB", im.size, "white")
            bg.paste(im, mask=im.split()[3])
            im = bg
        im.thumbnail((px, px), Image.LANCZOS)
        im.save(dest, "WEBP", quality=80, method=6)


def main(src_root, site_root, reuse=False):
    products = []
    for path in glob.glob(glob.escape(src_root) + "/**/product-data.json", recursive=True):
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        imgs = sorted(f for f in glob.glob(glob.escape(os.path.dirname(path)) + "/images/*")
                      if f.lower().endswith((".webp", ".jpg", ".jpeg", ".png", ".jfif")))
        products.append((data, imgs))

    digest = {}
    for _, imgs in products:
        for f in imgs:
            with open(f, "rb") as fh:
                digest[f] = hashlib.md5(fh.read()).hexdigest()
    shared = Counter(digest.values())

    thumb_dir = os.path.join(site_root, "assets/img/catalog/t")
    large_dir = os.path.join(site_root, "assets/img/catalog/l")
    chart_dir = os.path.join(site_root, "assets/img/catalog/charts")
    for d in (thumb_dir, large_dir, chart_dir):
        os.makedirs(d, exist_ok=True)

    # size charts: each product's own chart, else the most common chart of its category
    own_chart, chart_src = {}, {}
    for data, imgs in products:
        for f in imgs:
            if shared[digest[f]] >= SHARED_IMAGE_LIMIT:
                cid = digest[f][:8]
                chart_src.setdefault(cid, f)
                own_chart.setdefault(data["listing_sku"], cid)
    by_category = {}
    for data, _ in products:
        cid = own_chart.get(data["listing_sku"])
        if cid:
            by_category.setdefault(data["sub_category"], Counter())[cid] += 1
    category_chart = {c: n.most_common(1)[0][0] for c, n in by_category.items()}
    for cat, donor in CHART_FROM_CATEGORY.items():
        category_chart.setdefault(cat, category_chart.get(donor))
    for cid, f in chart_src.items():
        save_webp(f, os.path.join(chart_dir, cid + ".webp"), CHART_PX, reuse)

    sub_rank = {sub: (mi, si) for mi, (main_cat, subs) in enumerate(CATEGORY_ORDER.items())
                for si, sub in enumerate(subs)}
    out = []
    for data, imgs in products:
        sku = data["listing_sku"]
        if not re.fullmatch(r"NB-\d+", sku or ""):
            raise SystemExit("unexpected SKU: %r" % sku)
        photos = [f for f in imgs if shared[digest[f]] < SHARED_IMAGE_LIMIT] or imgs[:1]
        gallery = photos[:GALLERY_MAX]
        save_webp(gallery[0], os.path.join(thumb_dir, sku + ".webp"), THUMB_PX, reuse)
        for n, f in enumerate(gallery, 1):
            save_webp(f, os.path.join(large_dir, "%s-%d.webp" % (sku, n)), LARGE_PX, reuse)
        sub = data["sub_category"]
        if sub not in sub_rank:
            raise SystemExit("category missing from CATEGORY_ORDER: %r" % sub)
        price = data.get("price_from")
        item = {
            "s": sku,
            "n": clean_name(data["name"]),
            "m": data["main_category"],
            "c": sub,
            "g": len(gallery),
            "mat": (data.get("material") or "")[:160],
            "sz": sizes_from(data.get("options")),
            "ht": data.get("handling_time") or "",
            "st": data.get("shipping_time") or "",
            "d": details_from(data.get("dimensions")),
        }
        if price:
            item["p"] = int(round(price)) + PRICE_MARKUP_PKR
        chart = own_chart.get(sku) or category_chart.get(sub)
        if chart:
            item["ch"] = chart
        out.append(item)

    # category order first, newest SKU first inside each category
    out.sort(key=lambda p: (sub_rank[p["c"]], -int(p["s"][3:])))
    # preview: the newest product of each category in turn, so visitors see the range
    by_cat = {}
    for p in out:
        by_cat.setdefault(p["c"], []).append(p["s"])
    preview, row = [], 0
    while len(preview) < PREVIEW_COUNT and any(len(skus) > row for skus in by_cat.values()):
        preview += [skus[row] for skus in by_cat.values() if len(skus) > row]
        row += 1
    data_dir = os.path.join(site_root, "members/data")
    os.makedirs(data_dir, exist_ok=True)
    catalog = {"order": CATEGORY_ORDER, "preview": preview[:PREVIEW_COUNT], "products": out}
    with open(os.path.join(data_dir, "catalog.php"), "w", encoding="utf-8") as fh:
        fh.write(GUARD_LINE)
        json.dump(catalog, fh, ensure_ascii=False, separators=(",", ":"))
    print("%d products, %d categories, %d size charts, %d products with a chart, %d with a price" % (
        len(out), len({p["c"] for p in out}), len(chart_src),
        sum(1 for p in out if "ch" in p), sum(1 for p in out if "p" in p)))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], reuse="--reuse-images" in sys.argv[3:])
