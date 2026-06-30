# -*- coding: utf-8 -*-
"""
build_certificat.py — Générateur du certificat de cession premium TransakAuto.

Produit, à partir de certificat_data.py :
  • certificat-cession-transakauto.pdf            (interactif / AcroForm)
  • certificat-cession-transakauto-impression.pdf (impression, à remplir à la main)
  • certificat-cession-transakauto-mobile.pdf      (interactif, validé mobile)

Usage :
  python build_certificat.py                 # construit tous les PDF + PNG d'aperçu
  python build_certificat.py --no-png        # PDF seulement
  python build_certificat.py --nomenclature  # imprime la nomenclature des champs

Dépendances : reportlab, pymupdf (rendu PNG), pypdf (NeedAppearances + ordre TAB).
Police : Montserrat (embarquée), dossier fonts/. Saisie des champs : Helvetica.
"""
import argparse, os, re, shutil, sys

from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, Color, black, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

import certificat_data as D

HERE = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(HERE, "out")

# ───────────────────────────── POLICES ──────────────────────────────────────
FONT_LIGHT, FONT_REG, FONT_MED, FONT_SEMI, FONT_BOLD = (
    "Montserrat-Light", "Montserrat-Regular", "Montserrat-Medium",
    "Montserrat-SemiBold", "Montserrat-Bold")
_FONT_FILES = {
    FONT_LIGHT: "Montserrat-Light.ttf", FONT_REG: "Montserrat-Regular.ttf",
    FONT_MED: "Montserrat-Medium.ttf", FONT_SEMI: "Montserrat-SemiBold.ttf",
    FONT_BOLD: "Montserrat-Bold.ttf"}

def register_fonts():
    for name, fn in _FONT_FILES.items():
        pdfmetrics.registerFont(TTFont(name, os.path.join(HERE, "fonts", fn)))

# ───────────────────────────── PALETTE ──────────────────────────────────────
MAGENTA      = HexColor(D.BRAND["magenta"])
MAGENTA_DARK = HexColor(D.BRAND["magenta_dark"])
BLACK        = HexColor(D.BRAND["black"])
INK          = HexColor(D.BRAND["ink"])
COL_LABEL    = HexColor(0x77777F)      # libellés gris
COL_BODY     = HexColor(0x33323A)      # texte juridique
COL_INPUT    = HexColor(0x16151B)      # saisie utilisateur
FIELD_FILL   = HexColor(0xECEDF1)      # champ gris très clair (écran)
FIELD_BORDER = HexColor(0xD3D5DD)      # filet de champ
HAIRLINE     = HexColor(0xE6E6EB)      # filets de section
PANEL_FILL   = HexColor(0xFCEAF3)      # panneau prix : rose très clair
PANEL_BORDER = HexColor(0xF4CFE3)
FOOTER_COL   = HexColor(0x8A8A92)
MASTHEAD_COL = HexColor(0xEDEDF2)      # texte clair sur bandeau noir

# ───────────────────────────── GÉOMÉTRIE (mm, origine en haut) ───────────────
PAGE_W, PAGE_H = 210.0, 297.0
MARGIN = 18.0
CX, CW = MARGIN, PAGE_W - 2 * MARGIN          # x et largeur de contenu (18 ; 174)
GUTTER = 8.0
COLW = (CW - GUTTER) / 2                        # 83
XL, XR = CX, CX + COLW + GUTTER                 # 18 ; 109

BAND_H   = 23.0
FILET_H  = 1.4
TITLE_BASE  = 33.5
PARTIE_BASE = 39.8
CONTENT_TOP = 45.5
FOOTER_RULE = 285.0
USABLE_BOTTOM = 283.0

LBL_SIZE, LBL_TRACK = 6.4, 0.11
LBL_BLOCK = 2.9
FIELD_H   = 5.9
ROW_GAP   = 1.4
FIELD_R   = 1.3
ROW_H     = LBL_BLOCK + FIELD_H + ROW_GAP
SEC_GAP   = 1.8
SEC_HEAD  = 6.0

