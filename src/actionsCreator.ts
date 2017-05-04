import { Store } from "./store";

import * as Actions from "./actions";

export class ActionsCreator {
    constructor(private store: Store) {
    }

    /**
     * Change the title of the given item
     * @param id Id of work item to change title for
     * @param title New title of work item
     */
    public changeTitle(id: number, title: string) {
        Actions.changeTitle.invoke({
            id: id,
            title: title
        });
    }
    
    /**
     * Change the indentation level of a work item
     * @param id Id of work item to change
     * @param indentLevelChange Desired indent level change of the work item
     */
    public changeItemIndentLevel(id: number, indentLevelChange: number) {
        Actions.changeWorkItemLevel.invoke({
            id: id,
            indentLevelChange: indentLevelChange
        });
    }
    
    /**
     * Add a new item after the given index
     * @param insertIndex New item will be added after this item
     */
    public insertItem(afterId: number) {
        Actions.insertItem.invoke({
            afterId: afterId
        });
    }
    
    /**
     * Delete the given work item
     * @param id Work item id to delete
     */
    public deleteItem(id: number) {
        Actions.deleteItem.invoke({
            id: id
        });
    }
    
    /**
     * Change type of given work item
     * @param id Work item id to change
     */
    public changeType(id: number) {
        Actions.changeType.invoke({
            id: id
        });
    }
}