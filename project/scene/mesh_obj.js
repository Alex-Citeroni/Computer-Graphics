/**
 * Questa classe si occupa di tutti le funzionalità delle mesh visibili in scena, dal loro caricamento al render.
 * Il costruttore prende un oggetto in scene.js, contenente tutte le impostazioni come:
 *  1. Nome dell'oggetto
 *  2. Path per il file .obj
 *  3. Path per il file .mtl 
 *  4. Posizione dell’ oggetto rispetto all’origine
 *  5. Posizione iniziale dell’ oggetto
 *  6. Tutte le informazioni sulla mesh
 */
class MeshObj {
    constructor(obj, gl) {
        this.name = obj.name;
        this.obj_source = obj.obj_source;
        this.mtl_source = obj.mtl_source;
        this.position = obj.position;
        this.initialPosition = obj.position;
        this.mesh = [];
        this.mesh.sourceMesh = this.obj_source;
        this.mesh.fileMTL = this.mtl_source;

        /**
         * Dopo aver caricato la mesh, si occupa della creazione dei buffer,
         * utilizzando la funzione webglUtils.createBufferInfoFromArrays(gl, data),
         * per le varie componenti della mesh.
         */
        LoadMesh(gl, this.mesh).then(() => {
            const defaultMaterial = {
                diffuse: [1, 1, 1],
                diffuseMap: this.mesh.textures.defaultWhite,
                ambient: [0, 0, 0],
                specular: [1, 1, 1],
                shininess: 400,
                opacity: 1
            };
            let z = this.position[2], y = this.position[1], x = this.position[0];
            this.mesh.data.geometries.forEach(geom => {
                for (let i = 0; i < geom.data.position.length; i = i + 3) {
                    geom.data.position[i] += y;
                    geom.data.position[i + 1] += z;
                    geom.data.position[i + 2] += x;
                }
            });
            this.mesh.parts = this.mesh.data.geometries.map(({ material, data }) => {
                if (data.color) {
                    if (data.position.length === data.color.length) data.color = { numComponents: 3, data: data.color };
                } else data.color = { value: [1, 1, 1, 1] };
                const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
                return { material: { ...defaultMaterial, ...this.mesh.materials[material] }, bufferInfo };
            });
            this.ready = true;
        });
    }

    /**
     * Controlla se l'oggetto è pronto per il rendering e, in caso contrario, esce dalla funzione senza effettuare il rendering.
     * Viene utilizzato il programma di rendering specificato e vengono impostate le uniformi specificate
     * utilizzando la funzione webglUtils.setUniforms.
     * Poi viene calcola la matrice del mondo utilizzando una matrice di identità.
     * Infine, è utilizzato un ciclo for-of per iterare attraverso le parti del mesh dell'oggetto,
     * impostando i buffer, le caratteristiche dei vertici e le uniformi per ogni parte,
     * e infine esegue il rendering della parte utilizzando la funzione webglUtils.drawBufferInfo.
     * @param {*} gl oggetto WebGL
     * @param {*} programInfo contiene informazioni sul programma di rendering da utilizzare
     * @param {*} uniforms contiene le uniformi da utilizzare nel programma di rendering
     */
    render(gl, programInfo, uniforms) {
        if (!this.ready) return;
        gl.useProgram(programInfo.program);
        webglUtils.setUniforms(programInfo, uniforms);
        let u_world = m4.identity();
        for (const { bufferInfo, material } of this.mesh.parts) {
            webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
            webglUtils.setUniforms(programInfo, { u_world }, material);
            webglUtils.drawBufferInfo(gl, bufferInfo);
        }
    }
}

/**
 * Recupera un file mesh dalla fonte specificata.
 * Inizialmente utilizza la funzione "loadMeshFromOBJ" per recuperare i dati della mesh da un file OBJ,
 * se esiste un file MTL associato alla mesh,
 * il metodo utilizza la funzione fetch per recuperare il file MTL
 * e utilizzare la funzione "parseMTL" per analizzare i dati del file
 * e creare un oggetto di materiali utilizzabile dall'applicazione.
 * In seguito verifica se esiste una texture associata al materiale
 * e se non esiste la carica dalla risorsa specificata e la associa al materiale.
 * Infine, ritorna l'oggetto mesh completo con i materiali e le texture associate.
 * @param {*} gl 
 * @param {*} mesh 
 * @returns mesh
 */
async function LoadMesh(gl, mesh) {
    await loadMeshFromOBJ(mesh);
    if (mesh.fileMTL) {
        try {
            const response = await fetch(mesh.fileMTL), text = await response.text();
            mesh.data.materials = parseMTL(text);
        } catch (error) { handleError(error); }
        mesh.materials = mesh.data.materials;
        delete mesh.data.materials;
    }

    mesh.textures = { defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]) };
    let baseHref = mesh.sourceMesh.replace(/[^\/]*$/, '');
    for (const material of Object.values(mesh.materials))
        for (const [key1, filename] of Object.entries(material).filter(([key]) => key.endsWith('Map'))) {
            let texture = mesh.textures[filename];
            if (!texture) {
                texture = await createTexture(gl, baseHref + filename);
                mesh.textures[filename] = texture;
            }
            material[key1] = texture;
        }
    return mesh;
}

