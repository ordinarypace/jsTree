/**
 * @desc DOM 엘리먼트 관련 유틸
 * @type {Dom}
 */
const Dom = class {
    el(tag, ...attr){
        const el = typeof tag === 'string' ? document.createElement(tag) : tag;

        for(let i = 0; i < attr.length;){
            const k = attr[i++], v = attr[i++];

            switch(true){
                case typeof el[k] === 'function': {
                    el[k](...(Array.isArray(v) ? v : [v]));
                    break;
                }
                case k[0] === '@': {
                    el.style[k.substr(1)] = v;
                    break;
                }
                default: {
                    el[k] = v;
                    break;
                }
            }
        }

        return el;
    }

    $(selector, parent){
        const els = Array.from((parent || document).querySelectorAll(selector));

        return els;
    }

    on(events, els, callback, capture){
        events.split(',').forEach(e => els.forEach(v => v.addEventListener(e, callback, capture)));
    }

    off(events, els, callback){
        events.split(',').forEach(e => els.forEach(v => v.removeEventListener(e, callback)));
    }
};

const Store = class {
    set(name, value){
        if(!name || typeof name !== 'string') error('Name must be string type');

        localStorage.setItem(name, JSON.stringify(value));
    }

    get(name){
        if(!name || typeof name !== 'string') error('Name must be string type');

        return JSON.parse(localStorage.getItem(name));
    }
};

/**
 * @desc Throw error
 * @param str
 */
const error = (str) => {
    throw new Error(str ? str : 'override!');
};

const is = (obj, instance) => {
    return obj instanceof instance;
};

/**
 * @desc Tree
 * @type {JsTree}
 */
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

/**
 * @desc Tree List
 * @type {JsTreeList}
 */
const JsTreeList = class extends JsTree{
    constructor(title, id){
        super(title, id);
    }
};

/**
 * @desc Tree Item
 * @type {JsTreeItem}
 */
const JsTreeItem = class extends JsTree{
    constructor(title, id){
        super(title, id);
    }
};

const JsTreeState = class {
    constructor(){
        this.state = {};

        'ADD, MODIFY, REMOVE'.split(',').forEach(v => {
            const state = v.trim();

            this.state[state] = Symbol(state);
        });
    }
};

/**
 * 복사: ctrl + c
 * 붙여넣기: ctrl + v
 * 저장: ctrl + s
 * 이름바꾸기: space
 * 삭제하기: delete
 * 그룹핑: ctrl + g
 * 루트 노드 생성: enter
 * depth 노드 생성: tab
 *
 */
const JsTreeKeyAlias = _ => {
    return {
        8: 'backspace',
        9: 'tab',
        13: 'enter',
        16: 'shift',
        17: 'ctrl',
        18: 'alt',
        27: 'esc',
        32: 'space',
        38: 'up',
        40: 'down'
    };
};

/**
 * @desc Tree Renderer
 * @type {JsTreeRenderer}
 */
