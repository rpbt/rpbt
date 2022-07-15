export default interface LogContainer {
    info(text: string): void;
    warn(text: string): void;
    error(text: string): void;
}