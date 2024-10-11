/**
 * Quando viene creato un nuovo oggetto scena vengono eseguite le seguenti operazioni:
 *  1. Viene preso il WebGL rendering context dal canvas
 *  2. Vengono impostate le dimensioni della viewport
 *  3. Viene compilato il vertex e il fragment shader
 *  4. Viene letto un oggetto per ottenere la lista delle mesh da mostrare
 *  5. Per ogni elemento mesh nell'oggetto viene creato un nuovo mesh_obj e salvato in una lista interna all'oggetto scena
 *  6. Vengono inizializzate la camera, le keys (struttura per la gestione dei tasti della tastiera) e la light (oggetto luce di scena)
 */

class Scene {
    constructor(canvas_id, obj_path) {
        // Contesto WebGL del canvas
        this.canvas = document.getElementById(canvas_id);
        this.gl = this.canvas.getContext("webgl");
        this.gl.getExtension("OES_standard_derivatives");
        // Controlla se WebGL è supportato
        if (!this.gl) {
            alert("WebGL non è supportato!");
            throw new Error("WebGL non è supportato!");
        }
        this.ext = this.gl.getExtension('WEBGL_depth_texture');
        if (!this.ext) return alert('need WEBGL_depth_texture');
        this.gl.enable(this.gl.DEPTH_TEST);
        this.program = webglUtils.createProgramInfo(this.gl, ["base-vertex-shader", "base-fragment-shader"]);
        // Prepara la skybox
        this.prepareSkybox();
        // Prepara le ombre
        this.prepareShadows();
        // Array utilizzato per memorizzare tutte le mesh utilizzate nella scena
        this.mesh_list = [];
        this.load_mesh(obj_path);
        // Crea una camera per questa scena
        this.camera = new Camera([10, 2, 10], [0, 2, 0], [0, 1, 0]);
        // Tipo di camera 
        this.cameraType = 'Camera';
        // Tasti premuti
        this.keys = {};
        // Luce utilizzata nella scena
        this.light = { position: [10, 2, 10], direction: [1, 1, 1], color: [1.0, 1.0, 1.0], ambient: [0.1, 0.1, 0.1] };
        // Oggetto da spostare
        this.oggetto = document.forms.MyForm.oggetto.value;
        // Skybox
        this.faceInfos = [];
        // Switch Skybox
        this.switch = false;
        // Oggetti da aggiungere alla scena
        this.objectsToAdd = [];
        // Oggetti da rimuovere nella scena
        this.objectsToRemove = [];
    }

    /**
     * Muove l'oggetto selezionato in base a quale tasto viene premuto.
     * @param {*} click 
     */
    moveObj(click) {
        this.mesh_list.forEach(ecco => {
            if (ecco.name.includes(document.forms.MyForm.oggetto.value)) {
                var x = ecco.position[1], z = ecco.position[0], y = ecco.position[2];
                switch (click) {
                    case "ArrowUp": ecco.position = [z, x + 0.1, y];
                        break;
                    case "ArrowDown": ecco.position = [z, x - 0.1, y];
                        break;
                    case "ArrowLeft": ecco.position = [z + 0.1, x, y];
                        break;
                    case "ArrowRight": ecco.position = [z - 0.1, x, y];
                        break;
                    case "q": ecco.position = [z, x, y + 0.1];
                        break;
                    case "e": ecco.position = [z, x, y - 0.1];
                        break;
                }
            }
        });

        this.reload_scene();
    }

    /**
     * Aggiorna la scena in base alle modifiche effettuate dall'utente.
     * Utilizza la funzione map() per creare un nuovo array di oggetti MeshObj,
     * che vengono creati solo se il nome dell'oggetto include quello specificato dall'utente nella form
     * e se la posizione dell'oggetto non è uguale alla sua posizione iniziale.
     * Utilizza la funzione filter() per rimuovere dalla lista di oggetti MeshObj quelli indicati dall'utente come da rimuovere.
     * Utilizza il metodo load_mesh() per caricare gli oggetti indicati dall'utente come da aggiungere.
     * Pulisce gli array objectsToRemove e objectsToAdd.
     */
    async reload_scene() {
        this.mesh_list = this.mesh_list.map(elem => {
            if (elem.name.includes(document.forms.MyForm.oggetto.value) && elem.position !== elem.initialPosition)
                return new MeshObj({ ...elem, position: elem.position }, this.gl);
            return elem;
        });
        this.mesh_list = this.mesh_list.filter(elem => !this.objectsToRemove.find(removeElem => removeElem.name === elem.name));
        await this.load_mesh(this.objectsToAdd);
        this.objectsToRemove.length = 0;
        this.objectsToAdd.length = 0;
    }

