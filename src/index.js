const Chunk = require("./chunk")

module.exports = Chunk

window.TheChunk = Chunk

/**
 * @param {Chunk} chunk
 */
window.ChunkToMesh = (chunk) => {
    if(chunk.dirty || !chunk.alreadyBuilt) { chunk.rebuild(); }
    //console.log(chunk);

    // Create Object
    let geometry = new THREE.BufferGeometry();
    let v = new THREE.BufferAttribute(new Float32Array(chunk.vertices.length * 3), 3);
    let c = new THREE.BufferAttribute(new Float32Array(chunk.colors.length * 4), 4);

    chunk.vertices.forEach((arr, i) => v.setXYZ(i, ...arr));
    geometry.addAttribute('position', v);

    chunk.colors.forEach((arr, i) => c.setXYZW(i, ... arr.map(k => k / 255)))
    geometry.addAttribute('color', c);

    geometry.computeBoundingBox();

    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-geometry.boundingBox.max.x / 2, -geometry.boundingBox.max.z / 2, 0));
    geometry.computeVertexNormals();

    return geometry;
}