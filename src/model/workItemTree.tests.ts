import { expect } from 'chai';

import { WorkItemTree, WorkItemNode, IWorkItemTypeAdapter } from "./workItemTree";
import { IWorkItem, IBacklogLevel } from "../interfaces";


class TestableWorkItemTypeService implements IWorkItemTypeAdapter {
    public getMaxLevel(): number {
        return 4;
    }    
    
    public getBacklogForLevel(level: number): IBacklogLevel {
        return <IBacklogLevel>{
            level: level,
            types: [{
                name: `type1-${level}`,
                color: "rgb(255, 0, 0)"
            }, {
                name: `type2-${level}`,
                color: "rgb(0, 255, 0)"
            }]
        };
    }
}

class TestableWorkItemTree extends WorkItemTree {
    constructor(parentWorkItem: IWorkItem, buildEmptyTree: boolean = false) {
        super(parentWorkItem, new TestableWorkItemTypeService());

        /* Build tree with hierarchy:
             parent     (1) 
               0        (2)
                 1      (3)
                 2      (3)
                   3    (4)
               4        (2)
                 5      (3)
                 6      (3)
            */

        if (!buildEmptyTree) {
            this.root.add(new WorkItemNode(this._getWorkItem(0)));
            this.root.children[0].add(new WorkItemNode(this._getWorkItem(1)));
            this.root.children[0].add(new WorkItemNode(this._getWorkItem(2)));
            this.root.children[0].children[1].add(new WorkItemNode(this._getWorkItem(3)));

            this.root.add(new WorkItemNode(this._getWorkItem(4)));
            this.root.children[1].add(new WorkItemNode(this._getWorkItem(5)));
            this.root.children[1].add(new WorkItemNode(this._getWorkItem(6)));
        }
    }

    private _getWorkItem(id: number): IWorkItem {
        return {
            title: "",
            id: id,
            typeIndex: 0
        };
    }
}

