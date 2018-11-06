const {V3DSize, V3D, CubeArea} = require('spaceout').measure

const matcher = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [-1, 0, 0], [0, -1, 0], [0, 0, -1]];
const faces = [
    [[0, 0, 0], [0, 0, 1], [0, 1, 0]], // left
    [[0, 0, 0], [1, 0, 0], [0, 0, 1]], // top
    [[0, 0, 0], [0, 1, 0], [1, 0, 0]], // front
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]], // right
    [[0, 1, 0], [0, 0, 1], [1, 0, 0]], // bot
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]], // back
]

function merge(arr1, arr2, scale = 1) {
    return arr1.map((v, i) => scale * (v + arr2[i]));
}

const faceVertex = faces.map(arr => [arr[0], merge(arr[0], arr[1]), merge(merge(arr[0], arr[1]), arr[2]), merge(arr[0], arr[2])]);

class Chunk extends CubeArea {

    constructor(width, height, depth, scale, groupSideLength = 16, fakeAO = true) {
        super(V3D.prefab.zero, new V3DSize(width, height, depth));

        this._groupSideLength = groupSideLength;
        this._groupSize = new V3DSize(
            Math.ceil(width / groupSideLength),
            Math.ceil(height / groupSideLength),
            Math.ceil(depth / groupSideLength)
        );

        this._scale = scale;
        this._fakeAO = fakeAO;
        this._values = [... Array(this.size.total)].map(_ => ({r: 0, g: 0, b: 0, a: 0, _e: false}));
        this.clearBuild();

        if (!scale) {
            throw Error(`missing scale`);
        }

        console.log(`chunk created (${width},${height},${depth})x ${scale} | ${this._groupSize}`);
    }

    /**
     *
     * @param @param {V3D | Array} posB
     * @return {*}
     */
    getPosBGroupID(posB) {
        let groupPosB = [
            Math.floor(posB[0] / this._groupSideLength),
            Math.floor(posB[1] / this._groupSideLength),
            Math.floor(posB[2] / this._groupSideLength)]
        return this._groupSize.posB2Ind(groupPosB);
    }

    getGroupFromTo(groupID) {
        let posB = this._groupSize.ind2PosB(groupID).scl(this._groupSideLength);
        let from = this.restrictPosB(posB);
        let size = V3D.prefab.one.scl(this._groupSideLength - 1);
        let to = this.restrictPosB(from.add(size));
        // console.log("getGroupFromTo", posB, from, size, to)
        return {from, to};
    }

    clearBuild() {
        this._dirtyGroups = {};
        this._alreadyBuilt = false;
        this._vertexGroups = new Array(this._groupSize.total);
        this._colorGroups = new Array(this._groupSize.total);
    }

    /**
     * det value at ind = y * width * depth + x * depth + z
     * @param {V3D | Array} posB
     * @returns {number} uint
     */
    get(posB) {
        return this._values[this.posB2Ind(posB)];
    }

    /**
     * set a position
     * @param {V3D | Array} posB
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @param {boolean?} enabled
     * @return {Chunk} this
     */
    set(posB, r, g, b, a, enabled = true) {
        let data = {
            r, g, b, a, _e: enabled
        };
        let ind = this.posB2Ind(posB);
        this._values[ind] = data;
        //console.log(pos, data, ind, this._values[ind]);
        let groupID = this.getPosBGroupID(posB)

        this._vertexGroups[groupID] = this._vertexGroups[groupID] ? this._vertexGroups[groupID] + 1 : 1;
        return this;
    }

    get dirty() {
        return Object.keys(this._dirtyGroups).length > 0;
    }

    get alreadyBuilt() {
        return this._alreadyBuilt;
    }

    get vertexGroups() {
        return this._vertexGroups;
    }

    get colorGroups() {
        return this._colorGroups;
    }

    rebuild() {
        if (this.alreadyBuilt && !this.dirty) {
            return false; // no need to rebuild
        }
        console.log("== [START] BUILD CHUNK =>>> ", this.alreadyBuilt ? this._dirtyGroups : "THE FIRST TIME");

        let sz = this._scale;
        let faceMade = 0;
        const makeFace = (groupID, color, posB, faceInd, t) => {

            let near = merge(posB, faceVertex[faceInd][0], sz);
            let outside = merge(posB, faceVertex[faceInd][1], sz);
            let far = merge(posB, faceVertex[faceInd][2], sz);
            let inside = merge(posB, faceVertex[faceInd][3], sz);

            this._vertexGroups[groupID].push(near);
            this._vertexGroups[groupID].push(outside);
            this._vertexGroups[groupID].push(far);

            this._vertexGroups[groupID].push(near);
            this._vertexGroups[groupID].push(far);
            this._vertexGroups[groupID].push(inside);

            let cs;
            if (this._fakeAO) {
                let rate = (100 - (Math.pow((t - 1), 2) / 2)) / 100;
                cs = [color.r * rate | 0, color.g * rate | 0, color.b * rate | 0, color.a * rate | 0];
            } else {
                cs = [color.r, color.g, color.b, color.a];
            }

            for (let i = 0; i < 6; i++) {
                this._colorGroups[groupID].push(cs);
            }
            faceMade += 1;
        }

        const around = (posB) => {
            let t = this.get(posB);
            if (this.posBInside(posB) && t._e) return 0;

            return this._fakeAO ? matcher.reduce((v, arr, i) => {
                let pB = [posB[0] + arr[0], posB[1] + arr[1], posB[2] + arr[2]];
                return v + ((this.posBInside(pB) && this.get(pB)._e) ? 1 : 0);
            }, 0) : 1;
        }

        const pick = (posB, faceInd) => {
        }

        this._groupSize.forEachPosB(groupID => {
            if (this.alreadyBuilt && !this._dirtyGroups[groupID]) {
                return;
            }

            let {from, to} = this.getGroupFromTo(groupID);

            this._vertexGroups[groupID] = [];
            this._colorGroups[groupID] = [];

            let count = 0;
            faceMade = 0;
            V3D.forEachFromTo((x, y, z) => {
                let posB = [x, y, z];
                let me = this.get(posB);
                if (!me) {
                    throw new Error(`get item error : group-${groupID}, x-${x}, y-${y}, z-${z}`)
                }
                if (!me._e) return;
                count++;

                let t
                if (t = around([x - 1, y, z], 0), t > 0) makeFace(groupID, me, posB, 0, t);
                if (t = around([x, y - 1, z], 1), t > 0) makeFace(groupID, me, posB, 1, t);
                if (t = around([x, y, z - 1], 2), t > 0) makeFace(groupID, me, posB, 2, t);
                if (t = around([x + 1, y, z], 3), t > 0) makeFace(groupID, me, posB, 3, t);
                if (t = around([x, y + 1, z], 4), t > 0) makeFace(groupID, me, posB, 4, t);
                if (t = around([x, y, z + 1], 5), t > 0) makeFace(groupID, me, posB, 5, t);

                // console.log("== RENDER", groupID, " =>", [x, y, z], me, faceMade, this._vertexGroups[groupID], this._colorGroups[groupID]);
            }, from, to)

            if (count > 0) {
                console.log(`  - BUILD GROUP(${groupID}, ${to}) => count:${count}, faces:${faceMade}x2`);//, this._vertexGroups[groupID], this._colorGroups[groupID]);
            }

            delete this._dirtyGroups[groupID];
        })

        this._alreadyBuilt = true;

        console.log(`== [END] BUILD CHUNK =<<< `);
        return true;
    }

}

module.exports = Chunk;