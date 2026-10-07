# Setup (2 zips)
1. Unzip grocery-store-features.zip over your project (it adds/changes files under src/ and public/).
2. Unzip grocery-store-final-edits.zip over your project too (layout.js, globals.css, tailwind.config.js, pricing.js, CartContext.js, mockApi.js).
   Hero.js in that zip replaces your existing Hero.js (copy it to where your Hero.js lives).
3. npm run dev
Language: header button  EN | বাংলা  translates the WHOLE site (text, placeholders, numbers) using src/lib/bnPhrases.js.
New text you add later: add one line  "English text": "বাংলা"  to PHRASES in that file.
Skip translating something: put the attribute  data-no-translate  on it.
