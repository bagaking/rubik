const {V3DSize, V3D, CubeArea} = require('spaceout').measure

class Chunk extends CubeArea {

    constructor(width, height, depth, scale) {
        super(V3D.prefab.zero, new V3DSize(width, height, depth));
        this._scale = scale;
        this._values = Array.apply(null, Array(this.cube.size.total)).map(_ => ({r: 0, g: 0, b: 0, a: 0, _e: false}));
    }

    /**
     * det value at ind = y * width * depth + x * depth + z
     * @param {V3D | Array} pos
     * @returns {number} uint
     */
    get(pos) {
        return this._values[this.posB2Ind(pos)];
    }

    build() {
        let sz = this._scale;
        let vertices = [];
        let colors = [];

        const faces = [
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

        this.size.forEachPosB(V3D.prefab.one, V3D.prefab.minusOne, (ind, ...posArr) => {
            let t
            if (t = get(x - 1, y, z), t._e) makeFace(t, posArr, faces[0]);
            if (t = get(x, y - 1, z), t._e) makeFace(t, posArr, faces[1]);
            if (t = get(x, y, z - 1), t._e) makeFace(t, posArr, faces[2]);
            if (t = get(x + 1, y, z), t._e) makeFace(t, posArr, faces[3]);
            if (t = get(x, y + 1, z), t._e) makeFace(t, posArr, faces[4]);
            if (t = get(x, y, z + 1), t._e) makeFace(t, posArr, faces[5]);
        });

        // Create Object
        let geometry = new THREE.BufferGeometry();
        let v = new THREE.BufferAttribute( new Float32Array( vertices.length * 3), 3 );
        let c = new THREE.BufferAttribute(new Float32Array( colors.length *4), 4 );

        vertices.forEach((arr, i) => v.setXYZ(i, ...arr));
        geometry.addAttribute( 'position', v );
        colors.set((arr, i) => c.setXYZW(i, ... arr.map(k => k / 255)))
        geometry.addAttribute( 'color', c );

        geometry.computeBoundingBox();

        geometry.applyMatrix( new THREE.Matrix4().makeTranslation(-geometry.boundingBox.max.x/2, -geometry.boundingBox.max.z/2, 0));
        geometry.computeVertexNormals();

        let mat = new THREE.MeshLambertMaterial({ vertexColors: THREE.VertexColors });
        let mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(0, 0 , 0);
        return mesh;
    }

}

module.exports = Chunk;