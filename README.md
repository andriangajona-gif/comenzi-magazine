# ComandăLocal

Site în limba română pentru comenzi de la Bravo, Amore Sushi, Panda, Farmacie, Samurai Sushi și Davidan. Clientul completează formularul și trimite comanda direct pe Telegram printr-un Cloudflare Worker; pagina nu redirecționează clientul în Telegram.

## Activarea trimiterii comenzilor în Telegram

Site-ul GitHub Pages este static, așa că tokenul Telegram nu trebuie pus în `index.html` sau în alt cod trimis browserului. Pentru trimitere directă, configurează `worker.js` ca Cloudflare Worker:

1. Creează un bot cu `@BotFather` în Telegram și copiază tokenul privat. Nu îl publica și nu îl trimite în conversații.
2. Deschide conversația cu botul și apasă **Start**.
3. Află ID-ul numeric al conversației tale (de exemplu, printr-un bot de tip `getUpdates` după ce ai scris botului) și păstrează-l privat.
4. În Cloudflare, creează un Worker nou și publică conținutul din `worker.js`.
5. În Worker **Settings → Variables and Secrets**, adaugă ca **secrets** `TELEGRAM_BOT_TOKEN` (tokenul de la BotFather) și `TELEGRAM_CHAT_ID` (ID-ul conversației destinatare). Nu le adăuga în repository.
6. În `index.html`, înlocuiește `https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev` din `ORDER_API_URL` cu URL-ul Worker-ului publicat și salvează modificarea.
7. Pentru ca botul să poată trimite mesaje, ai nevoie să fi pornit conversația cu botul; apoi testează o comandă.

Worker-ul acceptă cereri doar de la originea GitHub Pages a acestui repository și trimite prin Telegram numele, telefonul, adresa și detaliile comenzii. Mesajul include suma produselor și livrarea, iar totalul de plată apare pe ultimul rând, evidențiat cu aldine. Pentru Panda și Farmacie, prețurile pot lipsi; Telegram indică suma și totalul ca parțiale, fără să estimeze produsele neprețuite. La comenzile Panda, mesajul precizează că prețurile produselor vor fi comunicate curierului la magazin. Configurează politicile de confidențialitate și păstrează tokenul botului secret. Înainte de configurare, formularul nu trimite nicio comandă și afișează un mesaj informativ.

Primul magazin comandat este inclus în taxa de livrare, iar fiecare magazin suplimentar adaugă 10 lei. După modificarea `worker.js`, publică din nou codul în Cloudflare pentru ca validarea prețului și notificările comenzilor să rămână sincronizate cu site-ul.

Catalogul Amore Sushi include 84 de produse și imaginile lor în categoriile Rolluri, Sushi Fastfood, Sushi, Pizza, Seturi și Fastfood. Produsele selectate și totalul lor sunt atașate comenzii către curier.

Catalogul Davidan permite căutarea și selectarea produselor de patiserie, cu prețurile afișate separat de fotografii. Produsele și totalul lor sunt atașate comenzii către curier.

Catalogul Bravo este organizat în categoriile Pizza, Plăcinte și Băuturi. Pentru fiecare pizza, alege prin buton radio felia de 130 g (26 MDL) sau pizza întreagă de 520 g (105 MDL). Coca-Cola și Sprite de 0,5 l au prețul afișat per unitate.

Catalogul Samurai Sushi include Uramaki, Tempura, Gunkan, Hossomaki, Nigiri, Poke Bowl, Roll Dog, Sushi Burger și Seturi, cu produse selectabile, fotografiile disponibile și prețurile din meniurile furnizate. Cele 25 de seturi vizibile în capturile de meniu au fotografii asociate individual; produsele adăugate sunt Lovitura Samuraiului, Set Aiko și Set California. PDF-ul Uramaki include fotografii pentru primele 10 produse; celelalte produse nu au fotografii în fișier. Uramaki și Tempura permit alegerea porției de 4 sau 8 bucăți folosind prețurile din fotografiile meniului. Hossomaki oferă aceleași opțiuni, iar până la primirea unui preț separat pentru fiecare porție folosește prețul listat în PDF.

## Publicare GitHub Pages

În repository mergi la **Settings → Pages**, alege **Deploy from a branch**, ramura `main` și folderul `/ (root)`. Site-ul este la `https://curierfloresti.github.io/comenzi-magazine/` după publicare.