    /**
     * Carica nuovi oggetti nella scena.
     * Prende in input una lista di percorsi degli oggetti (obj_path)
     * e per ogni oggetto crea un nuovo oggetto MeshObj o Mirror,
     * a seconda che l'oggetto debba essere specchiato o meno.
     * Infine, aggiunge questi nuovi oggetti alla lista di oggetti esistenti nella scena (this.mesh_list)
     * utilizzando il metodo push() di Array.
     * @param {*} obj_path 
     */
    async load_mesh(obj_path) {
        const newMeshList = obj_path.map(obj => {
            return obj.mirror ? new Mirror(obj, this.gl) : new MeshObj(obj, this.gl);
        });
        this.mesh_list.push(...newMeshList);
    }

    /**
     * Calcola la matrice di proiezione utilizzando la funzione perspective della libreria m4.js.
     * @returns Projection Matrix
     */
    projectionMatrix() {
        return m4.perspective(degToRad(60), this.gl.canvas.clientWidth / this.gl.canvas.clientHeight, 0.1, 200);
    }

    /**
     * Funzione che legge gli input da tastiera e chiama le funzioni di movimento della camera e degli oggetti a ogni tasto.
     */
    key_controller() {
        let step = 0.05;
        if (this.keys["w"]) this.camera.dolly(step);
        if (this.keys["s"]) this.camera.dolly(-step);
        if (this.keys["a"]) this.camera.truck(-step);
        if (this.keys["d"]) this.camera.truck(step);
        if (this.keys[" "]) this.camera.pedestal(step);
        if (this.keys["Shift"]) this.camera.pedestal(-step);
        if (this.keys["7"]) this.camera.cant(-step);
        if (this.keys["9"]) this.camera.cant(step);
        if (this.keys["1"]) this.camera.tilt(step);
        if (this.keys["3"]) this.camera.tilt(-step);
        if (this.keys["4"]) this.camera.pan(step);
        if (this.keys["6"]) this.camera.pan(-step);
        if (this.keys["r"]) this.camera.align();
        if (this.keys["ArrowUp"]) this.moveObj("ArrowUp");
        if (this.keys["ArrowDown"]) this.moveObj("ArrowDown");
        if (this.keys["ArrowLeft"]) this.moveObj("ArrowLeft");
        if (this.keys["ArrowRight"]) this.moveObj("ArrowRight");
        if (this.keys["q"]) this.moveObj("q");
        if (this.keys["e"]) this.moveObj("e");
    }

    /**
     * Cambia la camera attuale nella scena.
     * Utilizza la proprietà cameraType per controllare il tipo di camera attuale
     * e assegnare una nuova istanza della classe corretta in base al tipo di camera attuale.
     * In questo modo, quando si chiama la funzione switch_camera, essa passa dalla camera attuale all'altra disponibile.
     */
    switch_camera() {
        if (this.cameraType === "Animated Camera") {
            this.camera = new Camera([10, 2, 10], [0, 2, 0], [0, 1, 0]);
            this.cameraType = "Camera";
        } else {
            this.camera = new AnimatedCamera();
            this.cameraType = "Animated Camera";
        }
    }

    /**
     * Carica la texture cubemap per lo skybox.
     */
    async prepareSkybox() {
        this.skybox = {};
        this.skybox.programInfo = await webglUtils.createProgramInfo(this.gl, ["skybox-vertex-shader", "skybox-fragment-shader"]);
        this.skybox.quadBufferInfo = webglUtils.createBufferInfoFromArrays(this.gl,
            {
                position: { numComponents: 2, data: [-1, -1, 1, -1, -1, 1, 1, 1] },
                normal: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
                texcoord: [0, 0, 1, 0, 0, 1, 1, 1],
                indices: [0, 1, 2, 2, 1, 3]
            });
        this.skybox.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.skybox.texture);
        if (!this.switch)
            this.faceInfos = [{ target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: "./data/skybox/right.png" },
            { target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: "./data/skybox/left.png" },
            { target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: "./data/skybox/top.png" },
            { target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: "./data/skybox/bottom.png" },
            { target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: "./data/skybox/front.png" },
            { target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: "./data/skybox/back.png" }];
        else {
            const url = "./data/skybox/bianco.jpg";
            this.faceInfos = [{ target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: url },
            { target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: url },
            { target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: url },
            { target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: url },
            { target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: url },
            { target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: url }];
        }

