/** Interface for a simple listener to an action firing */
export interface IActionHandler<TPayload> {
    (payload: TPayload): void;
}

let executing = false;

/** Base class for a self dispatched action */
export class Action<TPayload> {
    private _handlers: IActionHandler<TPayload>[] = [];
    
    public addListener(handler: IActionHandler<TPayload>) {
        this._handlers.push(handler);
    }
    
    public invoke(payload: TPayload) {
        if (executing) {
            throw new Error("Cycle!");
        }
        
        executing = true;
        
        for (let handler of this._handlers) {
            handler(payload);
        }
        
        executing = false;
    }
}

export interface IChangeWorkItemLevelPayload {
    id: number;
    indentLevelChange: number;
}

/** Action to be called when the indent level of a work item should be changed */
export var changeWorkItemLevel = new Action<IChangeWorkItemLevelPayload>();

export interface IInsertItemPayload {
    afterId: number;
}

/** Action to be called when a new work item should be inserted at a given index */
export var insertItem = new Action<IInsertItemPayload>();

export interface IChangeWorkItemTitle {
    id: number;
    title: string;
}

/** Action to be called when work item title changes */
export var changeTitle = new Action<IChangeWorkItemTitle>();

export interface IDeleteItemPayload {
    id: number;
}

/** Action to be called when work item should be deleted */
export var deleteItem = new Action<IDeleteItemPayload>();