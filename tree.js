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

    insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    delay(f){
        if(typeof f === 'function') setTimeout(f.bind(this), 0);
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
    constructor(title, id, rootId = null, parentId = null){
        if(!title) error('invalid data!');

        this.id = Number(id);
        this.title = title;
        this.created_at = Date.now();
        this.children = [];
        this.parent_id = Number(parentId);
        this.root_id = Number(rootId);
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
    constructor(title, id, rootId, parentId){
        super(title, id, rootId, parentId);
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
        40: 'down',
        46: 'delete',
        82: 'r'
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
        this._symbols = new JsTreeState();
        this._canvas = canvas.nodeType ? canvas :  this._dom.$(canvas)[0];
        this._nodes = this._dom.$('.js-tree__item');
        this._offset = undefined;
        this._range = document.createRange();
        this._alias = JsTreeKeyAlias();
        this._temp = [];
        this._unique = [];

        this.createRoot();
        this.createEvent();
    }

    /**
     * @desc id getter
     * @returns {number|*}
     */
    get id(){
        return this._id;
    }

    /**
     * @desc id setter
     * @param v
     */
    set id(v){
        this._id = v;
    }

    /**
     * @desc schema getter
     * @returns {[null]}
     */
    get schema(){
        return [...this._map.values()];
    }

    /**
     * @desc schema setter
     * @param v
     */
    set schema(v){
        this._map = v;
    }

    /**
     * @desc bind events
     */
    createEvent(){
        this._dom.on('keyup, keydown', [document], e => this.mapped(e), false);
    }

    /**
     * @desc create root node
     */
    createRoot(){
        this._canvas.innerHTML = `
            <ul class="js-tree__list">
            </ul>
        `;
    }

    /**
     * @desc create children container
     * @returns {*}
     */
    createChildren(){
        return this._dom.el('ul', 'className', `js-tree__list child`);
    }

    /**
     * @desc create node
     * @param container
     * @param id
     */
    create(container, id, root){
        let data = {};

        data.parent_id = id ? id : null;
        data.id = Number(this.id);
        data.root_id = root;

        const item = this.createNode(data);

        container.appendChild(item);

        this._dom.$('input', item)[0].focus();
        this.id += 1;
        this.updateNodes();
    }

    /**
     * @desc create node element
     * @param data
     * @returns {*}
     */
    createNode(data){
        return this._dom.el('li', 'className', 'js-tree__item',
            'setAttribute', ['data-parent-id', data.parent_id ? data.parent_id : ''],
            'setAttribute', ['data-id', data.id],
            'setAttribute', ['data-root-id', data.root_id ? data.root_id : data.id],
            'appendChild',
            this._dom.el('label',
                'setAttribute', ['for', data.id],
                'setAttribute', ['data-parent-id', data.parent_id],
                'setAttribute', ['data-root-id', data.root_id ? data.root_id : data.id],
                'addEventListener', ['keypress', e => this.createLabel(e, data)],
                'addEventListener', ['keyup', e => this.activeMoveNodes(e), false],
                'appendChild',
                this._dom.el('input', 'type', 'text', 'id', data.id, 'value', data.title ? data.title : '', 'readOnly', data.title)
            ), 'appendChild',
            this._dom.el('button', 'type', 'button', 'className', 'js-tree__children-add', 'innerHTML', 'Add Children', 'addEventListener', ['click', e => this.addChild(e, 'children')]), !data.parent_id ? 'appendChild' : '',
            this._dom.el('button', 'type', 'button', 'className', 'js-tree__fold', 'innerHTML', 'fold/unfold', 'addEventListener', ['click', e => this.showHide(e)])
        );
    }

    /**
     * @desc create label
     * @param e
     * @param id
     */
    createLabel(e, data){
        const { keyCode, target } = e;
        const value = target.value.trim();

        if(!is(this._symbols, JsTreeState)) error('State is not JsTreeState instance');

        if(this._alias[keyCode] === 'enter' && value.length){
            this.createSchema(data.parent_id, target, value);

            target.readOnly = true;
            target.value.trim();
            target.focus();

            this.saveSchema();

            this._dom.delay(_ => {
                this.traversNodes(1, null);
            });
        }
    }

    /**
     * @desc create schema
     * @param id
     * @param target
     * @param value
     */
    createSchema(parent, target, value){
        const { rootId, parentId } = target.parentNode.dataset;

        if(!parent) this._map.set(target.id, new JsTreeList(value, target.id));
        else {
            const schema = this.find(target.id, Number(rootId), Number(parentId));

            if(is(this._symbols, JsTreeState) && this._state === this._symbols.state['ADD']) schema.add(new JsTreeItem(value, target.id, rootId, parentId));
            else schema.title = value;
        }
    }

    /**
     * add child node
     * @param e
     */
    addChild(e){
        const container = this.createChildren();
        const parent = e.target.parentNode;

        this._state = this._symbols.state['ADD'];

        this.create(container, parent.dataset.id, parent.dataset.rootId);

        parent.appendChild(container);
    }

    /**
     * @desc renderer
     * @param parent
     * @param base
     * @param data
     */
    render(parent, base, data){
        parent.innerHTML = '';

        if(!data) error('Data is empty!');

        if(is(data, JsTreeList)) this.untieTree(parent, base, this.schema);
        else {
            this.syncMap(data);
            this.untieTree(parent, base, data);
        }

        this._render();

        this.updateNodes(data);
        this.updateSchema(data);
        this.saveSchema();
    }

    /**
     * @desc untie json data
     * @param parent
     * @param base
     * @param data
     */
    untieTree(parent, base, data){
        let node;
        const tree = data.slice(0);

        while(node = tree.shift()){
            const el = this.createNode(node);

            this._temp.push([parent, base, el]);
            this._unique.push(el.dataset.id);

            if(!node.children.length) continue;
            else {
                const base = this.createChildren();

                node = node.children;

                this.untieTree(el, base, node);
            }
        }

        this.id = this._unique.sort((a, b) => b - a)[0];
    }

    syncMap(tree){
        tree.forEach(v => this._map.set(v.id, v));
    }

    /**
     * @desc render tree
     * @private
     */
    _render(){
        this._temp.forEach(v => {
            const [parent, base, node] = v;
            const locate = this._dom.$('.js-tree__fold', parent).length ? '.js-tree__fold' : 'button';

            if(base){
                base.appendChild(node);

                this._dom.insertAfter(base, this._dom.$(locate, parent)[0]);
            } else parent.appendChild(node);
        });
    }

    /**
     * @desc find node
     * @param id
     * @param parentId
     * @returns {*}
     */
    find(id, rootId, parentId){
        let schema = [this._map.get(rootId)];
        let condition = Number(this._state === this._symbols.state['ADD'] ? parentId : id);

        while(schema.length){
            let { children } = schema[0];

            if(rootId === parentId || !children.length) return schema[0];

            for(let i = 0; i < children.length; i += 1){
                if(children[i].id === condition) return children[i];
                else if(children && children.length) schema = [...children];
            }
        }
    }

    showHide(e){
        const { target } = e;
        const [tree] = this._dom.$('ul', target.parentNode);

        if(tree){
            const { classList } = tree;

            if(classList.contains('fold')) classList.remove('fold');
            else classList.add('fold')
        }
    }

    /**
     * 복사: ctrl + c
     * 붙여넣기: ctrl + v
     * 저장: ctrl + s
     * 이름바꾸기: space
     * 삭제하기: delete
     * 그룹핑: ctrl + g
     * 루트 노드 생성: ctrl + r
     * depth 노드 생성: tab
     */
    /**
     * @desc mapped key
     * @param e
     */
    mapped(e){
        const { keyCode } = e;
        const key = this._alias[keyCode];

        if(key === 'shift' && key === 'down') this.selectRange();
        else if(key === 'space') this.changeNodeName();
        else if(key === 'delete') this.removeNode();
        else if(key === 'ctrl' && key === 'r') this.create(el('.js-tree__list')[0]);
    }

    /**
     * @desc select range
     */
    selectRange(){
        const reference = this._nodes[this._offset];
        const { getSelection } = window;
        const node = this._range.selectNode(reference);

        // this._range.setStart(node, 1);
        // this._range.setEnd(node, 1);

        getSelection().removeAllRanges();
        // const a = getSelection().addRange(this._range);
    }

    /**
     * @desc change name of node item
     */
    changeNodeName(){
        const node = this._dom.$('input', this._nodes[this._offset])[0];

        node.readOnly = false;
        node.focus();
    }

    /**
     * @desc remove node item
     */
    removeNode(){
        const node = this._nodes[this._offset];
        const index = this.index(node);

        this._nodes.splice(index, 1);
    }

    /**
     * @desc get index
     * @param v
     * @returns {number}
     */
    index(v){
        return this._nodes.findIndex(f => f === v);
    }

    /**
     * @desc update schema
     * @param data
     */
    updateSchema(data){
        let node = data.slice(0);
        const schema = new Map();

        this.schema = node.reduce((p, c) => { return p.set(c.id, c), p; }, schema);
    }

    /**
     * @desc update offset
     * @param v
     */
    updateOffset(v){
        this._offset = this.index(v);
    }

    /**
     * @desc update nodes
     */
    updateNodes(){
        this._dom.delay(_ => this._nodes = this._dom.$('.js-tree__item'));
    }

    /**
     * @desc save schema
     */
    saveSchema(){
        this._store.set('jstree', this.schema);
    }

    /**
     * @desc activate move for node
     * @param e
     */
    activeMoveNodes(e){
        const { keyCode, currentTarget } = e;

        if(this._offset === undefined) this.updateOffset(currentTarget.parentNode);

        if(this._alias[keyCode] === 'up') this.traversNodes(-1, keyCode);
        else if(this._alias[keyCode] === 'down') this.traversNodes(1, keyCode);
    }

    /**
     * @desc traverse nodes
     * @param direction
     * @param code
     */
    traversNodes(direction, code){
        const nodes = [...this._nodes];
        let node = [];

        if(nodes.length < 2) return;

        if(!this._offset && this._alias[code] === 'up') node = [nodes[nodes.length - 1], nodes[0]];
        else if(this._offset === nodes.length - 1 && this._alias[code] === 'down') node = [nodes[0], nodes[nodes.length - 1]];
        else node = [nodes[this._offset + direction], nodes[this._offset]];

        this.fitNodes(node);
    }

    /**
     * @desc fitting nodes
     * @param nodes
     */
    fitNodes(nodes){
        nodes[0].classList.add('selected');
        nodes[1].classList.remove('selected');

        this.updateOffset(nodes[0]);
        console.log(this._offset);
    }
};