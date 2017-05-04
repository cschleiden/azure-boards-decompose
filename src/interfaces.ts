export interface IWorkItem {
    id: number;

    typeIndex: number;

    title: string;

    level?: number;

    relativeLevel?: number;
}

export interface IResultWorkItem extends IWorkItem {
    parentId: number;

    typeName: string;
}

export interface IDialogInputData {
    workItemId: number;
    setSaveHandler: (onSave: () => IPromise<void>) => void;
    onUpdate: (isValid: boolean) => void;
}

export interface IWorkItemType {
    name: string;
    color?: string;
}

export interface IBacklogLevel {
    types: IWorkItemType[];
    defaultType: IWorkItemType;
    level: number;
}