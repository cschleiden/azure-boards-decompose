import * as React from "react";
import * as ReactDOM from "react-dom";

export interface IGenericErrorProps extends React.Props<void> {
    message: string;
}

export class GenericErrorComponent extends React.Component<IGenericErrorProps, void> {
    public render(): JSX.Element {        
        return <div>
            <p>
                <b>An error has occured:</b>
            </p>
            <p style={{ marginLeft: 40 }}>
                <i>{ this.props.message }</i>
            </p>
            <div>
                <span style={{ color: "red" }}>6/15/2016: Due to a bug in the product, the extension does not work right now. A fix is expected to be deployed within a day.</span>
            </div>
        </div>;
    }
}