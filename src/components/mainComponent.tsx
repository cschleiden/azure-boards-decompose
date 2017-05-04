import * as React from "react";

import { AddItemsComponent } from "../components/addItemsComponent";
import { ParentWorkItemComponent } from "../components/parentWorkItemComponent";

import { IWorkItem } from "../interfaces";
import { Store } from "../store";
import { ActionsCreator } from "../actionsCreator";

export interface IMainProps extends React.Props<void> {
    store: Store;
    actionsCreator: ActionsCreator;
}

export interface IMainState {
    focusedItemIdx: number;

    parentWorkItem: IWorkItem;
    items: IWorkItem[];
}

export class MainComponent extends React.Component<IMainProps, IMainState> {
    constructor(props: IMainProps) {
        super(props);

        this.state = this._getStateFromStore();

        this.props.store.addListener(this._onDataChange.bind(this));
    }

    public render(): JSX.Element {
        return (<div onKeyUp={ this._onKeyUp.bind(this) } onFocus={ this._onFocus.bind(this) } >
            <ParentWorkItemComponent item={ this.state.parentWorkItem } />

            { this.state.items.map((item, idx) =>
                <AddItemsComponent
                    key={ item.id }
                    item={ item }
                    actionsCreator={ this.props.actionsCreator }
                    ref={ idx.toString() }
                    />) }
        </div>);
    }

    public componentDidUpdate() {
        this._setFocus();
    }

    private _setFocus() {
        let element = this.refs[this.state.focusedItemIdx.toString()] as AddItemsComponent;

        if (element) {
            element.focus();
        }
    }

    private _getStateFromStore(): IMainState {
        let items = this.props.store.getItems();

        let focusedItemIdx = this.state && this.state.focusedItemIdx || 0;
        if (focusedItemIdx >= items.length) {
            focusedItemIdx = items.length - 1;
        }

        return {
            focusedItemIdx: focusedItemIdx,
            parentWorkItem: this.props.store.getParentItem(),
            items: items.slice(0)
        };
    }

    private _onDataChange() {
        this.setState(() => this._getStateFromStore());
    }

    private _onKeyUp(evt: KeyboardEvent) {
        // We can only perform actions if we have a focused item
        let focusedItem = this._getFocusedItem();
        if (!focusedItem) {
            return;
        }

        switch (evt.key) {
            case "ArrowUp":
                this._updateFocusedItem(-1);
                break;

            case "ArrowDown":
                this._updateFocusedItem(1);
                break;

            case "Tab":
                this.props.actionsCreator.changeItemIndentLevel(focusedItem.id, evt.shiftKey ? -1 : 1);
                break;

            case "Enter": {
                if (evt.altKey) {
                    this.props.actionsCreator.changeType(focusedItem.id);
                } else {
                    this.props.actionsCreator.insertItem(focusedItem.id);
                    this._forceUpdateFocusedItem(this.state.focusedItemIdx + 1);
                }
                break;
            }

            case "Delete": {
                if (evt.shiftKey) {
                    this.props.actionsCreator.deleteItem(focusedItem.id);
                    break;
                }
            }

            default:
                return;
        }

        // Prevent default browser action when we have handled it
        evt.preventDefault();
        return false;
    }

    private _onFocus(evt: FocusEvent) {
        // Focus has changed, update out element idx
        for (let i = 0; i < this.state.items.length; ++i) {
            let comp = this.refs[i] as AddItemsComponent;
            if (comp.hasFocus()) {
                this._forceUpdateFocusedItem(i);
                break;
            }
        }
    }

    private _forceUpdateFocusedItem(focusedItemIdx: number) {
        this.setState({
            focusedItemIdx: focusedItemIdx
        } as any, () => {
            this._setFocus();
        });
    }

    private _updateFocusedItem(direction: number) {
        let focusedItemIdx = this.state.focusedItemIdx;

        if (direction < 0) {
            if (focusedItemIdx > 0) {
                focusedItemIdx--;
            }
        } else {
            if (focusedItemIdx < this.state.items.length - 1) {
                focusedItemIdx++;
            }
        }

        this._forceUpdateFocusedItem(focusedItemIdx);
    }

    private _getFocusedItem(): IWorkItem {
        if (this.state.focusedItemIdx >= 0 && this.state.focusedItemIdx < this.state.items.length) {
            return this.state.items[this.state.focusedItemIdx];
        }

        return null;
    }
}