const {V3DSize, V3D, CubeArea} = require('spaceout').measure

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

        let faces = [
            [[0, 0, 0], [0, 0, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 0, 0], [0, 0, 1]],
            [[0, 0, 0], [0, 1, 0], [1, 0, 0]],
            [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
            [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
        ]

        let faceMaked = 0;
        const makeFace = (groupID, color, v0, v1, v2, v3, t) => {
            let near = v0.map((k, i) => (k + v1[i]) * sz)
            let outside = v0.map((k, i) => (k + v1[i] + v2[i]) * sz)
            let far = v0.map((k, i) => (k + v1[i] + v2[i] + v3[i]) * sz)
            let inside = v0.map((k, i) => (k + v1[i] + v3[i]) * sz)

            this._vertexGroups[groupID].push(near);
            this._vertexGroups[groupID].push(outside);
            this._vertexGroups[groupID].push(far);

            this._vertexGroups[groupID].push(near);
            this._vertexGroups[groupID].push(far);
            this._vertexGroups[groupID].push(inside);


            let rate = (101 - t) / 100;
            let cs = this._fakeAO ? [color.r * rate | 0, color.g * rate | 0, color.b * rate | 0, color.a * rate | 0] :
                [color.r, color.g, color.b, color.a];
            // console.log(v0, t, color, cs)
            // if (!t) {
            //     console.log(""v0, t, color, cs);
            // }
            for (let i = 0; i < 6; i++) {
                this._colorGroups[groupID].push(cs);
            }
            faceMaked += 1;
        }

        const matcher = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [-1, 0, 0], [0, -1, 0], [0, 0, -1]];
        const around = (posB) => {
            let t = this.get(posB);
            if (this.posBInside(posB) && t._e) return 0;

            return this._fakeAO ? matcher.reduce((v, arr) => {
                let pB = [posB[0] + arr[0], posB[1] + arr[1], posB[2] + arr[2]];
                return v + ((this.posBInside(pB) && this.get(pB)._e) ? 1 : 0);
            }, 0) : 1;
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
                if (t = around([x - 1, y, z]), t > 0) makeFace(groupID, me, posB, ...faces[0], t);
                if (t = around([x, y - 1, z]), t > 0) makeFace(groupID, me, posB, ...faces[1], t);
                if (t = around([x, y, z - 1]), t > 0) makeFace(groupID, me, posB, ...faces[2], t);
                if (t = around([x + 1, y, z]), t > 0) makeFace(groupID, me, posB, ...faces[3], t);
                if (t = around([x, y + 1, z]), t > 0) makeFace(groupID, me, posB, ...faces[4], t);
                if (t = around([x, y, z + 1]), t > 0) makeFace(groupID, me, posB, ...faces[5], t);

                // console.log("== RENDER", groupID, " =>", [x, y, z], me, faceMaked, this._vertexGroups[groupID], this._colorGroups[groupID]);
            }, from, to)

            if (count > 0) {
                console.log(`  - BUILD GROUP(${groupID}, ${to}) => count:${count}, faces:${faceMaked}x2`);//, this._vertexGroups[groupID], this._colorGroups[groupID]);
            }

            delete this._dirtyGroups[groupID];
        })

        this._alreadyBuilt = true;

        console.log(`== [END] BUILD CHUNK =<<< `);
        return true;
    }

}

module.exports = Chunk;