const JsTreeRenderer = class {
    constructor(canvas){
        this._id = 0;
        this._parentId = '';
        this._dom = new Dom();
        this._map = new Map();
        this._store = new Store();
        this._state = null;
        this._keys = [];
        this._symbols = new JsTreeState();
        this._canvas = canvas.nodeType ? canvas :  this._dom.$(canvas)[0];
        this._nodes = this._dom.$('.js-tree__item');
        this._offset = undefined;
        this._alias = JsTreeKeyAlias();

        this.createRoot();
        this.createEvent();
    }

    get id(){
        return this._id;
    }

    set id(v){
        this._id = v;
    }

    get schema(){
        return [...this._map.values()];
    }

    createEvent(){
        this._dom.on('keyup, keydown', [document], e => this.mapped(e), false);
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
            this._dom.el('label', 'setAttribute', ['for', this._id], 'setAttribute', ['data-parent-id', this._parentId],
                'addEventListener', ['dblclick', e => this.modify(e)],
                'addEventListener', ['keypress', e => this.createLabel(e, id)],
                'addEventListener', ['keyup', e => this.activeMoveNodes(e), false], 'appendChild',
                this._dom.el('input', 'type', 'text', 'id', this._id)
            ), 'appendChild',
            this._dom.el('button', 'type', 'button', 'className', 'js-tree__children-add', 'innerHTML', 'Add Children', 'addEventListener', ['click', e => this.addChild(e, 'children')])
        );

        container.appendChild(item);

        this._dom.$('input', item)[0].focus();

        setTimeout(_ => this.updateNodes(), 0);

        this.id += 1;
    }

    createLabel(e, id){
        const { keyCode, target } = e;
        const value = target.value.trim();

        if(!is(this._symbols, JsTreeState)) error('State is not JsTreeState instance');

        if(keyCode === 13 && value.length){
            this.createSchema(id, target, value);

            target.setAttribute('readonly', true);
            target.value.trim();
            target.focus();

            this._store.set('jstree', this.schema);
        }
    }

    //TODO 버튼 위치를 통해 parentId를 가져와야 한다.
    createSchema(id, target, value){
        const { parentId } = target.parentNode.dataset;

        if(id === undefined) this._map.set(target.id, new JsTreeList(value, target.id));
        else {
            const schema = this.find(target.id, parentId);

            if(is(this._symbols, JsTreeState) && this._state === this._symbols.state['ADD']) schema.add(new JsTreeItem(value, target.id));
            else schema.title = value;
        }
    }

    find(id, parentId){
        let schema = [this._map.get(parentId)];

        while(schema.length){
            let { children } = schema[0];

            if(!children.length) return schema[0];

            for(let i = 0; i < children.length; i += 1){
                if(children[i].id === id) return children[i];
                else if(children && children.length) schema = [...children];
            }
        }
    }

    mapped(e){
        const { keyCode } = e;

        this._keys.push(keyCode);

        if(this._keys.length > 0 && this._keys.every(v => this._alias[v])){
            console.log(this._alias[keyCode]);
            this._keys.length = 0;
        }
    }

    addChild(e){
        const container = this.createChildren();
        const parent = e.target.parentNode;

        this._state = this._symbols.state['ADD'];

        this.create(container, this._dom.$('label', parent)[0].getAttribute('for'));

        parent.appendChild(container);
    }

    index(v){
        return this._nodes.findIndex(f => f === v);
    }

    updateOffset(v){
        this._offset = this.index(v);
    }

    updateNodes(){
        this._nodes = this._dom.$('.js-tree__item');
    }

    modify(e){
        const { currentTarget } = e;
        const { parentId } = currentTarget.parentNode.dataset;
        const schema = this.find(currentTarget.id, parentId);
        const item = this._dom.el('input', 'type', 'text', 'id', schema.id, 'value', schema.title);

        this._state = this._symbols.state['MODIFY'];

        currentTarget.innerHTML = '';
        currentTarget.appendChild(item);
    }

    activeMoveNodes(e){
        const { keyCode, currentTarget } = e;

        if(this._offset === undefined) this.updateOffset(currentTarget.parentNode);

        if(this._alias[keyCode] === 'up') this.traversNodes(-1, keyCode);
        else if(this._alias[keyCode] === 'down') this.traversNodes(1, keyCode);
    }

    traversNodes(direction, code){
        const nodes = [...this._nodes];
        let node = [];

        if(this._offset === 0 && this._alias[code] === 'up') node = [nodes[nodes.length - 1], nodes[0]];
        else if(this._offset === nodes.length - 1 && this._alias[code] === 'down') node = [nodes[0], nodes[nodes.length - 1]];
        else node = [nodes[this._offset + direction], nodes[this._offset]];

        this.fitNodes(node);
    }

    fitNodes(nodes){
        nodes[0].classList.add('selected');
        nodes[1].classList.remove('selected');

        this.updateOffset(nodes[0]);
    }

    toggleNodes(){

    }
};