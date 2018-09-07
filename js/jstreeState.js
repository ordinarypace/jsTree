const JsTreeState = class {
    constructor(){
        this.state = {};

        'ADD, MODIFY, REMOVE'.split(',').forEach(v => {
            const state = v.trim();

            this.state[state] = Symbol(state);
        });
    }
};

export default JsTreeState;