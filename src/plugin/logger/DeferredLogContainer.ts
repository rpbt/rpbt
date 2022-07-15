import LogContainerComponent from "../../ui/LogContainerComponent";
import LogContainer from "./LogContainer";

type LogType = "info" | "warn" | "error";

interface Entry {
    type: LogType;
    message: string;
}

export default class DeferredLogContainer implements LogContainer {
    private entries: Entry[] | null = [];

    addEntry(type: LogType, message: string) {
        if (this.entries == null) {
            throw new Error("Cannot use DeferredLogContainer after it has been applied.");
        }
        this.entries.push({ type, message });
        console.log("saving", this);
    }

    info(text: string) {
        this.addEntry("info", text);
    }

    warn(text: string) {
        this.addEntry("warn", text);
    }

    error(text: string) {
        this.addEntry("error", text);
    }

    apply(logContainerComponent: LogContainerComponent) {
        if (this.entries == null) {
            throw new Error("DeferredLogContainer has already been applied.");
        }
        for (const entry of this.entries) {
            logContainerComponent.addEntry(entry.type, entry.message);
            console.log("moving");
        }
        this.entries = null;
    }
}