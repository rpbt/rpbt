import PackFile from "../PackFile";
import Element from "./Element";
import ElementArray from "./ElementArray";

/**
 * A wrapper around a json model that contains useful methods for transforming the model.
 */
export default class Model {
    /**
     * The file where this model is stored.
     */
    readonly file: PackFile;
    /**
     * The root json object for this model.
     */
    readonly json: any;

    constructor(file: PackFile, json: any) {
        this.file = file;
        this.json = json;
    }

    getDisplay(): DisplayJson {
        if (!this.json.display) {
            this.json.display = {};
        }
        return this.json.display;
    }

    /**
     * Get an element by an index in the elements array.
     * 
     * @param index The index of the element.
     * @returns The element.
     */
    getElementByIndex(index: number): Element {
        if (this.json.elements) {
            const json = this.json.elements[index];
            if (json) {
                return new Element(json);
            } else {
                throw new Error("No element was found at index " + index);
            }
        } else {
            throw new Error("This model does not contain any elements.");
        }
    }

    /**
     * Get a ElementArray containing all elements in the model.
     * 
     * @returns The ElementArray.
     */
    getAllElements(): ElementArray {
        if (this.json.elements) {
            const elementArray = new ElementArray();
            for (const elementJson of this.json.elements) {
                elementArray.push(new Element(elementJson));
            }
            return elementArray;
        } else {
            throw new Error("This model does not contain any elements.");
        }
    }

    /**
     * Get all elements that have a specific name.
     * 
     * @param name The name to match against.
     * @returns The ElementArray.
     */
    getElementsByName(name: string): ElementArray {
        if (this.json.elements) {
            const elementArray = new ElementArray();
            for (const elementJson of this.json.elements) {
                if (elementJson.name == name) {
                    elementArray.push(new Element(elementJson));
                }
            }
            return elementArray;
        } else {
            throw new Error("This model does not contain any elements.");
        }
    }
}

export interface DisplayJson {
    thirdperson_righthand: DisplayPositionJson;
    thirdperson_lefthand: DisplayPositionJson;
    firstperson_righthand: DisplayPositionJson;
    firstperson_lefthand: DisplayPositionJson;
    gui: DisplayPositionJson;
    head: DisplayPositionJson;
    ground: DisplayPositionJson;
    fixed: DisplayPositionJson;
}

export interface DisplayPositionJson {
    rotation: [number, number, number];
    translation: [number, number, number];
    scale: [number, number, number];
}