import { IDialogInputData } from "interfaces";

var actionProvider = {
    getMenuItems: (context) => {
        return [<IContributedMenuItem>{
            title: "Decompose work item",
            action: (actionContext) => {
                let workItemId = actionContext.id
                    || (actionContext.ids && actionContext.ids.length > 0 && actionContext.ids[0])
                    || (actionContext.workItemIds && actionContext.workItemIds.length > 0 && actionContext.workItemIds[0]);

                if (workItemId) {
                    let dialog: IExternalDialog;
                    let onSaveHandler: () => IPromise<void>;

                    VSS.getService(VSS.ServiceIds.Dialog).then((hostDialogService: IHostDialogService) => {
                        hostDialogService.openDialog(`${extensionContext.publisherId}.${extensionContext.extensionId}.addItemsDialog`, {
                            title: "Decompose",
                            width: 500,
                            height: 400,
                            modal: true,
                            buttons: {
                                "ok": {
                                    id: "ok",
                                    text: "Create",
                                    click: () => {
                                        if (onSaveHandler) {
                                            dialog.updateOkButton(false);

                                            return onSaveHandler().then(() => {
                                                dialog.close();
                                                
                                                return VSS.getService(VSS.ServiceIds.Navigation).then((navigationService: IHostNavigationService) => {
                                                    // Refresh backlog
                                                    navigationService.reload();
                                                });
                                            }, (error) => {
                                                dialog.setTitle(error);
                                            });
                                        }
                                    },
                                    class: "cta",
                                    disabled: "disabled"
                                }
                            }
                        }, <IDialogInputData>{
                            workItemId: workItemId,
                            setSaveHandler: (onSave: () => IPromise<void>) => {
                                onSaveHandler = onSave;
                            },
                            onUpdate: (isValid: boolean) => {
                                if (dialog) {
                                    dialog.updateOkButton(isValid);
                                }
                            },
                        }).then(d => {
                            dialog = d;
                        });
                    });
                }
            }
        }];
    }
};

// Register context menu action provider
let extensionContext = VSS.getExtensionContext();
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.contextMenu`, actionProvider);