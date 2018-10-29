const {V3DSize, V3D, CubeArea} = require('spaceout').measure

class Chunk extends CubeArea {

    constructor(width, height, depth, scale) {
        super(V3D.prefab.zero, new V3DSize(width, height, depth));
        this._scale = scale;
        this._values = Array.apply(null, Array(this.size.total)).map(_ => ({r: 0, g: 0, b: 0, a: 0, _e: false}));
    }

    /**
     * det value at ind = y * width * depth + x * depth + z
     * @param {V3D | Array} pos
     * @returns {number} uint
     */
    get(pos) {
        console.log(pos, this.posB2Ind(pos));
        return this._values[this.posB2Ind(pos)];
    }

    set(pos, r, g, b, a) {
        return this._values[this.posB2Ind(pos)] = {
            r, g, b, a, _e: true
        };
    }

    build() {
        let sz = this._scale;
        let vertices = new Array();
        let colors = new Array();

        let faces = [
            [[0, 0, 0], [0, 1, 0], [0, 0, 1]],
            [[0, 0, 0], [0, 0, 1], [1, 0, 0]],
            [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
            [[1, 0, 0], [0, 0, 1], [0, 1, 0]],
            [[0, 1, 0], [1, 0, 0], [0, 0, 1]],
            [[0, 0, 1], [0, 1, 0], [1, 0, 0]],
        ]


        const makeFace = (color, v0, v1, v2, v3) => {
            vertices.push(v0.map((k, i) => (k + v1[i]) * sz));
            vertices.push(v0.map((k, i) => (k + v1[i] + v2[i]) * sz));
            vertices.push(v0.map((k, i) => (k + v1[i] + v2[i] + v3[i]) * sz));
            vertices.push(v0.map((k, i) => (k + v1[i]) * sz));
            vertices.push(v0.map((k, i) => (k + v1[i] + v3[i]) * sz));
            vertices.push(v0.map((k, i) => (k + v1[i] + v3[i] + v2[i]) * sz));
            for (let i = 0; i < 6; i++) {
                colors.push([color.r, color.g, color.b, color.a]);
            }
        }
        console.log(makeFace)

        this._size.forEachPosB(V3D.prefab.one, V3D.prefab.minusOne, (ind, x, y, z) => {
            console.log(ind, x, y, z);
            let t
            if (t = this.get([x - 1, y, z]), t._e) makeFace(t, [x, y, z], ...faces[0]);
            if (t = this.get([x, y - 1, z]), t._e) makeFace(t, [x, y, z], ...faces[1]);
            if (t = this.get([x, y, z - 1]), t._e) makeFace(t, [x, y, z], ...faces[2]);
            if (t = this.get([x + 1, y, z]), t._e) makeFace(t, [x, y, z], ...faces[3]);
            if (t = this.get([x, y + 1, z]), t._e) makeFace(t, [x, y, z], ...faces[4]);
            if (t = this.get([x, y, z + 1]), t._e) makeFace(t, [x, y, z], ...faces[5]);
        });

        // Create Object
        let geometry = new THREE.BufferGeometry();
        let v = new THREE.BufferAttribute(new Float32Array(vertices.length * 3), 3);
        let c = new THREE.BufferAttribute(new Float32Array(colors.length * 4), 4);

        vertices.forEach((arr, i) => v.setXYZ(i, ...arr));
        geometry.addAttribute('position', v);
        console.log(vertices);

        colors.forEach((arr, i) => c.setXYZW(i, ... arr.map(k => k / 255)))
        geometry.addAttribute('color', c);
        console.log(colors);

        geometry.computeBoundingBox();

        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(
            -geometry.boundingBox.max.x / 2, -geometry.boundingBox.max.z / 2, 0));
        geometry.computeVertexNormals();
        return mesh;
    }

}

module.exports = Chunk;