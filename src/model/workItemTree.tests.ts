import { expect } from 'chai';

import { WorkItemTree, WorkItemNode } from "./workItemTree";
import { IWorkItem } from "../interfaces";

class TestableWorkItemTree extends WorkItemTree {
    constructor(parentWorkItem: IWorkItem) {
        super(parentWorkItem);

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

        this.root.add(new WorkItemNode(this._getWorkItem(0)));
        this.root.children[0].add(new WorkItemNode(this._getWorkItem(1)));
        this.root.children[0].add(new WorkItemNode(this._getWorkItem(2)));
        this.root.children[0].children[1].add(new WorkItemNode(this._getWorkItem(3)));

        this.root.add(new WorkItemNode(this._getWorkItem(4)));
        this.root.children[1].add(new WorkItemNode(this._getWorkItem(5)));
        this.root.children[1].add(new WorkItemNode(this._getWorkItem(6)));
    }

    private _getWorkItem(id: number): IWorkItem {
        return {
            title: "",
            id: id
        };
    }
}

describe("WorkItemTree", () => {
    const parentId = 42;
    const parentWorkItem: IWorkItem = {
        id: parentId,
        title: "Parent-Epic",
        level: 1
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
            tree = new WorkItemTree(parentWorkItem);
        });

        it("should allow to insert item after root", () => {
            expect(tree.insert(parentId)).to.deep.equal(<IWorkItem>{
                id: -1,
                title: "",
                level: 2
            });
        });

        it("should allow to insert sibling item", () => {
            let afterId = tree.insert(parentId).id;

            expect(tree.insert(afterId)).to.deep.equal(<IWorkItem>{
                id: -2,
                title: "",
                level: 2
            });
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
            expect(tree.indent(2)).to.be.false;
        });

        it("should allow indenting items without subtree", () => {
            tree.indent(6);
            expect(getTreeLevels()).to.be.deep.equal([2, 3, 3, 4, 2, 3, 4]);
            expect(getTreeIds()).to.be.deep.equal([0, 1, 2, 3, 4, 5, 6]);
        });

        it("should allow indenting items with subtree", () => {
            tree.indent(4);
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
            tree.outdent(5);
            expect(getTreeLevels()).to.be.deep.equal([2, 3, 3, 4, 2, 2, 3]);
            expect(getTreeIds()).to.be.deep.equal([0, 1, 2, 3, 4, 5, 6]);
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

    let getTreeLevels = (): number[] => {
        return tree.displayTree().map(wi => wi.level);
    };
    
    let getTreeIds = (): number[] => {
        return tree.displayTree().map(wi => wi.id);
    };
});