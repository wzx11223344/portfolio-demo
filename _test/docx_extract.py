import zipfile, re, os

def extract_docx(path):
    out = []
    with zipfile.ZipFile(path) as z:
        xml = z.read('word/document.xml').decode('utf-8', 'ignore')
    paras = re.split(r'</w:p>', xml)
    for p in paras:
        texts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', p, re.S)
        line = ''.join(texts)
        line = re.sub(r'<[^>]+>', '', line)
        if line.strip():
            out.append(line.strip())
    return '\n'.join(out)

base = "E:/微信/xwechat_files/wxid_lp9ezul6ao5w22_14de/msg/file/2026-07/"
targets = [
    "个人简历-万值翔.docx",
    "个人简历-通用版-瀑布屏版.docx",
    "个人简历-银行岗-瀑布屏版.docx",
    "个人简历-国企政府版-瀑布屏版.docx",
    "个人简历-互联网内容数据运营岗-瀑布屏版.docx",
    "个人简历-私企版-瀑布屏版.docx",
]
for t in targets:
    p = base + t
    if not os.path.exists(p):
        print(f"\n##### MISSING: {t}\n")
        continue
    print(f"\n##### {t}\n")
    print(extract_docx(p))
