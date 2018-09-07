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

const error = (str) => {
    throw new Error(str ? str : 'override!');
};

const is = (obj, instance) => {
    return obj instanceof instance;
};

export { Dom, Store, error, is };