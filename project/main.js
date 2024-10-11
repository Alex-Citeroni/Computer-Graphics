/**
 * Applicazione WebGL:
 *  1. Crea una nuova scena
 *  2. Aggiunge un listener di eventi per tastiera
 *  3. Aggiunge il controller 2D
 *  4. Aggiunge i menù
 *  5. Aggiunge i listener del mouse e del touch
 *  6. Disegna la scena
 */
function main() {
    window["scene"] = new Scene("canvas", [createObj('stanzetta', [0, 0, 0])]);
    window.addEventListener('keydown', e => scene.keys[e.key] = true);
    window.addEventListener('keyup', e => scene.keys[e.key] = false);
    canvas2DController();
    add_dat_gui(scene);
    modify(scene);
    add_touch_canvas(scene);
    draw(scene);
}

main();