enum PackType {
    /**
     * A source pack the user has uploaded.
     */
    SOURCE,
    /**
     * The target pack for a source pack.
     */
    TARGET,
    /**
     * A dependency pack.
     */
    DEPENDENCY
};
export default PackType;