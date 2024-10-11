/**
 * Oggetti di scena.
 */
const objects = [
    { name: 'Quadro', position: [0, 0, 0] },
    { name: 'Letto', position: [-0.2, -2, 0] },
    { name: 'Orologio', position: [-1.5, -4, 4.5] },
    { name: 'Comodino', position: [2, -2.2, 0] },
    { name: 'VinileErnia', position: [1.2, -3.8, 4.6] },
    { name: 'VinileUltimo', position: [2.5, -3.8, 4.6] },
    { name: 'Vaso', position: [1.5, -1.2, 2.55] },
    { name: 'Libreria', position: [-5.15, -2, 3.8] },
    { name: 'Lampada', position: [3.3, 3, 0] }
], select = document.querySelector("select[name='oggetto']");

// Utilizzato per riempire la select usata per spostare gli oggetti di scena.
objects.forEach(option => {
    const optionEl = document.createElement("option");
    optionEl.value = option.name;
    optionEl.textContent = option.name;
    select.appendChild(optionEl);
});

/**
 * Variabile di utilità per gli oggetti comodino/vaso nella funzione addObject(obj, position).
 */
var sopra = false;

/**
 * Crea un'interfaccia grafica utente (GUI) utilizzando la libreria dat.gui.
 * La GUI consente di modificare alcune impostazioni della scena,
 * come l'abilitazione o la disabilitazione della skybox, lo switch tra skybox diverse,
 * l'abilitazione del rendereing con shadow map, e la modifica della posizione,
 * della direzione e dei colori della luce, nonché delle opzioni di frustum.
 * Inoltre consente di mostrare o meno il Frustum.
 * La GUI viene aggiunta all'elemento HTML con id "gui".
 * @param {*} scene 
 */
function add_dat_gui(scene) {
    let gui = new dat.gui.GUI({ autoPlace: false });

    let skybox_folder = gui.addFolder('Impostazioni Skybox');
    scene['On/Off Skybox'] = () => scene.toggle_skybox();
    skybox_folder.add(scene, 'On/Off Skybox');
    scene['Switch Skybox'] = () => scene.switch_skybox();
    skybox_folder.add(scene, 'Switch Skybox');

    let light_folder = gui.addFolder('Impostazioni luci/ombre');
    scene['On Shadow Map'] = () => scene.toggle_shadows();
    light_folder.add(scene, 'On Shadow Map');
    add_light_position_folder(light_folder, scene.light.position);
    add_light_direction_folder(light_folder, scene.light.direction);
    add_light_color_folder(light_folder, scene.light.color);
    add_shadow_folder(light_folder, scene.shadow);
    light_folder.add(scene.shadow, 'showFrustum');

    document.getElementById("gui").append(gui.domElement);
}

/**
 * Cartella nella GUI per la posizione della luce.
 * @param {*} parent 
 * @param {*} position 
 */
function add_light_position_folder(parent, position) {
    let folder = parent.addFolder('Posizione luce');
    folder.add(position, 0, -10, 10, 0.25);
    folder.add(position, 1, 0, 10, 0.25);
    folder.add(position, 2, -10, 10, 0.25);
}

/**
 * Cartella nella GUI per la direzione della luce.
 * @param {*} parent 
 * @param {*} direction 
 */
function add_light_direction_folder(parent, direction) {
    let folder = parent.addFolder('Direzione luce');
    folder.add(direction, 0, -10, 10, 0.25);
    folder.add(direction, 1, -10, 10, 0.25);
    folder.add(direction, 2, -10, 10, 0.25);
}

/**
 * Cartella nella GUI per i colori della scena.
 * @param {*} parent 
 * @param {*} color 
 */
function add_light_color_folder(parent, color) {
    let folder = parent.addFolder('Colori');
    folder.add(color, 0, 0.1, 1, 0.05);
    folder.add(color, 1, 0.1, 1, 0.05);
    folder.add(color, 2, 0.1, 1, 0.05);
}

/**
 * Cartella nella GUI per le impostazioni della luce e delle ombre.
 * @param {*} parent 
 * @param {*} shadow 
 */
function add_shadow_folder(parent, shadow) {
    let folder = parent.addFolder('Opzioni luci/ombre');
    folder.add(shadow, 'fov', 30, 180, 15);
    folder.add(shadow, 'projWidth', 1, 10, 1);
    folder.add(shadow, 'projHeight', 1, 10, 1);
    folder.add(shadow, 'zFarProj', 1, 30, 1);
    folder.add(shadow, 'bias', -0.001, 0, 0.0001);
}