        const level = 0, internalFormat = this.gl.RGBA, width = 1024, height = 1024, format = this.gl.RGBA, type = this.gl.UNSIGNED_BYTE,
            images = await Promise.all(this.faceInfos.map(async (faceInfo) => {
                this.gl.texImage2D(faceInfo.target, level, internalFormat, width, height, 0, format, type, null);
                const image = new Image();
                image.src = faceInfo.url;
                await new Promise((resolve) => image.addEventListener("load", resolve));
                return { target: faceInfo.target, image };
            }));

        images.forEach(({ target, image }) => {
            this.gl.texImage2D(target, level, internalFormat, format, type, image);
        });

        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        this.skybox.enable = true;
    }

    /**
     * Attiva o disattiva lo skybox cambiando il valore di skybox.enable.
     * Se impostato a falso, la fase di disegno dello skybox viene saltata.
     */
    toggle_skybox() { this.skybox.enable = !this.skybox.enable; }

    /**
     * Cambia Skybox
     */
    switch_skybox() {
        if (this.skybox.enable) {
            this.switch = !this.switch;
            this.prepareSkybox();
        }
    }

    /**
     * Funzione che si occupa della preparazione dei dati per la gestione e creazione delle ombre:
     *  1. Compila le shaders
     *  2. Crea una texture utilizzata come depth map
     *  3. Imposta i valori utilizzati in fase di rendering
     */
    async prepareShadows() {
        // Obj contenente tutte le variabili utilizzate per le ombre
        if (!this.shadow && this.gl) {
            this.shadow = {
                depthTexture: this.gl.createTexture(),
                depthTextureSize: 4096,
                depthFramebuffer: this.gl.createFramebuffer(),
                enable: false,
                fov: 60,
                projWidth: 2,
                projHeight: 2,
                zFarProj: 20,
                bias: -0.0001,
                showFrustum: false
            };
            // Disegna dal punto di vista della luce
            this.colorProgramInfo = await webglUtils.createProgramInfo(this.gl, ['color-vertex-shader', 'color-fragment-shader']);
            // Disegna dal punto di vista della camera
            this.textureProgramInfo = await webglUtils.createProgramInfo(this.gl, ['vertex-shader-3d', 'fragment-shader-3d']);
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadow.depthTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT, this.shadow.depthTextureSize, this.shadow.depthTextureSize, 0, this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.shadow.depthFramebuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, this.shadow.depthTexture, 0);
    }

    /**
     * Attiva o disattiva le ombre.
     */
    toggle_shadows() { this.shadow.enable = !this.shadow.enable; }
}

/**
 * Disegna tutto nella scena, eseguendo le seguenti operazioni:
 *  1. Ridimensiona il canvas e il viewport in base alla grandezza della finestra
 *  2. Chiama scene.key_controller() per la gestione degli input da tastiera
 *  3. Calcola la matrice di proiezione e vista
 *  4. La matrice di vista viene ottenuta da scene.camera che può essere un oggetto Camera o Animated_Camera
 *  5. A seconda del valore di scene.shadow.enable, esegue il rendering della scena con ombre o esegue il rendering della scena senza ombre
 *  6. A seconda del valore di scene.skybox.enable disegna o meno lo skybox
 */