INLINE_W = {"prix_chiffres": 28.0, "prix_lettres": 58.0, "vendeur_iban": 62.0}

PAGE_H_PT = PAGE_H * mm


class Cert:
    def __init__(self, variant):
        self.variant = variant
        self.interactive = variant in ("interactive", "mobile")
        self.path = os.path.join(OUT, f"certificat-cession-transakauto-{variant}.pdf")
        self.c = canvas.Canvas(self.path, pagesize=(PAGE_W * mm, PAGE_H * mm))
        self.c.setTitle("Certificat de cession — TransakAuto Bruxelles")
        self.c.setAuthor("TransakAuto Bruxelles")
        self.c.setSubject("Vente d’un véhicule d’occasion — certificat de cession")
        self.c.setCreator("TransakAuto · build_certificat.py")
        self.y = CONTENT_TOP
        self.field_count = {"text": 0, "checkbox": 0, "sign": 0}
        self.fill_field = FIELD_FILL if self.interactive else white

    # ---- primitives ---------------------------------------------------------
    def _y(self, fromtop_pt):
        return PAGE_H_PT - fromtop_pt

    def text_w(self, s, font, size, tracking=0.0):
        w = pdfmetrics.stringWidth(s, font, size)
        if len(s) > 1:
            w += tracking * size * (len(s) - 1)
        return w

    def text(self, x_mm, base_mm, s, font, size, color, align="left", tracking=0.0):
        w = self.text_w(s, font, size, tracking)
        xpt = x_mm * mm
        if align == "center": xpt -= w / 2
        elif align == "right": xpt -= w
        to = self.c.beginText(xpt, self._y(base_mm * mm))
        to.setFont(font, size); to.setFillColor(color)
        to.setCharSpace(tracking * size); to.setWordSpace(0)   # évite la fuite d'état texte
        to.textOut(s)
        self.c.drawText(to)
        return w

    def round_box(self, x_mm, top_mm, w_mm, h_mm, fill=None, stroke=None, lw=0.5, r=FIELD_R):
        c = self.c
        lly = self._y((top_mm + h_mm) * mm)
        c.saveState()
        if fill is not None: c.setFillColor(fill)
        if stroke is not None: c.setStrokeColor(stroke); c.setLineWidth(lw)
        c.roundRect(x_mm * mm, lly, w_mm * mm, h_mm * mm, r * mm,
                    stroke=1 if stroke is not None else 0,
                    fill=1 if fill is not None else 0)
        c.restoreState()

    def hline(self, x1, top, x2, color, lw=0.5):
        c = self.c
        c.saveState(); c.setStrokeColor(color); c.setLineWidth(lw)
        c.line(x1 * mm, self._y(top * mm), x2 * mm, self._y(top * mm))
        c.restoreState()

    def vrect(self, x, top, w, h, color):
        self.round_box(x, top, w, h, fill=color, r=0.0)

    def ornament(self, y_center):
        """Filet — losange rose — filet, centré : rythme un espace généreux."""
        cxm = PAGE_W / 2.0
        half, g = 24.0, 6.0
        self.hline(cxm - half - g, y_center, cxm - g, HAIRLINE, 0.6)
        self.hline(cxm + g, y_center, cxm + half + g, HAIRLINE, 0.6)
        s = 1.35
        yc = self._y(y_center * mm)
        c = self.c
        c.saveState(); c.setFillColor(MAGENTA)
        p = c.beginPath()
        p.moveTo(cxm * mm, yc + s * mm); p.lineTo((cxm + s) * mm, yc)
        p.lineTo(cxm * mm, yc - s * mm); p.lineTo((cxm - s) * mm, yc); p.close()
        c.drawPath(p, fill=1, stroke=0); c.restoreState()

    # ---- texte multi-lignes -------------------------------------------------
    def wrap(self, text, font, size, max_w_pt, tracking=0.0):
        words, lines, cur = text.split(), [], []
        space = pdfmetrics.stringWidth(" ", font, size)
        def lw(ws):
            return sum(self.text_w(w, font, size, tracking) for w in ws) + space * (len(ws) - 1)
        for w in words:
            if cur and lw(cur + [w]) > max_w_pt:
                lines.append(" ".join(cur)); cur = [w]
            else:
                cur.append(w)
        if cur: lines.append(" ".join(cur))
        return lines or [""]

    def para(self, x_mm, top_mm, w_mm, text, font, size, color,
             leading_factor=1.45, justify=False, tracking=0.0, dry=False):
        lines = self.wrap(text, font, size, w_mm * mm, tracking)
        leading = size * leading_factor
        x0 = x_mm * mm
        first_base = top_mm * mm + size * 0.92
        c = self.c
        for i, line in enumerate([] if dry else lines):
            ybase = self._y(first_base + i * leading)
            to = c.beginText(x0, ybase); to.setFont(font, size); to.setFillColor(color)
            to.setCharSpace(tracking * size)
            nspace = line.count(" ")
            if justify and i < len(lines) - 1 and nspace > 0:
                natural = self.text_w(line, font, size, tracking)
                to.setWordSpace((w_mm * mm - natural) / nspace)
            else:
                to.setWordSpace(0)
            to.textOut(line)
            c.drawText(to)
        total = size * 0.92 + (len(lines) - 1) * leading + size * 0.32
        return top_mm + total / mm

    # ---- widgets AcroForm ---------------------------------------------------
    def _text_widget(self, name, x_mm, top_mm, w_mm, h_mm, size=10.5, maxlen=None, multiline=False):
        if not self.interactive:
            return
        flags = "multiline" if multiline else ""
        self.c.acroForm.textfield(
            name=name, x=x_mm * mm, y=self._y((top_mm + h_mm) * mm),
            width=w_mm * mm, height=h_mm * mm,
            borderWidth=0, forceBorder=False, fillColor=None, borderColor=None,
            textColor=COL_INPUT, fontName="Helvetica", fontSize=size,
            maxlen=maxlen, fieldFlags=flags, annotationFlags="print",
            tooltip=D.FIELDS.get(name, {}).get("label", name), relative=False)

    def _check_widget(self, name, x_mm, top_mm, size_mm):
        if not self.interactive:
            return
        self.c.acroForm.checkbox(
            name=name, x=x_mm * mm, y=self._y((top_mm + size_mm) * mm),
            size=size_mm * mm, checked=False, buttonStyle="check",
            borderWidth=0, forceBorder=False, fillColor=None, borderColor=None,
            textColor=MAGENTA, annotationFlags="print",
            tooltip=D.FIELDS.get(name, {}).get("label", name), relative=False)

    # ---- composants ---------------------------------------------------------
    def field(self, x_mm, top_mm, w_mm, name, label=None, h=FIELD_H,
              fill=None, border=None, size=10.5, maxlen=None):
        meta = D.FIELDS.get(name, {})
        if label is None: label = meta.get("label", "")
        if maxlen is None: maxlen = meta.get("maxlen")
        self.text(x_mm + 0.4, top_mm + 2.6, label.upper(), FONT_MED, LBL_SIZE,
                  COL_LABEL, tracking=LBL_TRACK)
        bt = top_mm + LBL_BLOCK
        self.round_box(x_mm, bt, w_mm, h, fill=fill or self.fill_field,
                       stroke=border or FIELD_BORDER, lw=0.5)
        self._text_widget(name, x_mm, bt, w_mm, h, size=size, maxlen=maxlen)
        self.field_count["text"] += 1
        return bt + h

    def section(self, top_mm, title, x=CX, w=CW, rule=True):
        size = 9.0
        self.vrect(x, top_mm + 0.2, 1.4, 4.6, MAGENTA)           # tick rose
        tw = self.text(x + 4.0, top_mm + 3.9, title.upper(), FONT_SEMI, size,
                       INK, tracking=0.12)
        rule_x = x + 4.0 + tw + 4.0
        if rule and (x + w) - rule_x >= 12.0:   # pas de moignon de filet parasite
            self.hline(rule_x, top_mm + 2.6, x + w, HAIRLINE, 0.6)
        return top_mm + SEC_HEAD

    def flow_fields(self, x_mm, top_mm, w_mm, template, font, size, color,
                    field_h=4.7, leading_factor=1.5, field_fill=None, field_border=None,
                    dry=False):
        """Texte avec champs interactifs en ligne (marqueurs ⟦nom⟧)."""
        tokens = re.split(r"(⟦[^⟧]+⟧)", template)
        atoms = []
        for tok in tokens:
            m = re.match(r"⟦([^⟧]+)⟧$", tok)
            if m:
                nm = m.group(1)
                atoms.append(("f", nm, INLINE_W.get(nm, 40.0) * mm))
            else:
                for wd in tok.split(" "):
                    if wd:
                        atoms.append(("w", wd))
        space = pdfmetrics.stringWidth(" ", font, size)
        max_w = w_mm * mm
        line_h = max(size * leading_factor, field_h * mm + 1.0 * mm)
        x0 = x_mm * mm
        cur_x, line = x0, 0
        base0 = top_mm * mm + size * 0.92
        c = self.c
        for a in atoms:
            aw = (self.text_w(a[1], font, size) if a[0] == "w" else a[2])
            if cur_x > x0 and cur_x + aw > x0 + max_w:
                line += 1; cur_x = x0
            if a[0] == "w":
                if not dry:
                    to = c.beginText(cur_x, self._y(base0 + line * line_h))
                    to.setFont(font, size); to.setFillColor(color)
                    to.setCharSpace(0); to.setWordSpace(0)
                    to.textOut(a[1]); c.drawText(to)
                cur_x += aw + space
            else:
                nm, fw = a[1], a[2]
                # caler la boîte sur la ligne de base du texte porteur (centre optique
                # ≈ baseline - 0,32·corps) pour que la saisie repose sur la même horizontale
                bl = base0 + line * line_h
                box_top_pt = (bl - 0.32 * size) - (field_h * mm) / 2.0
                box_top_mm = box_top_pt / mm
                if not dry:
                    self.round_box(cur_x / mm, box_top_mm, fw / mm, field_h,
                                   fill=field_fill or self.fill_field,
                                   stroke=field_border or FIELD_BORDER, lw=0.5, r=1.1)
                    self._text_widget(nm, cur_x / mm, box_top_mm, fw / mm, field_h, size=9.5)
                    self.field_count["text"] += 1
                cur_x += fw + space
        bottom = top_mm * mm + (line + 1) * line_h + size * 0.32
        return bottom / mm

    def checkbox_row(self, x_mm, top_mm, w_mm, name, box=5.4, fsize=9.0, gap_after=6.4):
        label = D.FIELDS[name]["label"]
        self.round_box(x_mm, top_mm, box, box, fill=self.fill_field, stroke=FIELD_BORDER, lw=0.6, r=1.1)
        self._check_widget(name, x_mm, top_mm, box)
        self.field_count["checkbox"] += 1
        tx = x_mm + box + 3.4
        tw = w_mm - box - 3.4
        lines = self.wrap(label, FONT_REG, fsize, tw * mm)
        leading = fsize * 1.3
        n = len(lines)
        block_h = (n - 1) * leading / mm + fsize * 0.72 / mm
        # centrage vertical du texte sur la case
        first_base = top_mm + box / 2.0 - (block_h / 2.0) + (fsize * 0.72) / mm
        for i, ln in enumerate(lines):
            self.text(tx, first_base + i * leading / mm, ln, FONT_REG, fsize, COL_BODY)
        return top_mm + max(box, block_h) + gap_after

    def signature_block(self, top_mm, faita_name, date_name, sv_name, sa_name,
                        box_h=13.5, gap=9.0):
        # ligne : Fait à [____]   ·   Le [____]  ·  en deux exemplaires originaux
        size = 9.0
        y = top_mm
        fh = 5.6
        self.text(CX, y + 3.1, D.TEXTES["sign_faita"], FONT_MED, size, INK)
        fa_x = CX + self.text_w(D.TEXTES["sign_faita"], FONT_MED, size) + 3.0
        fa_w = 42.0
        self.round_box(fa_x, y, fa_w, fh, fill=self.fill_field, stroke=FIELD_BORDER, lw=0.5, r=1.1)
        self._text_widget(faita_name, fa_x, y, fa_w, fh, size=10); self.field_count["text"] += 1
        le_x = fa_x + fa_w + 6.0
        self.text(le_x, y + 3.1, D.TEXTES["sign_le"], FONT_MED, size, INK)
        d_x = le_x + self.text_w(D.TEXTES["sign_le"], FONT_MED, size) + 3.0
        d_w = 30.0
        self.round_box(d_x, y, d_w, fh, fill=self.fill_field, stroke=FIELD_BORDER, lw=0.5, r=1.1)
        self._text_widget(date_name, d_x, y, d_w, fh, size=10); self.field_count["text"] += 1
        ex_x = d_x + d_w + 4.0
        self.text(ex_x, y + 3.1, "— " + D.TEXTES["sign_exemplaires"], FONT_LIGHT, 8.0, COL_LABEL)
        # deux zones de signature
        y2 = y + gap
        box_w = COLW
        for bx, nm, cap in ((XL, sv_name, D.TEXTES["sign_vendeur"]),
                            (XR, sa_name, D.TEXTES["sign_acheteur"])):
            self.round_box(bx, y2, box_w, box_h, fill=None, stroke=FIELD_BORDER, lw=0.6, r=1.6)
            self._text_widget(nm, bx, y2, box_w, box_h, size=11)  # zone remplissable
            self.field_count["sign"] += 1
            self.hline(bx + 5, y2 + box_h - 4.0, bx + box_w - 5, FIELD_BORDER, 0.5)
            self.text(bx + 0.4, y2 + box_h + 4.0, cap.upper(), FONT_MED, LBL_SIZE,
                      COL_LABEL, tracking=LBL_TRACK)
        return y2 + box_h + 5.0

    # ---- chrome de page -----------------------------------------------------
    def page_chrome(self, page_no, title, partie):
        c = self.c
        # bandeau noir
        self.round_box(0, 0, PAGE_W, BAND_H, fill=BLACK, r=0.0)
        # logo
        logo = ImageReader(os.path.join(HERE, D.BRAND["logo"]))
        lh = 11.5; lw = lh * 896 / 278
        lt = (BAND_H - lh) / 2
        c.drawImage(logo, CX * mm, self._y((lt + lh) * mm), lw * mm, lh * mm,
                    mask="auto", preserveAspectRatio=True, anchor="sw")
        # label masthead à droite
        self.text(PAGE_W - MARGIN, BAND_H / 2 + 0.9, "Certificat de cession".upper(),
                  FONT_MED, 7.0, MASTHEAD_COL, align="right", tracking=0.30)
        # filet rose
        self.vrect(0, BAND_H, PAGE_W, FILET_H, MAGENTA)
        # titre (auto-fit)
        tsize = 18.0
        while self.text_w(title, FONT_SEMI, tsize, 0.005) > CW * mm and tsize > 13:
            tsize -= 0.5
        self.text(CX, TITLE_BASE, title, FONT_SEMI, tsize, INK, tracking=0.005)
        # partie
        self.para(CX, PARTIE_BASE - 2.4, CW, partie.upper(), FONT_MED, 7.6,
                  MAGENTA_DARK, leading_factor=1.3, tracking=0.10)
        # pied de page
        self._footer(page_no)
        self.y = CONTENT_TOP

    def _footer(self, page_no):
        self.hline(CX, FOOTER_RULE, CX + CW, HAIRLINE, 0.6)
        ft = D.FOOTER
        l1 = " · ".join([ft["raison"]] + ft["lignes"])
        l2 = ft["tel"] + "   ·   " + ft["email"]
        self.text(CX, FOOTER_RULE + 4.2, l1, FONT_MED, 6.7, FOOTER_COL, tracking=0.04)
        self.text(CX, FOOTER_RULE + 8.4, l2, FONT_REG, 6.7, FOOTER_COL, tracking=0.04)
        self.text(CX + CW, FOOTER_RULE + 4.2, f"Page {page_no} / 2", FONT_MED, 6.7,
                  MAGENTA_DARK, align="right", tracking=0.06)

    # ---- pages --------------------------------------------------------------
    def build_page1(self):
        self.page_chrome(1, D.TEXTES["titre_p1"], D.TEXTES["partie_p1"])
        y = self.y
        # VENDEUR
        y = self.section(y, "Vendeur")
        b = self.field(XL, y, COLW, "v_nom")
        self.field(XR, y, COLW, "v_telephone"); y = b + ROW_GAP
        b = self.field(XL, y, COLW, "v_mandataire")
        self.field(XR, y, COLW, "v_num_entreprise"); y = b + ROW_GAP
        y = self.field(CX, y, CW, "v_siege_social") + ROW_GAP + SEC_GAP

        # ACHETEUR 1 / ACHETEUR 2 (deux colonnes)
        ytop = y
        for cx, pfx, title in ((XL, "a1", "Acheteur 1"), (XR, "a2", "Acheteur 2 (le cas échéant)")):
            yy = self.section(ytop, title, x=cx, w=COLW, rule=False)
            yy = self.field(cx, yy, COLW, f"{pfx}_nom") + ROW_GAP
            inner = (COLW - 5.0) / 2
            bb = self.field(cx, yy, inner, f"{pfx}_telephone")
            self.field(cx + inner + 5.0, yy, inner, f"{pfx}_registre_national"); yy = bb + ROW_GAP
            yy = self.field(cx, yy, COLW, f"{pfx}_adresse")
            ybottom = yy
        y = ybottom + ROW_GAP + SEC_GAP

        # VÉHICULE
        y = self.section(y, "Véhicule")
        rows = [("veh_marque", "veh_modele"),
                ("veh_date_mec", "veh_couleur"),
                ("veh_puissance_kw", "veh_cylindree_cc"),
                ("veh_kilometrage", "veh_chassis")]
        for left, right in rows:
            b = self.field(XL, y, COLW, left)
            self.field(XR, y, COLW, right); y = b + ROW_GAP
        y += SEC_GAP - ROW_GAP

        # PRIX DE VENTE
        y = self.section(y, "Prix de vente")
        # panneau rosé : phrase prix + phrase IBAN
        pad = 4.6
        ptop = y
        inner_x, inner_w = CX + pad, CW - 2 * pad
        LF = 1.34
        def _prix_flow(yy, dry):
            yy = self.flow_fields(inner_x, yy, inner_w, D.TEXTES["prix_phrase"],
                                  FONT_REG, 9.3, COL_BODY, field_h=4.8, leading_factor=LF,
                                  field_fill=white, field_border=PANEL_BORDER, dry=dry) + 2.2
            yy = self.flow_fields(inner_x, yy, inner_w, D.TEXTES["iban_phrase"],
                                  FONT_REG, 8.7, COL_BODY, field_h=4.6, leading_factor=LF,
                                  field_fill=white, field_border=PANEL_BORDER, dry=dry)
            return yy
        # 1) mesure
        m = _prix_flow(ptop + pad + 4.0, dry=True)
        panel_h = (m + pad) - ptop
        # 2) fond du panneau (sous le texte)
        self.round_box(CX, ptop, CW, panel_h, fill=PANEL_FILL, stroke=PANEL_BORDER, lw=0.8, r=2.4)
        # 3) contenu
        self.text(inner_x, ptop + pad + 2.4, "Montant".upper(), FONT_SEMI, 6.5,
                  MAGENTA_DARK, tracking=0.16)
        _prix_flow(ptop + pad + 4.0, dry=False)
        y = ptop + panel_h + 2.2
        # clauses propriété + état
        y = self.para(CX, y, CW, D.TEXTES["prix_reserve"], FONT_REG, 7.6, COL_BODY,
                      leading_factor=1.28, justify=True) + 1.5
        y = self.para(CX, y, CW, D.TEXTES["prix_etat"], FONT_REG, 7.6, COL_BODY,
                      leading_factor=1.28, justify=True) + SEC_GAP

        # SIGNATURES
        y = self.section(y, "Signatures")
        end = self.signature_block(y, "p1_fait_a", "p1_date", "p1_sign_vendeur", "p1_sign_acheteur")
        if os.environ.get("CERT_DEBUG"):
            print(f"   [debug] page1 bottom = {end:.1f}mm (limite {USABLE_BOTTOM}mm, "
                  f"{'DÉBORDE de %.1f' % (end-USABLE_BOTTOM) if end>USABLE_BOTTOM else 'OK marge %.1f' % (USABLE_BOTTOM-end)})")
        self.c.showPage()

    def build_page2(self):
        self.page_chrome(2, D.TEXTES["titre_p2"], D.TEXTES["partie_p2"])
        y = self.y + 3.0
        # DOCUMENTS REMIS | CONTRÔLE TECHNIQUE (deux colonnes, aéré)
        ytop = y
        left_names  = ["doc_conformite", "doc_historique", "doc_immatriculation", "doc_cles"]
        right_names = ["ct_certificat_valide", "ct_demande_immat", "ct_rapport", "ct_carpass"]
        yL = self.section(ytop, f'{D.TEXTES["doc_titre"]}  ·  {D.TEXTES["doc_soustitre"]}', x=XL, w=COLW, rule=False)
        for nm in left_names:
            yL = self.checkbox_row(XL, yL, COLW, nm, box=5.6, fsize=9.2, gap_after=8.4)
        yR = self.section(ytop, f'{D.TEXTES["ct_titre"]}  ·  {D.TEXTES["ct_soustitre"]}', x=XR, w=COLW, rule=False)
        for nm in right_names:
            yR = self.checkbox_row(XR, yR, COLW, nm, box=5.6, fsize=9.2, gap_after=8.4)
        y = max(yL, yR) + 13.0

        # MENTIONS JURIDIQUES (panneau encadré, fond gris très clair, généreux)
        y = self.section(y, D.TEXTES["mentions_titre"])
        pad = 8.0
        ptop = y
        inner_x, inner_w = CX + pad, CW - 2 * pad
        keys = ("p2_inspection", "p2_responsabilite", "p2_risques")
        def _mentions(yy, dry):
            for key in keys:
                yy = self.para(inner_x, yy, inner_w, D.TEXTES[key], FONT_REG, 9.1, COL_BODY,
                               leading_factor=1.55, justify=True, dry=dry) + 4.5
            return yy - 4.5
        panel_h = (_mentions(ptop + pad, dry=True) + pad) - ptop
        self.round_box(CX, ptop, CW, panel_h, fill=HexColor(0xFAFAFC), stroke=HAIRLINE, lw=0.8, r=2.6)
        _mentions(ptop + pad, dry=False)
        mentions_end = ptop + panel_h

        # SIGNATURES — ancrées dans le tiers inférieur (rythme premium)
        SIGN_TOP = 214.0
        self.ornament((mentions_end + 6.0 + SIGN_TOP) / 2.0)
        y = self.section(SIGN_TOP, "Signatures")
        end = self.signature_block(y, "p2_fait_a", "p2_date", "p2_sign_vendeur",
                                   "p2_sign_acheteur", box_h=26.0, gap=11.0)
        if os.environ.get("CERT_DEBUG"):
            print(f"   [debug] page2 signatures bottom = {end:.1f}mm (footer {FOOTER_RULE})")
        self.c.showPage()

    def save(self):
        self.build_page1()
        self.build_page2()
        self.c.save()
        return self.path


