
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\NumList.svelte generated by Svelte v3.46.4 */

    const file$1 = "src\\components\\NumList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (18:8) {#each nums as num}
    function create_each_block$1(ctx) {
    	let li;
    	let t_value = /*num*/ ctx[5] + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$1, 18, 12, 528);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*nums*/ 1 && t_value !== (t_value = /*num*/ ctx[5] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(18:8) {#each nums as num}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let span;
    	let t0;
    	let t1;
    	let t2;
    	let input;
    	let t3;
    	let button;
    	let t4;
    	let t5;
    	let t6;
    	let ul;
    	let mounted;
    	let dispose;
    	let each_value = /*nums*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			t0 = text(/*name*/ ctx[2]);
    			t1 = text(":");
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			button = element("button");
    			t4 = text("Adicionar ");
    			t5 = text(/*name*/ ctx[2]);
    			t6 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span, "class", "input-group-text");
    			add_location(span, file$1, 12, 8, 239);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$1, 13, 8, 294);
    			attr_dev(button, "class", "btn btn-dark");
    			add_location(button, file$1, 14, 8, 372);
    			attr_dev(div0, "class", "input-group mb-3");
    			add_location(div0, file$1, 11, 4, 199);
    			attr_dev(ul, "class", "list-group");
    			add_location(ul, file$1, 16, 4, 462);
    			add_location(div1, file$1, 10, 0, 188);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(div0, t2);
    			append_dev(div0, input);
    			set_input_value(input, /*defaultNum*/ ctx[1]);
    			append_dev(div0, t3);
    			append_dev(div0, button);
    			append_dev(button, t4);
    			append_dev(button, t5);
    			append_dev(div1, t6);
    			append_dev(div1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(button, "click", /*addNum*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 4) set_data_dev(t0, /*name*/ ctx[2]);

    			if (dirty & /*defaultNum*/ 2 && to_number(input.value) !== /*defaultNum*/ ctx[1]) {
    				set_input_value(input, /*defaultNum*/ ctx[1]);
    			}

    			if (dirty & /*name*/ 4) set_data_dev(t5, /*name*/ ctx[2]);

    			if (dirty & /*nums*/ 1) {
    				each_value = /*nums*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NumList', slots, []);
    	let { name = "" } = $$props;
    	let { nums = [] } = $$props;
    	let { defaultNum = 0 } = $$props;

    	const addNum = () => {
    		$$invalidate(0, nums = nums.concat(defaultNum));
    	};

    	const writable_props = ['name', 'nums', 'defaultNum'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NumList> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		defaultNum = to_number(this.value);
    		$$invalidate(1, defaultNum);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('nums' in $$props) $$invalidate(0, nums = $$props.nums);
    		if ('defaultNum' in $$props) $$invalidate(1, defaultNum = $$props.defaultNum);
    	};

    	$$self.$capture_state = () => ({ name, nums, defaultNum, addNum });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('nums' in $$props) $$invalidate(0, nums = $$props.nums);
    		if ('defaultNum' in $$props) $$invalidate(1, defaultNum = $$props.defaultNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [nums, defaultNum, name, addNum, input_input_handler];
    }

    class NumList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 2, nums: 0, defaultNum: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NumList",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get name() {
    		throw new Error("<NumList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<NumList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nums() {
    		throw new Error("<NumList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nums(value) {
    		throw new Error("<NumList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get defaultNum() {
    		throw new Error("<NumList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set defaultNum(value) {
    		throw new Error("<NumList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.4 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    // (157:7) {#each finalInfos as finalInfo}
    function create_each_block_1(ctx) {
    	let p;
    	let t_value = /*finalInfo*/ ctx[24] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			add_location(p, file, 157, 8, 4792);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*finalInfos*/ 64 && t_value !== (t_value = /*finalInfo*/ ctx[24] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(157:7) {#each finalInfos as finalInfo}",
    		ctx
    	});

    	return block;
    }

    // (196:6) {#each table as row, index}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*row*/ ctx[21].cliente + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*row*/ ctx[21].tempoDesdeAUltimaChegada + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*row*/ ctx[21].tempoDeChegadaNoRelogio + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*row*/ ctx[21].tempoDoServico + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*row*/ ctx[21].tempoDeInicioDeServicoNoRelogio + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10_value = /*row*/ ctx[21].tempoDoClienteNaFila + "";
    	let t10;
    	let t11;
    	let td6;
    	let t12_value = /*row*/ ctx[21].tempoFinalDoServicoNoRelogio + "";
    	let t12;
    	let t13;
    	let td7;
    	let t14_value = /*row*/ ctx[21].tempoDoClienteNoSistema + "";
    	let t14;
    	let t15;
    	let td8;
    	let t16_value = /*row*/ ctx[21].tempoLivreDoOperador + "";
    	let t16;
    	let t17;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td6 = element("td");
    			t12 = text(t12_value);
    			t13 = space();
    			td7 = element("td");
    			t14 = text(t14_value);
    			t15 = space();
    			td8 = element("td");
    			t16 = text(t16_value);
    			t17 = space();
    			add_location(td0, file, 197, 8, 6119);
    			add_location(td1, file, 198, 8, 6151);
    			add_location(td2, file, 199, 8, 6200);
    			add_location(td3, file, 200, 8, 6248);
    			add_location(td4, file, 201, 8, 6287);
    			add_location(td5, file, 202, 8, 6343);
    			add_location(td6, file, 203, 8, 6388);
    			add_location(td7, file, 204, 8, 6441);
    			add_location(td8, file, 205, 8, 6489);
    			attr_dev(tr, "class", "svelte-966ocg");
    			toggle_class(tr, "last-line", /*index*/ ctx[23] === /*table*/ ctx[5].length - 1);
    			add_location(tr, file, 196, 7, 6060);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td6);
    			append_dev(td6, t12);
    			append_dev(tr, t13);
    			append_dev(tr, td7);
    			append_dev(td7, t14);
    			append_dev(tr, t15);
    			append_dev(tr, td8);
    			append_dev(td8, t16);
    			append_dev(tr, t17);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table*/ 32 && t0_value !== (t0_value = /*row*/ ctx[21].cliente + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*table*/ 32 && t2_value !== (t2_value = /*row*/ ctx[21].tempoDesdeAUltimaChegada + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*table*/ 32 && t4_value !== (t4_value = /*row*/ ctx[21].tempoDeChegadaNoRelogio + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*table*/ 32 && t6_value !== (t6_value = /*row*/ ctx[21].tempoDoServico + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*table*/ 32 && t8_value !== (t8_value = /*row*/ ctx[21].tempoDeInicioDeServicoNoRelogio + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*table*/ 32 && t10_value !== (t10_value = /*row*/ ctx[21].tempoDoClienteNaFila + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*table*/ 32 && t12_value !== (t12_value = /*row*/ ctx[21].tempoFinalDoServicoNoRelogio + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*table*/ 32 && t14_value !== (t14_value = /*row*/ ctx[21].tempoDoClienteNoSistema + "")) set_data_dev(t14, t14_value);
    			if (dirty & /*table*/ 32 && t16_value !== (t16_value = /*row*/ ctx[21].tempoLivreDoOperador + "")) set_data_dev(t16, t16_value);

    			if (dirty & /*table*/ 32) {
    				toggle_class(tr, "last-line", /*index*/ ctx[23] === /*table*/ ctx[5].length - 1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(196:6) {#each table as row, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div15;
    	let div1;
    	let div0;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let div6;
    	let div5;
    	let div4;
    	let div2;
    	let t5;
    	let div3;
    	let blockquote;
    	let div4_hidden_value;
    	let t6;
    	let div9;
    	let div8;
    	let div7;
    	let span;
    	let t8;
    	let input;
    	let t9;
    	let div12;
    	let div10;
    	let numlist0;
    	let updating_nums;
    	let updating_defaultNum;
    	let t10;
    	let div11;
    	let numlist1;
    	let updating_nums_1;
    	let updating_defaultNum_1;
    	let t11;
    	let div14;
    	let div13;
    	let table_1;
    	let thead;
    	let th0;
    	let t13;
    	let th1;
    	let t15;
    	let th2;
    	let t17;
    	let th3;
    	let t19;
    	let th4;
    	let t21;
    	let th5;
    	let t23;
    	let th6;
    	let t25;
    	let th7;
    	let t27;
    	let th8;
    	let t29;
    	let tbody;
    	let table_1_hidden_value;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*finalInfos*/ ctx[6];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	function numlist0_nums_binding(value) {
    		/*numlist0_nums_binding*/ ctx[10](value);
    	}

    	function numlist0_defaultNum_binding(value) {
    		/*numlist0_defaultNum_binding*/ ctx[11](value);
    	}

    	let numlist0_props = { name: "TEC" };

    	if (/*TECs*/ ctx[1] !== void 0) {
    		numlist0_props.nums = /*TECs*/ ctx[1];
    	}

    	if (/*defaultTEC*/ ctx[2] !== void 0) {
    		numlist0_props.defaultNum = /*defaultTEC*/ ctx[2];
    	}

    	numlist0 = new NumList({ props: numlist0_props, $$inline: true });
    	binding_callbacks.push(() => bind(numlist0, 'nums', numlist0_nums_binding));
    	binding_callbacks.push(() => bind(numlist0, 'defaultNum', numlist0_defaultNum_binding));

    	function numlist1_nums_binding(value) {
    		/*numlist1_nums_binding*/ ctx[12](value);
    	}

    	function numlist1_defaultNum_binding(value) {
    		/*numlist1_defaultNum_binding*/ ctx[13](value);
    	}

    	let numlist1_props = { name: "TS" };

    	if (/*TSs*/ ctx[3] !== void 0) {
    		numlist1_props.nums = /*TSs*/ ctx[3];
    	}

    	if (/*defaultTS*/ ctx[4] !== void 0) {
    		numlist1_props.defaultNum = /*defaultTS*/ ctx[4];
    	}

    	numlist1 = new NumList({ props: numlist1_props, $$inline: true });
    	binding_callbacks.push(() => bind(numlist1, 'nums', numlist1_nums_binding));
    	binding_callbacks.push(() => bind(numlist1, 'defaultNum', numlist1_defaultNum_binding));
    	let each_value = /*table*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div15 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Simular";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Limpar";
    			t3 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div2.textContent = "Resultados finais";
    			t5 = space();
    			div3 = element("div");
    			blockquote = element("blockquote");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			span = element("span");
    			span.textContent = "Tempo da Simulação (em minutos):";
    			t8 = space();
    			input = element("input");
    			t9 = space();
    			div12 = element("div");
    			div10 = element("div");
    			create_component(numlist0.$$.fragment);
    			t10 = space();
    			div11 = element("div");
    			create_component(numlist1.$$.fragment);
    			t11 = space();
    			div14 = element("div");
    			div13 = element("div");
    			table_1 = element("table");
    			thead = element("thead");
    			th0 = element("th");
    			th0.textContent = "Cliente";
    			t13 = space();
    			th1 = element("th");
    			th1.textContent = "Tempo desde a Ultima Chegada (minutos)";
    			t15 = space();
    			th2 = element("th");
    			th2.textContent = "Tempo de chegada no relógio";
    			t17 = space();
    			th3 = element("th");
    			th3.textContent = "Tempo do Serviço (minutos)";
    			t19 = space();
    			th4 = element("th");
    			th4.textContent = "Tempo de início do serviço no relógio";
    			t21 = space();
    			th5 = element("th");
    			th5.textContent = "Tempo do cliente na fila (minutos)";
    			t23 = space();
    			th6 = element("th");
    			th6.textContent = "Tempo final do serviço no relógio";
    			t25 = space();
    			th7 = element("th");
    			th7.textContent = "Tempo do cliente no sistema (minutos)";
    			t27 = space();
    			th8 = element("th");
    			th8.textContent = "Tempo livre do operador (minutos)";
    			t29 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(button0, "class", "btn btn-success");
    			add_location(button0, file, 146, 4, 4344);
    			attr_dev(button1, "class", "btn btn-danger");
    			add_location(button1, file, 147, 4, 4419);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file, 145, 3, 4321);
    			attr_dev(div1, "class", "row padded");
    			add_location(div1, file, 144, 2, 4292);
    			attr_dev(div2, "class", "card-header");
    			add_location(div2, file, 153, 5, 4620);
    			attr_dev(blockquote, "class", "blockquote mb-0");
    			add_location(blockquote, file, 155, 6, 4706);
    			attr_dev(div3, "class", "card-body");
    			add_location(div3, file, 154, 5, 4675);
    			attr_dev(div4, "class", "card");
    			div4.hidden = div4_hidden_value = /*finalInfos*/ ctx[6].length === 1;
    			add_location(div4, file, 152, 4, 4562);
    			attr_dev(div5, "class", "col");
    			add_location(div5, file, 151, 3, 4539);
    			attr_dev(div6, "class", "row padded");
    			add_location(div6, file, 150, 2, 4510);
    			attr_dev(span, "class", "input-group-text");
    			add_location(span, file, 167, 5, 4988);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file, 168, 5, 5065);
    			attr_dev(div7, "class", "input-group mb-3");
    			add_location(div7, file, 166, 4, 4951);
    			attr_dev(div8, "class", "col-5");
    			add_location(div8, file, 165, 3, 4926);
    			attr_dev(div9, "class", "row padded");
    			add_location(div9, file, 164, 2, 4897);
    			attr_dev(div10, "class", "col-5");
    			add_location(div10, file, 173, 3, 5203);
    			attr_dev(div11, "class", "col-5");
    			add_location(div11, file, 176, 3, 5312);
    			attr_dev(div12, "class", "row padded");
    			add_location(div12, file, 172, 2, 5174);
    			add_location(th0, file, 184, 6, 5570);
    			add_location(th1, file, 185, 6, 5594);
    			add_location(th2, file, 186, 6, 5649);
    			add_location(th3, file, 187, 6, 5693);
    			add_location(th4, file, 188, 6, 5736);
    			add_location(th5, file, 189, 6, 5790);
    			add_location(th6, file, 190, 6, 5841);
    			add_location(th7, file, 191, 6, 5891);
    			add_location(th8, file, 192, 6, 5945);
    			add_location(thead, file, 183, 5, 5555);
    			add_location(tbody, file, 194, 5, 6009);
    			attr_dev(table_1, "class", "table table-bordered");
    			table_1.hidden = table_1_hidden_value = /*finalInfos*/ ctx[6].length === 1;
    			add_location(table_1, file, 182, 4, 5479);
    			attr_dev(div13, "class", "col");
    			add_location(div13, file, 181, 3, 5456);
    			attr_dev(div14, "class", "row padded");
    			add_location(div14, file, 180, 2, 5427);
    			attr_dev(div15, "class", "container");
    			add_location(div15, file, 143, 1, 4265);
    			add_location(main, file, 142, 0, 4256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div15);
    			append_dev(div15, div1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			append_dev(div0, button1);
    			append_dev(div15, t3);
    			append_dev(div15, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, blockquote);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(blockquote, null);
    			}

    			append_dev(div15, t6);
    			append_dev(div15, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, span);
    			append_dev(div7, t8);
    			append_dev(div7, input);
    			set_input_value(input, /*tempoSimulacao*/ ctx[0]);
    			append_dev(div15, t9);
    			append_dev(div15, div12);
    			append_dev(div12, div10);
    			mount_component(numlist0, div10, null);
    			append_dev(div12, t10);
    			append_dev(div12, div11);
    			mount_component(numlist1, div11, null);
    			append_dev(div15, t11);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, table_1);
    			append_dev(table_1, thead);
    			append_dev(thead, th0);
    			append_dev(thead, t13);
    			append_dev(thead, th1);
    			append_dev(thead, t15);
    			append_dev(thead, th2);
    			append_dev(thead, t17);
    			append_dev(thead, th3);
    			append_dev(thead, t19);
    			append_dev(thead, th4);
    			append_dev(thead, t21);
    			append_dev(thead, th5);
    			append_dev(thead, t23);
    			append_dev(thead, th6);
    			append_dev(thead, t25);
    			append_dev(thead, th7);
    			append_dev(thead, t27);
    			append_dev(thead, th8);
    			append_dev(table_1, t29);
    			append_dev(table_1, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*calcTable*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*clearAll*/ ctx[8], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[9])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*finalInfos*/ 64) {
    				each_value_1 = /*finalInfos*/ ctx[6];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(blockquote, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (!current || dirty & /*finalInfos*/ 64 && div4_hidden_value !== (div4_hidden_value = /*finalInfos*/ ctx[6].length === 1)) {
    				prop_dev(div4, "hidden", div4_hidden_value);
    			}

    			if (dirty & /*tempoSimulacao*/ 1 && to_number(input.value) !== /*tempoSimulacao*/ ctx[0]) {
    				set_input_value(input, /*tempoSimulacao*/ ctx[0]);
    			}

    			const numlist0_changes = {};

    			if (!updating_nums && dirty & /*TECs*/ 2) {
    				updating_nums = true;
    				numlist0_changes.nums = /*TECs*/ ctx[1];
    				add_flush_callback(() => updating_nums = false);
    			}

    			if (!updating_defaultNum && dirty & /*defaultTEC*/ 4) {
    				updating_defaultNum = true;
    				numlist0_changes.defaultNum = /*defaultTEC*/ ctx[2];
    				add_flush_callback(() => updating_defaultNum = false);
    			}

    			numlist0.$set(numlist0_changes);
    			const numlist1_changes = {};

    			if (!updating_nums_1 && dirty & /*TSs*/ 8) {
    				updating_nums_1 = true;
    				numlist1_changes.nums = /*TSs*/ ctx[3];
    				add_flush_callback(() => updating_nums_1 = false);
    			}

    			if (!updating_defaultNum_1 && dirty & /*defaultTS*/ 16) {
    				updating_defaultNum_1 = true;
    				numlist1_changes.defaultNum = /*defaultTS*/ ctx[4];
    				add_flush_callback(() => updating_defaultNum_1 = false);
    			}

    			numlist1.$set(numlist1_changes);

    			if (dirty & /*table*/ 32) {
    				each_value = /*table*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*finalInfos*/ 64 && table_1_hidden_value !== (table_1_hidden_value = /*finalInfos*/ ctx[6].length === 1)) {
    				prop_dev(table_1, "hidden", table_1_hidden_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(numlist0.$$.fragment, local);
    			transition_in(numlist1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(numlist0.$$.fragment, local);
    			transition_out(numlist1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			destroy_component(numlist0);
    			destroy_component(numlist1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let inialTempoSimulacao = 180;
    	let inialTECs = [10, 11, 12];
    	let inialDefaultTEC = 0;
    	let inialTSs = [9, 10, 11];
    	let inialDefaultTS = 0;

    	const inialTable = [
    		{
    			cliente: 0,
    			tempoDesdeAUltimaChegada: 0,
    			tempoDeChegadaNoRelogio: 0,
    			tempoDoServico: 0,
    			tempoDeInicioDeServicoNoRelogio: 0,
    			tempoDoClienteNaFila: 0,
    			tempoFinalDoServicoNoRelogio: 0,
    			tempoDoClienteNoSistema: 0,
    			tempoLivreDoOperador: 0
    		}
    	];

    	let initialFinalInfos = [""];
    	let tempoSimulacao = inialTempoSimulacao;
    	let TECs = [...inialTECs];
    	let defaultTEC = inialDefaultTEC;
    	let TSs = [...inialTSs];
    	let defaultTS = inialDefaultTS;
    	let table = [...inialTable];
    	let finalInfos = initialFinalInfos;

    	const calcTable = () => {
    		const getRandBetween = (num1 = 0, num2 = 1) => {
    			return Math.floor(Math.random() * (num2 - num1 + 1) + num1);
    		};

    		const getRandomEL = (arr = [0]) => arr[getRandBetween(0, arr.length - 1)] || 0;
    		const newTable = [];

    		while (true) {
    			const lastEl = newTable[newTable.length - 1] || inialTable[0];
    			const cliente = lastEl.cliente + 1;
    			const tempoDesdeAUltimaChegada = getRandomEL(TECs);
    			const tempoDeChegadaNoRelogio = lastEl.tempoDeChegadaNoRelogio + tempoDesdeAUltimaChegada;

    			if (tempoDeChegadaNoRelogio > tempoSimulacao) {
    				break;
    			}

    			const tempoDoServico = getRandomEL(TSs);

    			const tempoDoClienteNaFila = lastEl.tempoFinalDoServicoNoRelogio >= tempoDeChegadaNoRelogio
    			? lastEl.tempoFinalDoServicoNoRelogio - tempoDeChegadaNoRelogio
    			: 0;

    			const tempoDeInicioDeServicoNoRelogio = tempoDeChegadaNoRelogio + tempoDoClienteNaFila;
    			const tempoFinalDoServicoNoRelogio = tempoDeInicioDeServicoNoRelogio + tempoDoServico;
    			const tempoDoClienteNoSistema = tempoDoServico + tempoDoClienteNaFila;

    			const tempoLivreDoOperador = lastEl.tempoFinalDoServicoNoRelogio <= tempoDeChegadaNoRelogio
    			? tempoDeChegadaNoRelogio - lastEl.tempoFinalDoServicoNoRelogio
    			: 0;

    			const newEl = {
    				cliente,
    				tempoDesdeAUltimaChegada,
    				tempoDeChegadaNoRelogio,
    				tempoDoServico,
    				tempoDeInicioDeServicoNoRelogio,
    				tempoDoClienteNaFila,
    				tempoFinalDoServicoNoRelogio,
    				tempoDoClienteNoSistema,
    				tempoLivreDoOperador
    			};

    			newTable.push(newEl);
    		}

    		const sumTableRows = (attr = "") => newTable.reduce((acc, el) => acc + el[attr], 0);
    		const quantidadeDeClientes = newTable.length;
    		const numClienteEsperaram = newTable.filter(el => el.tempoDoClienteNaFila > 0).length;

    		const sumsRow = {
    			cliente: "",
    			tempoDesdeAUltimaChegada: "",
    			tempoDeChegadaNoRelogio: "",
    			tempoDoServico: sumTableRows("tempoDoServico"),
    			tempoDeInicioDeServicoNoRelogio: "",
    			tempoDoClienteNaFila: sumTableRows("tempoDoClienteNaFila"),
    			tempoFinalDoServicoNoRelogio: "",
    			tempoDoClienteNoSistema: sumTableRows("tempoDoClienteNoSistema"),
    			tempoLivreDoOperador: sumTableRows("tempoLivreDoOperador")
    		};

    		newTable.push(sumsRow);
    		const tempoMedioEspera = (sumsRow.tempoDoClienteNaFila / quantidadeDeClientes).toFixed(2);
    		const probClienteFila = (100 * (numClienteEsperaram / quantidadeDeClientes)).toFixed(2);
    		const probOperadorLivre = (100 * (sumsRow.tempoLivreDoOperador / tempoSimulacao)).toFixed(2);
    		const tempoMedioServico = (sumsRow.tempoDoServico / quantidadeDeClientes).toFixed(2);
    		const tempoMedioSistema = (sumsRow.tempoDoClienteNoSistema / quantidadeDeClientes).toFixed(2);

    		$$invalidate(6, finalInfos = [
    			`Tempo médio de espera na fila: ${tempoMedioEspera} minutos`,
    			`Probabilidade de um cliente esperar na fila: ${probClienteFila} %`,
    			`Probabilidade do operador livre: ${probOperadorLivre} %`,
    			`Tempo médio do serviço: ${tempoMedioServico} minutos`,
    			`Tempo médio despendido no sistema: ${tempoMedioSistema} minutos`
    		]);

    		$$invalidate(5, table = newTable);
    	};

    	const clearAll = () => {
    		$$invalidate(0, tempoSimulacao = inialTempoSimulacao);
    		$$invalidate(1, TECs = [...inialTECs]);
    		$$invalidate(2, defaultTEC = inialDefaultTEC);
    		$$invalidate(3, TSs = [...inialTSs]);
    		$$invalidate(4, defaultTS = inialDefaultTS);
    		$$invalidate(5, table = [...inialTable]);
    		$$invalidate(6, finalInfos = initialFinalInfos);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		tempoSimulacao = to_number(this.value);
    		$$invalidate(0, tempoSimulacao);
    	}

    	function numlist0_nums_binding(value) {
    		TECs = value;
    		$$invalidate(1, TECs);
    	}

    	function numlist0_defaultNum_binding(value) {
    		defaultTEC = value;
    		$$invalidate(2, defaultTEC);
    	}

    	function numlist1_nums_binding(value) {
    		TSs = value;
    		$$invalidate(3, TSs);
    	}

    	function numlist1_defaultNum_binding(value) {
    		defaultTS = value;
    		$$invalidate(4, defaultTS);
    	}

    	$$self.$capture_state = () => ({
    		NumList,
    		inialTempoSimulacao,
    		inialTECs,
    		inialDefaultTEC,
    		inialTSs,
    		inialDefaultTS,
    		inialTable,
    		initialFinalInfos,
    		tempoSimulacao,
    		TECs,
    		defaultTEC,
    		TSs,
    		defaultTS,
    		table,
    		finalInfos,
    		calcTable,
    		clearAll
    	});

    	$$self.$inject_state = $$props => {
    		if ('inialTempoSimulacao' in $$props) inialTempoSimulacao = $$props.inialTempoSimulacao;
    		if ('inialTECs' in $$props) inialTECs = $$props.inialTECs;
    		if ('inialDefaultTEC' in $$props) inialDefaultTEC = $$props.inialDefaultTEC;
    		if ('inialTSs' in $$props) inialTSs = $$props.inialTSs;
    		if ('inialDefaultTS' in $$props) inialDefaultTS = $$props.inialDefaultTS;
    		if ('initialFinalInfos' in $$props) initialFinalInfos = $$props.initialFinalInfos;
    		if ('tempoSimulacao' in $$props) $$invalidate(0, tempoSimulacao = $$props.tempoSimulacao);
    		if ('TECs' in $$props) $$invalidate(1, TECs = $$props.TECs);
    		if ('defaultTEC' in $$props) $$invalidate(2, defaultTEC = $$props.defaultTEC);
    		if ('TSs' in $$props) $$invalidate(3, TSs = $$props.TSs);
    		if ('defaultTS' in $$props) $$invalidate(4, defaultTS = $$props.defaultTS);
    		if ('table' in $$props) $$invalidate(5, table = $$props.table);
    		if ('finalInfos' in $$props) $$invalidate(6, finalInfos = $$props.finalInfos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tempoSimulacao,
    		TECs,
    		defaultTEC,
    		TSs,
    		defaultTS,
    		table,
    		finalInfos,
    		calcTable,
    		clearAll,
    		input_input_handler,
    		numlist0_nums_binding,
    		numlist0_defaultNum_binding,
    		numlist1_nums_binding,
    		numlist1_defaultNum_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
