#!/usr/bin/env python3
"""Build the standalone single-file shareable version of the Peri Protocol app.

- Reads structured content JSON
- Compresses book images to width<=760 JPEG thumbnails, embeds as base64
- Injects everything into scripts/standalone_template.html
- Output: /home/z/my-project/download/Peri-Protocol-Companion.html
"""
import base64
import io
import json
import os
import sys

from PIL import Image

ROOT = '/home/z/my-project'
CONTENT_PATH = os.path.join(ROOT, 'scripts', 'content.json')
IMG_DIR = os.path.join(ROOT, 'public', 'book')
TEMPLATE_PATH = os.path.join(ROOT, 'scripts', 'standalone_template.html')
OUT_PATH = os.path.join(ROOT, 'download', 'Peri-Protocol-Companion.html')

MAX_W = 760
QUALITY = 62


def image_data_uri(path: str) -> str:
    img = Image.open(path)
    if img.mode not in ('RGB', 'L'):
        img = img.convert('RGB')
    if img.width > MAX_W:
        h = round(img.height * MAX_W / img.width)
        img = img.resize((MAX_W, h), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
    b64 = base64.b64encode(buf.getvalue()).decode('ascii')
    return 'data:image/jpeg;base64,' + b64


def rewrite_images(node, uris):
    """Recursively replace image block srcs with data URIs."""
    if isinstance(node, dict):
        if node.get('type') == 'image':
            name = node.get('src', '').split('/')[-1]
            if name in uris:
                node['src'] = uris[name]
        for v in node.values():
            rewrite_images(v, uris)
    elif isinstance(node, list):
        for v in node:
            rewrite_images(v, uris)


def main():
    with open(CONTENT_PATH) as f:
        content = json.load(f)

    # compress images
    uris = {}
    total = 0
    for name in sorted(os.listdir(IMG_DIR)):
        p = os.path.join(IMG_DIR, name)
        uri = image_data_uri(p)
        uris[name] = uri
        total += len(uri)
    print(f'images: {len(uris)} compressed, {total/1024:.0f} KB of base64')

    rewrite_images(content, uris)

    payload = json.dumps(content, ensure_ascii=False, separators=(',', ':'))
    # guard against accidental </script> termination inside embedded JSON
    payload = payload.replace('</', '<\\/')

    with open(TEMPLATE_PATH, encoding='utf-8') as f:
        template = f.read()

    if '@@CONTENT@@' not in template:
        print('ERROR: template placeholder missing', file=sys.stderr)
        sys.exit(1)
    html = template.replace('@@CONTENT@@', payload)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write(html)
    size = os.path.getsize(OUT_PATH)
    print(f'written: {OUT_PATH} ({size/1024/1024:.2f} MB)')


if __name__ == '__main__':
    main()
