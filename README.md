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

Worker-ul acceptă cereri doar de la originea GitHub Pages a acestui repository și trimite prin Telegram numele, telefonul, adresa și detaliile comenzii. Configurează politicile de confidențialitate și păstrează tokenul botului secret. Înainte de configurare, formularul nu trimite nicio comandă și afișează un mesaj informativ.

Primul magazin comandat este inclus în taxa de livrare, iar fiecare magazin suplimentar adaugă 10 lei. După modificarea `worker.js`, publică din nou codul în Cloudflare pentru ca validarea prețului și notificările comenzilor să rămână sincronizate cu site-ul.

Catalogul Amore Sushi este construit din meniurile PDF: include 42 de produse și imaginile lor în categoriile Rolluri, Sushi, Sushi Fastfood și Pizza. Sunt afișate toate cele 8 categorii din meniu; categoriile fără produse în PDF indică momentan că produsele nu sunt disponibile. Produsele selectate și totalul lor sunt atașate comenzii către curier.

## Publicare GitHub Pages

În repository mergi la **Settings → Pages**, alege **Deploy from a branch**, ramura `main` și folderul `/ (root)`. Site-ul este la `https://andriangajona-gif.github.io/comenzi-magazine/` după publicare.