/**
 * Recupera un file mesh in formato OBJ dalla fonte specificata in mesh.sourceMesh.
 * Successivamente utilizza una funzione parseOBJ per analizzare i dati del file
 * e creare un oggetto mesh utilizzabile dall'applicazione.
 * In caso di errore durante la richiesta del file, utilizza una funzione handleError per gestire l'errore.
 * @param {*} mesh 
 */
async function loadMeshFromOBJ(mesh) {
    return $.ajax({
        type: "GET",
        url: mesh.sourceMesh,
        dataType: "text",
        async: false,
        success: parseobjFile,
        error: handleError
    });
    function parseobjFile(result) { mesh.data = parseOBJ(result) }
}

/**
 * Gestisce gli eventuali errori.
 * @param {*} errorMessage 
 */
function handleError(errorMessage) { console.error('Error : ' + errorMessage); }

/**
 * Verifica se un numero è una potenza di 2 utilizzando l'operatore bitwise.
 * @param {*} value 
 */
function isPowerOf2(value) { return (value & (value - 1)) === 0; }

/**
 * Utilizza WebGL per creare una texture e caricare un'immagine su di essa.
 * Il parametro gl rappresenta un contesto WebGL, path rappresenta il percorso dell'immagine,
 * fileName rappresenta il nome dell'immagine.
 * In primis, viene creata una texture utilizzando il contesto WebGL e viene associata al contesto.
 * Successivamente, se viene passato un fileName, viene creata un'immagine
 * e viene assegnato un gestore di evento all'evento onload.
 * Nel gestore di evento, vengono impostati alcuni parametri di pixel,
 * viene associata la texture al contesto e viene utilizzata gl.texImage2D per caricare l'immagine sulla texture.
 * Se le dimensioni dell'immagine sono potenze di 2, vengono generati mipmap per la texture,
 * altrimenti imposta i parametri di wrapping e filtraggio per la texture.
 * Infine, viene impostato il path dell'immagine come src dell'immagine.
 * @param {*} gl 
 * @param {*} path 
 * @param {*} fileName 
 * @returns texture creata
 */
async function loadTexture(gl, path, fileName) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const level = 0, internalFormat = gl.RGBA, width = 1, height = 1, border = 0, srcFormat = gl.RGBA,
        srcType = gl.UNSIGNED_BYTE, pixel = new Uint8Array([255, 255, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    if (fileName) {
        const image = new Image();
        image.onload = function () {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) gl.generateMipmap(gl.TEXTURE_2D);
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
        };
        image.src = path + fileName;
    }
    return texture;
}

/**
 * Analizza un file MTL (Material Template Library) e restituisce un oggetto che contiene i materiali definiti nel file.
 * Il testo del file MTL viene passato come parametro e viene elaborato utilizzando un'altra funzione chiamata splitText.
 * Il testo del file viene esaminato riga per riga e vengono cercate parole chiave specifiche,
 * come "newmtl" e "map_Kd" e vengono eseguite determinate azioni in base alla parola chiave trovata.
 * Ad esempio, quando viene trovata la parola chiave "newmtl",
 * viene creato un nuovo materiale e quando viene trovata la parola chiave "map_Kd",
 * viene impostato il percorso del file immagine per la mappa diffuse del materiale.
 * @param {*} text 
 * @returns materials
 */
function parseMTL(text) {
    let material;
    const materials = {},
        keywords = {
            newmtl(_parts, unparsedArgs) { material = {}; materials[unparsedArgs] = material; },
            Ns(parts) { material.shininess = parseFloat(parts[0]); },
            Ka(parts) { material.ambient = parts.map(parseFloat); },
            Kd(parts) { material.diffuse = parts.map(parseFloat); },
            Ks(parts) { material.specular = parts.map(parseFloat); },
            Ke(parts) { material.emissive = parts.map(parseFloat); },
            map_Kd(_parts, unparsedArgs) { material.diffuseMap = unparsedArgs; },
            map_Ns(_parts, unparsedArgs) { material.specularMap = unparsedArgs; },
            map_Bump(_parts, unparsedArgs) { material.normalMap = unparsedArgs; },
            Ni(parts) { material.opticalDensity = parseFloat(parts[0]); },
            d(parts) { material.opacity = parseFloat(parts[0]); },
            illum(parts) { material.illum = parseInt(parts[0]); }
        };
    splitText(keywords, text);
    return materials;
}

/**
 * Splitta il testo in righe e per ogni riga rimuove gli spazi vuoti iniziali e finali e verifica se la riga è vuota o inizia con un "#".
 * Se la riga non è vuota o non inizia con un "#", estrae la parola chiave (keyword) e gli argomenti non elaborati (unparsedArgs)
 * utilizzando un'espressione regolare.
 * Cerca poi un gestore (handler) per la parola chiave nell'oggetto keywords e se esiste,
 * chiama il gestore passando come parametri parts e unparsedArgs.
 * Se non esiste un gestore per la parola chiave, viene stampato un avviso.
 * @param {*} keywords 
 * @param {*} text 
 */
