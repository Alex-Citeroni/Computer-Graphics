/**
 * Questa classe crea una camera che permette il movimento libero nelle spazio 3D.
 * L’orientamento della camera è definito dai seguenti parametri.
 *  1. position: posizione nello spazio della camera.
 *  2. forward: vettore che punta davanti la camera.
 *  3. right:vettore che punta alla destra della camera.
 *  4. up: vettore che punta verso l’alto.
 */
class Camera {
    constructor(pos, lookAt, up) {
        this.position = pos;
        this.forward = m4.normalize(m4.subtractVectors(lookAt, pos));
        this.right = m4.normalize(m4.cross(this.forward, up));
        this.up = m4.normalize(m4.cross(this.right, this.forward));
    }

    /**
     * Ruota la camera intorno al vettore right (verso l'alto o verso il basso).
     * La rotazione viene applicata sia al vettore forward (che rappresenta la direzione in cui la camera sta guardando)
     * che al vettore up (che rappresenta la direzione "su" della camera).
     * I vettori forward e up vengono quindi normalizzati per assicurare che la lunghezza rimanga 1.
     * @param {*} step 
     */
    tilt(step) {
        let rotation = m4.axisRotation(this.right, step / 2);
        this.forward = m4.transformPoint(rotation, this.forward);
        this.up = m4.transformPoint(rotation, this.up);
        this.forward = m4.normalize(this.forward);
        this.up = m4.normalize(this.up);
    }

    /**
     * Ruota la camera intorno all'asse verticale (asse Y, this.up), facendo una panoramica a sinistra oa destra.
     * La rotazione viene calcolata utilizzando la funzione m4.axisRotation(),
     * che prende come input l'asse intorno al quale ruotare e l'angolo di rotazione (step) e restituisce una matrice di rotazione.
     * La matrice di rotazione viene quindi utilizzata per trasformare le proprietà forward e right della camera,
     * che rappresentano la direzione in cui la camera guarda e la direzione a destra rispettivamente.
     * Infine, forward e right vengono normalizzate per garantire che abbiano lunghezza 1.
     * @param {*} step 
     */
    pan(step) {
        let rotation = m4.axisRotation(this.up, step);
        this.forward = m4.transformPoint(rotation, this.forward);
        this.right = m4.transformPoint(rotation, this.right);
        this.forward = m4.normalize(this.forward);
        this.right = m4.normalize(this.right);
    }

    /**
     * Ruota la camera intorno all'asse "forward" (direzione in cui la camera sta guardando)
     * utilizzando la funzione m4.axisRotation().
     * La quantità di rotazione è determinata dal parametro "step" diviso per 2.
     * Dopo la rotazione, i vettori "right" e "up" della camera vengono trasformati utilizzando la funzione m4.transformPoint()
     * e vengono normalizzati con m4.normalize() per assicurare che siano vettori unitari.
     * @param {*} step 
     */
    cant(step) {
        let rotation = m4.axisRotation(this.forward, step / 2);
        this.right = m4.transformPoint(rotation, this.right);
        this.up = m4.transformPoint(rotation, this.up);
        this.right = m4.normalize(this.right);
        this.up = m4.normalize(this.up);
    }

    /**
     * Muove la posizione della camera lateralmente (destra e sinistra).
     * Il parametro dist indica la distanza in cui la camera deve essere spostata lungo questo asse.
     * Il metodo aggiorna i valori della posizione della camera
     * sommando i valori dell'asse right moltiplicati per la distanza specificata.
     * @param {*} dist 
     */
    truck(dist) {
        this.position[0] += this.right[0] * dist;
        this.position[1] += this.right[1] * dist;
        this.position[2] += this.right[2] * dist;
    }

    /**
     * Muove la posizione della camera lungo l'asse verticale (y-axis) di una distanza specificata.
     * Viene fatto ciò moltiplicando ogni componente dell'asse up per la distanza specificata
     * e sommando i risultati alle componenti corrispondenti della posizione della camera.
     * @param {*} dist 
     */
    pedestal(dist) {
        this.position[0] += this.up[0] * dist;
        this.position[1] += this.up[1] * dist;
        this.position[2] += this.up[2] * dist;
    }

    /**
     * Modifica la posizione della camera spostandola lungo la direzione in cui guarda.
     * Il parametro dist specifica la distanza di spostamento della camera,
     * in base a questo valore vengono incrementate le coordinate x (forward[0]),
     * y (forward[1]), z forward[2] della posizione della camera.
     * @param {*} dist 
     */
    dolly(dist) {
        this.position[0] += this.forward[0] * dist;
        this.position[1] += this.forward[1] * dist;
        this.position[2] += this.forward[2] * dist;
    }

    /**
     * Allinea la camera sull'asse y, bloccando qualsiasi inclinazione sugli assi x e z.
     */
    align() {
        this.up = [0, 1, 0];
        this.forward[1] = 0;
        this.right = m4.normalize(m4.cross(this.forward, this.up));
    }

    /**
     * Calcola la matrice di visualizzazione della camera utilizzando la posizione della camera,
     * la direzione verso cui la camera sta guardando e la direzione "verso l'alto" della camera.
     * Viene creata una matrice di visualizzazione utilizzando la funzione m4.lookAt()
     * che utilizza la posizione della camera, la posizione verso cui la camera sta guardando
     * (ottenuta utilizzando la funzione m4.addVectors()
     * per sommare la posizione della camera con la direzione verso cui la camera sta guardando)
     * e la direzione verso l'alto della camera.
     * @returns View Matrix invertita
     */
    getViewMatrix() {
        return this.viewMatrix = m4.inverse(m4.lookAt(this.position, m4.addVectors(this.position, this.forward), this.up));
    }

    /**
     * Restituisce la posizione attuale della camera.
     * @returns position
     */
    getPosition() { return this.position; }
}