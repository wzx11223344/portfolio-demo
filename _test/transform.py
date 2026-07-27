#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Inject REAL GitHub metadata (stars/forks/lang/updated) + data-driven thumbnails
into the portfolio open-source project cards. Also fixes 3 broken repo links
(macrohub->macrodatahub, citycompare->city-compare, causal-ml->causal-inference-ml)
and real-content-ifies the root index.html.
"""
import re, os, json, io, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POS = os.path.join(ROOT, "positions")

# Real data pulled from `gh api users/wzx11223344/repos` (2026-07-27).
# slug: (stars, forks, language, last_push_YYYYMM)
REAL = {
    "pyconometrics":       (0, 0, "Python", "2026-06"),
    "quantlab":            (0, 0, "Python", "2026-07"),
    "dsgepy":              (0, 0, "Python", "2026-06"),
    "macrodatahub":        (0, 0, "Python", "2026-06"),
    "policysim":           (0, 0, "Python", "2026-06"),
    "city-compare":        (0, 0, "Python", "2026-07"),
    "express-consumption": (0, 0, "Python", "2026-06"),
    "causal-inference-ml": (1, 0, "Python", "2026-06"),
    "mcp-financial-data":  (0, 0, "Python", "2026-07"),
}
# Display name used in cards -> real repo slug
DISPLAY_TO_SLUG = {
    "macrohub": "macrodatahub",
    "citycompare": "city-compare",
    "causal-ml": "causal-inference-ml",
}
LANG_COLOR = {"Python": "#3776AB", "Jupyter Notebook": "#DA5B0B", "TeX": "#3D6117"}

CARD_RE = re.compile(
    r'<div class="proj-card" data-tilt>\s*'
    r'<div class="proj-top"><span class="proj-name">(.*?)</span>'
    r'<span class="proj-tag">(.*?)</span></div>\s*'
    r'<div class="proj-desc">(.*?)</div>\s*'
    r'<div class="proj-meta"><a href="(.*?)" target="_blank">(.*?)</a>'
    r'<span>(.*?)</span></div>\s*</div>', re.S)


def mono(slug):
    return slug.replace("-", "")[:2].upper()


def build_meta(slug):
    stars, forks, lang, ym = REAL[slug]
    return (f'<a href="https://github.com/wzx11223344/{slug}" target="_blank">↗ 源码</a>'
            f'<span>· {lang}</span>'
            f'<span class="repo-stat"><b>★ {stars}</b><span class="dot"></span>'
            f'<b>⑂ {forks}</b><span class="dot"></span>更新 {ym}</span>')


def build_thumb(slug):
    stars, forks, lang, ym = REAL[slug]
    color = LANG_COLOR.get(lang, "#3776AB")
    return (f'<div class="proj-thumb" style="--rc:{color}">'
            f'<span class="pt-mono">{mono(slug)}</span>'
            f'<span class="pt-name">{slug}</span>'
            f'<span class="pt-lang">{lang}</span></div>')


def transform_card(m):
    name = m.group(1)
    tag = m.group(2)
    desc = m.group(3)
    url = m.group(4)
    if "github.com/wzx11223344/" not in url:
        return m.group(0)  # not a repo card (e.g. B站) -> leave unchanged
    slug = DISPLAY_TO_SLUG.get(name, name)
    if slug not in REAL:
        slug = name  # fallback: keep as-is if unknown
    thumb = build_thumb(slug)
    meta = build_meta(slug)
    return (f'<div class="proj-card" data-tilt>\n      {thumb}\n'
            f'      <div class="proj-top"><span class="proj-name">{slug}</span>'
            f'<span class="proj-tag">{tag}</span></div>\n'
            f'      <div class="proj-desc">{desc}</div>\n'
            f'      <div class="proj-meta">{meta}</div>\n    </div>')


def process_positions():
    counts = {}
    for fn in ["index.html", "internet.html", "bank.html", "state.html",
               "hr.html", "finance.html", "general.html"]:
        p = os.path.join(POS, fn)
        if not os.path.exists(p):
            continue
        html = open(p, encoding="utf-8").read()
        new, n = CARD_RE.subn(transform_card, html)
        open(p, "w", encoding="utf-8").write(new)
        counts[fn] = n
    return counts


# ---------- ROOT index.html real-contentification ----------
def build_opensource_section():
    cards_spec = [
        ("pyconometrics",       "计量经济", "从零实现的计量经济学库：OLS / IV / DID / RDD 等因果识别方法与诊断，纯 Python 依赖。"),
        ("quantlab",            "量化金融", "量化工具箱：BS 期权定价、Greeks 风险度量、回测框架与组合分析，覆盖金融工程基础能力。"),
        ("dsgepy",              "宏观建模", "一般均衡建模工具：RBC / NK / B-K 等 DSGE 模型的求解与脉冲响应分析。"),
        ("macrodatahub",        "宏观数据", "宏观经济数据平台：对接 WB / FRED / 国家统计局等多源数据，统一接口与清洗流程。"),
        ("policysim",           "政策模拟", "政策模拟框架：ABM / DID / SC 多方法对比，支持产业政策与冲击的情景推演。"),
        ("city-compare",        "城市分析", "城市对标分析：50 城 8 维指标聚类与可视化，用于区域与产业比较研究。"),
        ("express-consumption", "实证研究", "正大杯全国大赛 1,352 份问卷计量建模可复现代码（LPM / Logistic / 回归），完整数据处理 pipeline。"),
        ("causal-inference-ml", "因果推断", "因果机器学习方法：Double ML / Causal Forest，衔接计量经济学与现代 ML 估计。"),
        ("mcp-financial-data",  "AI 工程",  "金融数据 MCP 服务器：把行情、财报、宏观等数据能力封装为 Agent 可调用的标准接口。"),
    ]
    cards_html = []
    for slug, tag, desc in cards_spec:
        thumb = build_thumb(slug)
        meta = build_meta(slug)
        cards_html.append(
            f'    <div class="proj-card" data-tilt>\n      {thumb}\n'
            f'      <div class="proj-top"><span class="proj-name">{slug}</span>'
            f'<span class="proj-tag">{tag}</span></div>\n'
            f'      <div class="proj-desc">{desc}</div>\n'
            f'      <div class="proj-meta">{meta}</div>\n    </div>')
    cards = "\n".join(cards_html)
    return (
        '\n<!-- ==================== OPEN SOURCE ==================== -->\n'
        '<section id="opensource" class="reveal">\n'
        '  <div class="section-title"><span class="section-index">&#9733;</span>'
        '<h2>开源<span class="hl">精选</span></h2></div>\n'
        '  <div class="section-subtitle">// 真实 GitHub 数据：★ star · ⑂ fork · 最近更新 — 全部从零实现，纯 Python 依赖</div>\n'
        '  <div class="proj-grid">\n'
        f'{cards}\n'
        '  </div>\n'
        '</section>\n')


def process_index():
    p = os.path.join(ROOT, "index.html")
    html = open(p, encoding="utf-8").read()
    rep = 0

    # 1) hero subtitle (static)
    old = ('<div class="hero-subtitle" id="typewriter">'
           '经济学本科(前30%) · 101个开源项目 · 15台MCP服务器 · 人工智能与量化计算</div>')
    new = ('<div class="hero-subtitle" id="typewriter">'
           '华东师范大学 · 经济学 2027 届 · 计量经济学与量化金融的从零实现开源实践</div>')
    if old in html:
        html = html.replace(old, new); rep += 1

    # 2) hero tags
    old = ('<span>TRAE插件生态</span><span>MCP架构</span><span>全栈工程</span>'
           '<span>量化金融</span><span>计算机图形学</span><span>高性能计算</span>')
    new = ('<span>计量经济学</span><span>量化金融</span><span>Python</span>'
           '<span>从零实现</span><span>GitHub 开源</span><span>经济学本科</span>')
    if old in html:
        html = html.replace(old, new); rep += 1

    # 3) KPI grid
    old = '''<div class="kpi-grid">
<div class="kpi-card"><div class="kpi-num" data-target="101">0</div><div class="kpi-label">代码仓库</div></div>
<div class="kpi-card"><div class="kpi-num" data-target="15">0</div><div class="kpi-label">MCP 服务</div></div>
<div class="kpi-card"><div class="kpi-num" data-target="370">0</div><div class="kpi-label">工具集成</div></div>
<div class="kpi-card"><div class="kpi-num" data-target="115000">0</div><div class="kpi-label">代码行数</div></div>
<div class="kpi-card"><div class="kpi-num" data-target="58">0</div><div class="kpi-label">技能模块</div></div>
</div>'''
    new = '''<div class="kpi-grid">
<div class="kpi-card"><div class="kpi-num" data-target="30">0</div><div class="kpi-label">开源库（计量·量化）</div></div>
<div class="kpi-card"><div class="kpi-num" data-target="9">0</div><div class="kpi-label">核心开源项目</div></div>
<div class="kpi-card"><div class="kpi-num" data-target="100">0</div><div class="kpi-label">GitHub 仓库</div></div>
<div class="kpi-card"><div class="kpi-num" data-count="6507000" data-suffix="万">0</div><div class="kpi-label">B站累计播放量</div></div>
<div class="kpi-card"><div class="kpi-num" data-target="1352">0</div><div class="kpi-label">实证问卷样本</div></div>
</div>'''
    if old in html:
        html = html.replace(old, new); rep += 1

    # 4) typewriter texts (JS array)
    old = ("const texts=['不套壳、不调API凑数、每个算法从零实现',\n"
           "    '101个开源项目 · 15台MCP服务器 · ~370个工具接口',\n"
           "    '计量经济学到量化金融 · 从NLP到光线追踪引擎',\n"
           "    '经济学本科(前30%) · 基金从业+银行从业双证持有'];\n")
    new = ("const texts=['不套壳、不调API凑数，每个算法从零实现',\n"
           "    '经济学本科 · 计量与量化金融开源实践',\n"
           "    '正大杯 1,352 样本 · 上证杯 36% 净值增长',\n"
           "    '国盛证券 / 经信委 / 联通 真实实习经历'];\n")
    if old in html:
        html = html.replace(old, new); rep += 1

    # 5) disclaimer note under hero
    if '<div class="kpi-grid">' in html and 'hero-note' not in html:
        html = html.replace(
            '<div class="kpi-grid">',
            '<p class="hero-note">下方为从零实现的工程能力演示（光线追踪 / 蒙特卡洛 / 期权定价 / 算法可视化），用于展示编码与数学功底，<b>非岗位经历</b>；真实实习与项目见各岗位作品集。</p>\n<div class="kpi-grid">',
            1)
        rep += 1

    # 6) nav: add 开源 link (skip if already present to avoid duplicates)
    old = '<a href="positions/index.html">岗位作品集 →</a>'
    new = '<a href="#opensource">开源</a><a href="positions/index.html">岗位作品集 →</a>'
    if old in html and '#opensource' not in html:
        html = html.replace(old, new, 1); rep += 1

    # 7) timeline overclaims
    old = '''<div class="timeline" style="margin-top:40px">
<div class="timeline-item"><div class="timeline-date">2026 Q2-现在</div><div class="timeline-title">MCP与效率技能生态</div><div class="timeline-desc">15台MCP服务器，~370工具接口。12项效率技能(17,138行)，24+核心算法从零实现。SkillHub发布58个技能。</div></div>
<div class="timeline-item"><div class="timeline-date">2025</div><div class="timeline-title">MCP基础设施搭建</div><div class="timeline-desc">首批8台MCP服务器上线：金融数据、量化引擎、文档分析、数据库助手、数据可视化、机器学习、统计引擎、网页抓取，共208个工具接口。</div></div>
<div class="timeline-item"><div class="timeline-date">2024 Q1-Q3</div><div class="timeline-title">量化金融与智能体系统</div><div class="timeline-desc">投资组合优化、回测引擎、因子挖掘、衍生品定价 + 多Agent交易模拟、RL交易</div></div>
<div class="timeline-item"><div class="timeline-date">2024 起步</div><div class="timeline-title">101个项目起航</div><div class="timeline-desc">14个计量经济学库：bayesmetrics、causalinference、dsgepy、spatialecon等。核心理念：每个算法亲手从零实现</div></div>
</div>'''
    new = '''<div class="timeline" style="margin-top:40px">
<div class="timeline-item"><div class="timeline-date">2026</div><div class="timeline-title">计量与量化开源深化</div><div class="timeline-desc">30+ 计量 / 量化库从零实现，覆盖 OLS / IV / DID / DSGE / 期权定价 / Greeks 等，全部纯 Python 依赖，已上线 GitHub。</div></div>
<div class="timeline-item"><div class="timeline-date">2025</div><div class="timeline-title">量化与金融工程实践</div><div class="timeline-desc">国盛证券行业研究、门店风险监测；上证杯 92.5% 正确率、36% 净值增长，沉淀回测与定价代码。</div></div>
<div class="timeline-item"><div class="timeline-date">2024</div><div class="timeline-title">竞赛与科研起步</div><div class="timeline-desc">正大杯全国大赛 1,352 份问卷计量建模（Logistic p&lt;0.001）；数学建模省二等，建立可复现研究流程。</div></div>
<div class="timeline-item"><div class="timeline-date">2023 起步</div><div class="timeline-title">经济学与编程启蒙</div><div class="timeline-desc">Python 计量经济学工具库从零构建，核心理念：每个算法亲手实现，拒绝调包凑数。</div></div>
</div>'''
    if old in html:
        html = html.replace(old, new); rep += 1

    # 8) inject 开源 section before footer
    if '<footer' in html and 'id="opensource"' not in html:
        html = html.replace('<footer', build_opensource_section() + '\n<footer', 1)
        rep += 1

    # 9) hero-note CSS
    if '.hero-note{' not in html:
        css = ('.hero-note{margin:18px auto 0;max-width:780px;font-size:12.5px;'
               'color:var(--text-dim);font-family:var(--font-mono);line-height:1.7;text-align:center}\n'
               '.hero-note b{color:var(--neon-green)}\n')
        html = html.replace('/* ============ KPI CARDS ============ */',
                            css + '/* ============ KPI CARDS ============ */')
        rep += 1

    open(p, "w", encoding="utf-8").write(html)
    return rep


if __name__ == "__main__":
    c = process_positions()
    print("positions cards transformed:", c)
    r = process_index()
    print("index.html replacements:", r)
    print("OK")
