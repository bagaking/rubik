const _ = require("lodash");
const Chunk = require("./chunk");

const {V3DSize} = require("spaceout").measure;

function readInt32Arr(byteArray, from, count = 1) {
    let ret = new Array(count);
    for (let i = 0; i < count; i++) {
        ret[i] = readInt32(byteArray, from + i * 4);
    }
    return ret;
}

function readInt32(byteArray, from = 0) {
    return byteArray[from] | (byteArray[from + 1] << 8) | (byteArray[from + 2] << 16) | (byteArray[from + 3] << 24);
};

function readColor32(byteArray, from = 0) {
    return byteArray[from] << 24 | (byteArray[from + 1] << 16) | (byteArray[from + 2] << 8) | (byteArray[from + 3]);
};

function readColor16B(byteArray, from = 0) {
    return (byteArray[from] << 24)
        | (byteArray[from + 4] << 16)
        | (byteArray[from + 8] << 8)
        | (byteArray[from + 12]);
};


function readColorTable4B(byteArray, from = 0) {
    return [byteArray[from], byteArray[from + 1], byteArray[from + 2], byteArray[from + 3]]
};

function color32ToColorTable(color32) {
    return [color32 >> 24 & 0xFF, color32 >> 16 & 0xFF, color32 >> 8 & 0xFF, color32 & 0xFF]
}

function readStr(byteArray, from, to) {
    let arr = byteArray.slice(from, to)
    //console.log(`readStr`, from, to, arr)
    return String.fromCharCode(...arr);
}

function readChunkHead(byteArray, from) {
    let ind = from;
    let ret = {};
    ret.id = readStr(byteArray, ind, ind += 4);
    ret.size = readInt32(byteArray, ind) & 0xFF;
    ret.childrenNum = readInt32(byteArray, ind + 4) & 0xFF;
    return ret;
};

const defaultPalette = [
    0x00000000, 0xffffffff, 0xffccffff, 0xff99ffff, 0xff66ffff, 0xff33ffff, 0xff00ffff, 0xffffccff, 0xffccccff, 0xff99ccff, 0xff66ccff, 0xff33ccff, 0xff00ccff, 0xffff99ff, 0xffcc99ff, 0xff9999ff,
    0xff6699ff, 0xff3399ff, 0xff0099ff, 0xffff66ff, 0xffcc66ff, 0xff9966ff, 0xff6666ff, 0xff3366ff, 0xff0066ff, 0xffff33ff, 0xffcc33ff, 0xff9933ff, 0xff6633ff, 0xff3333ff, 0xff0033ff, 0xffff00ff,
    0xffcc00ff, 0xff9900ff, 0xff6600ff, 0xff3300ff, 0xff0000ff, 0xffffffcc, 0xffccffcc, 0xff99ffcc, 0xff66ffcc, 0xff33ffcc, 0xff00ffcc, 0xffffcccc, 0xffcccccc, 0xff99cccc, 0xff66cccc, 0xff33cccc,
    0xff00cccc, 0xffff99cc, 0xffcc99cc, 0xff9999cc, 0xff6699cc, 0xff3399cc, 0xff0099cc, 0xffff66cc, 0xffcc66cc, 0xff9966cc, 0xff6666cc, 0xff3366cc, 0xff0066cc, 0xffff33cc, 0xffcc33cc, 0xff9933cc,
    0xff6633cc, 0xff3333cc, 0xff0033cc, 0xffff00cc, 0xffcc00cc, 0xff9900cc, 0xff6600cc, 0xff3300cc, 0xff0000cc, 0xffffff99, 0xffccff99, 0xff99ff99, 0xff66ff99, 0xff33ff99, 0xff00ff99, 0xffffcc99,
    0xffcccc99, 0xff99cc99, 0xff66cc99, 0xff33cc99, 0xff00cc99, 0xffff9999, 0xffcc9999, 0xff999999, 0xff669999, 0xff339999, 0xff009999, 0xffff6699, 0xffcc6699, 0xff996699, 0xff666699, 0xff336699,
    0xff006699, 0xffff3399, 0xffcc3399, 0xff993399, 0xff663399, 0xff333399, 0xff003399, 0xffff0099, 0xffcc0099, 0xff990099, 0xff660099, 0xff330099, 0xff000099, 0xffffff66, 0xffccff66, 0xff99ff66,
    0xff66ff66, 0xff33ff66, 0xff00ff66, 0xffffcc66, 0xffcccc66, 0xff99cc66, 0xff66cc66, 0xff33cc66, 0xff00cc66, 0xffff9966, 0xffcc9966, 0xff999966, 0xff669966, 0xff339966, 0xff009966, 0xffff6666,
    0xffcc6666, 0xff996666, 0xff666666, 0xff336666, 0xff006666, 0xffff3366, 0xffcc3366, 0xff993366, 0xff663366, 0xff333366, 0xff003366, 0xffff0066, 0xffcc0066, 0xff990066, 0xff660066, 0xff330066,
    0xff000066, 0xffffff33, 0xffccff33, 0xff99ff33, 0xff66ff33, 0xff33ff33, 0xff00ff33, 0xffffcc33, 0xffcccc33, 0xff99cc33, 0xff66cc33, 0xff33cc33, 0xff00cc33, 0xffff9933, 0xffcc9933, 0xff999933,
    0xff669933, 0xff339933, 0xff009933, 0xffff6633, 0xffcc6633, 0xff996633, 0xff666633, 0xff336633, 0xff006633, 0xffff3333, 0xffcc3333, 0xff993333, 0xff663333, 0xff333333, 0xff003333, 0xffff0033,
    0xffcc0033, 0xff990033, 0xff660033, 0xff330033, 0xff000033, 0xffffff00, 0xffccff00, 0xff99ff00, 0xff66ff00, 0xff33ff00, 0xff00ff00, 0xffffcc00, 0xffcccc00, 0xff99cc00, 0xff66cc00, 0xff33cc00,
    0xff00cc00, 0xffff9900, 0xffcc9900, 0xff999900, 0xff669900, 0xff339900, 0xff009900, 0xffff6600, 0xffcc6600, 0xff996600, 0xff666600, 0xff336600, 0xff006600, 0xffff3300, 0xffcc3300, 0xff993300,
    0xff663300, 0xff333300, 0xff003300, 0xffff0000, 0xffcc0000, 0xff990000, 0xff660000, 0xff330000, 0xff0000ee, 0xff0000dd, 0xff0000bb, 0xff0000aa, 0xff000088, 0xff000077, 0xff000055, 0xff000044,
    0xff000022, 0xff000011, 0xff00ee00, 0xff00dd00, 0xff00bb00, 0xff00aa00, 0xff008800, 0xff007700, 0xff005500, 0xff004400, 0xff002200, 0xff001100, 0xffee0000, 0xffdd0000, 0xffbb0000, 0xffaa0000,
    0xff880000, 0xff770000, 0xff550000, 0xff440000, 0xff220000, 0xff110000, 0xffeeeeee, 0xffdddddd, 0xffbbbbbb, 0xffaaaaaa, 0xff888888, 0xff777777, 0xff555555, 0xff444444, 0xff222222, 0xff111111
];

