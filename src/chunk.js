const {V3DSize, V3D, CubeArea} = require('spaceout').measure

class Chunk extends CubeArea {

    constructor(width, height, depth, scale) {
        super(V3D.prefab.zero, new V3DSize(width, height, depth));
        this._scale = scale;
        this._values = [... Array(this.size.total)].map(_ => ({r: 0, g: 0, b: 0, a: 0, _e: false}));
        this._dirty = 0;
        this.clearBuild();

        console.log(`chunk created (${width},${height},${depth})x${scale}`);
    }

    clearBuild() {
        this._builded = false;
        this._vertices = new Array();
        this._colors = new Array();
    }

    /**
     * det value at ind = y * width * depth + x * depth + z
     * @param {V3D | Array} pos
     * @returns {number} uint
     */
    get(pos) {
        return this._values[this.posB2Ind(pos)];
    }

    /**
     * set a position
     * @param {V3D | Array} pos
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @return {Chunk} this
     */
    set(pos, r, g, b, a, enabled = true) {
        let data = {
            r, g, b, a, _e: enabled
        };
        let ind = this.posB2Ind(pos);
        this._values[ind] = data;
        //console.log(pos, data, ind, this._values[ind]);
        this._dirty += 1;
        return this;
    }

    get dirty() {
        return this._dirty > 0;
    }

    get alreadyBuilt() {
        return this._builded;
    }

    get vertices() {
        return this._vertices;
    }

    get colors() {
        return this._colors;
    }

    rebuild() {
        this.clearBuild();
        let sz = this._scale;

        let faces = [
            [[0, 0, 0], [0, 0, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 0, 0], [0, 0, 1]],
            [[0, 0, 0], [0, 1, 0], [1, 0, 0]],
            [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
            [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
        ]

        const makeFace = (color, v0, v1, v2, v3) => {
            this._vertices.push(v0.map((k, i) => (k + v1[i]) * sz));
            this._vertices.push(v0.map((k, i) => (k + v1[i] + v2[i]) * sz));
            this._vertices.push(v0.map((k, i) => (k + v1[i] + v2[i] + v3[i]) * sz));
            this._vertices.push(v0.map((k, i) => (k + v1[i]) * sz));
            this._vertices.push(v0.map((k, i) => (k + v1[i] + v3[i] + v2[i]) * sz));
            this._vertices.push(v0.map((k, i) => (k + v1[i] + v3[i]) * sz));
            for (let i = 0; i < 6; i++) {
                this._colors.push([color.r, color.g, color.b, color.a]);
            }
        }

        this._size.forEachPosB((ind, x, y, z) => {
            let me = this.get([x, y, z]);
            if (!me._e) return;

            let t
            if (x === 0 || (t = this.get([x - 1, y, z]), !t._e)) makeFace(me, [x, y, z], ...faces[0]);
            if (y === 0 || (t = this.get([x, y - 1, z]), !t._e)) makeFace(me, [x, y, z], ...faces[1]);
            if (z === 0 || (t = this.get([x, y, z - 1]), !t._e)) makeFace(me, [x, y, z], ...faces[2]);
            if (x + 1 === this.size.width || (t = this.get([x + 1, y, z]), !t._e)) makeFace(me, [x, y, z], ...faces[3]);
            if (y + 1 === this.size.height || (t = this.get([x, y + 1, z]), !t._e)) makeFace(me, [x, y, z], ...faces[4]);
            if (z + 1 === this.size.depth || (t = this.get([x, y, z + 1]), !t._e)) makeFace(me, [x, y, z], ...faces[5]);
        });

        this._dirty = 0;
        this._builded = true;

        console.log(`CHUNK REBUILD ==> VS:${this._vertices.length} CS:${this._colors.length}`);
        return this;
    }

}

module.exports = Chunk;