describe("WorkItemTree", () => {
    const parentId = 42;
    const parentWorkItem: IWorkItem = {
        id: parentId,
        title: "Parent-Epic",
        level: 1,
        typeIndex: 0
    };

    let tree: WorkItemTree;

    describe("getItem", () => {
        beforeEach(() => {
            tree = new TestableWorkItemTree(parentWorkItem);
        });

        it("should throw for invalid id", () => {
            expect(() => tree.getItem(99)).to.throw(Error);
        });

        it("should get item for valid id", () => {
            expect(tree.getItem(2).id).to.be.equal(2);
        });
    });

    describe("insert", () => {
        beforeEach(() => {
            tree = new TestableWorkItemTree(parentWorkItem, true);
        });

        it("should allow to insert item after root", () => {
            expect(tree.insert(parentId)).to.deep.equal(<IWorkItem>{
                id: -1,
                title: "",
                level: 2,
                typeIndex: 0
            });
        });

        it("should allow to insert sibling item", () => {
            let afterId = tree.insert(parentId).id;

            expect(tree.insert(afterId)).to.deep.equal(<IWorkItem>{
                id: -2,
                title: "",
                level: 2,
                typeIndex: 0
            });
        });

        it("should allow to insert item after reference element with children", () => {
            tree = new TestableWorkItemTree(parentWorkItem);
            let newId = tree.insert(2).id;
                        
            expect(getTreeLevels()).to.be.deep.equal([2, 3, 3, 4, 4, 2, 3, 3]);
            expect(getTreeIds()).to.be.deep.equal([0, 1, 2, newId, 3, 4, 5, 6]);
        });

        it("should allow to insert item after reference element on same level", () => {
            tree = new TestableWorkItemTree(parentWorkItem);
            let newId = tree.insert(5).id;
                        
            expect(getTreeLevels()).to.be.deep.equal([2, 3, 3, 4, 2, 3, 3, 3]);
            expect(getTreeIds()).to.be.deep.equal([0, 1, 2, 3, 4, 5, newId, 6]);
        });
        
        it("should not allow to insert after invalid element", () => {
            expect(() => tree.insert(99)).to.throw(Error);
        });
    });

    describe("indent/outdent", () => {
        beforeEach(() => {
            /* Build tree with hierarchy:
             parent     (1) 
               0        (2)
                 1      (3)
                 2      (3)
                   3    (4)
               4        (2)
                 5      (3)
                 6      (3)
            */
            tree = new TestableWorkItemTree(parentWorkItem);
        });

        it("should not allow indenting items without previous sibling", () => {
            expect(tree.indent(0)).to.be.false;
            expect(tree.indent(1)).to.be.false;
            expect(tree.indent(3)).to.be.false;
            expect(tree.indent(5)).to.be.false;
        });

        it("should not allow indenting items after max level", () => {
            expect(tree.indent(3)).to.be.false;
        });
        
        it("should allow indenting items and change children if max level would be reached", () => {
            expect(tree.indent(2)).to.be.true;
            expect(getTreeLevels()).to.be.deep.equal([2, 3, 4, 4, 2, 3, 3]);
            expect(getTreeIds()).to.be.deep.equal([0, 1, 2, 3, 4, 5, 6]);
        });

        it("should allow indenting items without subtree", () => {
            expect(tree.indent(6)).to.be.true;
            expect(getTreeLevels()).to.be.deep.equal([2, 3, 3, 4, 2, 3, 4]);
            expect(getTreeIds()).to.be.deep.equal([0, 1, 2, 3, 4, 5, 6]);
        });

        it("should allow indenting items with subtree", () => {
            expect(tree.indent(4)).to.be.true;
            expect(getTreeLevels()).to.be.deep.equal([2, 3, 3, 4, 3, 4, 4]);
            expect(getTreeIds()).to.be.deep.equal([0, 1, 2, 3, 4, 5, 6]);
        });


        it("should not allow outdenting root items", () => {
            expect(tree.outdent(0)).to.be.false;
            expect(tree.outdent(4)).to.be.false;
        });

        it("should allow outdenting items without subtree", () => {
            expect(tree.outdent(3)).to.be.true;
            expect(getTreeLevels()).to.be.deep.equal([2, 3, 3, 3, 2, 3, 3]);
            expect(getTreeIds()).to.be.deep.equal([0, 1, 2, 3, 4, 5, 6]);
        });

        it("should allow outdenting items with subtree", () => {
            expect(tree.outdent(2)).to.be.true;
            expect(getTreeLevels()).to.be.deep.equal([2, 3, 2, 3, 2, 3, 3]);
            expect(getTreeIds()).to.be.deep.equal([0, 1, 2, 3, 4, 5, 6]);
        });

        it("should allow reparent children when outdenting items", () => {
            expect(tree.outdent(5)).to.be.true;
            expect(getTreeLevels()).to.be.deep.equal([2, 3, 3, 4, 2, 2, 3]);
            expect(getTreeIds()).to.be.deep.equal([0, 1, 2, 3, 4, 5, 6]);
        });
        
        it("should reset typeindex", () => {
            tree.getItem(2).typeIndex = 3;
            expect(tree.outdent(2)).to.be.true;
            expect(tree.getItem(2).typeIndex).to.be.equal(0);
            
            tree.getItem(2).typeIndex = 3;
            expect(tree.indent(2)).to.be.true;
            expect(tree.getItem(2).typeIndex).to.be.equal(0);
        });
    });

    describe("resultTree", () => {
        it("should generate tree", () => {
            tree = new TestableWorkItemTree(parentWorkItem);
            let resultTree = tree.resultTree();

            expect(resultTree.map(wi => wi.parentId)).to.be.deep.equal([null, 42, 0, 0, 2, 42, 4, 4]);
        });
    });

    describe("displayTree", () => {
        it("should not include parent item", () => {
            tree = new TestableWorkItemTree(parentWorkItem);
            let resultTree = tree.displayTree();

            expect(resultTree.some(e => e.id === parentId)).to.be.false;
        });
    });

    describe("delete", () => {
        beforeEach(() => {
            /* Build tree with hierarchy:
             parent     (1) 
               0        (2)
                 1      (3)
                 2      (3)
                   3    (4)
               4        (2)
                 5      (3)
                 6      (3)
            */
            tree = new TestableWorkItemTree(parentWorkItem);
        });

        it("should not delete root", () => {
            expect(() => tree.deleteItem(parentId)).to.throw(Error);
        });

        it("should not delete last item", () => {
            tree = new TestableWorkItemTree(parentWorkItem, true);
            let id = tree.insert(parentId).id;

            expect(tree.deleteItem(id)).to.be.false;
        });

        it("should delete item", () => {
            tree.deleteItem(3);
            expect(getTreeIds()).to.be.deep.equal([0, 1, 2, 4, 5, 6]);
        });

        it("should delete item and subtree", () => {
            tree.deleteItem(2);
            expect(getTreeIds()).to.be.deep.equal([0, 1, 4, 5, 6]);
        });
    });
    
    describe("changeType", () => {
        beforeEach(() => {
            /* Build tree with hierarchy:
             parent     (1) 
               0        (2)
                 1      (3)
                 2      (3)
                   3    (4)
               4        (2)
                 5      (3)
                 6      (3)
            */
            tree = new TestableWorkItemTree(parentWorkItem);
        });
        
        it("should cycle through types per level", () => {
            expect(getTypeNameForItem(2)).to.be.equal("type1-3");
            
            tree.changeType(2);
            expect(getTypeNameForItem(2)).to.be.equal("type2-3");
            
            tree.changeType(2);
            expect(getTypeNameForItem(2)).to.be.equal("type1-3");
        });
        
        let getTypeNameForItem = (id: number): string => {
            return tree.resultTree().filter(item => item.id === id)[0].typeName;
        }
    });
       

    let getTreeLevels = (): number[] => {
        return tree.displayTree().map(wi => wi.level);
    };

    let getTreeIds = (): number[] => {
        return tree.displayTree().map(wi => wi.id);
    };
});