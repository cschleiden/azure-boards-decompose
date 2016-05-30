export interface IWorkItem {
    id: number;
        
    title: string;
    
    level?: number;
    
    relativeLevel?: number;
}

export interface IResultWorkItem extends IWorkItem {
    parentId: number;
}

export interface IDialogInputData {
    workItemId: number;
    setSaveHandler: (onSave: () => IPromise<void>) => void;
    onUpdate: (isValid: boolean) => void; 
}