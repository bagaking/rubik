const {V3D, V3DSize} = require("spaceout").measure
const Chunk = require("./chunk")
/
// const CHUNK_BLOCK_D1LENGTH_OPEN_MAX = 256;
// // const CHUNK_BLOCK_D1LENGTH_OPEN_MAX_SPACE = V3DSize.prefab.one.scl(CHUNK_BLOCK_D1LENGTH_OPEN_MAX * 2);

class ChunkMgr {

    constructor() {
        this._pendingList = [];
        this._loadedList = [];
        this._builtList = [];
        this._renderedList = [];
    }


    // insert loading info to pending lst
    addChunk(...args){

    }

    // mv chunk form rendered list or built lst to loaded lst
    markDirty(...args){

    }

    update(){

        // load some chunks from pending list to loaded list
        this.loadPendingChunks();

        // rebuild(generate vertices and colors of) chunks from loaded list, and mv the chunk to built list
        this.rebuildChunks();

        // generate mesh from the chunk, and mv the chunk to rendered lst
        // maybe
        this.renderChunks();


    }

    loadPendingChunks(){

    }

    rebuildChunks(){

    }

    renderChunks(){

    }


}