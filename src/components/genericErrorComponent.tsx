import * as React from "react";

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
                <i>{this.props.message}</i>
            </p>
        </div>;
    }
}