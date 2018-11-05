const {V3DSize, V3D, CubeArea} = require('spaceout').measure

class Chunk extends CubeArea {

    constructor(width, height, depth, scale, groupSideLength = 16) {
        super(V3D.prefab.zero, new V3DSize(width, height, depth));

        this._groupSideLength = groupSideLength;
        this._groupSize = new V3DSize(
            Math.ceil(width / groupSideLength),
            Math.ceil(height / groupSideLength),
            Math.ceil(depth / groupSideLength)
        );

        this._scale = scale;
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
        console.log(`============= rebuild : `, this._dirtyGroups);

        let sz = this._scale;

        let faces = [
            [[0, 0, 0], [0, 0, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 0, 0], [0, 0, 1]],
            [[0, 0, 0], [0, 1, 0], [1, 0, 0]],
            [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
            [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
        ]

        let faceMaked = 0;
        const makeFace = (groupID, color, v0, v1, v2, v3) => {
            this._vertexGroups[groupID].push(v0.map((k, i) => (k + v1[i]) * sz));
            this._vertexGroups[groupID].push(v0.map((k, i) => (k + v1[i] + v2[i]) * sz));
            this._vertexGroups[groupID].push(v0.map((k, i) => (k + v1[i] + v2[i] + v3[i]) * sz));
            this._vertexGroups[groupID].push(v0.map((k, i) => (k + v1[i]) * sz));
            this._vertexGroups[groupID].push(v0.map((k, i) => (k + v1[i] + v3[i] + v2[i]) * sz));
            this._vertexGroups[groupID].push(v0.map((k, i) => (k + v1[i] + v3[i]) * sz));
            for (let i = 0; i < 6; i++) {
                this._colorGroups[groupID].push([color.r, color.g, color.b, color.a]);
            }
            faceMaked += 1;
        }

        this._groupSize.forEachPosB(groupID => {
            if (this.alreadyBuilt && !this._dirtyGroups[groupID]) {
                return;
            }

            let {from, to} = this.getGroupFromTo(groupID);

            this._vertexGroups[groupID] = [];
            this._colorGroups[groupID] = [];

            let count = 0;
            faceMaked = 0;
            V3D.forEachFromTo((x, y, z) => {
                let posB = [x, y, z];
                let me = this.get(posB);
                if (!me) {
                    throw new Error(`get item error : group-${groupID}, x-${x}, y-${y}, z-${z}`)
                }
                if (!me._e) return;
                count++;

                let t
                if (x === 0 || (t = this.get([x - 1, y, z]), !t._e)) makeFace(groupID, me, posB, ...faces[0]);
                if (y === 0 || (t = this.get([x, y - 1, z]), !t._e)) makeFace(groupID, me, posB, ...faces[1]);
                if (z === 0 || (t = this.get([x, y, z - 1]), !t._e)) makeFace(groupID, me, posB, ...faces[2]);
                if (x + 1 === this.size.width || (t = this.get([x + 1, y, z]), !t._e)) makeFace(groupID, me, posB, ...faces[3]);
                if (y + 1 === this.size.height || (t = this.get([x, y + 1, z]), !t._e)) makeFace(groupID, me, posB, ...faces[4]);
                if (z + 1 === this.size.depth || (t = this.get([x, y, z + 1]), !t._e)) makeFace(groupID, me, posB, ...faces[5]);

                // console.log("== RENDER", groupID, " =>", [x, y, z], me, faceMaked, this._vertexGroups[groupID], this._colorGroups[groupID]);
            }, from, to)

            if (count > 0) {
                console.log("=>", groupID, to, count, faceMaked, this._vertexGroups[groupID], this._colorGroups[groupID]);
            }

            delete this._dirtyGroups[groupID];
        })

        this._alreadyBuilt = true;

        console.log(`CHUNK REBUILD ==> VS:${this._vertexGroups.length} CS:${this._colorGroups.length}`);
        return true;
    }

}

module.exports = Chunk;