/**
 * Crea un oggetto per la scena.
 * @param {*} obj 
 * @param {*} position 
 * @returns object
 */
function createObj(obj, position) {
    return object = {
        name: obj,
        obj_source: `./data/${obj}/${obj}.obj`,
        mtl_source: `./data/${obj}/${obj}.mtl`,
        position: position
    };
}

/**
 * Utilizzata per aggiungere un oggetto alla scena, specificato dalla variabile "obj",
 * con una posizione specificata dalla variabile "position".
 * La funzione controlla se l'oggetto è già presente nella scena e, in caso contrario, lo aggiunge,
 * altrimenti rimuove l'oggetto dalla scena.
 * Inoltre, la funzione fa alcune verifiche specifiche per gli oggetti "comodino" e "vaso"
 * per assicurare che siano posizionati correttamente nella scena.
 * Infine, la funzione richiama il metodo reload_scene() per aggiornare la scena.
 * @param {*} obj 
 * @param {*} position 
 */
function addObject(obj, position) {
    var pos, object = createObj(obj, position);

    if (object.name === 'Comodino')
        scene.mesh_list.forEach(ecco => {
            if (ecco.name.includes("Vaso"))
                if (!sopra) {
                    const vaso = createObj('Vaso', [1.5, -1.2, 2.55]);
                    scene.objectsToRemove.push(vaso);
                    scene.objectsToAdd.push(vaso);
                    sopra = !sopra;
                } else {
                    const vaso = createObj('Vaso', [1.5, -1.2, 0]);
                    scene.objectsToRemove.push(vaso);
                    scene.objectsToAdd.push(vaso);
                }
        });
    else if (object.name === 'Vaso') {
        scene.mesh_list.forEach(ecco => {
            if (ecco.name.includes("Comodino")) sopra = !sopra;
        });
        if (!sopra) object.position = [1.5, -1.2, 0];
        else object.position = [1.5, -1.2, 2.55];
    }

    pos = scene.mesh_list.findIndex(ecco => ecco.name.includes(object.name));
    if (pos !== -1) {
        scene.objectsToRemove.push(object);
        if (object.name == 'Comodino') sopra = !sopra;
    }
    else scene.objectsToAdd.push(object);
    scene.reload_scene();
}

/**
 * Elimina tutti gli oggetti presenti nella scena.
 */
function clear() {
    let objectsToRemove = [];
    objects.forEach(obj => objectsToRemove.push(obj.name))
    for (let i = 0; i < scene.mesh_list.length; i++)
        if (objectsToRemove.includes(scene.mesh_list[i].name)) {
            scene.mesh_list.splice(i, 1);
            i--;
        }
    scene.reload_scene();
}

/**
 * Crea un menù per aggiungere o rimuovere oggetti in scena, inserendo tutti gli oggetti presenti in objects.
 * @param {*} scene 
 */
function modify(scene) {
    let mod = new dat.gui.GUI({ autoPlace: false });

    scene['Svuota la stanza'] = () => clear();
    mod.add(scene, 'Svuota la stanza');

    for (const obj of objects) {
        scene[obj.name] = () => addObject(obj.name, obj.position);
        mod.add(scene, obj.name);
    }

    scene['Inserisci tutti'] = () => {
        clear();
        for (const obj of objects) scene.objectsToAdd.push(createObj(obj.name, obj.position));
        scene.reload_scene();
    };
    mod.add(scene, 'Inserisci tutti');
    document.getElementById("mod").append(mod.domElement);
}

/**
 * Registra alcuni eventi del mouse/touch sulla scena passata come parametro.
 * Quando uno degli eventi registrati si verifica,
 * viene cambiata la posizione della camera o il suo orientamento in base alla posizione del mouse/touch.
 * @param {*} scene 
 */