# ───────────────────────────── POST-TRAITEMENT (pypdf) ──────────────────────
def postprocess(path):
    """NeedAppearances=true + ordre de tabulation par ligne (/Tabs /R)."""
    try:
        from pypdf import PdfReader, PdfWriter
        from pypdf.generic import NameObject, BooleanObject
    except Exception as e:
        print("  (pypdf indisponible, post-traitement ignoré:", e, ")"); return
    r = PdfReader(path); w = PdfWriter()
    w.append(r)
    try:
        w._root_object["/AcroForm"][NameObject("/NeedAppearances")] = BooleanObject(True)
    except Exception:
        pass
    for page in w.pages:
        page[NameObject("/Tabs")] = NameObject("/R")
    with open(path, "wb") as f:
        w.write(f)


# ───────────────────────────── RENDU PNG (pymupdf) ──────────────────────────
def render_png(path, dpi=170):
    import fitz
    doc = fitz.open(path)
    base = os.path.splitext(os.path.basename(path))[0]
    outs = []
    for i, page in enumerate(doc, 1):
        pix = page.get_pixmap(dpi=dpi, alpha=False)
        op = os.path.join(OUT, f"{base}-p{i}.png")
        pix.save(op); outs.append(op)
    doc.close()
    return outs


# ───────────────────────────── NOMENCLATURE ─────────────────────────────────
def dump_nomenclature():
    rows = []
    for i, (name, m) in enumerate(D.FIELDS.items(), 1):
        rows.append((i, name, m["type"], f'P{m["page"]}', m["section"], m["label"]))
    width = max(len(r[1]) for r in rows)
    print(f'{"#":>3}  {"NOM":<{width}}  {"TYPE":<9} PAGE  SECTION')
    for i, name, typ, pg, sec, lab in rows:
        print(f"{i:>3}  {name:<{width}}  {typ:<9} {pg:<4}  {sec} — {lab}")
    print(f"\nTotal : {len(rows)} champs.")


# ───────────────────────────── MAIN ─────────────────────────────────────────
def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-png", action="store_true")
    ap.add_argument("--nomenclature", action="store_true")
    args = ap.parse_args()

    if args.nomenclature:
        dump_nomenclature(); return

    os.makedirs(OUT, exist_ok=True)
    register_fonts()

    counts = {}
    for variant in ("interactive", "print"):
        cert = Cert(variant)
        path = cert.save()
        if cert.interactive:
            postprocess(path)
        counts[variant] = cert.field_count
        print(f"✓ {os.path.basename(path)}  champs={cert.field_count}")

    # mobile = interactif (PDF vectoriel universel, AcroForm standard)
    src = os.path.join(OUT, "certificat-cession-transakauto-interactive.pdf")
    dst = os.path.join(OUT, "certificat-cession-transakauto-mobile.pdf")
    shutil.copyfile(src, dst)
    print(f"✓ {os.path.basename(dst)}  (copie de la version interactive)")

    if not args.no_png:
        for v in ("interactive", "print"):
            p = os.path.join(OUT, f"certificat-cession-transakauto-{v}.pdf")
            for op in render_png(p):
                print("  →", os.path.basename(op))


if __name__ == "__main__":
    main()