function splitText(keywords, text) {
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) continue;
        const m = /(\w*)(?: )*(.*)/.exec(line);
        if (!m) continue;
        const [, keyword, unparsedArgs] = m, parts = line.split(/\s+/).slice(1), handler = keywords[keyword];
        if (!handler) {
            console.debug('unhandled keyword:', keyword);
            continue;
        }
        handler(parts, unparsedArgs);
    }
}

/**
 * Crea una texture con un solo pixel utilizzando la libreria WebGL.
 * Il pixel è specificato come un array di 4 elementi RGBA,
 * dove ogni elemento è un valore intero compreso tra 0 e 255.
 * La texture creata viene poi associata al contesto WebGL attualmente in uso e restituita dalla funzione. 
 * @param {*} gl 
 * @param {*} pixel 
 * @returns texture
 */
function create1PixelTexture(gl, pixel) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(pixel));
    return texture;
}

/**
 * Carica un'immagine dall'URL specificato e la utilizza per creare una texture WebGL.
 * La funzione utilizza la libreria WebGL per creare una texture vuota,
 * quindi carica l'immagine utilizzando l'oggetto Image e assegna l'immagine come dati della texture.
 * Successivamente, la funzione utilizza isPowerOf2 per verificare se l'immagine è una potenza di 2 in entrambe le dimensioni.
 * In caso contrario, la funzione imposta i parametri di wrapping e filtraggio per evitare problemi di distorsione dell'immagine.
 * @param {*} gl 
 * @param {*} url 
 * @returns texture
 */
async function createTexture(gl, url) {
    const texture = create1PixelTexture(gl, [128, 192, 255, 255]), image = new Image();
    image.src = url;
    image.addEventListener('load', function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) gl.generateMipmap(gl.TEXTURE_2D);
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    });
    return texture;
}


/**
 * Prende in input una stringa text contenente un file OBJ e ne estrae le geometrie e i materiali.
 * @param {*} text 
 * @returns oggetto contenente le geometrie e i materiali estratti dal testo
 */
function parseOBJ(text) {
    /**
     * Vengono inizializzate diverse variabili, tra cui una serie di array per posizioni,
     * texture, normali e colori dei vertici del modello 3D, un array per i materiali e uno per le geometrie.
     */
    const objPositions = [[0, 0, 0]], objTexcoords = [[0, 0]], objNormals = [[0, 0, 0]], objColors = [[0, 0, 0]],
        objVertexData = [objPositions, objTexcoords, objNormals, objColors], materialLibs = [], geometries = [];
    let webglVertexData = [[], [], [], []], geometry, groups = ['default'], material = 'default', object = 'default';

    /**
     * Resetta la geometria corrente se esiste e ha dati.
     */
    function newGeometry() {
        if (geometry && geometry.data.position.length) geometry = undefined;
    }

    /**
     * Utilizzato per associare i diversi comandi del file OBJ a funzioni specifiche.
     */
    const keywords = {
        v(parts) {
            if (parts.length > 3) {
                objPositions.push(parts.slice(0, 3).map(parseFloat));
                objColors.push(parts.slice(3).map(parseFloat));
            } else objPositions.push(parts.map(parseFloat));
        },
        vn(parts) { objNormals.push(parts.map(parseFloat)); },
        vt(parts) { objTexcoords.push(parts.map(parseFloat)); },
        f(parts) {
            if (!geometry) {
                const position = [], texcoord = [], normal = [], color = [];
                webglVertexData = [position, texcoord, normal, color];
                geometry = { object, groups, material, data: { position, texcoord, normal, color } };
                geometries.push(geometry);
            }
            const numTriangles = parts.length - 2;
            for (let tri = 0; tri < numTriangles; ++tri) {
                addVertex(parts[0]);
                addVertex(parts[tri + 1]);
                addVertex(parts[tri + 2]);
            }
        },
        s: () => { },
        mtllib(_parts, unparsedArgs) { materialLibs.push(unparsedArgs); },
        usemtl(_parts, unparsedArgs) { material = unparsedArgs; newGeometry(); },
        g(parts) { groups = parts; newGeometry(); },
        o(_parts, unparsedArgs) { object = unparsedArgs; newGeometry(); }
    };

    /**
     * Viene chiamata per ogni vertice del modello 3D.
     * Utilizza i dati del vertice per aggiungere informazioni alle varie strutture di dati del modello 3D.
     * @param {*} vert 
     */
    function addVertex(vert) {
        const vertData = vert.split('/');
        for (let i = 0; i < 3; i++) {
            const objIndex = parseInt(vertData[i]);
            webglVertexData[i].push(...objVertexData[i][objIndex]);
            if (objColors.length > 1) geometry.data.color.push(...objColors[objIndex]);
        }
    }

    splitText(keywords, text);

    // Rimuove gli array vuoti dai dati delle geometrie
    for (const geometry of geometries)
        geometry.data = Object.fromEntries(Object.entries(geometry.data).filter(([, array]) => array.length > 0));

    return { geometries, materialLibs };
}