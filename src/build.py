#!/usr/bin/env python3
"""המארג – build: מקור אחד → שני קבצים עצמאיים.

המקור: src/weave.src.html. בו כל ההבדלים בין הקבוצתי למשפחתי מסומנים:

  בתוך שורה:   ⟦טקסט לקבוצתי¦טקסט למשפחתי⟧
  כמה שורות:   שורה שמכילה רק  @@group   ... קוד לקבוצתי ...
               שורה שמכילה רק  @@family  ... קוד למשפחתי ...
               שורה שמכילה רק  @@end
               (אפשר גם רק @@group…@@end או רק @@family…@@end)

שימוש (מתוך תיקיית group-weave):
  python3 src/build.py            בונה index.html ו-../family-weave/index.html
  python3 src/build.py --check    רק בודק שהקבצים הנוכחיים זהים למה שהמקור מייצר
  python3 src/build.py --family PATH   נתיב אחר לקובץ המשפחתי
כל קובץ שיוצא הוא HTML יחיד ועצמאי – בלי תלות בקובץ חיצוני.
"""
import re, sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "weave.src.html"
INLINE = re.compile(r"⟦([^⟦⟧¦]*)¦([^⟦⟧¦]*)⟧")


def render(src: str, which: str) -> str:
    out, mode = [], None  # mode: None | 'group' | 'family'
    for n, line in enumerate(src.split("\n"), 1):
        s = line.strip()
        if s in ("@@group", "@@family"):
            mode = s[2:]
            continue
        if s == "@@end":
            if mode is None:
                sys.exit(f"@@end בלי פתיחה בשורה {n}")
            mode = None
            continue
        if mode is not None and mode != which:
            continue
        idx = 1 if which == "group" else 2
        out.append(INLINE.sub(lambda m: m.group(idx), line))
    if mode is not None:
        sys.exit("בלוק @@ לא נסגר")
    text = "\n".join(out)
    if "⟦" in text or "⟧" in text or "@@group" in text or "@@family" in text:
        sys.exit("נשאר סימון לא תקין בפלט – בדוק את המקור")
    return text


def main():
    args = sys.argv[1:]
    fam = HERE.parent.parent / "family-weave" / "index.html"
    if "--family" in args:
        fam = pathlib.Path(args[args.index("--family") + 1]).resolve()
    targets = {"group": HERE.parent / "index.html", "family": fam}
    src = SRC.read_text(encoding="utf-8")
    ok = True
    for which, path in targets.items():
        txt = render(src, which)
        if "--check" in args:
            cur = path.read_text(encoding="utf-8") if path.exists() else None
            same = cur == txt
            ok &= same
            print(f"{which:7} {'זהה ✓' if same else 'שונה ✗'}  {path}")
        else:
            if not path.parent.exists():
                print(f"דילגתי על {which}: אין תיקייה {path.parent}")
                continue
            path.write_text(txt, encoding="utf-8")
            print(f"{which:7} נכתב  {path}  ({len(txt.splitlines())} שורות)")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
