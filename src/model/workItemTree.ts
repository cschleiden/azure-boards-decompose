import { IWorkItem, IResultWorkItem } from "../interfaces";

export class WorkItemNode {
    public parent: WorkItemNode;
    public children: WorkItemNode[] = [];

    constructor(public workItem: IWorkItem) {
    }

    public add(node: WorkItemNode) {
        node.parent = this;
        this.children.push(node);
    }

    public insert(node: WorkItemNode, idx: number) {
        node.parent = this;
        this.children.splice(idx, 0, node);
    }

    public remove(node: WorkItemNode) {
        let idx = this.children.indexOf(node);
        if (idx === -1) {
            throw new Error("Node to be removed is not in children");
        }

        node.parent = null;
        this.children.splice(idx, 1);
    }
}

export class WorkItemTree {
    protected root: WorkItemNode;
    private insertId = -1;

    constructor(private parentWorkItem: IWorkItem, private minLevel = 1, private maxLevel = 4) {
        this.root = new WorkItemNode(this.parentWorkItem);
    }

    public getItem(id: number): IWorkItem {
        let node = this._find(id);
        return node.workItem;
    }

    /** Indent and all subtrees of the given work item */
    public indent(id: number): boolean {
        let node = this._find(id);
        if (!node.parent) {
            // Cannot indent root
            return false;
        }

        let nodeParentIdx = node.parent.children.indexOf(node);
        if (nodeParentIdx === 0) {
            // Cannot indent without sibling
            return false;
        }

        let wouldReachMaxLevel = false;
        this._traverse(node, n => {
            let level = this._getLevelForNode(n);
            if (level + 1 > this.maxLevel) {
                wouldReachMaxLevel = true;
                return false;
            }
        });
        if (wouldReachMaxLevel) {
            // Cannot indent after max level
            return false;
        }

        let previousSibling = node.parent.children[nodeParentIdx - 1];

        // Detach from current parent
        node.parent.remove(node);

        // Add to new parent
        previousSibling.add(node);

        return true;
    }

    public outdent(id: number) {
        let node = this._find(id);
        if (!node.parent) {
            // Cannot outdent root
            return false;
        }

        if (node.parent === this.root) {
            // Cannot outdent top level items
            return false;
        }

        let newParent = node.parent.parent;
        let oldParent = node.parent;

        // Find position to insert in new parent
        let nodeParentIdx = newParent.children.indexOf(node.parent);
        
        // Determine whether there are siblings after current item
        let nodeIdx = oldParent.children.indexOf(node);
        if (nodeIdx + 1 < oldParent.children.length) {
            // There are siblings which need to be moved
            let itemsToMove = oldParent.children.slice(nodeIdx + 1);
            for (let itemToMove of itemsToMove) {
                oldParent.remove(itemToMove);
                node.add(itemToMove);
            }
        }
        
        // Detach from current parent
        oldParent.remove(node);

        // Add to new parent
        newParent.insert(node, nodeParentIdx + 1);
        
        return true;
    }

    /** Insert sibling after the given work item */
    public insert(afterId: number): IWorkItem {
        let node = this._find(afterId);

        let newNode = new WorkItemNode({
            id: this.insertId--,
            title: ""
        });
        
        if (node === this.root) {
            node.add(newNode);
        } else {
            node.parent.add(newNode);
        }
        
        newNode.workItem.level = this._getLevelForNode(newNode);

        return newNode.workItem;
    }
    
    /** Delete item with given id from tree */
    public deleteItem(id: number): boolean {
        let node = this._find(id);
        
        if (node === this.root) {
            throw new Error("Cannot delete root");
        }
        
        if (node.parent === this.root && this.root.children.length === 1) {
            // Cannot delete last item before root
            return false;
        }
        
        node.parent.remove(node);
        
        return true;
    }

    /** Flatten tree */
    public displayTree(): IWorkItem[] {
        let result: IWorkItem[] = [];

        this._traverse(this.root, node => {
            if (node !== this.root) {                
                let level = this._getLevelForNode(node);
                
                result.push({
                    id: node.workItem.id,
                    title: node.workItem.title,
                    level: level,
                    relativeLevel: level - this.parentWorkItem.level
                });
            }
        });

        return result;
    }

    /** Flatten tree */
    public resultTree(): IResultWorkItem[] {
        let result: IResultWorkItem[] = [];        

        this._traverse(this.root, (node, parent) => {
            let level = this._getLevelForNode(node);
            
            result.push({
                id: node.workItem.id,
                title: node.workItem.title,
                level: level,
                parentId: parent ? parent.workItem && parent.workItem.id : null
            });
        });

        return result;
    }

    private _getLevelForNode(node: WorkItemNode): number {
        let level = 0;

        let parent = node.parent;
        while(!!parent) {
            ++level;
            
            parent = parent.parent;
        }

        return level + this.parentWorkItem.level;
    }

    private _find(id: number): WorkItemNode {
        let result: WorkItemNode;

        this._traverse(this.root, node => {
            if (node.workItem.id === id) {
                result = node;

                return false;
            }
        });

        if (!result) {
            throw new Error(`Could not find node with id '${id}'`);
        }

        return result;
    }

    private _traverse(root: WorkItemNode, cb: (node: WorkItemNode, parent?: WorkItemNode) => boolean | void) {
        let itemToParent: IDictionaryNumberTo<WorkItemNode> = {};

        let stack = [root];
        while (stack.length > 0) {
            let node = stack.pop();

            if (cb(node, itemToParent[node.workItem.id] || null) === false) {
                // Abort traversal
                return;
            }

            let reverseChildren = node.children.slice(0).reverse();
            for (let child of reverseChildren) {
                itemToParent[child.workItem.id] = node;

                stack.push(child);
            }
        }
    }
}