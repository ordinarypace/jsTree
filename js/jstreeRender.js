import JsTreeList from 'jstreeList';
import JsTreeItem from 'jstreeItem';
import { Dom, Store, error, is } from 'utility';

const JsTreeRenderer = class {
    constructor(canvas){
        this._id = 0;
        this._parentId = '';
        this._dom = new Dom();
        this._map = new Map();
        this._store = new Store();
        this._state = null;
        this._symbols = new JsTreeState();
        this._canvas = canvas.nodeType ? canvas :  this._dom.$(canvas)[0];

        this.createRoot();
    }

    get id(){
        return this._id;
    }

    set id(v){
        this._id = v;
    }

    get scheme(){
        return [...this._map.values()];
    }

    createRoot(){
        this._canvas.innerHTML = `
            <ul class="js-tree__list">
            </ul>
        `;
    }

    createChildren(){
        return this._dom.el('ul', 'className', `js-tree__list child`);
    }

    create(container, id){
        if(!id) this._parentId = this.id;

        const item = this._dom.el('li', 'className', 'js-tree__item', 'setAttribute', ['data-parent-id', this._parentId], 'appendChild',
            this._dom.el('label', 'setAttribute', ['for', this._id], 'setAttribute', ['data-parent-id', this._parentId], 'addEventListener', ['dblclick', e => this.modify(e)], 'addEventListener', ['keyup', e => this.createLabel(e, id)], 'appendChild',
                this._dom.el('input', 'type', 'text', 'id', this._id)
            ), 'appendChild',
            this._dom.el('button', 'type', 'button', 'className', 'js-tree__children-add', 'innerHTML', 'Add Children', 'addEventListener', ['click', e => this.add(e, 'children')])
        );

        container.appendChild(item);

        this.id += 1;
    }

    createLabel(e, id){
        const { keyCode, target } = e;
        const value = target.value.trim();

        if(!is(this._symbols, JsTreeState)) error('State is not JsTreeState instance');

        if(keyCode === 13 && value.length){
            this.createScheme(id, target, value);

            target.parentNode.innerHTML = target.value.trim();

            this._store.set('jstree', this.scheme);
        }
    }

    createScheme(id, target, value){
        const { parentId } = target.parentNode.dataset;

        if(id === undefined) this._map.set(target.id, new JsTreeList(value, target.id));
        else {
            const scheme = this.find(target.id, parentId);

            if(is(this._symbols, JsTreeState) && this._state === this._symbols.state['ADD']) scheme.add(new JsTreeItem(value, target.id));
            else scheme.title = value;
        }
    }

    find(id, parentId){
        let scheme = [this._map.get(parentId)];

        while(scheme.length){
            let { children } = scheme[0];

            if(!children.length) return scheme[0];

            for(let i = 0; i < children.length; i += 1){
                if(children[i].id === id) return children[i];
                else if(children && children.length) scheme = [...children];
            }
        }
    }

    add(e){
        const container = this.createChildren();
        const parent = e.target.parentNode;

        this._state = this._symbols.state['ADD'];

        this.create(container, this._dom.$('label', parent)[0].getAttribute('for'));

        parent.appendChild(container);
    }

    modify(e){
        const { currentTarget } = e;
        const { parentId } = currentTarget.parentNode.dataset;
        const scheme = this.find(currentTarget.id, parentId);
        const item = this._dom.el('input', 'type', 'text', 'id', scheme.id, 'value', scheme.title);

        this._state = this._symbols.state['MODIFY'];

        currentTarget.innerHTML = '';
        currentTarget.appendChild(item);
    }
};

export default JsTreeRenderer;