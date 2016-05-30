import { Store } from "store";

import * as Actions from "actions";

export class ActionsCreator {        
    constructor(private store: Store) {        
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
     * Attempt to delete the given work item
     * @param id Work item id to delete
     */
    public attemptDelete(id: number) {
        Actions.attemptDelete.invoke({
            id: id
        });
    }
}