# ComandăLocal

Site în limba română pentru comenzi de la Bravo, Amore Sushi, Panda, Farmacie, Samurai Sushi, Davidan și Casa perfectă și curată. Clientul completează formularul și trimite comanda direct pe Telegram printr-un Cloudflare Worker; pagina nu redirecționează clientul în Telegram.

## Activarea trimiterii comenzilor în Telegram

Site-ul GitHub Pages este static, așa că tokenul Telegram nu trebuie pus în `index.html` sau în alt cod trimis browserului. Pentru trimitere directă, configurează `worker.js` ca Cloudflare Worker:

1. Creează un bot cu `@BotFather` în Telegram și copiază tokenul privat. Nu îl publica și nu îl trimite în conversații.
2. Deschide conversația cu botul și apasă **Start**.
3. Află ID-ul numeric al conversației tale (de exemplu, printr-un bot de tip `getUpdates` după ce ai scris botului) și păstrează-l privat.
4. În Cloudflare, creează un Worker nou și publică conținutul din `worker.js`.
5. În Worker **Settings → Variables and Secrets**, adaugă ca **secrets** `TELEGRAM_BOT_TOKEN` (tokenul de la BotFather) și `TELEGRAM_CHAT_ID` (ID-ul conversației destinatare). Nu le adăuga în repository.
6. Pentru numerele magazinelor, adaugă tot ca **secret** `STORE_PHONE_NUMBERS`, cu o valoare JSON. Exemplu de structură:

   ```json
   {
     "Amore Sushi": [{"number": "+373 XX XXX XXX"}],
     "Bravo": [{"number": "+373 XX XXX XXX"}],
     "Davidan": [
       {"label": "Iuliana", "number": "0XXXXXXXX"},
       {"number": "0XXXXXXXX"}
     ]
   }
   ```

   Adaugă doar magazinele pentru care ai număr. Aceste contacte apar numai în mesajele trimise de Worker către conversația Telegram configurată; nu sunt incluse în site sau în repository. Nu publica valoarea secretului.
7. În `index.html`, înlocuiește `https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev` din `ORDER_API_URL` cu URL-ul Worker-ului publicat și salvează modificarea.
8. Pentru ca botul să poată trimite mesaje, ai nevoie să fi pornit conversația cu botul; apoi testează o comandă.

Worker-ul acceptă cereri doar de la originea GitHub Pages a acestui repository și trimite prin Telegram numele, telefonul, adresa și detaliile comenzii. Dacă este configurat `STORE_PHONE_NUMBERS`, atașează fiecărui magazin comandat numărul lui de telefon, vizibil doar în conversația Telegram destinatară. Mesajul include suma produselor și livrarea, iar totalul de plată apare pe ultimul rând, evidențiat cu aldine. Pentru Farmacie, prețurile pot lipsi; Telegram indică suma și totalul ca parțiale, fără să estimeze produsele neprețuite. Configurează politicile de confidențialitate și păstrează tokenul botului secret. Înainte de configurare, formularul nu trimite nicio comandă și afișează un mesaj informativ.

Primul magazin comandat este inclus în taxa de livrare, iar fiecare magazin suplimentar adaugă 10 lei. După modificarea `worker.js`, publică din nou codul în Cloudflare pentru ca validarea prețului și notificările comenzilor să rămână sincronizate cu site-ul.

Clientul alege mai întâi produsele, apoi localitatea și datele pentru livrare. Selecția temporară este păstrată la revenirea în magazin, dar este inclusă în comandă numai după apăsarea „Salvează produsele”. Înainte de trimitere, pagina afișează suma produselor, livrarea și totalul de plată. Produsele unui magazin pot fi eliminate din sumar, iar totalul se recalculează. Pentru produse introduse manual fără preț, totalul este marcat ca parțial; interpretarea prețurilor trebuie păstrată în concordanță cu `getProductSubtotal` din `worker.js`.

Catalogul Amore Sushi afișează toate cele 84 de produse și imaginile lor într-o singură listă, fără categorii. Produsele selectate și totalul lor sunt atașate comenzii către curier.

Catalogul Davidan afișează produsele de patiserie într-o singură listă, cu prețurile și fotografiile lor. Produsele și totalul lor sunt atașate comenzii către curier.

Catalogul Casa perfectă și curată afișează produse de îngrijire a copiilor, produse din hârtie, articole de curățenie și produse de îngrijire personală, cu prețurile lizibile din fotografiile furnizate. Produsele sunt grupate pe categorii, iar imaginile decupate și optimizate din `assets/casa-curata-catalog/` nu afișează etichetele de preț de la raft.

Catalogul Bravo afișează toate produsele într-o singură listă, fără categorii. Pentru fiecare pizza, alege prin buton radio felia de 130 g (26 MDL) sau pizza întreagă de 520 g (105 MDL). Coca-Cola și Sprite de 0,5 l au prețul afișat per unitate.

Catalogul Panda afișează 24 de produse și prețurile într-o singură listă, fără categorii. Cele 22 de fotografii incluse în meniu sunt asociate produselor pe care le ilustrează; produsele fără fotografie în sursă nu primesc imagini inventate. Cafeaua, cocktailurile și băuturile cu sau fără alcool nu sunt incluse; catalogul se oprește la produsele dinainte de King Burger. Selecția include prețul fiecărui produs în suma comenzii.

Catalogul Samurai Sushi include Uramaki, Tempura, Gunkan, Hossomaki, Nigiri, Poke Bowl, Roll Dog, Sushi Burger și Seturi, cu produse selectabile, fotografiile disponibile și prețurile din meniurile furnizate. Cele 25 de seturi vizibile în capturile de meniu au fotografii asociate individual; produsele adăugate sunt Lovitura Samuraiului, Set Aiko și Set California. PDF-ul Uramaki include fotografii pentru primele 10 produse; celelalte produse nu au fotografii în fișier. Uramaki și Tempura permit alegerea porției de 4 sau 8 bucăți folosind prețurile din fotografiile meniului. Hossomaki oferă aceleași opțiuni, iar până la primirea unui preț separat pentru fiecare porție folosește prețul listat în PDF.

## Publicare GitHub Pages

În repository mergi la **Settings → Pages**, alege **Deploy from a branch**, ramura `main` și folderul `/ (root)`. Site-ul este la `https://curierfloresti.github.io/comenzi-magazine/` după publicare.
