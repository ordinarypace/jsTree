import JsTree from 'jstree';

const JsTreeItem = class extends JsTree{
    constructor(title, id){
        super(title, id);
    }
};

export default JsTreeItem;