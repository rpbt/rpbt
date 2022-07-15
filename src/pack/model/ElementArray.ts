import Element from "./Element";

/**
 * An array of {@link Element}s.
 * 
 * Note that some methods like filter, slice, etc that create new array instances
 * will not be an ElementArray but {@code Element[]}. To filter an ElementArray do
 * the following:
 * {@code
 * const filtered = new ElementArray(elementArray.filter((element, index) => true));
 * }
 */
export default class ElementArray extends Array<Element> {
    /**
     * Move the elements relative to the coordinate axes.
     * 
     * Rotated elements will have their origins changed so they move as expected.
     * 
     * @param offsetX The amount to move relative to the x-axis.
     * @param offsetY The amount to move relative to the y-axis.
     * @param offsetZ The amount to move relative to the z-axis.
     */
    move(offsetX: number, offsetY: number, offsetZ: number) {
        for (const element of this) {
            element.move(offsetX, offsetY, offsetZ);
        }
    }
}