function add_touch_canvas(scene) {
    let drag = false, old_x, old_y;
    scene.canvas.addEventListener("pointerdown", handleEvent);
    scene.canvas.addEventListener("touchmove", handleEvent);
    scene.canvas.addEventListener("pointermove", handleEvent);
    scene.canvas.addEventListener("pointerup", handleEvent);
    scene.canvas.addEventListener("pointercancel", handleEvent);

    /**
     * Gestisce gli eventi del mouse/touch.
     * @param {*} e 
     */
    function handleEvent(e) {
        e.preventDefault();
        switch (e.type) {
            case "pointerdown":
                drag = true;
                old_x = e.pageX;
                old_y = e.pageY;
                break;
            case "pointermove":
                if (!drag) return;
                let dX = -(e.pageX - old_x) * 2 * Math.PI / scene.canvas.width;
                scene.camera.pan(-dX * 0.2);
                let dY = -(e.pageY - old_y) * 2 * Math.PI / scene.canvas.height;
                scene.camera.tilt(-dY * 0.2);
                old_x = e.pageX;
                old_y = e.pageY;
                break;
            case "pointerup":
            case "pointercancel":
                drag = false;
                break;
        }
    }
}

/**
 * Gestisce la logica di un controller bidimensionale per la scena 3D.
 * Utilizza l'elemento canvas HTML per disegnare un'immagine di un controller
 * e assegna azioni specifiche a diverse zone dell'immagine.
 * Quando l'utente fa clic o tocca una determinata zona dell'immagine del controller,
 * viene attivata un'azione specifica, come ad esempio il movimento in avanti nella scena 3D.
 * La funzione utilizza anche l'oggetto keyMap per associare le azioni del controller a determinate chiavi della tastiera.
 */

function canvas2DController() {
    let canvas = document.getElementById("canvas2d"),
        context = canvas.getContext("2d"),
        keyMap = { forward: "w", backward: "s", left: "a", right: "d", up: " ", down: "Shift" },
        image = new Image(150, 150);

    image.onload = function () { context.drawImage(this, 0, 0, image.width, image.height); }
    image.src = './data/immagini/Controller.jpg';

    context.font = '35px serif';
    context.fillText('⬆️', 210, 45);
    context.fillText('⬇️', 210, 125);

    function handleEvent(e) {
        const rect = canvas.getBoundingClientRect(), XY = { x: e.pageX - rect.left, y: e.pageY - rect.top }, eventType = e.type;

        if (document.forms.pad.controller.value === 'oggetto')
            keyMap = { forward: "ArrowUp", backward: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", up: "q", down: "e" };
        else keyMap = { forward: "w", backward: "s", left: "a", right: "d", up: " ", down: "Shift" };

        context.beginPath();
        context.rect(25, 0, 39, 39);
        if (context.isPointInPath(XY.x, XY.y)) {
            if (eventType === "pointerdown") scene.keys[keyMap.forward] = true;
            else scene.keys[keyMap.forward] = false;
        }

        context.beginPath();
        context.rect(25, 60, 39, 39);
        if (context.isPointInPath(XY.x, XY.y)) {
            if (eventType === "pointerdown") scene.keys[keyMap.backward] = true;
            else scene.keys[keyMap.backward] = false;
        }

        context.beginPath();
        context.rect(0, 30, 39, 39);
        if (context.isPointInPath(XY.x, XY.y)) {
            if (eventType === "pointerdown") scene.keys[keyMap.left] = true;
            else scene.keys[keyMap.left] = false;
        }

        context.beginPath();
        context.rect(64, 30, 39, 39);
        if (context.isPointInPath(XY.x, XY.y)) {
            if (eventType === "pointerdown") scene.keys[keyMap.right] = true;
            else scene.keys[keyMap.right] = false;
        }

        context.beginPath();
        context.rect(110, 10, 45, 25);
        if (context.isPointInPath(XY.x, XY.y)) {
            if (eventType === "pointerdown") scene.keys[keyMap.up] = true;
            else scene.keys[keyMap.up] = false;
        }

        context.beginPath();
        context.rect(110, 65, 45, 25);
        if (context.isPointInPath(XY.x, XY.y)) {
            if (eventType === "pointerdown") scene.keys[keyMap.down] = true;
            else scene.keys[keyMap.down] = false;
        }
    }

    canvas.addEventListener('pointerdown', handleEvent, false);
    canvas.addEventListener('pointerup', handleEvent, false);
}

/**
 * Converte un angolo in gradi a radianti,
 * utilizzando la relazione nota che un angolo di 1 grado equivale a pi/180 radianti. 
 * @param {*} d 
 */
function degToRad(d) { return d * Math.PI / 180; }