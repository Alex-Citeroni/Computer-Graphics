/**
 * Camera animata usata per visualizzare la scena (questa classe estende Camera).
 * Si muove in maniera automatica lungo un quarto di circonferenza, rimanendo fissa a guardare il centro della scena (la stanza).
 * La posizione sulla circonferenza è determinata da tre valori:
 *  1. direction: usato per determinare la direzione che sta seguendo la camera.
 *  2. radius: rappresenta il raggio della circonferenza su cui ci si muove.
 *  3. angle: rappresenta l’angolo della posizione attuale (angolo tra x e z).
 */

class AnimatedCamera extends Camera {
    constructor() {
        super([0, 4, 12], [0, 0, 0], [0, 1, 0]);
        this.direction = 1;
        this.angle = 1;
        this.radius = Math.sqrt(Math.pow(this.position[0], 2) + Math.pow(this.position[2], 2))
    }

    /**
     * Sposta la camera avanti o indietro lungo il suo asse di visuale, noto come "dolly".
     * Il parametro "step" indica la quantità di movimento desiderata,
     * in questo caso moltiplicata per 100 e convertita in radianti.
     * La funzione controlla anche se il raggio (rappresentato dalla variabile this.radius) è inferiore a 5
     * e se il valore di step è maggiore di zero, in questo caso non fa nulla.
     * @param {*} step 
     * @returns 
     */
    dolly(step) {
        if (this.radius < 5 && step > 0) return;
        this.radius -= degToRad(step * 100);
    }

    /**
     * Controlla se l'angolo della camera si trova su uno degli assi e, in tal caso,
     * cambia la direzione dell'animazione.
     * Calcola quindi un passo in base alla posizione della camera rispetto all'asse,
     * aggiorna l'angolo della camera e calcola le posizioni x e z utilizzando le coordinate polari.
     * Infine, restituisce la matrice di visualizzazione invertendo la matrice restituita da m4.lookAt
     * (posizione della telecamera, posizione di osservazione, vettore up).
     * @returns ViewMatrix
     */
    getViewMatrix() {
        if (this.angle > 89 || this.angle < 1) this.direction *= -1;
        let step = this.radius - Math.abs(this.position[0] - this.position[2]) + 1;
        this.angle += step * this.direction * .04;
        let rad = degToRad(this.angle);
        this.position[0] = Math.sin(rad) * this.radius;
        this.position[2] = Math.cos(rad) * this.radius;
        return m4.inverse(m4.lookAt(this.position, [0, 1, 0], [0, 1, 0]));
    }
}