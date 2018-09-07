import { error } from 'utility';

const JsTree = class {
    constructor(title, id, created_at = Date.now()){
        if(!title) error('invalid data!');

        this.id = id;
        this.title = title;
        this.created_at = created_at;
        this.children = [];
    }

    add(tree){
        if(tree instanceof JsTree) this.children.push(tree);
        else error('invalid!');

        return this;
    }

    remove(tree){
        const list = this.children;

        if(list.includes(tree)) list.splice(list.indexOf(tree), 1);
    }

    composite(){
        const list = this.children;

        return {
            item: this,
            children: list.map(v => v._composite())
        }
    }

    _composite(){
        error();
    }
};

export default JsTree;