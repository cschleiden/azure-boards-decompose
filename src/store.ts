import { IWorkItem, IResultWorkItem } from "interfaces";
import { WorkItemTypeService } from "services/workItemTypeService";
import { WorkItemTree } from "model/workItemTree";

import * as Actions from "actions";

export interface StoreListener {
    (): void;
}

class BaseStore {
    private _handlers: StoreListener[] = [];

    public addListener(handler: StoreListener) {
        this._handlers.push(handler);
    }

    protected _emitChanged() {
        for (let handler of this._handlers) {
            handler();
        }
    }
}

export class Store extends BaseStore {
    private _parentWorkItem: IWorkItem;
    private _tree: WorkItemTree;

    constructor(parentWorkItem: IWorkItem) {
        super();

        this._parentWorkItem = parentWorkItem;

        let minLevel = WorkItemTypeService.getInstance().getMinLevel();
        let maxLevel = WorkItemTypeService.getInstance().getMaxLevel();
        this._tree = new WorkItemTree(this._parentWorkItem, minLevel, maxLevel);

        Actions.changeWorkItemLevel.addListener(this._changeIndentLevel.bind(this));
        Actions.insertItem.addListener(this._insertItem.bind(this));
        Actions.changeTitle.addListener(this._changeTitle.bind(this));
        Actions.deleteItem.addListener(this._deleteItem.bind(this));

        // Add initial new item
        this._insertItem({ 
            afterId: this._parentWorkItem.id 
        });
    }

    public getParentItem(): IWorkItem {
        return this._parentWorkItem;
    }

    public getItems(): IWorkItem[] {
        let displayTree = this._tree.displayTree();
        
        for (let entry of displayTree) {
            entry.relativeLevel =  entry.level - this._parentWorkItem.level;
        }
        
        return displayTree;
    }
    
    public getResult(): IResultWorkItem[] {
        return this._tree.resultTree();
    }
    
    public getIsValid(): boolean {
        let currentResult = this.getResult();
        
        return currentResult && currentResult.length > 0 && currentResult.every(n => n.title.trim() !== "");
    }

    private _deleteItem(payload: Actions.IDeleteItemPayload) {
        this._tree.deleteItem(payload.id);
        this._emitChanged();
    }

    private _changeIndentLevel(payload: Actions.IChangeWorkItemLevelPayload) {
        let result: boolean;

        if (payload.indentLevelChange < 0) {
            result = this._tree.outdent(payload.id);
        } else {
            result = this._tree.indent(payload.id);
        }

        if (result) {
            this._emitChanged();
        }
    }

    private _changeTitle(payload: Actions.IChangeWorkItemTitle) {
        let workItem = this._getItem(payload.id);

        workItem.title = payload.title;

        this._emitChanged();
    }

    private _insertItem(payload: Actions.IInsertItemPayload) {
        if (this._tree.insert(payload.afterId) !== null) {
            this._emitChanged();
        }
    }

    private _getItem(id: number): IWorkItem {
        return this._tree.getItem(id);
    }
}