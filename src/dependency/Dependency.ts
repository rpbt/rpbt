import Pack from "../pack/Pack";

export default class Dependency {
    readonly id: string;
    readonly version: string;
    readonly pack: Pack;

    constructor(id: string, version: string, pack: Pack) {
        this.id = id;
        this.version = version;
        this.pack = pack;
    }
}