function draw() {
    const displayWidth = scene.gl.canvas.clientWidth, displayHeight = scene.gl.canvas.clientHeight;
    if (scene.gl.canvas.width !== displayWidth || scene.gl.canvas.height !== displayHeight) {
        scene.gl.canvas.width = displayWidth;
        scene.gl.canvas.height = displayHeight;
    }
    scene.gl.viewport(0, 0, scene.gl.canvas.width, scene.gl.canvas.height);
    scene.key_controller();
    scene.gl.enable(scene.gl.CULL_FACE);
    scene.gl.enable(scene.gl.DEPTH_TEST);
    // Se un materiale di un oggetto ha opacità minore di uno, questo verrà disegnato con una trasparenza
    scene.gl.enable(scene.gl.BLEND);
    scene.gl.blendFunc(scene.gl.SRC_ALPHA, scene.gl.ONE_MINUS_SRC_ALPHA);
    let proj = scene.projectionMatrix(), view = scene.camera.getViewMatrix();

    // Disegna la scena sul canvas proiettando la texture di profondità nella scena
    function bindFrameBufferNull() {
        scene.gl.bindFramebuffer(scene.gl.FRAMEBUFFER, null);
        scene.gl.viewport(0, 0, scene.gl.canvas.width, scene.gl.canvas.height);
        scene.gl.clearColor(0, 0, 0, 1);
        scene.gl.clear(scene.gl.COLOR_BUFFER_BIT | scene.gl.DEPTH_BUFFER_BIT);
    }

    if (scene.shadow.enable) {
        const lightWorldMatrix = m4.lookAt(scene.light.position, scene.light.direction, [0, 1, 0]),
            lightProjectionMatrix = m4.perspective(degToRad(scene.shadow.fov), scene.shadow.projWidth / scene.shadow.projHeight, 0.5, scene.shadow.zFarProj);
        let sharedUniforms = {
            u_view: m4.inverse(lightWorldMatrix),
            u_projection: lightProjectionMatrix,
            u_bias: scene.shadow.bias,
            u_textureMatrix: m4.identity(),
            u_shadowMap: scene.shadow.depthTexture,
            u_lightDirection: lightWorldMatrix.slice(8, 11)
        };
        scene.gl.bindFramebuffer(scene.gl.FRAMEBUFFER, scene.shadow.depthFramebuffer);
        scene.gl.viewport(0, 0, scene.shadow.depthTextureSize, scene.shadow.depthTextureSize);
        scene.gl.clear(scene.gl.COLOR_BUFFER_BIT | scene.gl.DEPTH_BUFFER_BIT);
        scene.mesh_list.forEach(m => m.render(scene.gl, scene.colorProgramInfo, sharedUniforms));
        bindFrameBufferNull();
        let textureMatrix = m4.identity();
        textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
        textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
        textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
        textureMatrix = m4.multiply(textureMatrix, m4.inverse(lightWorldMatrix));
        sharedUniforms = {
            u_view: view,
            u_projection: proj,
            u_bias: scene.shadow.bias,
            u_textureMatrix: textureMatrix,
            u_shadowMap: scene.shadow.depthTexture,
            u_lightDirection: lightWorldMatrix.slice(8, 11),
            u_worldCameraPosition: scene.camera.getPosition()
        };
        scene.mesh_list.forEach(m => m.render(scene.gl, scene.textureProgramInfo, sharedUniforms));
        if (scene.shadow.showFrustum) {
            scene.gl.useProgram(scene.colorProgramInfo.program);
            const cubeLinesBufferInfo = webglUtils.createBufferInfoFromArrays(scene.gl, {
                position: [-1, -1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1],
                indices: [0, 1, 1, 3, 3, 2, 2, 0, 4, 5, 5, 7, 7, 6, 6, 4, 0, 4, 1, 5, 3, 7, 2, 6]
            });
            webglUtils.setBuffersAndAttributes(scene.gl, scene.colorProgramInfo, cubeLinesBufferInfo);
            const mat = m4.multiply(lightWorldMatrix, m4.inverse(lightProjectionMatrix));
            webglUtils.setUniforms(scene.colorProgramInfo, {
                u_color: [1, 1, 1, 1],
                u_view: view,
                u_projection: proj,
                u_world: mat
            });
            webglUtils.drawBufferInfo(scene.gl, cubeLinesBufferInfo, scene.gl.LINES);
        }
    } else {
        bindFrameBufferNull()
        const sharedUniforms = {
            // Ambiente
            u_ambientLight: scene.light.ambient,
            // Direzione della luce          
            u_lightDirection: m4.normalize(scene.light.direction),
            // Colore della luce
            u_lightColor: scene.light.color,
            // Matrice     
            u_view: view,
            // Matrice di proiezione
            u_projection: proj,
            // Posizione della camera     
            u_viewWorldPosition: scene.camera.getPosition(),
            // Posizione della luce  
            u_lightPosition: scene.light.position
        };
        scene.mesh_list.forEach(m => m.render(scene.gl, scene.program, sharedUniforms));
    }

    if (scene.skybox.enable) {
        view[12] = 0;
        view[13] = 0;
        view[14] = 0;
        scene.gl.depthFunc(scene.gl.LEQUAL);
        scene.gl.useProgram(scene.skybox.programInfo.program);
        webglUtils.setBuffersAndAttributes(scene.gl, scene.skybox.programInfo, scene.skybox.quadBufferInfo);
        webglUtils.setUniforms(scene.skybox.programInfo, {
            u_viewDirectionProjectionInverse: m4.inverse(m4.multiply(proj, view)),
            u_skybox: scene.skybox.texture,
            u_lightColor: scene.light.color
        });
        webglUtils.drawBufferInfo(scene.gl, scene.skybox.quadBufferInfo);
        scene.gl.depthFunc(scene.gl.LESS);
    }

    requestAnimationFrame(draw);
}