class Voxel {

    constructor() {
        this.name = "";
        this.chunks = [];
        this.palette = defaultPalette.map(color32ToColorTable);
    }

    getColor(ind) {
        return this.palette[ind];
    }

    /**
     *
     * @see {@url https://github.com/ephtracy/voxel-model/blob/master/MagicaVoxel-file-format-vox.txt}
     * @param {string} name
     * @param {Buffer | ArrayBuffer } input
     */
    Load(name, buffer, scale = 1) {
        console.log("== LOAD VOX => from buffer :", buffer);
        if (!_.isBuffer(buffer) && !_.isArrayBuffer(buffer)) {
            throw new Error(`LoadModel error : input should be a buffer. ${buffer} is invalid.`);
        }

        let byteArray = new Uint8Array(buffer);

        let voxFileSymbol = readStr(byteArray, 0, 4);
        if (voxFileSymbol !== "VOX ") {
            throw new Error(`LoadModel error : vox file symbol should be exactly 'VOX '. The symbol '${voxFileSymbol}' is not supported.`);
        }

        let voxFileVersion = readInt32(byteArray, 4);
        if (voxFileVersion !== 0x96) {
            throw new Error(`LoadModel error : version should be exactly 150. The version ${version} is not supported`);
        }

        let chunksHdl = {
            handler: {
                RGBA: [],
                MATT: [],
                OTHERS: [],
            },
            packNum: 1,
            realLength: (chunkID, start) => {
                switch (chunkID) {
                    case "MAIN":
                        return 0;
                    case "PACK":
                        return 4;
                    case "SIZE":
                        return 12;
                    case "XYZI":
                        return 4 * (Math.abs(readInt32(byteArray, start)) + 1)
                    case "RGBA":
                        return 1024; // for each phase (r,g,b,a).
                    case "MATT": // todo:
                        break;
                }
            },
            deal: (chunkID, start, end) => {
                // console.log(`deal chunk ${chunkID} ${start}`)
                switch (chunkID) {
                    case "MAIN": /** the root chunk and parent chunk of all the other chunks */
                        break;
                    case "PACK":
                        /**
                         * if it is absent, only one model in the file
                         * 4        | int        | numModels : num of SIZE and XYZI chunks
                         */
                        chunksHdl.packNum = readInt32(byteArray, start);
                        break;
                    case "SIZE":
                        /**
                         *  model size
                         *  4        | int        | size x
                         *  4        | int        | size y
                         *  4        | int        | size z : gravity direction
                         */
                        if (!!this.chunkTemp) {
                            throw new Error("chunk id SIZE error: already exist");
                        }
                        let szArr = readInt32Arr(byteArray, start, 3);
                        this.chunkTemp = new Chunk(...szArr, scale);
                        //console.log(`SIZE : ${szArr} x${scale}`, chunkTemp);
                        break;
                    case "XYZI":
                        /**
                         *  model voxels
                         *  4        | int        | numVoxels (N)
                         *  4 x N    | int        | (x, y, z, colorIndex) : 1 byte for each component
                         */
                        if (!this.chunkTemp) {
                            throw new Error("chunk id XYZI error: haven't been created");
                        }

                        let length = Math.abs(readInt32(byteArray, start));
                        start += 4;

                        for (let i = 0; i < length; i++) {
                            let posIndPos = start + 4 * i;
                            let colorIndPos = posIndPos + 3;
                            let pos = byteArray.slice(posIndPos, colorIndPos);
                            let colorInd = byteArray[colorIndPos];
                            let color = this.getColor(colorInd);
                            // console.log(`chunkTemp.set|${i}/${length}|(${pos}, ${color})`, i, colorIndPos, colorIndPos, colorInd, pos, color);
                            this.chunkTemp.set(pos, ...color);
                        }
                        this.chunks.push(this.chunkTemp);
                        this.chunkTemp = undefined;

                        console.log("XYZI_PUSH_CHUNK", length, this.chunks);
                        break;
                    case "RGBA":
                        /**
                         * palette
                         * 4 x 256  | int         | (R, G, B, A) : 1 byte for each component
                         *                        | color [0-254] are mapped to palette index [1-255]
                         */
                        for (let i = 0; i <= 254; i++) {
                            let colorArr = readColorTable4B(byteArray, start + i * 4);
                            // console.log(`${start + i * 4} => palette[${i+1}] = ${colorArr}`);
                            this.palette[i + 1] = colorArr;
                        }
                        break;
                    case "MATT":
                        break;
                }
            },
            dealAll() {
                // todo: some check here
                chunksHdl.handler.RGBA.forEach(callArr => chunksHdl.deal(...callArr));
                chunksHdl.handler.MATT.forEach(callArr => chunksHdl.deal(...callArr));
                chunksHdl.handler.OTHERS.forEach(callArr => {
                    // console.log("callArr", callArr);
                    chunksHdl.deal(...callArr);
                });
            },
            sm: {
                latest: "____",
                trans: {
                    ____: ["MAIN"],
                    MAIN: ["PACK", "SIZE"],
                    PACK: ["SIZE"],
                    SIZE: ["XYZI"],
                    XYZI: ["SIZE", "RGBA", "MATT"],
                    RGBA: ["MATT"],
                    MATT: ["MATT"]
                },
                transfer(chunkInfo, cdStart, cdEnd) {
                    let id = chunkInfo.id;
                    if (!chunksHdl.sm.trans[chunksHdl.sm.latest] || !chunksHdl.sm.trans[chunksHdl.sm.latest].find(_v => _v === id)) {
                        throw new Error(`State Machine Error: Transfer does not exist ${chunksHdl.sm.latest} => ${id}. The chunk id is invalid in this case.`)
                    }

                    let callArr = [id, cdStart, cdEnd];
                    chunksHdl.sm.latest = id;
                    if (id in chunksHdl.handler) {
                        chunksHdl.handler[id].push(callArr);
                    } else {
                        chunksHdl.handler.OTHERS.push(callArr);
                    }
                    // console.log("insert chunk ", id, cdStart, cdEnd);
                }
            }
        }


        let cur = 8;
        while (cur < byteArray.length) {
            let chunkInfo = readChunkHead(byteArray, cur);
            cur += 12; // skip head length
            let cdStart = cur;
            let length = chunksHdl.realLength(chunkInfo.id, cdStart)
            let cdEnd = cur + length;
            //chunkInfo.size == length;

            console.log(`  - VOX CHUNK FOUND => ${cdStart} to ${cdEnd} (${length})`, chunkInfo);
            chunksHdl.sm.transfer(chunkInfo, cdStart, cdEnd);
            cur += length; // todo : should cur do this? or done it in each function?
        }

        chunksHdl.dealAll();
        this.name = name;
    };

}

module.exports = Voxel;

