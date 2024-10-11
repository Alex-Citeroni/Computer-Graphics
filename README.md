# Computer-Graphics

📗 Progetto
Questo progetto è stato sviluppo come prova d'esame per il corso di Computer Graphics del Corso di Laurea Magistrale in Informatica (Curriculum B), presso l'Università di Bologna.
All'interno di questa documentazione sono contenuti dettagli inerenti alle scelte di sviluppo.
L'obbiettivo del progetto è sviluppare una “3D-WebApp” usando WebGL (HTML5, CSS e contesto webgl), linguaggio JavaScript e OpenGL ES SL.

🗿 Soggetto dell'applicazione
Il progetto sviluppato prende ispirazione da giochi di arredamento e consiste in un'applicazione web che permette di visualizzare una scena 3D (inizialmente composta da una stanza vuota) e muoversi liberamente in essa tramite tastiera e mouse o controller.
Tramite l'apposito menu è possibile aggiungere o rimuovere diversi oggetti e spostarli dove si proferisce attraverso la tastiera o il controller 2D posizionato in alto a destra.
Inoltre è possibile modificare alcune impostazioni grafiche attraverso l'apposito menù in basso a sinistra.
L'applicazione è stata testata su dispositivi mobili e in ambienete Windows e Linux.

💼 File
I file che compongono il progetto sono i seguenti:

📁 data: cartella che contiene immagini, file mtl, file obj e file i blend degli oggetti.
📁 librerie: cartella che contiene le librerie fornite dal professore (dat.gui.js, glm_utils.js, jquery_3.6.1.js,m4.js, mesh_utils.js, ui_components.js, webgl-utils.js).
📁 scene:
📄 scene.js: classe principale che si occupa di tutte le operazioni, dall'inizializzazione del canvas e delle mesh, al rendering.
📄 camera.js: classe che gestisce la camera e i suoi movimenti.
📄 animated_camera.js: classe che gestisce la camera che si muove automaticamente.
📄 mesh_obj.js: classe per la gestione degli oggetti da disegnare.
📁 styles: cartella che continene file css riguardanti gli stili dei file html.
📄 main.js: main del programma.
📄 relazione.html: questo file.
📄 utils.js: file che contiene funzioni riguardanti gli oggetti, i menù e il controller (tastiera/mouse/touch).
📄 webapp.html: il file principale che contiene l'app.
💻 Interfaccia
Interfaccia
Quando avviamo l'applicazione possiamo notare che al centro dello schermo troviamo la scena contenente una stanza vuota.
↘ In basso a destra possiamo trovare il menù (realizzato utilizzando la libreria dat.gui.js) dove possiamo piazzare gli oggetti e rimuoverli.
↓ In basso al centro ci sono due pulsanti:

Cambia Camera: permette di attivare la camera animata che gira intorno alla stanza
Allinea Camera: allinea la camera sull'asse verticale e obliqua
↙ In basso a sinistra troviamo il menù (realizzato utilizzando la libreria dat.gui.js) che su occupa di gestire:
skybox: on/off e switch (è possibile alternare due skybox, tra quella iniziale e una completamente bianca).
luce: posizione (ha effetto solo se se attiviamo il rendering avanzato), colore (modificano anche il colore della skybox e non ha effetto se è attivo il rendering tramite shadow map) e direzione.
ombre: on/off rendering avanzato, fov, width, height, far, bias, on/off frustum.
↖ In alto a sinistra troviamo: il link per raggiungere questo documento, i comandi della tastiera (visibili cliccando su 'Comandi tastiera') e la scelta dell'oggetto selezionato da spostare.
documento: link per raggiungere questo documento.
comandi tastiera: visibili cliccando su 'Comandi tastiera'.
oggetto da spostare: da questa select è possibile scegliere l'oggetto da spostare.
↗ In alto a destra troviamo il controller che si può utilizzare per muovere la camera e gli oggetti, in base a ciò che si è selezionato nella select.
🎮 Comandi
Attraverso la tastiera o tramite il controller presente in alto a destra è possibile spostarsi nella scena e spostare gli oggetti presenti nella scena (gli oggetti si possono spostare solo se sono già presenti nella scena).
I comandi da tastiera sono i seguenti:

W/S: camera avanti/indietro
A/D: camera sinistra/destra
Space/Shift: camera sopra/sotto
1/3: inclina in alto/basso
4/6: panoramica a sinistra/destra
7/9: camera ruota a sinistra/destra
Freccia Su/Giù: sposta oggetto avanti/indietro
Freccia Sinistra/Destra: sposta oggetto sinistra/destra
Q/E: sposta oggetto in alto/basso
R: allinea la camera
È possibile ruotare la camera nelle varie direzioni attraverso il tocco sul canvas tramite mouse o touch.
🪑 Aggiungere un nuovo oggetto
È possibile aggiungere un nuovo oggetto, da utilizzare poi nella scena, in due passaggi:

Inserisci nella cartella "data" una cartella dedicata all'oggetto, contenente un file mtl e un file obj (puoi anche inserire le texure nel caso ci fossero). I nomi dei file e della cartella dovranno essere identici.
Modifica il file "utils.js", inserendo nella costante "objects" il nuovo oggetto:

