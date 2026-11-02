# Judges explorer

An interactive study site for the Book of Judges, using the King James Version text.

**Live site:** https://d3narius.github.io/judges-explorer/

## Features

- **Timeline** of the judges, showing each period of oppression and rest using the years stated in the text. Click a bar to open that judge.
- **Characters**: 45 people with a short profile, a chart of where they appear by chapter, verse references, and a mind map of the incidents they are part of and the people connected to them.
- **Word frequency** for the whole book or any chapter, shown as a word cloud and a top-25 list. Options to hide common words, merge plurals, and show the words most distinctive to a chapter. Click a word to see every verse that uses it.
- **Chapter maps** linking each chapter's incidents, people, places, and neighboring chapters, with the full chapter text below.
- **Search** across verses (whole-word matching), characters, and places.

The site is plain HTML, CSS, and JavaScript with no dependencies or build step, and works on phones and desktops.

## Files

| File | Contents |
| --- | --- |
| `index.html` | Page shell |
| `app.js` | Views, routing, mind maps, word cloud, and search |
| `style.css` | Light, responsive theme |
| `data/verses_kjv.js` | KJV text of Judges 1–21, verse by verse |
| `data/curated.js` | Characters, incidents, places, timeline, and chapter summaries |

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Sources and notes

- Scripture text: King James Version (Authorized Version), public domain outside the United Kingdom.
- Character profiles, incident summaries, chapter summaries, and incident categories are original paraphrases and interpretations written for this site.
- The timeline places the stated years end to end in book order, so its span is relative. Some periods likely overlapped.
