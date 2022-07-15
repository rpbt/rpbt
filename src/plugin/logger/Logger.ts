import LogContainer from "./LogContainer";

export default class Logger {
    protected prefix: string = "";
    logContainer: LogContainer | null = null;

    constructor(name: string) {
        this.setName(name);
    }
    
    setName(name: string) {
        this.prefix = "[" + name + "] ";
    }

    protected getText(text: any) {
        if (typeof text == "object" && ("" + text) == "[object Object]") {
            try {
                const json = JSON.stringify(text);
                if (typeof json == "string") {
                    text = json;
                }
            } catch(e) {}
        }
        if (text instanceof Error) {
            text = text.stack;
        }
        return this.prefix + text;
    }

    log(text: any) {
        this.info(text);
    }

    info(text: any) {
        const formatted = this.getText(text);
        console.log(formatted);
        if (this.logContainer != null) {
            this.logContainer.info(formatted);
        }
    }

    warn(text: any) {
        const formatted = this.getText(text);
        console.warn(formatted);
        if (this.logContainer != null) {
            this.logContainer.warn(formatted);
        }
    }

    error(text: any) {
        const formatted = this.getText(text);
        console.error(formatted);
        if (this.logContainer != null) {
            this.logContainer.error(formatted);
        }
    }
}