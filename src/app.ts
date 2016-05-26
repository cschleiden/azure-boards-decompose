import { Test } from "other";

var actionProvider =  {        
    getMenuItems: (context) => {
        return [<IContributedMenuItem>{
            title: "Work Item Menu Action",
            action: (actionContext) => {
                let workItemId = actionContext.id
                    || (actionContext.ids && actionContext.ids.length > 0 && actionContext.ids[0])
                    || (actionContext.workItemIds && actionContext.workItemIds.length > 0 && actionContext.workItemIds[0]);
                    
                if (workItemId) {
                    alert(`Selected work item ${workItemId} ${Test.Hello}`);
                }
            }
        }];
    }
};

// Register context menu action provider
let extensionContext = VSS.getExtensionContext();
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.contextMenu`, actionProvider);