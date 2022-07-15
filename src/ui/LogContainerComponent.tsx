import * as React from "react";
import DeferredLogContainer from "../plugin/logger/DeferredLogContainer";
import LogContainer from "../plugin/logger/LogContainer";
import Logger from "../plugin/logger/Logger";

type LogType = "info" | "warn" | "error";

interface LogContainerProps {
    loggers: Logger[];
}

export default class LogContainerComponent extends React.Component<LogContainerProps> implements LogContainer {
    private ref: React.RefObject<HTMLDivElement> = React.createRef();

    componentDidMount(): void {
        const logContainer = this.props.loggers[0].logContainer;
        if (logContainer instanceof DeferredLogContainer) {
            (logContainer as DeferredLogContainer).apply(this);
        }
        for (const logger of this.props.loggers) {
            logger.logContainer = this;
        }
    }
    
    render() {
        return (
            <div className="log-container" ref={this.ref}></div>
        );
    }

    addEntry(type: LogType, message: string) {
        const element = document.createElement("div");
        element.className = "log-" + type;
        element.textContent = message;
        this.ref.current!.appendChild(element);
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
}