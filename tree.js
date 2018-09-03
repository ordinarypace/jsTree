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
};

/**
 * @desc Throw error
 * @param str
 */
const error = (str) => {
    throw new Error(str ? str : 'override!');
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

    toJSON(){
        return {
            title: this.title,
            created_at: this.created_at,
            children: this.children.map(v => v._composite())
        }
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

/**
 * @desc Tree Renderer
 * @type {JsTreeRenderer}
 */
const JsTreeRenderer = class {
    constructor(canvas){
        this._id = 0;
        this._dom = new Dom();
        this._map = new Map();
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
        return [...this._map];
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
        const item = this._dom.el('li', 'className', 'js-tree__item', 'appendChild',
            this._dom.el('label', 'setAttribute', ['for', this._id], 'addEventListener', ['dblclick', e => this.modify(e)], 'addEventListener', ['keyup', e => this.createLabel(e, id)], 'appendChild',
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

        if(keyCode === 13 && target.value.trim().length){
            this.createTree(id, target, value);

            target.parentNode.innerHTML = target.value.trim();
        }
    }

    createTree(id, target, value){
        if(!id) this._map.set(target.id, new JsTreeList(value, target.id));
        else {
            const item = this._map.get(id).add(new JsTreeItem(value));

            this._map.set(id, item);
        }
    }

    render(data){

    }

    add(e){
        const container = this.createChildren();
        const parent = e.target.parentNode;

        console.log(this._dom.$('input', parent));

        this.create(container, this._dom.$('label', parent)[0].getAttribute('for'));

        parent.appendChild(container);
    }

    remove(){

    }

    modify(e){
        const { currentTarget } = e;

        const data = this._map.get(currentTarget.getAttribute('for'));
        const item = this._dom.el('input', 'type', data.type, 'id', data.id, 'value', data.value);

        currentTarget.innerHTML = '';
        currentTarget.appendChild(item);
    }
};