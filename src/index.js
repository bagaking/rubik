const Chunk = require("./chunk");

const Voxel = require("./voxel");

// module.exports = Chunk

window.TheChunk = Chunk
window.Voxel = Voxel;

/**
 * @param {Chunk} chunk
 */
window.ChunkToMesh = (chunk) => {
    if (!chunk.dirty && chunk.alreadyBuilt) {
        return;
        //console.log("rebuild", chunk, chunk.alreadyBuilt, chunk.dirty);

    }

    console.log("== ChunkToMesh =>>>", chunk);//, vertexArr, colorArr);
    chunk.rebuild();

    // Create Object
    let geometry = new THREE.BufferGeometry();

    let vertexArr = new Float32Array(chunk.vertexGroups.reduce((t, arr) => t + arr.length, 0) * 3);
    let colorArr = new Float32Array(chunk.colorGroups.reduce((t, arr) => t + arr.length, 0) * 4);

    let v = new THREE.BufferAttribute(vertexArr, 3);
    let c = new THREE.BufferAttribute(colorArr, 4);

    let sum = 0;
    chunk.vertexGroups.forEach(group => {
        (!!group) ? group.forEach((arr, i) => v.setXYZ(sum + i, ...arr)) : group;
        sum += group.length;
    });
    sum = 0;
    chunk.colorGroups.forEach(group => {
        (!!group) ? group.forEach((arr, i) => c.setXYZW(sum + i, ... arr.map(k => k / 255))) : group;
        sum += group.length;
    });

    geometry.addAttribute('position', v);
    geometry.addAttribute('color', c);

    geometry.computeBoundingBox();

    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-geometry.boundingBox.max.x / 2, -geometry.boundingBox.max.z / 2, 0));
    geometry.computeVertexNormals();

    return geometry;
}

window.readVoxel = async (filename, scale = 1) => {
    console.log(`try get model : ${filename}`);

    let arrayBuffer = await new Promise((rsv, rej) => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", filename, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = oEvent => {
            //console.log("Loaded model: " + xhr.responseURL);
            rsv(xhr.response);
        }
        xhr.onerror = function () {
            rej(xhr.statusText);
        };
        xhr.send(null);
    });

    let v = new Voxel();
    v.Load(filename, arrayBuffer, scale);
    return v;
    // let ctx = document.createElement('canvas').getContext('2d');
    //
    // // Read png file binary and get color for each pixel
    // // one pixel = one block
    // // Read RGBA (alpha is height)
    // // 255 = max height
    // // a < 50 = floor
    // let image = new Image();
    //
    // image.src = filename;
    // image.onload = () => {
    //     let v = new Voxel()
    //     v.Load(filename)
    // }

}
