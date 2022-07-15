import * as React from "react";
import * as ReactDOM from "react-dom/client";
import Pack from "../pack/Pack";
import PackComponent from "./PackComponent";

let app: App;

interface AppState {
    packs: Pack[];
}

class App extends React.Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            packs: []
        };
        app = this;
    }

    render() {
        return (
            <div>
                {this.state.packs.map(pack => {
                    return <PackComponent pack={pack} key={pack.name} />;
                })}
                {this.state.packs.length == 0 && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                        <h2>Ready to upload.</h2>
                        <p>Drag and drop a folder or zip file to upload a pack.</p>
                    </div>
                )}
            </div>
        );
    }
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

export default function getApp() {
    return app;
};