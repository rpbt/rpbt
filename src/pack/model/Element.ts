/**
 * A wrapper around an element in a model. Contains useful methods for
 * transforming an element.
 */
export default class Element {
    public readonly json: ElementJson;

    constructor(json: ElementJson) {
        this.json = json;
    }

    /**
     * Move the element relative to the coordinate axes.
     * 
     * Rotated elements will have their origins changed so they move as expected.
     * 
     * @param offsetX The amount to move relative to the x-axis.
     * @param offsetY The amount to move relative to the y-axis.
     * @param offsetZ The amount to move relative to the z-axis.
     */
    move(offsetX: number, offsetY: number, offsetZ: number) {
        this.json.from[0] += offsetX;
        this.json.from[1] += offsetY;
        this.json.from[2] += offsetZ;
        this.json.to[0] += offsetX;
        this.json.to[1] += offsetY;
        this.json.to[2] += offsetZ;
        if (this.json.rotation && this.json.rotation.origin) {
            this.json.rotation.origin[0] += offsetX;
            this.json.rotation.origin[1] += offsetY;
            this.json.rotation.origin[2] += offsetZ;
        }
    }
}

export interface ElementJson {
    from: [number, number, number];
    to: [number, number, number];
    rotation?: {
        origin: [number, number, number];
        axis: "x" | "y" | "z";
        angle: number;
        rescale: boolean;
    }
    shade: boolean;
    faces: any;
}