"{ name: 'NomeCartella', position: [z, x, y] }"

A questo punto l'oggetto potrà essere aggiunto dal menù situato in basso a destra e potrà anche essere selezionato nel select per essere spostato.

🚪 Cambiare stanza
È possibile anche caricare una stanza diversa tramite i seguenti passaggi:
Inserisci nella cartella "data" una cartella dedicata alla stanza, contenente un file mtl e un file obj (puoi anche inserire le texure nel caso ci fossero). I nomi dei file e della cartella dovranno essere identici.
Modifica il file "main.js", sostituendo alla riga 11 la parola "stanzetta", con il nome della cartella che hai aggiunto:

Da così:
"window["scene"] = new Scene("canvas", [createObj('stanzetta', [0, 0, 0])]);"

A così:
"window["scene"] = new Scene("canvas", [createObj('nomeCartella', [0, 0, 0])]);"

🎡 Scelte progettuali
Sono state utilizzate e implementate diverse funzionalità:

Vertex shader: ha il compito di trasformare i vertici del modello 3D dalle coordinate del modello allo spazio della scena, in modo che possano essere correttamente disegnati sullo schermo.

Fragment shader: utilizzato per determinare il colore di ogni singolo pixel sullo schermo.

Rendering di base: la scena disegnata supporta texture e colori, avendo una luce diffusa e speculare. L'illuminazione segue il modello di Phong, andando a definire una luce ambientale legata alla sorgente luminosa di base che va ad irradiare l'intera scena e una riflessione puntiforme data dalla combinazione di luce diffusa e speculare. Data la presenza di texture, l'algoritmo è stato adattato per il texture mapping.

Rendering avanzato: le ombre vengono generate tramite Shadow Mapping. La scena viene prima disegnata prima dal punto di vista della sorgente luminosa, registrando i valori di profondità sul depth buffer (senza renderizzazione) per poi definire i valori dello shadow buffer, poi dal punto di vista dell'osservatore (camera), utilizzando la shadowmap generata per capire se un punto è in ombra o meno.
È possibile attivare questo tipo di render dal menu in basso a sinistra, cliccando sulla voce "On Shadow Map".

Caricamento modelli: segue la formattazione di file wavefront .OBJ andando a caricarne le varie parti (facce) partendo dalle coordinate dei suoi vertici insieme ai materiali annessi (definiti in file .MTL linkati all'interno del documento .OBJ).

Skybox: implementata tramite l'utilizzo di una cubemap, un tipo di texture tridimensionale. Ogni faccia ha un riferimento bidimensionale relativo ai pixel di ogni quadrato del cubo e una normale che, a secondo della direzione a cui punta, viene selezionata una delle 6 facce del cubo, andandone a campionare i pixel per poi produrre il colore. Poichè l'osservatore si trova all'interno della cubemap, è stata utilizzata l'inversa della matrice di proiezione di vista per ottenere la direzione in cui l'osservatore (la camera) sta guardando.

Context 2D: per definire il controller visualizzato internamente al canvas, si è utilizzato il context2D del canvas sovrapposto a quello di gioco.

Adattamento mobile: l'interfaccia è gestita secondo i display di un monitor classico per PC e di uno smartphone. I test inerenti all'adattamento mobile sono stati effettuati tramite gli strumenti di sviluppo di Google Chrome.
Sono state anche utilizzate le funzioni WebGL provenienti dalle librerie spiegate durante il corso, come m4.js (per la gestione delle operazioni matriciali), dat.gui.js (per definire i menù per gli oggetti e le impostazioni delle luci e ombre) e webgl-utils.js (per la semplificazione del codice come ad esempio la creazione dei vari shader program utilizzati).

💥 Particolarità
Quando viene spostato un oggetto in realtà viene cancellato dalla scena e viene aggiunto in una posizione diversa, in base alla direzione in cui è stato spostato in precedenza.
Anche i colori della Skybox possono essere modificati dal menù in basso a sinistra, nella sezione colori, così avendo lo Skybox bianco, si può scegliere qualsiasi combinazione di colore.
Una mia immagine (come da richiesta) si trova nel quadro, che è possibile aggiungere attraverso il menù in basso a destra.
🔭 Lavori Futuri
In futuro si potrebbe espendare e migliorare il gioco aggiungendo diverse cose, ad esempio:

Oggetti e scene: potrebbe essere possibile aggiungere altri oggetti e altre stanze. Oltre a questo sarebbe bello implemetare la collissione, la gravità e la rotazione degli oggetti.

Obiettivi: fare dei livelli sempre più difficili e in questi livelli copiare l'arredamento di un'altra stanza o ricrearlo in modo da fare entrare tutti gli oggetti in essa. Per fare questo sarebbe necessario aggiungere ulteriori stanze e oggetti, così da non rendere il gioco monotono.

Caricamento e download di oggetti e scene: una cosa che avrebbe richiesto molto più tempo ma che mi sarebbe piaciuto implemetare è il caricamento online (tramite un server) di diversi oggetti e scene (file obj e mtl, incluse texture) e la possibilità di scaricarli in locale, magari per modificarli a proprio piacimento.
