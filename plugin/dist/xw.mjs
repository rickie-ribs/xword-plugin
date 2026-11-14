var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};

// src/home.ts
import { homedir } from "node:os";
import { join } from "node:path";
var GRID_GUIDE_HOME, WORDLIST, NYT_DIR, COOKIE, WORD_DATA;
var init_home = __esm({
  "src/home.ts"() {
    "use strict";
    GRID_GUIDE_HOME = process.env.GRID_GUIDE_HOME ?? join(homedir(), ".grid-guide");
    WORDLIST = join(GRID_GUIDE_HOME, "wordlists", "spreadthewordlist.txt");
    NYT_DIR = join(GRID_GUIDE_HOME, "nyt");
    COOKIE = join(NYT_DIR, "cookie.txt");
    WORD_DATA = join(NYT_DIR, "word-data.json");
  }
});

// node_modules/immer/dist/immer.mjs
function die(error, ...args2) {
  if (process.env.NODE_ENV !== "production") {
    const e = errors[error];
    const msg = isFunction(e) ? e.apply(null, args2) : e;
    throw new Error(`[Immer] ${msg}`);
  }
  throw new Error(
    `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
  );
}
function isDraftable(value) {
  if (!value)
    return false;
  return isPlainObject(value) || isArray(value) || !!value[DRAFTABLE] || !!value[CONSTRUCTOR]?.[DRAFTABLE] || isMap(value) || isSet(value);
}
function isPlainObject(value) {
  if (!value || !isObjectish(value))
    return false;
  const proto = getPrototypeOf(value);
  if (proto === null || proto === O[PROTOTYPE])
    return true;
  const Ctor = O.hasOwnProperty.call(proto, CONSTRUCTOR) && proto[CONSTRUCTOR];
  if (Ctor === Object)
    return true;
  if (!isFunction(Ctor))
    return false;
  let ctorString = cachedCtorStrings.get(Ctor);
  if (ctorString === void 0) {
    ctorString = Function.toString.call(Ctor);
    cachedCtorStrings.set(Ctor, ctorString);
  }
  return ctorString === objectCtorString;
}
function each(obj, iter, strict = true) {
  if (getArchtype(obj) === 0) {
    const keys = strict ? Reflect.ownKeys(obj) : O.keys(obj);
    keys.forEach((key) => {
      iter(key, obj[key], obj);
    });
  } else {
    obj.forEach((entry, index2) => iter(index2, entry, obj));
  }
}
function getArchtype(thing) {
  const state = thing[DRAFT_STATE];
  return state ? state.type_ : isArray(thing) ? 1 : isMap(thing) ? 2 : isSet(thing) ? 3 : 0;
}
function is(x, y) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
function isArrayIndex(value) {
  const n = +value;
  return Number.isInteger(n) && String(n) === value;
}
function shallowCopy(base, strict) {
  if (isMap(base)) {
    return new Map(base);
  }
  if (isSet(base)) {
    return new Set(base);
  }
  if (isArray(base))
    return Array[PROTOTYPE].slice.call(base);
  const isPlain = isPlainObject(base);
  if (strict === true || strict === "class_only" && !isPlain) {
    const descriptors = O.getOwnPropertyDescriptors(base);
    delete descriptors[DRAFT_STATE];
    let keys = Reflect.ownKeys(descriptors);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const desc = descriptors[key];
      if (desc[WRITABLE] === false) {
        desc[WRITABLE] = true;
        desc[CONFIGURABLE] = true;
      }
      if (desc.get || desc.set)
        descriptors[key] = {
          [CONFIGURABLE]: true,
          [WRITABLE]: true,
          // could live with !!desc.set as well here...
          [ENUMERABLE]: desc[ENUMERABLE],
          [VALUE]: base[key]
        };
    }
    return O.create(getPrototypeOf(base), descriptors);
  } else {
    const proto = getPrototypeOf(base);
    if (proto !== null && isPlain) {
      return { ...base };
    }
    const obj = O.create(proto);
    return O.assign(obj, base);
  }
}
function freeze(obj, deep = false) {
  if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj))
    return obj;
  if (getArchtype(obj) > 1) {
    O.defineProperties(obj, {
      set: dontMutateMethodOverride,
      add: dontMutateMethodOverride,
      clear: dontMutateMethodOverride,
      delete: dontMutateMethodOverride
    });
  }
  O.freeze(obj);
  if (deep)
    each(
      obj,
      (_key, value) => {
        freeze(value, true);
      },
      false
    );
  return obj;
}
function dontMutateFrozenCollections() {
  die(2);
}
function isFrozen(obj) {
  if (obj === null || !isObjectish(obj))
    return true;
  return O.isFrozen(obj);
}
function getPlugin(pluginKey) {
  const plugin = plugins[pluginKey];
  if (!plugin) {
    die(0, pluginKey);
  }
  return plugin;
}
function usePatchesInScope(scope, patchListener) {
  if (patchListener) {
    scope.patchPlugin_ = getPlugin(PluginPatches);
    scope.patches_ = [];
    scope.inversePatches_ = [];
    scope.patchListener_ = patchListener;
  }
}
function revokeScope(scope) {
  leaveScope(scope);
  scope.drafts_.forEach(revokeDraft);
  scope.drafts_ = null;
}
function leaveScope(scope) {
  if (scope === currentScope) {
    currentScope = scope.parent_;
  }
}
function revokeDraft(draft) {
  const state = draft[DRAFT_STATE];
  if (state.type_ === 0 || state.type_ === 1)
    state.revoke_();
  else
    state.revoked_ = true;
}
function processResult(result, scope) {
  scope.unfinalizedDrafts_ = scope.drafts_.length;
  const baseDraft = scope.drafts_[0];
  const isReplaced = result !== void 0 && result !== baseDraft;
  if (isReplaced) {
    if (baseDraft[DRAFT_STATE].modified_) {
      revokeScope(scope);
      die(4);
    }
    if (isDraftable(result)) {
      result = finalize(scope, result);
    }
    const { patchPlugin_ } = scope;
    if (patchPlugin_) {
      patchPlugin_.generateReplacementPatches_(
        baseDraft[DRAFT_STATE].base_,
        result,
        scope
      );
    }
  } else {
    result = finalize(scope, baseDraft);
  }
  maybeFreeze(scope, result, true);
  revokeScope(scope);
  if (scope.patches_) {
    scope.patchListener_(scope.patches_, scope.inversePatches_);
  }
  return result !== NOTHING ? result : void 0;
}
function finalize(rootScope, value) {
  if (isFrozen(value))
    return value;
  const state = value[DRAFT_STATE];
  if (!state) {
    const finalValue = handleValue(value, rootScope.handledSet_, rootScope);
    return finalValue;
  }
  if (!isSameScope(state, rootScope)) {
    return value;
  }
  if (!state.modified_) {
    return state.base_;
  }
  if (!state.finalized_) {
    const { callbacks_ } = state;
    if (callbacks_) {
      while (callbacks_.length > 0) {
        const callback = callbacks_.pop();
        callback(rootScope);
      }
    }
    generatePatchesAndFinalize(state, rootScope);
  }
  return state.copy_;
}
function maybeFreeze(scope, value, deep = false) {
  if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
    freeze(value, deep);
  }
}
function markStateFinalized(state) {
  state.finalized_ = true;
  state.scope_.unfinalizedDrafts_--;
}
function updateDraftInParent(parent, draftValue, finalizedValue, originalKey) {
  const parentCopy = latest(parent);
  const parentType = parent.type_;
  if (originalKey !== void 0) {
    const currentValue = get(parentCopy, originalKey, parentType);
    if (currentValue === draftValue) {
      set(parentCopy, originalKey, finalizedValue, parentType);
      return;
    }
  }
  if (!parent.draftLocations_) {
    const draftLocations = parent.draftLocations_ = /* @__PURE__ */ new Map();
    each(parentCopy, (key, value) => {
      if (isDraft(value)) {
        const keys = draftLocations.get(value) || [];
        keys.push(key);
        draftLocations.set(value, keys);
      }
    });
  }
  const locations = parent.draftLocations_.get(draftValue) ?? EMPTY_LOCATIONS_RESULT;
  for (const location of locations) {
    set(parentCopy, location, finalizedValue, parentType);
  }
}
function registerChildFinalizationCallback(parent, child, key) {
  parent.callbacks_.push(function childCleanup(rootScope) {
    const state = child;
    if (!state || !isSameScope(state, rootScope)) {
      return;
    }
    rootScope.mapSetPlugin_?.fixSetContents(state);
    const finalizedValue = getFinalValue(state);
    updateDraftInParent(parent, state.draft_ ?? state, finalizedValue, key);
    generatePatchesAndFinalize(state, rootScope);
  });
}
function generatePatchesAndFinalize(state, rootScope) {
  const shouldFinalize = state.modified_ && !state.finalized_ && (state.type_ === 3 || state.type_ === 1 && state.allIndicesReassigned_ || (state.assigned_?.size ?? 0) > 0);
  if (shouldFinalize) {
    const { patchPlugin_ } = rootScope;
    if (patchPlugin_) {
      const basePath = patchPlugin_.getPath(state);
      if (basePath) {
        patchPlugin_.generatePatches_(state, basePath, rootScope);
      }
    }
    markStateFinalized(state);
  }
}
function handleCrossReference(target, key, value) {
  const { scope_ } = target;
  if (isDraft(value)) {
    const state = value[DRAFT_STATE];
    if (isSameScope(state, scope_)) {
      state.callbacks_.push(function crossReferenceCleanup() {
        prepareCopy(target);
        const finalizedValue = getFinalValue(state);
        updateDraftInParent(target, value, finalizedValue, key);
      });
    }
  } else if (isDraftable(value)) {
    target.callbacks_.push(function nestedDraftCleanup() {
      const targetCopy = latest(target);
      if (target.type_ === 3) {
        if (targetCopy.has(value)) {
          handleValue(value, scope_.handledSet_, scope_);
        }
      } else {
        if (get(targetCopy, key, target.type_) === value) {
          if (scope_.drafts_.length > 1 && (target.assigned_.get(key) ?? false) === true && target.copy_) {
            handleValue(
              get(target.copy_, key, target.type_),
              scope_.handledSet_,
              scope_
            );
          }
        }
      }
    });
  }
}
function handleValue(target, handledSet, rootScope) {
  if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
    return target;
  }
  if (isDraft(target) || handledSet.has(target) || !isDraftable(target) || isFrozen(target)) {
    return target;
  }
  handledSet.add(target);
  each(target, (key, value) => {
    if (isDraft(value)) {
      const state = value[DRAFT_STATE];
      if (isSameScope(state, rootScope)) {
        const updatedValue = getFinalValue(state);
        set(target, key, updatedValue, target.type_);
        markStateFinalized(state);
      }
    } else if (isDraftable(value)) {
      handleValue(value, handledSet, rootScope);
    }
  });
  return target;
}
function createProxyProxy(base, parent) {
  const baseIsArray = isArray(base);
  const state = {
    type_: baseIsArray ? 1 : 0,
    // Track which produce call this is associated with.
    scope_: parent ? parent.scope_ : getCurrentScope(),
    // True for both shallow and deep changes.
    modified_: false,
    // Used during finalization.
    finalized_: false,
    // Track which properties have been assigned (true) or deleted (false).
    // actually instantiated in `prepareCopy()`
    assigned_: void 0,
    // The parent draft state.
    parent_: parent,
    // The base state.
    base_: base,
    // The base proxy.
    draft_: null,
    // set below
    // The base copy with any updated values.
    copy_: null,
    // Called by the `produce` function.
    revoke_: null,
    isManual_: false,
    // `callbacks` actually gets assigned in `createProxy`
    callbacks_: void 0
  };
  let target = state;
  let traps = objectTraps;
  if (baseIsArray) {
    target = [state];
    traps = arrayTraps;
  }
  const { revoke, proxy } = Proxy.revocable(target, traps);
  state.draft_ = proxy;
  state.revoke_ = revoke;
  return [proxy, state];
}
function peek(draft, prop) {
  const state = draft[DRAFT_STATE];
  const source = state ? latest(state) : draft;
  return source[prop];
}
function isRelocatedBaseRef(state, prop, value) {
  if (state.type_ !== 1 || !state.allIndicesReassigned_ || !isDraftable(value) || value[DRAFT_STATE]) {
    return false;
  }
  return state.baseRefs_.has(value);
}
function readPropFromProto(state, source, prop) {
  const desc = getDescriptorFromProto(source, prop);
  return desc ? VALUE in desc ? desc[VALUE] : (
    // This is a very special case, if the prop is a getter defined by the
    // prototype, we should invoke it with the draft as context!
    desc.get?.call(state.draft_)
  ) : void 0;
}
function getDescriptorFromProto(source, prop) {
  if (!(prop in source))
    return void 0;
  let proto = getPrototypeOf(source);
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc)
      return desc;
    proto = getPrototypeOf(proto);
  }
  return void 0;
}
function markChanged(state) {
  if (!state.modified_) {
    state.modified_ = true;
    if (state.parent_) {
      markChanged(state.parent_);
    }
  }
}
function prepareCopy(state) {
  if (!state.copy_) {
    state.assigned_ = /* @__PURE__ */ new Map();
    state.copy_ = shallowCopy(
      state.base_,
      state.scope_.immer_.useStrictShallowCopy_
    );
  }
}
function createProxy(rootScope, value, parent, key) {
  const [draft, state] = isMap(value) ? getPlugin(PluginMapSet).proxyMap_(value, parent) : isSet(value) ? getPlugin(PluginMapSet).proxySet_(value, parent) : createProxyProxy(value, parent);
  const scope = parent?.scope_ ?? getCurrentScope();
  scope.drafts_.push(draft);
  state.callbacks_ = parent?.callbacks_ ?? [];
  state.key_ = key;
  if (parent && key !== void 0) {
    registerChildFinalizationCallback(parent, state, key);
  } else {
    state.callbacks_.push(function rootDraftCleanup(rootScope2) {
      rootScope2.mapSetPlugin_?.fixSetContents(state);
      const { patchPlugin_ } = rootScope2;
      if (state.modified_ && patchPlugin_) {
        patchPlugin_.generatePatches_(state, [], rootScope2);
      }
    });
  }
  return draft;
}
function current(value) {
  if (!isDraft(value))
    die(10, value);
  return currentImpl(value);
}
function currentImpl(value) {
  if (!isDraftable(value) || isFrozen(value))
    return value;
  const state = value[DRAFT_STATE];
  let copy;
  let strict = true;
  if (state) {
    if (!state.modified_)
      return state.base_;
    state.finalized_ = true;
    copy = shallowCopy(value, state.scope_.immer_.useStrictShallowCopy_);
    strict = state.scope_.immer_.shouldUseStrictIteration();
  } else {
    copy = shallowCopy(value, true);
  }
  const source = copy;
  if (isSet(copy))
    copy = /* @__PURE__ */ new Set();
  each(
    source,
    (key, childValue) => {
      set(copy, key, currentImpl(childValue));
    },
    strict
  );
  if (state) {
    state.finalized_ = false;
  }
  return copy;
}
var NOTHING, DRAFTABLE, DRAFT_STATE, errors, O, getPrototypeOf, CONSTRUCTOR, PROTOTYPE, CONFIGURABLE, ENUMERABLE, WRITABLE, VALUE, isDraft, objectCtorString, cachedCtorStrings, has, get, set, isArray, isMap, isSet, isObjectish, isFunction, isBoolean, latest, getFinalValue, dontMutateMethodOverride, PluginMapSet, PluginPatches, PluginArrayMethods, plugins, isPluginLoaded, currentScope, getCurrentScope, createScope, enterScope, isSameScope, EMPTY_LOCATIONS_RESULT, objectTraps, arrayTraps, Immer2, _globalIterator, hasIteratorFrom, immer, produce;
var init_immer = __esm({
  "node_modules/immer/dist/immer.mjs"() {
    NOTHING = /* @__PURE__ */ Symbol.for("immer-nothing");
    DRAFTABLE = /* @__PURE__ */ Symbol.for("immer-draftable");
    DRAFT_STATE = /* @__PURE__ */ Symbol.for("immer-state");
    errors = process.env.NODE_ENV !== "production" ? [
      // All error codes, starting by 0:
      function(plugin) {
        return `The plugin for '${plugin}' has not been loaded into Immer. To enable the plugin, import and call \`enable${plugin}()\` when initializing your application.`;
      },
      function(thing) {
        return `produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '${thing}'`;
      },
      "This object has been frozen and should not be mutated",
      function(data) {
        return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + data;
      },
      "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",
      "Immer forbids circular references",
      "The first or second argument to `produce` must be a function",
      "The third argument to `produce` must be a function or undefined",
      "First argument to `createDraft` must be a plain object, an array, or an immerable object",
      "First argument to `finishDraft` must be a draft returned by `createDraft`",
      function(thing) {
        return `'current' expects a draft, got: ${thing}`;
      },
      "Object.defineProperty() cannot be used on an Immer draft",
      "Object.setPrototypeOf() cannot be used on an Immer draft",
      "Immer only supports deleting array indices",
      "Immer only supports setting array indices and the 'length' property",
      function(thing) {
        return `'original' expects a draft, got: ${thing}`;
      }
      // Note: if more errors are added, the errorOffset in Patches.ts should be increased
      // See Patches.ts for additional errors
    ] : [];
    O = Object;
    getPrototypeOf = O.getPrototypeOf;
    CONSTRUCTOR = "constructor";
    PROTOTYPE = "prototype";
    CONFIGURABLE = "configurable";
    ENUMERABLE = "enumerable";
    WRITABLE = "writable";
    VALUE = "value";
    isDraft = (value) => !!value && !!value[DRAFT_STATE];
    objectCtorString = O[PROTOTYPE][CONSTRUCTOR].toString();
    cachedCtorStrings = /* @__PURE__ */ new WeakMap();
    has = (thing, prop, type = getArchtype(thing)) => type === 2 ? thing.has(prop) : O[PROTOTYPE].hasOwnProperty.call(thing, prop);
    get = (thing, prop, type = getArchtype(thing)) => (
      // @ts-ignore
      type === 2 ? thing.get(prop) : thing[prop]
    );
    set = (thing, propOrOldValue, value, type = getArchtype(thing)) => {
      if (type === 2)
        thing.set(propOrOldValue, value);
      else if (type === 3) {
        thing.add(value);
      } else
        thing[propOrOldValue] = value;
    };
    isArray = Array.isArray;
    isMap = (target) => target instanceof Map;
    isSet = (target) => target instanceof Set;
    isObjectish = (target) => typeof target === "object";
    isFunction = (target) => typeof target === "function";
    isBoolean = (target) => typeof target === "boolean";
    latest = (state) => state.copy_ || state.base_;
    getFinalValue = (state) => state.modified_ ? state.copy_ : state.base_;
    dontMutateMethodOverride = {
      [VALUE]: dontMutateFrozenCollections
    };
    PluginMapSet = "MapSet";
    PluginPatches = "Patches";
    PluginArrayMethods = "ArrayMethods";
    plugins = {};
    isPluginLoaded = (pluginKey) => !!plugins[pluginKey];
    getCurrentScope = () => currentScope;
    createScope = (parent_, immer_) => ({
      drafts_: [],
      parent_,
      immer_,
      // Whenever the modified draft contains a draft from another scope, we
      // need to prevent auto-freezing so the unowned draft can be finalized.
      canAutoFreeze_: true,
      unfinalizedDrafts_: 0,
      handledSet_: /* @__PURE__ */ new Set(),
      processedForPatches_: /* @__PURE__ */ new Set(),
      mapSetPlugin_: isPluginLoaded(PluginMapSet) ? getPlugin(PluginMapSet) : void 0,
      arrayMethodsPlugin_: isPluginLoaded(PluginArrayMethods) ? getPlugin(PluginArrayMethods) : void 0
    });
    enterScope = (immer2) => currentScope = createScope(currentScope, immer2);
    isSameScope = (state, rootScope) => state.scope_ === rootScope;
    EMPTY_LOCATIONS_RESULT = [];
    objectTraps = {
      get(state, prop) {
        if (prop === DRAFT_STATE)
          return state;
        let arrayPlugin = state.scope_.arrayMethodsPlugin_;
        const isArrayWithStringProp = state.type_ === 1 && typeof prop === "string";
        if (isArrayWithStringProp) {
          if (arrayPlugin?.isArrayOperationMethod(prop)) {
            return arrayPlugin.createMethodInterceptor(state, prop);
          }
        }
        const source = latest(state);
        if (!has(source, prop, state.type_)) {
          return readPropFromProto(state, source, prop);
        }
        const value = source[prop];
        if (state.finalized_ || !isDraftable(value)) {
          return value;
        }
        if (isArrayWithStringProp && state.operationMethod && arrayPlugin?.isMutatingArrayMethod(
          state.operationMethod
        ) && isArrayIndex(prop)) {
          return value;
        }
        if (value === peek(state.base_, prop) || isRelocatedBaseRef(state, prop, value)) {
          prepareCopy(state);
          const childKey = state.type_ === 1 ? +prop : prop;
          const childDraft = createProxy(state.scope_, value, state, childKey);
          return state.copy_[childKey] = childDraft;
        }
        return value;
      },
      has(state, prop) {
        return prop in latest(state);
      },
      ownKeys(state) {
        return Reflect.ownKeys(latest(state));
      },
      set(state, prop, value) {
        const desc = getDescriptorFromProto(latest(state), prop);
        if (desc?.set) {
          desc.set.call(state.draft_, value);
          return true;
        }
        if (!state.modified_) {
          const current2 = peek(latest(state), prop);
          const currentState = current2?.[DRAFT_STATE];
          if (currentState && currentState.base_ === value) {
            state.copy_[prop] = value;
            state.assigned_.delete(prop);
            return true;
          }
          if (is(value, current2) && (value !== void 0 || has(state.base_, prop, state.type_)))
            return true;
          prepareCopy(state);
          markChanged(state);
        }
        if (state.copy_[prop] === value && // special case: handle new props with value 'undefined'
        (value !== void 0 || has(state.copy_, prop, state.type_)) || // special case: NaN
        Number.isNaN(value) && Number.isNaN(state.copy_[prop]))
          return true;
        state.copy_[prop] = value;
        state.assigned_.set(prop, true);
        handleCrossReference(state, prop, value);
        return true;
      },
      deleteProperty(state, prop) {
        prepareCopy(state);
        if (peek(state.base_, prop) !== void 0 || prop in state.base_) {
          state.assigned_.set(prop, false);
          markChanged(state);
        } else {
          state.assigned_.delete(prop);
        }
        if (state.copy_) {
          delete state.copy_[prop];
        }
        return true;
      },
      // Note: We never coerce `desc.value` into an Immer draft, because we can't make
      // the same guarantee in ES5 mode.
      getOwnPropertyDescriptor(state, prop) {
        const owner = latest(state);
        const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
        if (!desc)
          return desc;
        return {
          [WRITABLE]: true,
          [CONFIGURABLE]: state.type_ !== 1 || prop !== "length",
          [ENUMERABLE]: desc[ENUMERABLE],
          [VALUE]: owner[prop]
        };
      },
      defineProperty() {
        die(11);
      },
      getPrototypeOf(state) {
        return getPrototypeOf(state.base_);
      },
      setPrototypeOf() {
        die(12);
      }
    };
    arrayTraps = {};
    for (let key in objectTraps) {
      let fn = objectTraps[key];
      arrayTraps[key] = function() {
        const args2 = arguments;
        args2[0] = args2[0][0];
        return fn.apply(this, args2);
      };
    }
    arrayTraps.deleteProperty = function(state, prop) {
      if (process.env.NODE_ENV !== "production" && isNaN(parseInt(prop)))
        die(13);
      return arrayTraps.set.call(this, state, prop, void 0);
    };
    arrayTraps.set = function(state, prop, value) {
      if (process.env.NODE_ENV !== "production" && prop !== "length" && isNaN(parseInt(prop)))
        die(14);
      return objectTraps.set.call(this, state[0], prop, value, state[0]);
    };
    Immer2 = class {
      constructor(config) {
        this.autoFreeze_ = true;
        this.useStrictShallowCopy_ = false;
        this.useStrictIteration_ = false;
        this.produce = (base, recipe, patchListener) => {
          if (isFunction(base) && !isFunction(recipe)) {
            const defaultBase = recipe;
            recipe = base;
            const self = this;
            return function curriedProduce(base2 = defaultBase, ...args2) {
              return self.produce(base2, (draft) => recipe.call(this, draft, ...args2));
            };
          }
          if (!isFunction(recipe))
            die(6);
          if (patchListener !== void 0 && !isFunction(patchListener))
            die(7);
          let result;
          if (isDraftable(base)) {
            const scope = enterScope(this);
            const proxy = createProxy(scope, base, void 0);
            let hasError = true;
            try {
              result = recipe(proxy);
              hasError = false;
            } finally {
              if (hasError)
                revokeScope(scope);
              else
                leaveScope(scope);
            }
            usePatchesInScope(scope, patchListener);
            return processResult(result, scope);
          } else if (!base || !isObjectish(base)) {
            result = recipe(base);
            if (result === void 0)
              result = base;
            if (result === NOTHING)
              result = void 0;
            if (this.autoFreeze_)
              freeze(result, true);
            if (patchListener) {
              const p = [];
              const ip = [];
              getPlugin(PluginPatches).generateReplacementPatches_(base, result, {
                patches_: p,
                inversePatches_: ip
              });
              patchListener(p, ip);
            }
            return result;
          } else
            die(1, base);
        };
        this.produceWithPatches = (base, recipe) => {
          if (isFunction(base)) {
            return (state, ...args2) => this.produceWithPatches(state, (draft) => base(draft, ...args2));
          }
          let patches, inversePatches;
          const result = this.produce(base, recipe, (p, ip) => {
            patches = p;
            inversePatches = ip;
          });
          return [result, patches, inversePatches];
        };
        if (isBoolean(config?.autoFreeze))
          this.setAutoFreeze(config.autoFreeze);
        const strictShallowCopy = config?.useStrictShallowCopy;
        if (isBoolean(strictShallowCopy) || strictShallowCopy === "class_only")
          this.setUseStrictShallowCopy(strictShallowCopy);
        if (isBoolean(config?.useStrictIteration))
          this.setUseStrictIteration(config.useStrictIteration);
      }
      createDraft(base) {
        if (!isDraftable(base))
          die(8);
        if (isDraft(base))
          base = current(base);
        const scope = enterScope(this);
        const proxy = createProxy(scope, base, void 0);
        proxy[DRAFT_STATE].isManual_ = true;
        leaveScope(scope);
        return proxy;
      }
      finishDraft(draft, patchListener) {
        const state = draft && draft[DRAFT_STATE];
        if (!state || !state.isManual_)
          die(9);
        const { scope_: scope } = state;
        usePatchesInScope(scope, patchListener);
        return processResult(void 0, scope);
      }
      /**
       * Pass true to automatically freeze all copies created by Immer.
       *
       * By default, auto-freezing is enabled.
       */
      setAutoFreeze(value) {
        this.autoFreeze_ = value;
      }
      /**
       * Pass true to enable strict shallow copy.
       *
       * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
       */
      setUseStrictShallowCopy(value) {
        this.useStrictShallowCopy_ = value;
      }
      /**
       * Pass false to use faster iteration that skips non-enumerable properties
       * but still handles symbols for compatibility.
       *
       * By default, strict iteration is enabled (includes all own properties).
       */
      setUseStrictIteration(value) {
        this.useStrictIteration_ = value;
      }
      shouldUseStrictIteration() {
        return this.useStrictIteration_;
      }
      applyPatches(base, patches) {
        let i;
        for (i = patches.length - 1; i >= 0; i--) {
          const patch = patches[i];
          if (patch.path.length === 0 && patch.op === "replace") {
            base = patch.value;
            break;
          }
        }
        if (i > -1) {
          patches = patches.slice(i + 1);
        }
        const applyPatchesImpl = getPlugin(PluginPatches).applyPatches_;
        if (isDraft(base)) {
          return applyPatchesImpl(base, patches);
        }
        return this.produce(
          base,
          (draft) => applyPatchesImpl(draft, patches)
        );
      }
    };
    _globalIterator = globalThis.Iterator;
    hasIteratorFrom = typeof _globalIterator?.from === "function";
    immer = new Immer2();
    produce = immer.produce;
  }
});

// vendor/src/model/numbering.ts
function computeNumbering(puzzle) {
  const isWhite2 = (r, c) => r >= 0 && r < puzzle.rows && c >= 0 && c < puzzle.cols && !puzzle.cells[r][c].block;
  const numbers = [];
  const slots = [];
  let next = 1;
  for (let r = 0; r < puzzle.rows; r++) {
    const row = [];
    for (let c = 0; c < puzzle.cols; c++) {
      let number = null;
      for (const direction of ["across", "down"]) {
        const [dr, dc] = STEP[direction];
        if (!isWhite2(r, c) || isWhite2(r - dr, c - dc) || !isWhite2(r + dr, c + dc)) continue;
        number ??= next++;
        const cells = [];
        for (let rr = r, cc = c; isWhite2(rr, cc); rr += dr, cc += dc) cells.push([rr, cc]);
        slots.push({ number, direction, row: r, col: c, length: cells.length, cells });
      }
      row.push(number);
    }
    numbers.push(row);
  }
  return { numbers, slots };
}
function slotAt(slots, r, c, direction) {
  return slots.find((s) => s.direction === direction && s.cells.some(([sr, sc]) => sr === r && sc === c));
}
var STEP;
var init_numbering = __esm({
  "vendor/src/model/numbering.ts"() {
    "use strict";
    STEP = { across: [0, 1], down: [1, 0] };
  }
});

// vendor/src/model/entries.ts
function letterOffsets(puzzle, slot) {
  let offset = 0;
  return slot.cells.map(([r, c]) => {
    const start = offset;
    offset += puzzle.cells[r][c].value.length || 1;
    return start;
  });
}
function slotPattern(puzzle, slot) {
  return slot.cells.map(([r, c]) => puzzle.cells[r][c].value || "?").join("");
}
function placeWord(puzzle, slot, word) {
  const pattern = slotPattern(puzzle, slot);
  if (word.length !== pattern.length || !pattern.includes("?")) return puzzle;
  if ([...pattern].some((ch, i) => ch !== "?" && ch !== word[i])) return puzzle;
  const offsets = letterOffsets(puzzle, slot);
  return produce(puzzle, (draft) => {
    slot.cells.forEach(([r, c], i) => {
      const cell = draft.cells[r][c];
      if (!cell.value) cell.value = word[offsets[i]];
    });
  });
}
var init_entries = __esm({
  "vendor/src/model/entries.ts"() {
    "use strict";
    init_immer();
    init_numbering();
  }
});

// vendor/src/engine/index.ts
function buildIndex(entries) {
  const byLength = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    const list = byLength.get(entry.word.length);
    if (list) list.push(entry);
    else byLength.set(entry.word.length, [entry]);
  }
  const buckets = /* @__PURE__ */ new Map();
  for (const [length, list] of byLength) {
    list.sort((a, b) => a.word < b.word ? -1 : 1);
    const stride = Math.ceil(list.length / 32);
    const all = new Uint32Array(stride);
    const letters = new Uint32Array(length * 26 * stride);
    list.forEach(({ word }, i) => {
      const bit = 1 << (i & 31);
      const slot = i >>> 5;
      all[slot] |= bit;
      for (let p = 0; p < length; p++) letters[(p * 26 + word.charCodeAt(p) - A) * stride + slot] |= bit;
    });
    buckets.set(length, {
      words: list.map((e) => e.word),
      display: list.map((e) => e.display),
      stride,
      all,
      letters
    });
  }
  return { size: entries.length, buckets };
}
function letterBits(bucket, position, letter) {
  const start = (position * 26 + letter.charCodeAt(0) - A) * bucket.stride;
  return bucket.letters.subarray(start, start + bucket.stride);
}
function matchBits(bucket, pattern) {
  const bits = bucket.all.slice();
  for (let p = 0; p < pattern.length; p++) {
    const ch = pattern[p];
    if (ch === "?") continue;
    if (ch < "A" || ch > "Z") return bits.fill(0);
    const fixed = letterBits(bucket, p, ch);
    for (let w = 0; w < bits.length; w++) bits[w] &= fixed[w];
  }
  return bits;
}
function popcount(x) {
  x -= x >>> 1 & 1431655765;
  x = (x & 858993459) + (x >>> 2 & 858993459);
  return (x + (x >>> 4) & 252645135) * 16843009 >>> 24;
}
function countBits(bits, and) {
  let n = 0;
  for (let w = 0; w < bits.length; w++) n += popcount(and ? bits[w] & and[w] : bits[w]);
  return n;
}
function bitIndices(bits) {
  const out = [];
  for (let w = 0; w < bits.length; w++) {
    let x = bits[w];
    while (x) {
      const low = x & -x;
      out.push(w * 32 + 31 - Math.clz32(low));
      x ^= low;
    }
  }
  return out;
}
function countMatches(index2, pattern) {
  const bucket = index2.buckets.get(pattern.length);
  return bucket ? countBits(matchBits(bucket, pattern)) : 0;
}
var A;
var init_engine = __esm({
  "vendor/src/engine/index.ts"() {
    "use strict";
    A = 65;
  }
});

// vendor/src/engine/candidates.ts
function candidateQuery(puzzle, slots, slot) {
  const offsets = letterOffsets(puzzle, slot);
  const other = slot.direction === "across" ? "down" : "across";
  const crossings = [];
  slot.cells.forEach(([r, c], i) => {
    if (puzzle.cells[r][c].value) return;
    const cross = slotAt(slots, r, c, other);
    if (!cross) return;
    const j = cross.cells.findIndex(([cr, cc]) => cr === r && cc === c);
    crossings.push({
      at: offsets[i],
      pattern: slotPattern(puzzle, cross),
      offset: letterOffsets(puzzle, cross)[j],
      label: label(cross)
    });
  });
  return { pattern: slotPattern(puzzle, slot), crossings };
}
function findCandidates(index2, query, filters, uses2, limit = 300) {
  let regex;
  try {
    regex = filters.regex ? new RegExp(filters.regex, "i") : void 0;
  } catch {
    return { total: 0, candidates: [], error: "That regex pattern is not valid." };
  }
  const bucket = index2.buckets.get(query.pattern.length);
  if (!bucket) return { total: 0, candidates: [] };
  const perLetter = query.crossings.map(({ pattern, offset }) => {
    const cross = index2.buckets.get(pattern.length);
    const counts = new Array(26).fill(0);
    if (!cross) return counts;
    const base = matchBits(cross, pattern);
    for (let l = 0; l < 26; l++) counts[l] = countBits(base, letterBits(cross, offset, String.fromCharCode(65 + l)));
    return counts;
  });
  const search = filters.search.toUpperCase().replace(/[^A-Z]/g, "");
  const kept = [];
  for (const i of bitIndices(matchBits(bucket, query.pattern))) {
    const word = bucket.words[i];
    if (search && !word.includes(search)) continue;
    if (regex && !regex.test(word)) continue;
    const crossings = query.crossings.map(({ at }, k) => perLetter[k][word.charCodeAt(at) - 65]);
    kept.push({ i, crossings, fewest: Math.min(Infinity, ...crossings), uses: uses2 ? uses2.get(word) ?? 0 : null });
  }
  kept.sort(
    (a, b) => Number(b.fewest > 0) - Number(a.fewest > 0) || b.fewest - a.fewest || (b.uses ?? 0) - (a.uses ?? 0) || a.i - b.i
  );
  return {
    total: kept.length,
    candidates: kept.slice(0, limit).map(({ i, crossings, fewest, uses: uses3 }) => ({
      word: bucket.words[i],
      display: bucket.display[i],
      uses: uses3,
      crossings,
      viable: fewest > 0
    }))
  };
}
var label;
var init_candidates = __esm({
  "vendor/src/engine/candidates.ts"() {
    "use strict";
    init_entries();
    init_numbering();
    init_engine();
    label = (s) => `${s.number} ${s.direction === "across" ? "Across" : "Down"}`;
  }
});

// vendor/src/engine/fill.ts
function fillRequest(puzzle, slots) {
  const ids = /* @__PURE__ */ new Map();
  const squares = [];
  const entries = [];
  const used = [];
  slots.forEach((slot, i) => {
    const pattern = slotPattern(puzzle, slot);
    if (!pattern.includes("?")) return void used.push(pattern);
    const offsets = letterOffsets(puzzle, slot);
    const entrySquares = new Array(pattern.length).fill(null);
    slot.cells.forEach(([r, c], k) => {
      if (puzzle.cells[r][c].value) return;
      const key = `${r},${c}`;
      let id = ids.get(key);
      if (id === void 0) {
        id = squares.push([r, c]) - 1;
        ids.set(key, id);
      }
      entrySquares[offsets[k]] = id;
    });
    entries.push({ slot: i, pattern, squares: entrySquares });
  });
  return { squares, entries, used };
}
function applyFill(puzzle, request, fill2) {
  if (request.squares.some(([r, c]) => puzzle.cells[r]?.[c]?.block !== false || puzzle.cells[r][c].value)) return puzzle;
  return produce(puzzle, (draft) => {
    request.squares.forEach(([r, c], i) => void (draft.cells[r][c].value = fill2.letters[i]));
  });
}
function popcount2(x) {
  x -= x >>> 1 & 1431655765;
  x = (x & 858993459) + (x >>> 2 & 858993459);
  return (x + (x >>> 4) & 252645135) * 16843009 >>> 24;
}
function count(bits) {
  let n = 0;
  for (let w = 0; w < bits.length; w++) n += popcount2(bits[w]);
  return n;
}
function luby(i) {
  for (let k = 1; ; k++) {
    if (i === (1 << k) - 1) return 1 << k - 1;
    if (i < (1 << k) - 1) return luby(i - (1 << k - 1) + 1);
  }
}
function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function solveFill(index2, request, options = {}) {
  return new Solver(index2, request, {
    seed: options.seed ?? 1,
    variety: options.variety ?? 0.5,
    budgetMs: options.budgetMs ?? 3e4,
    maxFills: options.maxFills ?? 10,
    onProgress: options.onProgress,
    now: options.now ?? (() => performance.now())
  }).run();
}
var ALL_LETTERS, TRY_LIMIT, RESTART_BASE, PROGRESS_MS, Solver;
var init_fill = __esm({
  "vendor/src/engine/fill.ts"() {
    "use strict";
    init_immer();
    init_entries();
    ALL_LETTERS = (1 << 26) - 1;
    TRY_LIMIT = 100;
    RESTART_BASE = 50;
    PROGRESS_MS = 100;
    Solver = class {
      constructor(index2, request, options) {
        this.request = request;
        this.options = options;
        const { entries, squares, used } = request;
        this.n = entries.length;
        this.rand = random(options.seed);
        this.noise = options.variety;
        this.start = this.lastProgress = options.now();
        this.minDiffer = Math.max(1, Math.ceil(this.n / 4));
        this.masks = new Int32Array(squares.length).fill(ALL_LETTERS);
        this.weights = new Float64Array(this.n).fill(1);
        this.assigned = new Int32Array(this.n).fill(-1);
        this.stamps = new Int32Array(this.n).fill(-1);
        this.queued = new Uint8Array(this.n);
        this.links = squares.map(() => []);
        this.positions = entries.map((entry, e) => {
          const pairs2 = [];
          entry.squares.forEach((s, p) => {
            if (s === null) return;
            pairs2.push([p, s]);
            this.links[s].push([e, p]);
          });
          return pairs2;
        });
        const empty = { words: [], display: [], stride: 0, all: new Uint32Array(0), letters: new Uint32Array(0) };
        this.buckets = entries.map((entry) => index2.buckets.get(entry.pattern.length) ?? empty);
        this.domains = entries.map((entry, e) => this.initialDomain(this.buckets[e], entry.pattern, used));
      }
      request;
      options;
      n;
      buckets;
      domains;
      /** Per entry, its [letter position, square] pairs. */
      positions;
      /** Per square, the [entry, letter position] pairs through it (one or two). */
      links;
      masks;
      weights;
      assigned;
      /** The frame in which each domain was last saved to the trail. */
      stamps;
      trail = [];
      frame = 0;
      queue = [];
      queued;
      rand;
      noise;
      start;
      lastProgress;
      timedOut = false;
      /** False once a run skips words (TRY_LIMIT), so finishing it proves nothing. */
      complete = true;
      runDeadEnds = 0;
      runLimit = 0;
      minDiffer;
      fills = [];
      deadEnds = 0;
      restarts = 0;
      initialDomain(bucket, pattern, used) {
        const bits = bucket.all.slice();
        for (let p = 0; p < pattern.length; p++) {
          const ch = pattern.charCodeAt(p);
          if (ch === 63) continue;
          if (ch < 65 || ch > 90) return bits.fill(0);
          const base = (p * 26 + ch - 65) * bucket.stride;
          for (let w = 0; w < bits.length; w++) bits[w] &= bucket.letters[base + w];
        }
        for (const word of used) {
          const i = this.find(bucket, word);
          if (i >= 0) bits[i >>> 5] &= ~(1 << (i & 31));
        }
        return bits;
      }
      /** Position of `word` in the bucket (sorted A–Z), or -1. */
      find(bucket, word) {
        let lo = 0;
        let hi = bucket.words.length - 1;
        while (lo <= hi) {
          const mid = lo + hi >>> 1;
          const w = bucket.words[mid];
          if (w === word) return mid;
          if (w < word) lo = mid + 1;
          else hi = mid - 1;
        }
        return -1;
      }
      run() {
        const empty = this.domains.flatMap((d, e) => count(d) === 0 ? [e] : []);
        if (empty.length) return this.result({ reason: "no-word", entries: empty });
        for (let e = 0; e < this.n; e++) this.enqueue(e);
        const failed = this.propagate();
        if (failed >= 0) return this.result({ reason: "no-word", entries: [failed] });
        const root = this.mark();
        for (let i = 1; ; i++) {
          this.runDeadEnds = 0;
          this.runLimit = RESTART_BASE * luby(i);
          this.complete = true;
          const signal = this.search();
          this.undo(root);
          if (signal === "stop" || this.timedOut) break;
          if (signal === "continue" && this.complete) break;
          this.restarts++;
        }
        if (this.fills.length) return this.result();
        return this.result({ reason: this.timedOut ? "timeout" : "no-fill", entries: this.hardest() });
      }
      result(failure) {
        const elapsedMs = this.options.now() - this.start;
        return { elapsedMs, fills: this.fills, restarts: this.restarts, deadEnds: this.deadEnds, ...failure && { failure } };
      }
      hardest() {
        return [...this.weights.keys()].sort((a, b) => this.weights[b] - this.weights[a] || a - b).slice(0, 3);
      }
      search() {
        const now = this.options.now();
        if (now - this.start > this.options.budgetMs) {
          this.timedOut = true;
          return "stop";
        }
        if (now - this.lastProgress > PROGRESS_MS) this.progress(now);
        const e = this.choose();
        if (e < 0) return this.solution();
        for (const word of this.order(e)) {
          const m = this.mark();
          const failed = this.assign(e, word);
          if (failed < 0) {
            const signal = this.search();
            if (signal !== "continue") {
              this.undo(m);
              return signal;
            }
          } else {
            this.weights[failed]++;
            if (this.deadEnd()) {
              this.undo(m);
              return "restart";
            }
          }
          this.undo(m);
        }
        return "continue";
      }
      /** Counts a dead end; true when this run has used up its allowance. */
      deadEnd() {
        this.deadEnds++;
        return ++this.runDeadEnds > this.runLimit;
      }
      solution() {
        const words2 = [...this.assigned].map((w, e) => this.buckets[e].words[w]);
        const distinct = this.fills.every((f) => f.words.filter((w, e) => w !== words2[e]).length >= this.minDiffer);
        if (!distinct) return this.deadEnd() ? "restart" : "continue";
        const letters = new Array(this.request.squares.length);
        this.positions.forEach((pairs2, e) => pairs2.forEach(([p, s]) => letters[s] = words2[e][p]));
        this.fills.push({ letters, words: words2 });
        this.progress(this.options.now());
        if (this.fills.length >= this.options.maxFills) return "stop";
        this.noise = Math.max(this.noise, 0.3);
        return "restart";
      }
      progress(now) {
        this.lastProgress = now;
        this.options.onProgress?.({ elapsedMs: now - this.start, fills: [...this.fills] });
      }
      /** The unassigned entry with the fewest words per unit of conflict weight; -1 when every entry has a word. */
      choose() {
        let best = -1;
        let bestScore = Infinity;
        for (let e = 0; e < this.n; e++) {
          if (this.assigned[e] >= 0) continue;
          const score = count(this.domains[e]) / this.weights[e];
          if (score < bestScore || score === bestScore && this.positions[e].length > this.positions[best].length) {
            best = e;
            bestScore = score;
          }
        }
        return best;
      }
      /**
       * Words for entry `e`, most room first: the sum over its crossings of log(1 + matches left in the crossing),
       * with jitter. Each crossing's matches depend only on the letter in the shared square, so they're counted once
       * per letter.
       */
      order(e) {
        const bucket = this.buckets[e];
        const crossings = this.positions[e].flatMap(([p, s]) => {
          const other = this.links[s].find(([e22]) => e22 !== e);
          if (!other || this.assigned[other[0]] >= 0) return [];
          const [e2, p2] = other;
          const d = this.domains[e2];
          const b = this.buckets[e2];
          const room = new Float64Array(26);
          for (let l = 0; l < 26; l++) {
            if (!(this.masks[s] & 1 << l)) continue;
            const base = (p2 * 26 + l) * b.stride;
            let k = 0;
            for (let w = 0; w < d.length; w++) k += popcount2(d[w] & b.letters[base + w]);
            room[l] = Math.log1p(k);
          }
          return [{ p, room }];
        });
        const scored = [];
        this.eachWord(this.domains[e], (word) => {
          const text = bucket.words[word];
          let key = 0;
          for (const { p, room } of crossings) key += room[text.charCodeAt(p) - 65];
          scored.push({ word, key: key * (1 + this.noise * (this.rand() - 0.5)) });
        });
        scored.sort((a, b) => b.key - a.key || a.word - b.word);
        if (scored.length > TRY_LIMIT) {
          this.complete = false;
          scored.length = TRY_LIMIT;
        }
        return scored.map((s) => s.word);
      }
      eachWord(bits, fn) {
        for (let w = 0; w < bits.length; w++) {
          let x = bits[w];
          while (x) {
            const low = x & -x;
            fn(w * 32 + 31 - Math.clz32(low));
            x ^= low;
          }
        }
      }
      /** Gives entry `e` one word, removes that word from every other entry (V10) and propagates. Returns the entry that ran out of words, or -1. */
      assign(e, word) {
        this.save(e);
        const d = this.domains[e];
        d.fill(0);
        d[word >>> 5] = 1 << (word & 31);
        this.trail.push({ assigned: e });
        this.assigned[e] = word;
        this.enqueue(e);
        const length = this.request.entries[e].pattern.length;
        for (let e2 = 0; e2 < this.n; e2++) {
          if (e2 === e || this.request.entries[e2].pattern.length !== length) continue;
          const d2 = this.domains[e2];
          if (!(d2[word >>> 5] & 1 << (word & 31))) continue;
          this.save(e2);
          d2[word >>> 5] &= ~(1 << (word & 31));
          if (count(d2) === 0) return e2;
          this.enqueue(e2);
        }
        return this.propagate();
      }
      /** AC-3 by letters: narrows square masks to the letters an entry's words support, and entries to their masks. */
      propagate() {
        while (this.queue.length) {
          const e = this.queue.pop();
          this.queued[e] = 0;
          const supported = this.supported(e);
          const pairs2 = this.positions[e];
          for (let k = 0; k < pairs2.length; k++) {
            const [, s] = pairs2[k];
            const mask = this.masks[s];
            const kept = mask & supported[k];
            if (kept === mask) continue;
            if (kept === 0) {
              this.queue.length = 0;
              this.queued.fill(0);
              return e;
            }
            this.trail.push({ square: s, mask });
            this.masks[s] = kept;
            const removed = mask & ~kept;
            for (const [e2, p2] of this.links[s]) {
              if (e2 === e) continue;
              this.save(e2);
              const d = this.domains[e2];
              const b = this.buckets[e2];
              for (let l = 0; l < 26; l++) {
                if (!(removed & 1 << l)) continue;
                const base = (p2 * 26 + l) * b.stride;
                for (let w = 0; w < d.length; w++) d[w] &= ~b.letters[base + w];
              }
              if (count(d) === 0) {
                this.queue.length = 0;
                this.queued.fill(0);
                return e2;
              }
              this.enqueue(e2);
            }
          }
        }
        return -1;
      }
      /** For each of entry `e`'s [position, square] pairs, the letters its words have there, as a 26-bit mask. */
      supported(e) {
        const d = this.domains[e];
        const b = this.buckets[e];
        const pairs2 = this.positions[e];
        const out = new Array(pairs2.length).fill(0);
        if (count(d) * pairs2.length < 26 * d.length) {
          this.eachWord(d, (word) => {
            const text = b.words[word];
            for (let k = 0; k < pairs2.length; k++) out[k] |= 1 << text.charCodeAt(pairs2[k][0]) - 65;
          });
          return out;
        }
        pairs2.forEach(([p, s], k) => {
          const mask = this.masks[s];
          for (let l = 0; l < 26; l++) {
            if (!(mask & 1 << l)) continue;
            const base = (p * 26 + l) * b.stride;
            for (let w = 0; w < d.length; w++) {
              if (d[w] & b.letters[base + w]) {
                out[k] |= 1 << l;
                break;
              }
            }
          }
        });
        return out;
      }
      enqueue(e) {
        if (this.queued[e]) return;
        this.queued[e] = 1;
        this.queue.push(e);
      }
      /** Saves entry `e`'s domain the first time it changes in this frame. */
      save(e) {
        if (this.stamps[e] === this.frame) return;
        this.stamps[e] = this.frame;
        this.trail.push({ entry: e, bits: this.domains[e].slice() });
      }
      mark() {
        this.frame++;
        return this.trail.length;
      }
      undo(mark) {
        while (this.trail.length > mark) {
          const t = this.trail.pop();
          if (t.bits) this.domains[t.entry].set(t.bits);
          else if (t.square !== void 0) this.masks[t.square] = t.mask;
          else this.assigned[t.assigned] = -1;
        }
        this.frame++;
      }
    };
  }
});

// vendor/src/engine/wordlist.ts
function parseWordlist(text) {
  const seen = /* @__PURE__ */ new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = /^(.+);\s*(\d+)\s*$/.exec(line);
    if (!match) continue;
    const display = match[1].trim();
    const word = display.normalize("NFD").toUpperCase().replace(/[^A-Z]/g, "");
    if (word && !seen.has(word)) seen.set(word, display);
  }
  return [...seen].map(([word, display]) => ({ word, display }));
}
var init_wordlist = __esm({
  "vendor/src/engine/wordlist.ts"() {
    "use strict";
  }
});

// vendor/src/history/nytHistory.json
var nytHistory_default;
var init_nytHistory = __esm({
  "vendor/src/history/nytHistory.json"() {
    nytHistory_default = {
      metricsVersion: 2,
      from: "2023-11-02",
      to: "2026-11-01",
      puzzles: [
        { id: 21465, date: "2023-11-02", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 62, longShare: 0.0789, familiarity: 1.25 },
        { id: 21437, date: "2023-11-03", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 81, longShare: 0.1714, familiarity: 1.1 },
        { id: 21436, date: "2023-11-04", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 93, longShare: 0.1515, familiarity: 0.7727 },
        { id: 21449, date: "2023-11-05", rows: 21, cols: 21, words: 140, blocks: 73, openSquares: 114, longShare: 0.1143, familiarity: 1.1429 },
        { id: 21447, date: "2023-11-06", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 66, longShare: 0.0789, familiarity: 1.3289 },
        { id: 21448, date: "2023-11-07", rows: 15, cols: 15, words: 76, blocks: 41, openSquares: 70, longShare: 0.0921, familiarity: 1.25 },
        { id: 21451, date: "2023-11-08", rows: 15, cols: 16, words: 79, blocks: 38, openSquares: 78, longShare: 0.1392, familiarity: 1.0759 },
        { id: 21342, date: "2023-11-09", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 66, longShare: 0.1447, familiarity: 1.2895 },
        { id: 21475, date: "2023-11-10", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 74, longShare: 0.1528, familiarity: 1.0556 },
        { id: 21464, date: "2023-11-11", rows: 15, cols: 15, words: 58, blocks: 34, openSquares: 112, longShare: 0.1379, familiarity: 0.4828 },
        { id: 21467, date: "2023-11-12", rows: 21, cols: 21, words: 142, blocks: 86, openSquares: 107, longShare: 0.1268, familiarity: 1.1268 },
        { id: 21478, date: "2023-11-13", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 63, longShare: 0.0811, familiarity: 1.1757 },
        { id: 21477, date: "2023-11-14", rows: 15, cols: 15, words: 76, blocks: 39, openSquares: 70, longShare: 0.1053, familiarity: 1.1579 },
        { id: 21479, date: "2023-11-15", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 64, longShare: 0.0658, familiarity: 1.1053 },
        { id: 21476, date: "2023-11-16", rows: 15, cols: 15, words: 73, blocks: 44, openSquares: 73, longShare: 0.137, familiarity: 1.1096 },
        { id: 21489, date: "2023-11-17", rows: 15, cols: 15, words: 72, blocks: 32, openSquares: 77, longShare: 0.1667, familiarity: 1.1111 },
        { id: 21481, date: "2023-11-18", rows: 15, cols: 15, words: 68, blocks: 32, openSquares: 97, longShare: 0.2206, familiarity: 0.8382 },
        { id: 21480, date: "2023-11-19", rows: 21, cols: 20, words: 137, blocks: 68, openSquares: 104, longShare: 0.1241, familiarity: 1.1387 },
        { id: 21493, date: "2023-11-20", rows: 15, cols: 16, words: 79, blocks: 38, openSquares: 74, longShare: 0.1139, familiarity: 1.038 },
        { id: 21491, date: "2023-11-21", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 62, longShare: 0.0897, familiarity: 1.1667 },
        { id: 21506, date: "2023-11-22", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 66, longShare: 0.1053, familiarity: 1.2105 },
        { id: 21490, date: "2023-11-23", rows: 15, cols: 15, words: 72, blocks: 40, openSquares: 73, longShare: 0.125, familiarity: 1.1389 },
        { id: 21505, date: "2023-11-24", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 88, longShare: 0.1857, familiarity: 0.9286 },
        { id: 21508, date: "2023-11-25", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 80, longShare: 0.1324, familiarity: 0.9412 },
        { id: 21492, date: "2023-11-26", rows: 22, cols: 21, words: 143, blocks: 72, openSquares: 138, longShare: 0.1329, familiarity: 0.9371 },
        { id: 21504, date: "2023-11-27", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 69, longShare: 0.0921, familiarity: 1.1316 },
        { id: 21509, date: "2023-11-28", rows: 15, cols: 15, words: 73, blocks: 42, openSquares: 68, longShare: 0.0274, familiarity: 1.1233 },
        { id: 21549, date: "2023-11-29", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 67, longShare: 0.1184, familiarity: 1.1711 },
        { id: 21507, date: "2023-11-30", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 71, longShare: 0.1316, familiarity: 1.1316 },
        { id: 21517, date: "2023-12-01", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 81, longShare: 0.2273, familiarity: 0.8333 },
        { id: 21529, date: "2023-12-02", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 85, longShare: 0.1857, familiarity: 0.9429 },
        { id: 21512, date: "2023-12-03", rows: 21, cols: 21, words: 126, blocks: 55, openSquares: 186, longShare: 0.1905, familiarity: 0.6984 },
        { id: 21524, date: "2023-12-04", rows: 15, cols: 15, words: 74, blocks: 44, openSquares: 60, longShare: 0.0811, familiarity: 1.3784 },
        { id: 21539, date: "2023-12-05", rows: 15, cols: 14, words: 73, blocks: 36, openSquares: 60, longShare: 0.0959, familiarity: 1.274 },
        { id: 21527, date: "2023-12-06", rows: 16, cols: 15, words: 78, blocks: 46, openSquares: 80, longShare: 0.1026, familiarity: 1.141 },
        { id: 21528, date: "2023-12-07", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 68, longShare: 0.1026, familiarity: 1.2143 },
        { id: 21543, date: "2023-12-08", rows: 15, cols: 15, words: 62, blocks: 44, openSquares: 81, longShare: 0.1935, familiarity: 0.9516 },
        { id: 21525, date: "2023-12-09", rows: 15, cols: 15, words: 68, blocks: 30, openSquares: 98, longShare: 0.1912, familiarity: 0.8824 },
        { id: 21518, date: "2023-12-10", rows: 21, cols: 21, words: 140, blocks: 82, openSquares: 113, longShare: 0.1, familiarity: 1.1571 },
        { id: 21546, date: "2023-12-11", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 74, longShare: 0.1447, familiarity: 1.3158 },
        { id: 21542, date: "2023-12-12", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 71, longShare: 0.1053, familiarity: 1.1579 },
        { id: 21550, date: "2023-12-13", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 72, longShare: 0.1053, familiarity: 1.0921 },
        { id: 21515, date: "2023-12-14", rows: 15, cols: 15, words: 74, blocks: 36, openSquares: 78, longShare: 0.0946, familiarity: 1.0405 },
        { id: 21547, date: "2023-12-15", rows: 15, cols: 15, words: 72, blocks: 38, openSquares: 74, longShare: 0.1667, familiarity: 1.0972 },
        { id: 21551, date: "2023-12-16", rows: 15, cols: 16, words: 65, blocks: 40, openSquares: 106, longShare: 0.3538, familiarity: 0.6923 },
        { id: 21526, date: "2023-12-17", rows: 21, cols: 21, words: 140, blocks: 82, openSquares: 108, longShare: 0.1214, familiarity: 1.127 },
        { id: 21545, date: "2023-12-18", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 62, longShare: 0.0789, familiarity: 1.1711 },
        { id: 21544, date: "2023-12-19", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 68, longShare: 0.1154, familiarity: 1.2692 },
        { id: 21566, date: "2023-12-20", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 70, longShare: 0.0658, familiarity: 1.3289 },
        { id: 21548, date: "2023-12-21", rows: 15, cols: 15, words: 77, blocks: 39, openSquares: 76, longShare: 0.1169, familiarity: 1.0779 },
        { id: 21579, date: "2023-12-22", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 79, longShare: 0.2, familiarity: 1.1143 },
        { id: 21560, date: "2023-12-23", rows: 15, cols: 15, words: 68, blocks: 23, openSquares: 116, longShare: 0.1765, familiarity: 0.9853 },
        { id: 21568, date: "2023-12-24", rows: 21, cols: 21, words: 140, blocks: 76, openSquares: 113, longShare: 0.1, familiarity: 1.1286 },
        { id: 21567, date: "2023-12-25", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 61, longShare: 0.0769, familiarity: 1.359 },
        { id: 21564, date: "2023-12-26", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 64, longShare: 0.0769, familiarity: 1.0385 },
        { id: 21563, date: "2023-12-27", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 73, longShare: 0.1053, familiarity: 0.9868 },
        { id: 21608, date: "2023-12-28", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 75, longShare: 0.0676, familiarity: 1.0946 },
        { id: 21609, date: "2023-12-29", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 72, longShare: 0.1944, familiarity: 1.125 },
        { id: 21588, date: "2024-01-01", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 74, longShare: 0.1053, familiarity: 1.2237 },
        { id: 21607, date: "2024-01-02", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 61, longShare: 0.0897, familiarity: 1.3205 },
        { id: 21596, date: "2024-01-03", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 56, longShare: 0.0769, familiarity: 1.2692 },
        { id: 21557, date: "2024-01-04", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 61, longShare: 0.1154, familiarity: 1.3205 },
        { id: 21613, date: "2024-01-05", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 93, longShare: 0.1515, familiarity: 0.9697 },
        { id: 21611, date: "2024-01-06", rows: 15, cols: 15, words: 70, blocks: 42, openSquares: 58, longShare: 0.0857, familiarity: 1.1571 },
        { id: 21552, date: "2024-01-07", rows: 21, cols: 21, words: 140, blocks: 78, openSquares: 123, longShare: 0.1214, familiarity: 1.0643 },
        { id: 21626, date: "2024-01-08", rows: 15, cols: 15, words: 78, blocks: 35, openSquares: 66, longShare: 0.0769, familiarity: 1.2179 },
        { id: 21614, date: "2024-01-09", rows: 15, cols: 14, words: 67, blocks: 36, openSquares: 66, longShare: 0.1045, familiarity: 0.9851 },
        { id: 21604, date: "2024-01-10", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 65, longShare: 0.1053, familiarity: 1.25 },
        { id: 21541, date: "2024-01-11", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 65, longShare: 0.1184, familiarity: 1.1486 },
        { id: 21620, date: "2024-01-12", rows: 15, cols: 15, words: 72, blocks: 32, openSquares: 77, longShare: 0.1389, familiarity: 0.9861 },
        { id: 21625, date: "2024-01-13", rows: 15, cols: 15, words: 70, blocks: 26, openSquares: 88, longShare: 0.2143, familiarity: 1.0143 },
        { id: 21610, date: "2024-01-14", rows: 21, cols: 21, words: 136, blocks: 78, openSquares: 123, longShare: 0.1618, familiarity: 1.0147 },
        { id: 21615, date: "2024-01-15", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 66, longShare: 0.0789, familiarity: 1.2105 },
        { id: 21622, date: "2024-01-16", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 69, longShare: 0.1026, familiarity: 1.0256 },
        { id: 21647, date: "2024-01-17", rows: 15, cols: 15, words: 78, blocks: 39, openSquares: 72, longShare: 0.0513, familiarity: 1.2564 },
        { id: 21648, date: "2024-01-18", rows: 15, cols: 15, words: 72, blocks: 38, openSquares: 79, longShare: 0.1389, familiarity: 1.0492 },
        { id: 21645, date: "2024-01-19", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 83, longShare: 0.2222, familiarity: 1.125 },
        { id: 21623, date: "2024-01-20", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 85, longShare: 0.2222, familiarity: 1.1111 },
        { id: 21639, date: "2024-01-21", rows: 21, cols: 21, words: 138, blocks: 65, openSquares: 124, longShare: 0.087, familiarity: 1.0652 },
        { id: 21638, date: "2024-01-22", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 66, longShare: 0.0526, familiarity: 1.2237 },
        { id: 21637, date: "2024-01-23", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 73, longShare: 0.0921, familiarity: 1.0526 },
        { id: 21655, date: "2024-01-24", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 85, longShare: 0.0658, familiarity: 1.2368 },
        { id: 21629, date: "2024-01-25", rows: 15, cols: 16, words: 75, blocks: 36, openSquares: 84, longShare: 0.16, familiarity: 0.96 },
        { id: 21627, date: "2024-01-26", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 88, longShare: 0.2, familiarity: 0.8571 },
        { id: 21654, date: "2024-01-27", rows: 15, cols: 15, words: 66, blocks: 32, openSquares: 99, longShare: 0.2576, familiarity: 0.9242 },
        { id: 21649, date: "2024-01-28", rows: 21, cols: 21, words: 140, blocks: 83, openSquares: 128, longShare: 0.1, familiarity: 1.0429 },
        { id: 21656, date: "2024-01-29", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 58, longShare: 0.0897, familiarity: 1.2179 },
        { id: 21658, date: "2024-01-30", rows: 15, cols: 15, words: 76, blocks: 42, openSquares: 62, longShare: 0.0921, familiarity: 1.3026 },
        { id: 21657, date: "2024-01-31", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 67, longShare: 0.0789, familiarity: 1.1711 },
        { id: 21660, date: "2024-02-01", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 74, longShare: 0.1316, familiarity: 1.0395 },
        { id: 21662, date: "2024-02-02", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 100, longShare: 0.2286, familiarity: 0.9143 },
        { id: 21659, date: "2024-02-03", rows: 16, cols: 15, words: 71, blocks: 36, openSquares: 94, longShare: 0.1831, familiarity: 0.8732 },
        { id: 21661, date: "2024-02-04", rows: 21, cols: 21, words: 140, blocks: 76, openSquares: 111, longShare: 0.0929, familiarity: 1.0643 },
        { id: 21668, date: "2024-02-05", rows: 15, cols: 15, words: 76, blocks: 42, openSquares: 54, longShare: 0.0921, familiarity: 1.2105 },
        { id: 21667, date: "2024-02-06", rows: 15, cols: 15, words: 74, blocks: 32, openSquares: 73, longShare: 0.1216, familiarity: 1.1757 },
        { id: 21678, date: "2024-02-07", rows: 15, cols: 16, words: 79, blocks: 40, openSquares: 72, longShare: 0.0759, familiarity: 1.1392 },
        { id: 21673, date: "2024-02-08", rows: 15, cols: 16, words: 81, blocks: 42, openSquares: 72, longShare: 0.0864, familiarity: 1.0617 },
        { id: 21682, date: "2024-02-09", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 88, longShare: 0.2143, familiarity: 1.0429 },
        { id: 21684, date: "2024-02-10", rows: 15, cols: 15, words: 71, blocks: 34, openSquares: 85, longShare: 0.0986, familiarity: 1.0986 },
        { id: 21687, date: "2024-02-12", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 66, longShare: 0.1026, familiarity: 1.2564 },
        { id: 21688, date: "2024-02-13", rows: 15, cols: 15, words: 74, blocks: 42, openSquares: 65, longShare: 0.0811, familiarity: 1.1216 },
        { id: 21685, date: "2024-02-14", rows: 15, cols: 15, words: 74, blocks: 37, openSquares: 66, longShare: 0.0676, familiarity: 1.0676 },
        { id: 21674, date: "2024-02-15", rows: 15, cols: 15, words: 78, blocks: 41, openSquares: 73, longShare: 0.0128, familiarity: 1.3529 },
        { id: 21679, date: "2024-02-16", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 93, longShare: 0.1806, familiarity: 1.125 },
        { id: 21669, date: "2024-02-17", rows: 15, cols: 15, words: 72, blocks: 39, openSquares: 66, longShare: 0.1389, familiarity: 1 },
        { id: 21689, date: "2024-02-18", rows: 21, cols: 21, words: 140, blocks: 70, openSquares: 125, longShare: 0.1357, familiarity: 1.0643 },
        { id: 21699, date: "2024-02-19", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 64, longShare: 0.1026, familiarity: 1.2179 },
        { id: 21711, date: "2024-02-20", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 67, longShare: 0.0921, familiarity: 1.0263 },
        { id: 21698, date: "2024-02-21", rows: 15, cols: 16, words: 81, blocks: 36, openSquares: 78, longShare: 0.0864, familiarity: 1.1728 },
        { id: 21686, date: "2024-02-22", rows: 15, cols: 15, words: 78, blocks: 34, openSquares: 69, longShare: 0.1282, familiarity: 1.2051 },
        { id: 21690, date: "2024-02-23", rows: 15, cols: 15, words: 64, blocks: 37, openSquares: 96, longShare: 0.1875, familiarity: 0.8438 },
        { id: 21700, date: "2024-02-24", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 85, longShare: 0.2, familiarity: 1.0571 },
        { id: 21710, date: "2024-02-25", rows: 21, cols: 21, words: 142, blocks: 78, openSquares: 108, longShare: 0.0775, familiarity: 1.2254 },
        { id: 21712, date: "2024-02-26", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 64, longShare: 0.0769, familiarity: 1.2179 },
        { id: 21727, date: "2024-02-27", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 71, longShare: 0.1282, familiarity: 1.3077 },
        { id: 21720, date: "2024-02-28", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 69, longShare: 0.1053, familiarity: 1.2632 },
        { id: 21701, date: "2024-02-29", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 77, longShare: 0.125, familiarity: 0.9028 },
        { id: 21738, date: "2024-03-01", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 79, longShare: 0.2121, familiarity: 1.0455 },
        { id: 21732, date: "2024-03-02", rows: 15, cols: 15, words: 66, blocks: 42, openSquares: 79, longShare: 0.1667, familiarity: 0.9394 },
        { id: 21743, date: "2024-03-03", rows: 21, cols: 21, words: 142, blocks: 77, openSquares: 106, longShare: 0.1127, familiarity: 1.0211 },
        { id: 21736, date: "2024-03-04", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 62, longShare: 0.0513, familiarity: 1.1795 },
        { id: 21747, date: "2024-03-05", rows: 15, cols: 14, words: 73, blocks: 36, openSquares: 60, longShare: 0.0822, familiarity: 1.274 },
        { id: 21739, date: "2024-03-06", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 77, longShare: 0.1081, familiarity: 1.1081 },
        { id: 21733, date: "2024-03-07", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 67, longShare: 0.0811, familiarity: 1.2027 },
        { id: 21748, date: "2024-03-08", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 87, longShare: 0.1286, familiarity: 0.9857 },
        { id: 21740, date: "2024-03-09", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 81, longShare: 0.2, familiarity: 1.0143 },
        { id: 21757, date: "2024-03-10", rows: 21, cols: 21, words: 140, blocks: 76, openSquares: 117, longShare: 0.1214, familiarity: 1.1286 },
        { id: 21763, date: "2024-03-11", rows: 15, cols: 14, words: 71, blocks: 34, openSquares: 64, longShare: 0.0704, familiarity: 1.1831 },
        { id: 21755, date: "2024-03-12", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 69, longShare: 0.0513, familiarity: 1.141 },
        { id: 21749, date: "2024-03-13", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 71, longShare: 0.0946, familiarity: 1.2838 },
        { id: 21758, date: "2024-03-14", rows: 14, cols: 15, words: 68, blocks: 34, openSquares: 79, longShare: 0.1176, familiarity: 1.1765 },
        { id: 21750, date: "2024-03-15", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 74, longShare: 0.1471, familiarity: 1.1176 },
        { id: 21759, date: "2024-03-16", rows: 15, cols: 15, words: 70, blocks: 35, openSquares: 74, longShare: 0.1714, familiarity: 1.0429 },
        { id: 21777, date: "2024-03-17", rows: 21, cols: 22, words: 147, blocks: 80, openSquares: 114, longShare: 0.1293, familiarity: 1.0141 },
        { id: 21776, date: "2024-03-18", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 65, longShare: 0.1026, familiarity: 1.2821 },
        { id: 21788, date: "2024-03-19", rows: 15, cols: 16, words: 81, blocks: 42, openSquares: 74, longShare: 0.1111, familiarity: 1.2222 },
        { id: 21768, date: "2024-03-20", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 71, longShare: 0.0769, familiarity: 1.1923 },
        { id: 21771, date: "2024-03-21", rows: 15, cols: 15, words: 74, blocks: 36, openSquares: 71, longShare: 0.1622, familiarity: 1.1216 },
        { id: 21767, date: "2024-03-22", rows: 15, cols: 15, words: 72, blocks: 36, openSquares: 69, longShare: 0.2083, familiarity: 1.0278 },
        { id: 21754, date: "2024-03-23", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 90, longShare: 0.1618, familiarity: 0.7059 },
        { id: 21779, date: "2024-03-24", rows: 21, cols: 21, words: 140, blocks: 69, openSquares: 116, longShare: 0.1143, familiarity: 1.0286 },
        { id: 21770, date: "2024-03-25", rows: 15, cols: 15, words: 76, blocks: 39, openSquares: 66, longShare: 0.0789, familiarity: 1.1974 },
        { id: 21795, date: "2024-03-26", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 64, longShare: 0.0921, familiarity: 1.1842 },
        { id: 21775, date: "2024-03-27", rows: 15, cols: 15, words: 78, blocks: 44, openSquares: 57, longShare: 0.0641, familiarity: 1.3205 },
        { id: 21769, date: "2024-03-28", rows: 16, cols: 15, words: 77, blocks: 46, openSquares: 72, longShare: 0.1299, familiarity: 1 },
        { id: 21787, date: "2024-03-29", rows: 15, cols: 15, words: 68, blocks: 35, openSquares: 76, longShare: 0.1176, familiarity: 0.8971 },
        { id: 21796, date: "2024-03-30", rows: 15, cols: 15, words: 66, blocks: 24, openSquares: 105, longShare: 0.0909, familiarity: 0.7121 },
        { id: 21792, date: "2024-03-31", rows: 21, cols: 21, words: 140, blocks: 74, openSquares: 107, longShare: 0.1643, familiarity: 1.15 },
        { id: 21790, date: "2024-04-01", rows: 15, cols: 15, words: 74, blocks: 35, openSquares: 72, longShare: 0.0811, familiarity: 0.9865 },
        { id: 21797, date: "2024-04-02", rows: 15, cols: 16, words: 81, blocks: 42, openSquares: 76, longShare: 0.0988, familiarity: 1.2593 },
        { id: 21765, date: "2024-04-03", rows: 15, cols: 15, words: 74, blocks: 31, openSquares: 76, longShare: 0.1622, familiarity: 1.1351 },
        { id: 21791, date: "2024-04-04", rows: 16, cols: 15, words: 77, blocks: 40, openSquares: 81, longShare: 0.0909, familiarity: 1.0909 },
        { id: 21798, date: "2024-04-05", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 71, longShare: 0.2, familiarity: 1.0571 },
        { id: 21820, date: "2024-04-06", rows: 15, cols: 15, words: 68, blocks: 25, openSquares: 104, longShare: 0.2353, familiarity: 0.7794 },
        { id: 21802, date: "2024-04-07", rows: 21, cols: 21, words: 140, blocks: 68, openSquares: 131, longShare: 0.1429, familiarity: 1.0143 },
        { id: 21801, date: "2024-04-08", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 74, longShare: 0.0921, familiarity: 1.3026 },
        { id: 21799, date: "2024-04-09", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 69, longShare: 0.1053, familiarity: 1.1842 },
        { id: 21789, date: "2024-04-10", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 75, longShare: 0.0789, familiarity: 1.1053 },
        { id: 21812, date: "2024-04-11", rows: 15, cols: 15, words: 80, blocks: 40, openSquares: 68, longShare: 0.075, familiarity: 1.2 },
        { id: 21805, date: "2024-04-12", rows: 15, cols: 15, words: 72, blocks: 29, openSquares: 92, longShare: 0.1944, familiarity: 1.0417 },
        { id: 21821, date: "2024-04-13", rows: 15, cols: 15, words: 72, blocks: 31, openSquares: 86, longShare: 0.1944, familiarity: 0.9028 },
        { id: 21819, date: "2024-04-14", rows: 21, cols: 21, words: 141, blocks: 81, openSquares: 115, longShare: 0.1135, familiarity: 0.9362 },
        { id: 21814, date: "2024-04-15", rows: 15, cols: 15, words: 78, blocks: 39, openSquares: 58, longShare: 0.0769, familiarity: 1.1154 },
        { id: 21829, date: "2024-04-16", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 62, longShare: 0.0769, familiarity: 1.2564 },
        { id: 21816, date: "2024-04-17", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 66, longShare: 0.1026, familiarity: 1.2821 },
        { id: 21837, date: "2024-04-18", rows: 15, cols: 15, words: 78, blocks: 46, openSquares: 59, longShare: 0.0769, familiarity: 1.2564 },
        { id: 21836, date: "2024-04-19", rows: 15, cols: 15, words: 70, blocks: 35, openSquares: 78, longShare: 0.1429, familiarity: 0.9429 },
        { id: 21817, date: "2024-04-20", rows: 15, cols: 15, words: 70, blocks: 38, openSquares: 79, longShare: 0.1571, familiarity: 1.0286 },
        { id: 21842, date: "2024-04-22", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 61, longShare: 0.0641, familiarity: 1.1026 },
        { id: 21843, date: "2024-04-23", rows: 15, cols: 14, words: 73, blocks: 34, openSquares: 60, longShare: 0.0822, familiarity: 1.1507 },
        { id: 21831, date: "2024-04-24", rows: 15, cols: 15, words: 78, blocks: 42, openSquares: 57, longShare: 0.0641, familiarity: 1.3462 },
        { id: 21841, date: "2024-04-25", rows: 15, cols: 15, words: 76, blocks: 39, openSquares: 64, longShare: 0.0789, familiarity: 1.3134 },
        { id: 21846, date: "2024-04-26", rows: 15, cols: 15, words: 68, blocks: 35, openSquares: 70, longShare: 0.1176, familiarity: 0.9412 },
        { id: 21848, date: "2024-04-27", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 93, longShare: 0.2571, familiarity: 0.9 },
        { id: 21844, date: "2024-04-28", rows: 21, cols: 21, words: 140, blocks: 69, openSquares: 142, longShare: 0.1571, familiarity: 0.9143 },
        { id: 21873, date: "2024-04-29", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 64, longShare: 0.0769, familiarity: 1.2179 },
        { id: 21874, date: "2024-04-30", rows: 15, cols: 15, words: 78, blocks: 39, openSquares: 64, longShare: 0.0769, familiarity: 1.0385 },
        { id: 21854, date: "2024-05-01", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 66, longShare: 0.0921, familiarity: 1.1316 },
        { id: 21855, date: "2024-05-02", rows: 15, cols: 15, words: 72, blocks: 42, openSquares: 62, longShare: 0.125, familiarity: 1.1833 },
        { id: 21880, date: "2024-05-03", rows: 15, cols: 15, words: 68, blocks: 35, openSquares: 88, longShare: 0.0882, familiarity: 0.9706 },
        { id: 21800, date: "2024-05-04", rows: 15, cols: 15, words: 68, blocks: 38, openSquares: 85, longShare: 0.1618, familiarity: 1.0147 },
        { id: 21865, date: "2024-05-05", rows: 22, cols: 21, words: 143, blocks: 92, openSquares: 124, longShare: 0.1189, familiarity: 1.014 },
        { id: 21893, date: "2024-05-06", rows: 15, cols: 15, words: 78, blocks: 42, openSquares: 65, longShare: 0.1026, familiarity: 1.4103 },
        { id: 21884, date: "2024-05-07", rows: 15, cols: 15, words: 72, blocks: 38, openSquares: 79, longShare: 0.0972, familiarity: 1.1111 },
        { id: 21887, date: "2024-05-08", rows: 15, cols: 15, words: 76, blocks: 41, openSquares: 66, longShare: 0.0526, familiarity: 1.1711 },
        { id: 21894, date: "2024-05-09", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 67, longShare: 0.1053, familiarity: 1.1579 },
        { id: 21891, date: "2024-05-10", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 92, longShare: 0.2571, familiarity: 1.1 },
        { id: 21856, date: "2024-05-11", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 101, longShare: 0.1515, familiarity: 0.8939 },
        { id: 21889, date: "2024-05-12", rows: 21, cols: 21, words: 140, blocks: 71, openSquares: 130, longShare: 0.1, familiarity: 0.8857 },
        { id: 21916, date: "2024-05-13", rows: 15, cols: 15, words: 78, blocks: 46, openSquares: 53, longShare: 0.1026, familiarity: 1.2436 },
        { id: 21895, date: "2024-05-14", rows: 15, cols: 15, words: 74, blocks: 32, openSquares: 79, longShare: 0.0946, familiarity: 1.0135 },
        { id: 21917, date: "2024-05-15", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 71, longShare: 0.0921, familiarity: 1.0789 },
        { id: 21898, date: "2024-05-16", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 58, longShare: 0.1316, familiarity: 1.1316 },
        { id: 21896, date: "2024-05-17", rows: 15, cols: 15, words: 72, blocks: 32, openSquares: 83, longShare: 0.1944, familiarity: 1.0694 },
        { id: 21815, date: "2024-05-18", rows: 15, cols: 15, words: 64, blocks: 35, openSquares: 102, longShare: 0.125, familiarity: 0.8438 },
        { id: 21897, date: "2024-05-19", rows: 21, cols: 21, words: 140, blocks: 77, openSquares: 112, longShare: 0.1, familiarity: 1.1429 },
        { id: 21892, date: "2024-05-20", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 67, longShare: 0.1351, familiarity: 1.2027 },
        { id: 21918, date: "2024-05-21", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 59, longShare: 0.0641, familiarity: 1.1923 },
        { id: 21928, date: "2024-05-22", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 84, longShare: 0.2083, familiarity: 0.9444 },
        { id: 21921, date: "2024-05-23", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 57, longShare: 0.0526, familiarity: 1.1053 },
        { id: 21919, date: "2024-05-24", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 85, longShare: 0.1515, familiarity: 0.8788 },
        { id: 21929, date: "2024-05-25", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 93, longShare: 0.1515, familiarity: 0.8636 },
        { id: 21920, date: "2024-05-26", rows: 21, cols: 21, words: 136, blocks: 80, openSquares: 94, longShare: 0.1324, familiarity: 1.0074 },
        { id: 21925, date: "2024-05-27", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 71, longShare: 0.0769, familiarity: 1.2564 },
        { id: 21927, date: "2024-05-28", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 70, longShare: 0.0769, familiarity: 1.2564 },
        { id: 21931, date: "2024-05-29", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 60, longShare: 0.1026, familiarity: 1.0513 },
        { id: 21922, date: "2024-05-30", rows: 16, cols: 15, words: 79, blocks: 34, openSquares: 90, longShare: 0.1139, familiarity: 0.8734 },
        { id: 21955, date: "2024-05-31", rows: 15, cols: 15, words: 68, blocks: 32, openSquares: 99, longShare: 0.1471, familiarity: 1 },
        { id: 21930, date: "2024-06-01", rows: 15, cols: 15, words: 66, blocks: 27, openSquares: 110, longShare: 0.2121, familiarity: 0.7273 },
        { id: 21937, date: "2024-06-02", rows: 21, cols: 21, words: 138, blocks: 71, openSquares: 114, longShare: 0.1159, familiarity: 0.9348 },
        { id: 21963, date: "2024-06-03", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 69, longShare: 0.0921, familiarity: 1.1184 },
        { id: 21948, date: "2024-06-04", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 55, longShare: 0.1154, familiarity: 1.2436 },
        { id: 21903, date: "2024-06-05", rows: 15, cols: 15, words: 76, blocks: 42, openSquares: 72, longShare: 0.1184, familiarity: 1.1842 },
        { id: 21940, date: "2024-06-06", rows: 15, cols: 15, words: 70, blocks: 42, openSquares: 69, longShare: 0.1143, familiarity: 1.0429 },
        { id: 21939, date: "2024-06-07", rows: 15, cols: 15, words: 68, blocks: 28, openSquares: 91, longShare: 0.2206, familiarity: 0.9118 },
        { id: 21974, date: "2024-06-08", rows: 15, cols: 15, words: 66, blocks: 35, openSquares: 84, longShare: 0.1818, familiarity: 0.9242 },
        { id: 21956, date: "2024-06-09", rows: 21, cols: 21, words: 140, blocks: 77, openSquares: 100, longShare: 0.1, familiarity: 1.0286 },
        { id: 21961, date: "2024-06-11", rows: 15, cols: 15, words: 74, blocks: 32, openSquares: 77, longShare: 0.1081, familiarity: 1.1081 },
        { id: 21962, date: "2024-06-12", rows: 15, cols: 16, words: 79, blocks: 40, openSquares: 76, longShare: 0.0886, familiarity: 1.1139 },
        { id: 21976, date: "2024-06-13", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 66, longShare: 0.1154, familiarity: 1.1923 },
        { id: 21977, date: "2024-06-14", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 81, longShare: 0.1667, familiarity: 1.125 },
        { id: 21964, date: "2024-06-15", rows: 15, cols: 15, words: 66, blocks: 35, openSquares: 82, longShare: 0.1515, familiarity: 0.9697 },
        { id: 21975, date: "2024-06-16", rows: 21, cols: 21, words: 138, blocks: 74, openSquares: 129, longShare: 0.1159, familiarity: 1.0435 },
        { id: 21979, date: "2024-06-17", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 65, longShare: 0.0769, familiarity: 1.3846 },
        { id: 21978, date: "2024-06-18", rows: 15, cols: 14, words: 71, blocks: 38, openSquares: 50, longShare: 0.0563, familiarity: 1.1127 },
        { id: 21995, date: "2024-06-19", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 69, longShare: 0.1184, familiarity: 1.1053 },
        { id: 21981, date: "2024-06-20", rows: 15, cols: 15, words: 74, blocks: 37, openSquares: 78, longShare: 0.0811, familiarity: 1.027 },
        { id: 21980, date: "2024-06-21", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 83, longShare: 0.2143, familiarity: 1.1429 },
        { id: 21973, date: "2024-06-22", rows: 15, cols: 15, words: 68, blocks: 25, openSquares: 102, longShare: 0.1765, familiarity: 0.8235 },
        { id: 21991, date: "2024-06-23", rows: 21, cols: 21, words: 140, blocks: 70, openSquares: 124, longShare: 0.0786, familiarity: 1.05 },
        { id: 22006, date: "2024-06-24", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 71, longShare: 0.0513, familiarity: 1.1538 },
        { id: 22016, date: "2024-06-25", rows: 15, cols: 15, words: 72, blocks: 42, openSquares: 68, longShare: 0.0694, familiarity: 1.0972 },
        { id: 22001, date: "2024-06-26", rows: 15, cols: 15, words: 72, blocks: 42, openSquares: 68, longShare: 0.1389, familiarity: 1.25 },
        { id: 21997, date: "2024-06-27", rows: 16, cols: 16, words: 76, blocks: 80, openSquares: 36, longShare: 0.0526, familiarity: 0.8289 },
        { id: 22011, date: "2024-06-28", rows: 15, cols: 15, words: 68, blocks: 36, openSquares: 77, longShare: 0.2059, familiarity: 1 },
        { id: 22018, date: "2024-06-29", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 94, longShare: 0.2273, familiarity: 0.9091 },
        { id: 22013, date: "2024-06-30", rows: 21, cols: 21, words: 142, blocks: 83, openSquares: 108, longShare: 0.0845, familiarity: 1.0211 },
        { id: 22027, date: "2024-07-01", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 66, longShare: 0.1053, familiarity: 1.3026 },
        { id: 22014, date: "2024-07-02", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 62, longShare: 0.0769, familiarity: 1.1667 },
        { id: 22017, date: "2024-07-03", rows: 15, cols: 15, words: 76, blocks: 37, openSquares: 68, longShare: 0.0789, familiarity: 1.1316 },
        { id: 22041, date: "2024-07-04", rows: 15, cols: 15, words: 75, blocks: 36, openSquares: 76, longShare: 0.04, familiarity: 1.1467 },
        { id: 22028, date: "2024-07-05", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 89, longShare: 0.2083, familiarity: 1.1111 },
        { id: 22e3, date: "2024-07-06", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 101, longShare: 0.1618, familiarity: 0.8529 },
        { id: 22033, date: "2024-07-07", rows: 21, cols: 21, words: 140, blocks: 84, openSquares: 107, longShare: 0.0429, familiarity: 1.1357 },
        { id: 22029, date: "2024-07-08", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 63, longShare: 0.1154, familiarity: 1.3462 },
        { id: 22032, date: "2024-07-09", rows: 15, cols: 15, words: 78, blocks: 41, openSquares: 64, longShare: 0.0769, familiarity: 1.3462 },
        { id: 22031, date: "2024-07-10", rows: 15, cols: 15, words: 72, blocks: 42, openSquares: 63, longShare: 0.1667, familiarity: 1 },
        { id: 22015, date: "2024-07-11", rows: 15, cols: 15, words: 74, blocks: 36, openSquares: 67, longShare: 0.0946, familiarity: 1 },
        { id: 22043, date: "2024-07-12", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 88, longShare: 0.2083, familiarity: 1.0417 },
        { id: 22044, date: "2024-07-13", rows: 15, cols: 15, words: 66, blocks: 34, openSquares: 97, longShare: 0.2273, familiarity: 0.8182 },
        { id: 22030, date: "2024-07-14", rows: 21, cols: 21, words: 138, blocks: 88, openSquares: 103, longShare: 0.1159, familiarity: 1.2029 },
        { id: 22048, date: "2024-07-15", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 74, longShare: 0.0921, familiarity: 1.1974 },
        { id: 22058, date: "2024-07-16", rows: 16, cols: 15, words: 77, blocks: 46, openSquares: 64, longShare: 0.1169, familiarity: 1.1688 },
        { id: 21998, date: "2024-07-17", rows: 15, cols: 16, words: 81, blocks: 38, openSquares: 72, longShare: 0.0988, familiarity: 1.1481 },
        { id: 22045, date: "2024-07-19", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 77, longShare: 0.2, familiarity: 1.0714 },
        { id: 22047, date: "2024-07-20", rows: 15, cols: 15, words: 70, blocks: 27, openSquares: 102, longShare: 0.2, familiarity: 0.9 },
        { id: 22050, date: "2024-07-21", rows: 21, cols: 21, words: 138, blocks: 76, openSquares: 128, longShare: 0.087, familiarity: 1.1232 },
        { id: 22083, date: "2024-07-22", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 73, longShare: 0.0789, familiarity: 1.1579 },
        { id: 22072, date: "2024-07-23", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 65, longShare: 0.0641, familiarity: 1.1667 },
        { id: 22049, date: "2024-07-24", rows: 15, cols: 15, words: 68, blocks: 39, openSquares: 83, longShare: 0.0882, familiarity: 1.0294 },
        { id: 22073, date: "2024-07-25", rows: 15, cols: 16, words: 79, blocks: 38, openSquares: 84, longShare: 0.1139, familiarity: 1.1549 },
        { id: 22074, date: "2024-07-26", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 71, longShare: 0.2083, familiarity: 1.0694 },
        { id: 22077, date: "2024-07-27", rows: 15, cols: 15, words: 68, blocks: 25, openSquares: 104, longShare: 0.2353, familiarity: 0.7794 },
        { id: 22061, date: "2024-07-28", rows: 19, cols: 23, words: 143, blocks: 91, openSquares: 98, longShare: 0.0839, familiarity: 1.1399 },
        { id: 22086, date: "2024-07-29", rows: 16, cols: 14, words: 78, blocks: 38, openSquares: 64, longShare: 0.0513, familiarity: 1.3462 },
        { id: 22084, date: "2024-07-30", rows: 15, cols: 15, words: 72, blocks: 43, openSquares: 62, longShare: 0.1111, familiarity: 1.0556 },
        { id: 22085, date: "2024-07-31", rows: 15, cols: 15, words: 78, blocks: 35, openSquares: 62, longShare: 0.1026, familiarity: 1.2821 },
        { id: 22092, date: "2024-08-01", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 68, longShare: 0.0769, familiarity: 1.2308 },
        { id: 22093, date: "2024-08-02", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 85, longShare: 0.1857, familiarity: 1.0286 },
        { id: 22094, date: "2024-08-03", rows: 15, cols: 15, words: 72, blocks: 33, openSquares: 78, longShare: 0.1389, familiarity: 0.9306 },
        { id: 22087, date: "2024-08-04", rows: 21, cols: 21, words: 142, blocks: 72, openSquares: 101, longShare: 0.1479, familiarity: 1.0634 },
        { id: 22101, date: "2024-08-05", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 67, longShare: 0.0769, familiarity: 1.2179 },
        { id: 22113, date: "2024-08-06", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 67, longShare: 0.1026, familiarity: 1.1923 },
        { id: 22096, date: "2024-08-07", rows: 15, cols: 15, words: 78, blocks: 47, openSquares: 57, longShare: 0.0256, familiarity: 1.2051 },
        { id: 22109, date: "2024-08-08", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 70, longShare: 0.0641, familiarity: 1.1795 },
        { id: 22114, date: "2024-08-09", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 87, longShare: 0.2, familiarity: 0.9286 },
        { id: 22110, date: "2024-08-10", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 71, longShare: 0.1667, familiarity: 1.0556 },
        { id: 22098, date: "2024-08-11", rows: 21, cols: 21, words: 140, blocks: 80, openSquares: 103, longShare: 0.0929, familiarity: 1.0857 },
        { id: 22119, date: "2024-08-12", rows: 15, cols: 15, words: 72, blocks: 40, openSquares: 73, longShare: 0.0972, familiarity: 1.25 },
        { id: 22118, date: "2024-08-13", rows: 15, cols: 15, words: 78, blocks: 44, openSquares: 58, longShare: 0.0641, familiarity: 1.2308 },
        { id: 22122, date: "2024-08-14", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 74, longShare: 0.0921, familiarity: 1.0263 },
        { id: 22117, date: "2024-08-15", rows: 15, cols: 16, words: 79, blocks: 38, openSquares: 64, longShare: 0.0886, familiarity: 0.962 },
        { id: 22095, date: "2024-08-16", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 69, longShare: 0.2, familiarity: 1.0571 },
        { id: 22120, date: "2024-08-17", rows: 15, cols: 15, words: 68, blocks: 36, openSquares: 79, longShare: 0.1912, familiarity: 0.9412 },
        { id: 22129, date: "2024-08-18", rows: 21, cols: 21, words: 142, blocks: 86, openSquares: 107, longShare: 0.1197, familiarity: 1.2958 },
        { id: 22133, date: "2024-08-19", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 67, longShare: 0.1053, familiarity: 1.1316 },
        { id: 22139, date: "2024-08-20", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 63, longShare: 0.0769, familiarity: 1.2179 },
        { id: 22130, date: "2024-08-21", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 58, longShare: 0.0769, familiarity: 1.2564 },
        { id: 22137, date: "2024-08-22", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 75, longShare: 0.1216, familiarity: 1.1351 },
        { id: 22131, date: "2024-08-23", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 79, longShare: 0.2083, familiarity: 1.0833 },
        { id: 22138, date: "2024-08-24", rows: 15, cols: 15, words: 66, blocks: 31, openSquares: 90, longShare: 0.2121, familiarity: 0.7879 },
        { id: 22134, date: "2024-08-25", rows: 21, cols: 22, words: 145, blocks: 90, openSquares: 116, longShare: 0.1724, familiarity: 1.1517 },
        { id: 22159, date: "2024-08-26", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 64, longShare: 0.0658, familiarity: 1.1053 },
        { id: 22152, date: "2024-08-27", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 67, longShare: 0.1053, familiarity: 1.1184 },
        { id: 22158, date: "2024-08-28", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 68, longShare: 0.0513, familiarity: 1.1667 },
        { id: 22160, date: "2024-08-29", rows: 15, cols: 16, words: 81, blocks: 38, openSquares: 64, longShare: 0.1358, familiarity: 1 },
        { id: 22132, date: "2024-08-30", rows: 15, cols: 15, words: 72, blocks: 29, openSquares: 92, longShare: 0.1111, familiarity: 0.9306 },
        { id: 22161, date: "2024-08-31", rows: 15, cols: 15, words: 68, blocks: 30, openSquares: 94, longShare: 0.1912, familiarity: 0.7794 },
        { id: 22163, date: "2024-09-01", rows: 22, cols: 22, words: 154, blocks: 86, openSquares: 112, longShare: 0.1429, familiarity: 1.0915 },
        { id: 22170, date: "2024-09-02", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 64, longShare: 0.0769, familiarity: 1.3077 },
        { id: 22097, date: "2024-09-03", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 63, longShare: 0.1184, familiarity: 1.3289 },
        { id: 22186, date: "2024-09-04", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 76, longShare: 0.1316, familiarity: 1.1316 },
        { id: 22172, date: "2024-09-05", rows: 15, cols: 15, words: 74, blocks: 35, openSquares: 68, longShare: 0.1351, familiarity: 1.0676 },
        { id: 22162, date: "2024-09-06", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 87, longShare: 0.2429, familiarity: 1.2 },
        { id: 22174, date: "2024-09-07", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 93, longShare: 0.1515, familiarity: 0.7424 },
        { id: 22199, date: "2024-09-08", rows: 21, cols: 21, words: 140, blocks: 80, openSquares: 124, longShare: 0.15, familiarity: 1.1214 },
        { id: 22197, date: "2024-09-09", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 67, longShare: 0.0641, familiarity: 1.1795 },
        { id: 22182, date: "2024-09-10", rows: 15, cols: 16, words: 79, blocks: 44, openSquares: 74, longShare: 0.1013, familiarity: 1.1013 },
        { id: 22198, date: "2024-09-11", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 66, longShare: 0.0946, familiarity: 1.2297 },
        { id: 22184, date: "2024-09-12", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 75, longShare: 0.1026, familiarity: 1.3077 },
        { id: 22185, date: "2024-09-13", rows: 15, cols: 15, words: 70, blocks: 36, openSquares: 77, longShare: 0.1429, familiarity: 1.1 },
        { id: 22183, date: "2024-09-14", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 86, longShare: 0.2273, familiarity: 1 },
        { id: 22200, date: "2024-09-15", rows: 21, cols: 21, words: 138, blocks: 76, openSquares: 105, longShare: 0.0942, familiarity: 1.1232 },
        { id: 22201, date: "2024-09-16", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 75, longShare: 0.0921, familiarity: 1.1842 },
        { id: 22211, date: "2024-09-17", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 81, longShare: 0.1081, familiarity: 0.9459 },
        { id: 22208, date: "2024-09-18", rows: 16, cols: 15, words: 79, blocks: 40, openSquares: 78, longShare: 0.1013, familiarity: 1.2152 },
        { id: 22202, date: "2024-09-19", rows: 15, cols: 16, words: 81, blocks: 38, openSquares: 76, longShare: 0.1111, familiarity: 1.0617 },
        { id: 22203, date: "2024-09-20", rows: 15, cols: 15, words: 68, blocks: 32, openSquares: 80, longShare: 0.1471, familiarity: 0.9559 },
        { id: 22209, date: "2024-09-21", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 99, longShare: 0.2286, familiarity: 0.8571 },
        { id: 22224, date: "2024-09-23", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 62, longShare: 0.1026, familiarity: 1.2821 },
        { id: 22217, date: "2024-09-24", rows: 15, cols: 15, words: 82, blocks: 38, openSquares: 66, longShare: 0.0488, familiarity: 1.3902 },
        { id: 22226, date: "2024-09-25", rows: 15, cols: 15, words: 76, blocks: 42, openSquares: 60, longShare: 0.0395, familiarity: 1.1316 },
        { id: 22225, date: "2024-09-26", rows: 15, cols: 15, words: 72, blocks: 36, openSquares: 80, longShare: 0.0556, familiarity: 1.0417 },
        { id: 22223, date: "2024-09-27", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 76, longShare: 0.2, familiarity: 0.9143 },
        { id: 22219, date: "2024-09-28", rows: 15, cols: 15, words: 66, blocks: 38, openSquares: 87, longShare: 0.2273, familiarity: 0.803 },
        { id: 22227, date: "2024-09-29", rows: 21, cols: 21, words: 136, blocks: 70, openSquares: 121, longShare: 0.1103, familiarity: 0.9485 },
        { id: 22246, date: "2024-09-30", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 53, longShare: 0.1053, familiarity: 1.2895 },
        { id: 22245, date: "2024-10-01", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 63, longShare: 0.0658, familiarity: 1.1711 },
        { id: 22243, date: "2024-10-02", rows: 16, cols: 15, words: 79, blocks: 40, openSquares: 74, longShare: 0.1392, familiarity: 1.1266 },
        { id: 22247, date: "2024-10-03", rows: 15, cols: 15, words: 78, blocks: 39, openSquares: 60, longShare: 0.0769, familiarity: 1.0128 },
        { id: 22238, date: "2024-10-04", rows: 15, cols: 15, words: 72, blocks: 32, openSquares: 75, longShare: 0.1389, familiarity: 0.9722 },
        { id: 22244, date: "2024-10-05", rows: 15, cols: 15, words: 66, blocks: 32, openSquares: 89, longShare: 0.2273, familiarity: 0.8788 },
        { id: 22105, date: "2024-10-06", rows: 21, cols: 21, words: 136, blocks: 78, openSquares: 111, longShare: 0.1397, familiarity: 1.1618 },
        { id: 22248, date: "2024-10-07", rows: 15, cols: 16, words: 81, blocks: 40, openSquares: 80, longShare: 0.0864, familiarity: 1.1605 },
        { id: 22252, date: "2024-10-08", rows: 15, cols: 16, words: 79, blocks: 38, openSquares: 78, longShare: 0.1139, familiarity: 1.1646 },
        { id: 22250, date: "2024-10-09", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 67, longShare: 0.0897, familiarity: 1.1923 },
        { id: 22249, date: "2024-10-10", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 59, longShare: 0.0769, familiarity: 1.2121 },
        { id: 22251, date: "2024-10-11", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 83, longShare: 0.2143, familiarity: 1.1429 },
        { id: 22253, date: "2024-10-12", rows: 15, cols: 15, words: 70, blocks: 27, openSquares: 90, longShare: 0.1429, familiarity: 0.8 },
        { id: 22235, date: "2024-10-13", rows: 21, cols: 21, words: 140, blocks: 74, openSquares: 113, longShare: 0.0857, familiarity: 1.0929 },
        { id: 22274, date: "2024-10-14", rows: 15, cols: 15, words: 72, blocks: 38, openSquares: 73, longShare: 0.0833, familiarity: 1.1806 },
        { id: 22284, date: "2024-10-15", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 72, longShare: 0.0946, familiarity: 1.1216 },
        { id: 22257, date: "2024-10-16", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 63, longShare: 0.0921, familiarity: 1.1579 },
        { id: 22265, date: "2024-10-17", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 87, longShare: 0.125, familiarity: 1.1389 },
        { id: 22285, date: "2024-10-18", rows: 15, cols: 15, words: 68, blocks: 30, openSquares: 96, longShare: 0.2059, familiarity: 0.8676 },
        { id: 22275, date: "2024-10-19", rows: 15, cols: 15, words: 66, blocks: 30, openSquares: 103, longShare: 0.2424, familiarity: 0.8636 },
        { id: 22254, date: "2024-10-20", rows: 21, cols: 21, words: 140, blocks: 75, openSquares: 108, longShare: 0.0857, familiarity: 1.0714 },
        { id: 22293, date: "2024-10-21", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 70, longShare: 0.1154, familiarity: 1.2179 },
        { id: 22298, date: "2024-10-22", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 66, longShare: 0.1316, familiarity: 1.1974 },
        { id: 22286, date: "2024-10-23", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 68, longShare: 0.0789, familiarity: 1.2105 },
        { id: 22276, date: "2024-10-24", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 54, longShare: 0.0641, familiarity: 1.2051 },
        { id: 22299, date: "2024-10-25", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 85, longShare: 0.1515, familiarity: 0.9091 },
        { id: 22296, date: "2024-10-26", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 91, longShare: 0.2143, familiarity: 0.9286 },
        { id: 22292, date: "2024-10-27", rows: 21, cols: 21, words: 141, blocks: 79, openSquares: 115, longShare: 0.1348, familiarity: 1.0355 },
        { id: 22332, date: "2024-10-28", rows: 15, cols: 15, words: 78, blocks: 35, openSquares: 60, longShare: 0.1282, familiarity: 1.2564 },
        { id: 22310, date: "2024-10-29", rows: 15, cols: 15, words: 76, blocks: 39, openSquares: 68, longShare: 0.0526, familiarity: 1.2237 },
        { id: 22294, date: "2024-10-30", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 59, longShare: 0.0897, familiarity: 1.1282 },
        { id: 22322, date: "2024-10-31", rows: 15, cols: 15, words: 70, blocks: 40, openSquares: 77, longShare: 0.1286, familiarity: 1.0429 },
        { id: 22323, date: "2024-11-01", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 75, longShare: 0.1389, familiarity: 1.0833 },
        { id: 22318, date: "2024-11-02", rows: 15, cols: 15, words: 66, blocks: 26, openSquares: 100, longShare: 0.2424, familiarity: 0.8636 },
        { id: 22309, date: "2024-11-03", rows: 21, cols: 21, words: 140, blocks: 80, openSquares: 120, longShare: 0.0929, familiarity: 1.0571 },
        { id: 22319, date: "2024-11-04", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 64, longShare: 0.1053, familiarity: 1.3026 },
        { id: 22287, date: "2024-11-05", rows: 15, cols: 15, words: 78, blocks: 46, openSquares: 50, longShare: 0.0897, familiarity: 1.1923 },
        { id: 22297, date: "2024-11-06", rows: 15, cols: 16, words: 81, blocks: 44, openSquares: 68, longShare: 0.0864, familiarity: 1.1481 },
        { id: 22340, date: "2024-11-07", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 66, longShare: 0.1053, familiarity: 1.1974 },
        { id: 22351, date: "2024-11-08", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 87, longShare: 0.2, familiarity: 0.9429 },
        { id: 22343, date: "2024-11-09", rows: 15, cols: 15, words: 68, blocks: 30, openSquares: 101, longShare: 0.2353, familiarity: 0.8529 },
        { id: 22329, date: "2024-11-10", rows: 21, cols: 21, words: 138, blocks: 73, openSquares: 122, longShare: 0.1159, familiarity: 0.8841 },
        { id: 22321, date: "2024-11-11", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 63, longShare: 0.1026, familiarity: 1.3077 },
        { id: 22339, date: "2024-11-12", rows: 16, cols: 15, words: 77, blocks: 46, openSquares: 64, longShare: 0.1039, familiarity: 1.0519 },
        { id: 22347, date: "2024-11-13", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 70, longShare: 0.0263, familiarity: 0.9737 },
        { id: 22288, date: "2024-11-14", rows: 15, cols: 15, words: 78, blocks: 44, openSquares: 55, longShare: 0.0769, familiarity: 1.0897 },
        { id: 22356, date: "2024-11-15", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 73, longShare: 0.1667, familiarity: 1.0694 },
        { id: 22350, date: "2024-11-16", rows: 15, cols: 15, words: 66, blocks: 32, openSquares: 75, longShare: 0.2727, familiarity: 0.8939 },
        { id: 22330, date: "2024-11-17", rows: 21, cols: 21, words: 141, blocks: 82, openSquares: 112, longShare: 0.1489, familiarity: 1.2411 },
        { id: 22345, date: "2024-11-18", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 75, longShare: 0.0789, familiarity: 1.1316 },
        { id: 22373, date: "2024-11-19", rows: 15, cols: 15, words: 74, blocks: 32, openSquares: 81, longShare: 0.0946, familiarity: 1.1351 },
        { id: 22361, date: "2024-11-20", rows: 15, cols: 15, words: 80, blocks: 36, openSquares: 68, longShare: 0.075, familiarity: 1.0875 },
        { id: 22374, date: "2024-11-21", rows: 15, cols: 16, words: 75, blocks: 32, openSquares: 86, longShare: 0.16, familiarity: 0.9333 },
        { id: 22371, date: "2024-11-22", rows: 15, cols: 15, words: 70, blocks: 36, openSquares: 80, longShare: 0.1857, familiarity: 1.0571 },
        { id: 22376, date: "2024-11-23", rows: 15, cols: 15, words: 66, blocks: 32, openSquares: 97, longShare: 0.1818, familiarity: 0.7121 },
        { id: 22352, date: "2024-11-24", rows: 21, cols: 21, words: 142, blocks: 84, openSquares: 107, longShare: 0.1127, familiarity: 1.1408 },
        { id: 22362, date: "2024-11-25", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 68, longShare: 0.0513, familiarity: 1.3718 },
        { id: 22370, date: "2024-11-26", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 67, longShare: 0.1184, familiarity: 1.25 },
        { id: 22398, date: "2024-11-27", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 73, longShare: 0.1154, familiarity: 1.2179 },
        { id: 22397, date: "2024-11-28", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 65, longShare: 0.0513, familiarity: 0.8846 },
        { id: 22378, date: "2024-11-29", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 88, longShare: 0.125, familiarity: 0.9861 },
        { id: 22379, date: "2024-11-30", rows: 15, cols: 15, words: 64, blocks: 33, openSquares: 80, longShare: 0.1563, familiarity: 0.7344 },
        { id: 22409, date: "2024-12-02", rows: 15, cols: 15, words: 74, blocks: 36, openSquares: 79, longShare: 0.0946, familiarity: 1.2297 },
        { id: 22372, date: "2024-12-03", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 66, longShare: 0.0921, familiarity: 1.0658 },
        { id: 22416, date: "2024-12-04", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 66, longShare: 0.0789, familiarity: 1.1447 },
        { id: 22405, date: "2024-12-05", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 62, longShare: 0.1282, familiarity: 1.2821 },
        { id: 22396, date: "2024-12-06", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 80, longShare: 0.1714, familiarity: 1.1571 },
        { id: 22404, date: "2024-12-07", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 101, longShare: 0.1515, familiarity: 0.8182 },
        { id: 22406, date: "2024-12-08", rows: 21, cols: 21, words: 138, blocks: 69, openSquares: 122, longShare: 0.087, familiarity: 1.0507 },
        { id: 22400, date: "2024-12-09", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 67, longShare: 0.0526, familiarity: 1.1842 },
        { id: 22402, date: "2024-12-10", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 63, longShare: 0.1447, familiarity: 1.2105 },
        { id: 22395, date: "2024-12-11", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 73, longShare: 0.0811, familiarity: 1.2297 },
        { id: 22401, date: "2024-12-12", rows: 15, cols: 14, words: 71, blocks: 38, openSquares: 58, longShare: 0.1268, familiarity: 1.3521 },
        { id: 22415, date: "2024-12-13", rows: 15, cols: 15, words: 68, blocks: 28, openSquares: 99, longShare: 0.1324, familiarity: 0.7353 },
        { id: 22417, date: "2024-12-14", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 87, longShare: 0.1912, familiarity: 0.9853 },
        { id: 22414, date: "2024-12-15", rows: 21, cols: 21, words: 140, blocks: 80, openSquares: 115, longShare: 0.1, familiarity: 0.8429 },
        { id: 22411, date: "2024-12-16", rows: 15, cols: 15, words: 74, blocks: 42, openSquares: 71, longShare: 0.0946, familiarity: 1.1486 },
        { id: 22434, date: "2024-12-17", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 65, longShare: 0.0513, familiarity: 1.1795 },
        { id: 22380, date: "2024-12-18", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 59, longShare: 0.1154, familiarity: 1.2821 },
        { id: 22440, date: "2024-12-19", rows: 15, cols: 15, words: 70, blocks: 40, openSquares: 61, longShare: 0.0857, familiarity: 1.1406 },
        { id: 22441, date: "2024-12-20", rows: 15, cols: 15, words: 70, blocks: 40, openSquares: 69, longShare: 0.1429, familiarity: 1.2571 },
        { id: 22432, date: "2024-12-21", rows: 15, cols: 15, words: 70, blocks: 26, openSquares: 96, longShare: 0.2286, familiarity: 0.8714 },
        { id: 22433, date: "2024-12-22", rows: 21, cols: 21, words: 124, blocks: 71, openSquares: 162, longShare: 0.1774, familiarity: 0.8387 },
        { id: 22431, date: "2024-12-23", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 67, longShare: 0.0946, familiarity: 1.2568 },
        { id: 22435, date: "2024-12-24", rows: 15, cols: 15, words: 80, blocks: 40, openSquares: 52, longShare: 0.0875, familiarity: 1.3125 },
        { id: 22443, date: "2024-12-25", rows: 14, cols: 15, words: 69, blocks: 36, openSquares: 76, longShare: 0.0435, familiarity: 1.1014 },
        { id: 22456, date: "2024-12-26", rows: 15, cols: 15, words: 76, blocks: 41, openSquares: 62, longShare: 0.1316, familiarity: 1.1184 },
        { id: 22457, date: "2024-12-27", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 85, longShare: 0.1806, familiarity: 1.0417 },
        { id: 22455, date: "2024-12-28", rows: 15, cols: 15, words: 66, blocks: 43, openSquares: 70, longShare: 0.1515, familiarity: 1.1061 },
        { id: 22460, date: "2024-12-29", rows: 21, cols: 21, words: 136, blocks: 83, openSquares: 136, longShare: 0.1176, familiarity: 1.1261 },
        { id: 22289, date: "2024-12-30", rows: 15, cols: 15, words: 78, blocks: 34, openSquares: 68, longShare: 0.0769, familiarity: 1.2564 },
        { id: 22290, date: "2024-12-31", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 75, longShare: 0.1053, familiarity: 1.0921 },
        { id: 22295, date: "2025-01-02", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 67, longShare: 0.0946, familiarity: 1.1034 },
        { id: 22324, date: "2025-01-03", rows: 15, cols: 15, words: 72, blocks: 32, openSquares: 81, longShare: 0.1667, familiarity: 1.0139 },
        { id: 22333, date: "2025-01-04", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 91, longShare: 0.2059, familiarity: 0.75 },
        { id: 22484, date: "2025-01-05", rows: 21, cols: 21, words: 140, blocks: 78, openSquares: 128, longShare: 0.0786, familiarity: 1.05 },
        { id: 22317, date: "2025-01-06", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 70, longShare: 0.0789, familiarity: 1.2237 },
        { id: 22315, date: "2025-01-07", rows: 15, cols: 15, words: 74, blocks: 32, openSquares: 76, longShare: 0.1351, familiarity: 1.1081 },
        { id: 22316, date: "2025-01-08", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 79, longShare: 0.1081, familiarity: 1.027 },
        { id: 22320, date: "2025-01-09", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 73, longShare: 0.1053, familiarity: 0.8947 },
        { id: 22341, date: "2025-01-10", rows: 15, cols: 15, words: 64, blocks: 39, openSquares: 82, longShare: 0.125, familiarity: 0.75 },
        { id: 22334, date: "2025-01-11", rows: 15, cols: 15, words: 62, blocks: 34, openSquares: 109, longShare: 0.2581, familiarity: 0.6452 },
        { id: 22494, date: "2025-01-12", rows: 21, cols: 21, words: 138, blocks: 84, openSquares: 105, longShare: 0.0942, familiarity: 1.1232 },
        { id: 22336, date: "2025-01-13", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 75, longShare: 0.1184, familiarity: 1.2895 },
        { id: 22337, date: "2025-01-14", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 69, longShare: 0.1184, familiarity: 1.25 },
        { id: 22338, date: "2025-01-15", rows: 15, cols: 15, words: 78, blocks: 33, openSquares: 70, longShare: 0.1026, familiarity: 1.1795 },
        { id: 22377, date: "2025-01-16", rows: 15, cols: 14, words: 69, blocks: 34, openSquares: 72, longShare: 0.1304, familiarity: 1.087 },
        { id: 22399, date: "2025-01-17", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 73, longShare: 0.1389, familiarity: 1.1667 },
        { id: 22407, date: "2025-01-18", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 101, longShare: 0.125, familiarity: 1.1806 },
        { id: 22510, date: "2025-01-19", rows: 21, cols: 21, words: 140, blocks: 76, openSquares: 110, longShare: 0.1143, familiarity: 1.0214 },
        { id: 22382, date: "2025-01-20", rows: 15, cols: 15, words: 76, blocks: 42, openSquares: 68, longShare: 0.1184, familiarity: 1.2368 },
        { id: 22383, date: "2025-01-21", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 62, longShare: 0.0897, familiarity: 1.2179 },
        { id: 22384, date: "2025-01-22", rows: 15, cols: 15, words: 74, blocks: 35, openSquares: 74, longShare: 0.0811, familiarity: 1.027 },
        { id: 22493, date: "2025-01-23", rows: 15, cols: 15, words: 72, blocks: 38, openSquares: 74, longShare: 0.0972, familiarity: 1.0694 },
        { id: 22413, date: "2025-01-24", rows: 15, cols: 15, words: 68, blocks: 32, openSquares: 89, longShare: 0.1765, familiarity: 0.9853 },
        { id: 22459, date: "2025-01-25", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 102, longShare: 0.2286, familiarity: 1.0143 },
        { id: 22509, date: "2025-01-26", rows: 21, cols: 21, words: 140, blocks: 82, openSquares: 116, longShare: 0.1357, familiarity: 1.0786 },
        { id: 22392, date: "2025-01-27", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 63, longShare: 0.1447, familiarity: 1.3158 },
        { id: 22393, date: "2025-01-28", rows: 15, cols: 15, words: 78, blocks: 42, openSquares: 54, longShare: 0.0513, familiarity: 1.359 },
        { id: 22394, date: "2025-01-29", rows: 16, cols: 15, words: 79, blocks: 38, openSquares: 70, longShare: 0.1392, familiarity: 1.0886 },
        { id: 22458, date: "2025-01-30", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 68, longShare: 0.1053, familiarity: 1.1711 },
        { id: 22492, date: "2025-01-31", rows: 15, cols: 15, words: 68, blocks: 32, openSquares: 95, longShare: 0.2059, familiarity: 0.9265 },
        { id: 22537, date: "2025-02-01", rows: 15, cols: 15, words: 68, blocks: 29, openSquares: 102, longShare: 0.2353, familiarity: 0.8971 },
        { id: 22528, date: "2025-02-02", rows: 21, cols: 21, words: 140, blocks: 77, openSquares: 126, longShare: 0.1143, familiarity: 0.913 },
        { id: 22426, date: "2025-02-03", rows: 15, cols: 15, words: 72, blocks: 36, openSquares: 86, longShare: 0.0972, familiarity: 1 },
        { id: 22427, date: "2025-02-04", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 74, longShare: 0.0676, familiarity: 1.2162 },
        { id: 22470, date: "2025-02-05", rows: 15, cols: 15, words: 72, blocks: 40, openSquares: 73, longShare: 0.1389, familiarity: 1.125 },
        { id: 22521, date: "2025-02-06", rows: 15, cols: 16, words: 78, blocks: 40, openSquares: 80, longShare: 0.1026, familiarity: 1.1154 },
        { id: 22520, date: "2025-02-07", rows: 15, cols: 15, words: 68, blocks: 37, openSquares: 76, longShare: 0.1765, familiarity: 0.9853 },
        { id: 22518, date: "2025-02-08", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 79, longShare: 0.2, familiarity: 1.1 },
        { id: 22556, date: "2025-02-09", rows: 21, cols: 21, words: 140, blocks: 76, openSquares: 107, longShare: 0.1214, familiarity: 1.2214 },
        { id: 22560, date: "2025-02-10", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 71, longShare: 0.0921, familiarity: 1.2368 },
        { id: 22430, date: "2025-02-11", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 70, longShare: 0.0789, familiarity: 1.1711 },
        { id: 22412, date: "2025-02-12", rows: 16, cols: 15, words: 77, blocks: 40, openSquares: 77, longShare: 0.1039, familiarity: 1.1039 },
        { id: 22554, date: "2025-02-13", rows: 15, cols: 15, words: 78, blocks: 34, openSquares: 67, longShare: 0.0769, familiarity: 1.0641 },
        { id: 22553, date: "2025-02-14", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 77, longShare: 0.1857, familiarity: 0.9571 },
        { id: 22551, date: "2025-02-15", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 93, longShare: 0.1515, familiarity: 0.8333 },
        { id: 22550, date: "2025-02-16", rows: 21, cols: 21, words: 138, blocks: 71, openSquares: 114, longShare: 0.1304, familiarity: 1.0145 },
        { id: 22429, date: "2025-02-17", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 60, longShare: 0.0897, familiarity: 1.2308 },
        { id: 22471, date: "2025-02-18", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 67, longShare: 0.1282, familiarity: 1.2692 },
        { id: 22472, date: "2025-02-19", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 68, longShare: 0.1216, familiarity: 1.2027 },
        { id: 22562, date: "2025-02-20", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 73, longShare: 0.1447, familiarity: 1.2237 },
        { id: 22564, date: "2025-02-21", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 99, longShare: 0.2286, familiarity: 1 },
        { id: 22555, date: "2025-02-22", rows: 15, cols: 15, words: 68, blocks: 36, openSquares: 77, longShare: 0.2353, familiarity: 1.0294 },
        { id: 22565, date: "2025-02-23", rows: 21, cols: 21, words: 140, blocks: 70, openSquares: 129, longShare: 0.1429, familiarity: 1.1143 },
        { id: 22473, date: "2025-02-24", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 70, longShare: 0.0789, familiarity: 1.2368 },
        { id: 22474, date: "2025-02-25", rows: 15, cols: 15, words: 78, blocks: 42, openSquares: 62, longShare: 0.0513, familiarity: 1.1795 },
        { id: 22475, date: "2025-02-26", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 66, longShare: 0.0789, familiarity: 1.2895 },
        { id: 22461, date: "2025-02-27", rows: 15, cols: 15, words: 76, blocks: 46, openSquares: 61, longShare: 0.0789, familiarity: 1.1974 },
        { id: 22566, date: "2025-02-28", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 102, longShare: 0.2286, familiarity: 0.9714 },
        { id: 22586, date: "2025-03-01", rows: 15, cols: 15, words: 68, blocks: 38, openSquares: 93, longShare: 0.1912, familiarity: 0.9853 },
        { id: 22569, date: "2025-03-02", rows: 21, cols: 22, words: 145, blocks: 90, openSquares: 128, longShare: 0.0966, familiarity: 1.0759 },
        { id: 22607, date: "2025-03-03", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 66, longShare: 0.0921, familiarity: 1.2763 },
        { id: 22588, date: "2025-03-04", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 70, longShare: 0.0921, familiarity: 1.1579 },
        { id: 22587, date: "2025-03-05", rows: 16, cols: 15, words: 81, blocks: 43, openSquares: 78, longShare: 0.0988, familiarity: 1.284 },
        { id: 22577, date: "2025-03-07", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 79, longShare: 0.2083, familiarity: 0.9444 },
        { id: 22578, date: "2025-03-08", rows: 15, cols: 15, words: 66, blocks: 28, openSquares: 117, longShare: 0.303, familiarity: 0.9242 },
        { id: 22590, date: "2025-03-09", rows: 21, cols: 21, words: 140, blocks: 70, openSquares: 121, longShare: 0.1429, familiarity: 1.1 },
        { id: 22591, date: "2025-03-10", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 69, longShare: 0.0789, familiarity: 1.0526 },
        { id: 22589, date: "2025-03-11", rows: 15, cols: 15, words: 74, blocks: 33, openSquares: 72, longShare: 0.1081, familiarity: 1.1892 },
        { id: 22592, date: "2025-03-12", rows: 15, cols: 15, words: 78, blocks: 39, openSquares: 69, longShare: 0.0128, familiarity: 1.1923 },
        { id: 22604, date: "2025-03-13", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 68, longShare: 0.1026, familiarity: 1.1667 },
        { id: 22593, date: "2025-03-14", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 78, longShare: 0.2059, familiarity: 0.9265 },
        { id: 22605, date: "2025-03-15", rows: 15, cols: 15, words: 66, blocks: 31, openSquares: 90, longShare: 0.2121, familiarity: 0.803 },
        { id: 22603, date: "2025-03-16", rows: 21, cols: 21, words: 140, blocks: 80, openSquares: 133, longShare: 0.1286, familiarity: 0.9429 },
        { id: 22653, date: "2025-03-17", rows: 15, cols: 15, words: 78, blocks: 39, openSquares: 74, longShare: 0.0769, familiarity: 1.1795 },
        { id: 22606, date: "2025-03-18", rows: 15, cols: 16, words: 79, blocks: 42, openSquares: 58, longShare: 0.0886, familiarity: 1.1392 },
        { id: 22627, date: "2025-03-19", rows: 15, cols: 15, words: 76, blocks: 39, openSquares: 67, longShare: 0.0526, familiarity: 1.2105 },
        { id: 22625, date: "2025-03-20", rows: 15, cols: 15, words: 74, blocks: 42, openSquares: 67, longShare: 0.0811, familiarity: 1.1515 },
        { id: 22622, date: "2025-03-21", rows: 15, cols: 15, words: 68, blocks: 32, openSquares: 82, longShare: 0.1471, familiarity: 0.9853 },
        { id: 22654, date: "2025-03-22", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 73, longShare: 0.1714, familiarity: 1.0857 },
        { id: 22636, date: "2025-03-23", rows: 21, cols: 21, words: 140, blocks: 74, openSquares: 105, longShare: 0.0786, familiarity: 1.1286 },
        { id: 22568, date: "2025-03-24", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 65, longShare: 0.0789, familiarity: 1.1974 },
        { id: 22672, date: "2025-03-25", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 70, longShare: 0.0789, familiarity: 1.1184 },
        { id: 22673, date: "2025-03-26", rows: 15, cols: 16, words: 85, blocks: 42, openSquares: 66, longShare: 0.0588, familiarity: 1.0588 },
        { id: 22646, date: "2025-03-27", rows: 16, cols: 14, words: 76, blocks: 38, openSquares: 76, longShare: 0.0526, familiarity: 1.1316 },
        { id: 22624, date: "2025-03-28", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 87, longShare: 0.2222, familiarity: 0.9028 },
        { id: 22674, date: "2025-03-29", rows: 15, cols: 15, words: 68, blocks: 28, openSquares: 99, longShare: 0.2353, familiarity: 0.9118 },
        { id: 22652, date: "2025-03-30", rows: 21, cols: 21, words: 134, blocks: 80, openSquares: 119, longShare: 0.097, familiarity: 1.0746 },
        { id: 22675, date: "2025-03-31", rows: 15, cols: 14, words: 73, blocks: 36, openSquares: 60, longShare: 0.1233, familiarity: 1.1644 },
        { id: 22676, date: "2025-04-01", rows: 15, cols: 16, words: 79, blocks: 40, openSquares: 64, longShare: 0.0759, familiarity: 1.1519 },
        { id: 22677, date: "2025-04-02", rows: 15, cols: 15, words: 74, blocks: 42, openSquares: 71, longShare: 0.0811, familiarity: 1.0676 },
        { id: 22664, date: "2025-04-03", rows: 15, cols: 15, words: 76, blocks: 42, openSquares: 62, longShare: 0.0263, familiarity: 1.1212 },
        { id: 22651, date: "2025-04-04", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 82, longShare: 0.1429, familiarity: 1.1286 },
        { id: 22663, date: "2025-04-05", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 87, longShare: 0.2571, familiarity: 0.9714 },
        { id: 22688, date: "2025-04-07", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 68, longShare: 0.0789, familiarity: 1.3289 },
        { id: 22689, date: "2025-04-08", rows: 15, cols: 15, words: 74, blocks: 36, openSquares: 75, longShare: 0.0811, familiarity: 1.1216 },
        { id: 22671, date: "2025-04-09", rows: 15, cols: 16, words: 81, blocks: 36, openSquares: 70, longShare: 0.1111, familiarity: 1.1111 },
        { id: 22670, date: "2025-04-10", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 73, longShare: 0.0676, familiarity: 1.1757 },
        { id: 22691, date: "2025-04-11", rows: 15, cols: 15, words: 68, blocks: 30, openSquares: 93, longShare: 0.2059, familiarity: 0.7794 },
        { id: 22695, date: "2025-04-12", rows: 15, cols: 15, words: 68, blocks: 33, openSquares: 82, longShare: 0.2353, familiarity: 0.9559 },
        { id: 22679, date: "2025-04-13", rows: 21, cols: 22, words: 137, blocks: 76, openSquares: 136, longShare: 0.1241, familiarity: 0.8759 },
        { id: 22696, date: "2025-04-14", rows: 15, cols: 15, words: 76, blocks: 42, openSquares: 66, longShare: 0.1053, familiarity: 1.1842 },
        { id: 22678, date: "2025-04-15", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 69, longShare: 0.0921, familiarity: 1.1184 },
        { id: 22687, date: "2025-04-16", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 66, longShare: 0.0789, familiarity: 1.0395 },
        { id: 22697, date: "2025-04-17", rows: 15, cols: 15, words: 72, blocks: 37, openSquares: 78, longShare: 0.0972, familiarity: 0.8611 },
        { id: 22681, date: "2025-04-18", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 85, longShare: 0.2083, familiarity: 1.2639 },
        { id: 22698, date: "2025-04-19", rows: 15, cols: 15, words: 70, blocks: 31, openSquares: 68, longShare: 0.1714, familiarity: 0.9857 },
        { id: 22692, date: "2025-04-20", rows: 21, cols: 22, words: 145, blocks: 70, openSquares: 112, longShare: 0.0966, familiarity: 1.0897 },
        { id: 22726, date: "2025-04-21", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 80, longShare: 0.0526, familiarity: 1.1447 },
        { id: 22700, date: "2025-04-22", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 64, longShare: 0.0789, familiarity: 1.1184 },
        { id: 22727, date: "2025-04-23", rows: 15, cols: 16, words: 77, blocks: 40, openSquares: 82, longShare: 0.1169, familiarity: 1.0519 },
        { id: 22725, date: "2025-04-24", rows: 15, cols: 15, words: 78, blocks: 42, openSquares: 69, longShare: 0.0769, familiarity: 1.0385 },
        { id: 22733, date: "2025-04-25", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 86, longShare: 0.25, familiarity: 1.0294 },
        { id: 22711, date: "2025-04-26", rows: 15, cols: 15, words: 68, blocks: 32, openSquares: 96, longShare: 0.2206, familiarity: 0.8676 },
        { id: 22704, date: "2025-04-27", rows: 21, cols: 21, words: 140, blocks: 80, openSquares: 117, longShare: 0.1714, familiarity: 1.0571 },
        { id: 22699, date: "2025-04-28", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 64, longShare: 0.0641, familiarity: 1.2179 },
        { id: 22709, date: "2025-04-29", rows: 15, cols: 16, words: 79, blocks: 44, openSquares: 70, longShare: 0.1013, familiarity: 1.1013 },
        { id: 22748, date: "2025-04-30", rows: 15, cols: 15, words: 74, blocks: 43, openSquares: 58, longShare: 0.1216, familiarity: 1.1757 },
        { id: 22764, date: "2025-05-01", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 70, longShare: 0.0946, familiarity: 1.0811 },
        { id: 22750, date: "2025-05-02", rows: 15, cols: 15, words: 72, blocks: 32, openSquares: 77, longShare: 0.1667, familiarity: 1.0972 },
        { id: 22724, date: "2025-05-03", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 103, longShare: 0.2286, familiarity: 0.9286 },
        { id: 22768, date: "2025-05-04", rows: 21, cols: 21, words: 140, blocks: 76, openSquares: 109, longShare: 0.15, familiarity: 0.9429 },
        { id: 22758, date: "2025-05-05", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 64, longShare: 0.1351, familiarity: 1.2297 },
        { id: 22763, date: "2025-05-06", rows: 15, cols: 16, words: 80, blocks: 38, openSquares: 76, longShare: 0.1, familiarity: 1.1625 },
        { id: 22761, date: "2025-05-07", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 64, longShare: 0.1184, familiarity: 1.2368 },
        { id: 22742, date: "2025-05-08", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 66, longShare: 0.0769, familiarity: 1.1026 },
        { id: 22743, date: "2025-05-09", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 89, longShare: 0.2222, familiarity: 1.0139 },
        { id: 22762, date: "2025-05-10", rows: 15, cols: 15, words: 60, blocks: 38, openSquares: 101, longShare: 0.2333, familiarity: 0.75 },
        { id: 22746, date: "2025-05-11", rows: 21, cols: 21, words: 128, blocks: 54, openSquares: 179, longShare: 0.2656, familiarity: 0.7813 },
        { id: 22795, date: "2025-05-12", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 71, longShare: 0.0769, familiarity: 1.3333 },
        { id: 22747, date: "2025-05-13", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 65, longShare: 0.0658, familiarity: 1.2763 },
        { id: 22796, date: "2025-05-14", rows: 15, cols: 16, words: 79, blocks: 40, openSquares: 64, longShare: 0.1392, familiarity: 1.1646 },
        { id: 22749, date: "2025-05-15", rows: 15, cols: 15, words: 78, blocks: 34, openSquares: 67, longShare: 0.0897, familiarity: 1.141 },
        { id: 22756, date: "2025-05-16", rows: 15, cols: 15, words: 72, blocks: 32, openSquares: 88, longShare: 0.1806, familiarity: 0.9583 },
        { id: 22760, date: "2025-05-17", rows: 15, cols: 15, words: 72, blocks: 29, openSquares: 73, longShare: 0.1944, familiarity: 1.0833 },
        { id: 22757, date: "2025-05-18", rows: 21, cols: 21, words: 138, blocks: 74, openSquares: 123, longShare: 0.1377, familiarity: 1.0217 },
        { id: 22797, date: "2025-05-19", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 62, longShare: 0.1026, familiarity: 1.2436 },
        { id: 22745, date: "2025-05-20", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 73, longShare: 0.1053, familiarity: 1.25 },
        { id: 22789, date: "2025-05-21", rows: 15, cols: 15, words: 74, blocks: 36, openSquares: 74, longShare: 0.1216, familiarity: 1.027 },
        { id: 22798, date: "2025-05-22", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 75, longShare: 0.0658, familiarity: 1.0395 },
        { id: 22774, date: "2025-05-23", rows: 15, cols: 15, words: 72, blocks: 32, openSquares: 83, longShare: 0.1667, familiarity: 0.9722 },
        { id: 22744, date: "2025-05-24", rows: 15, cols: 16, words: 75, blocks: 30, openSquares: 92, longShare: 0.1867, familiarity: 0.92 },
        { id: 22781, date: "2025-05-25", rows: 21, cols: 21, words: 140, blocks: 74, openSquares: 119, longShare: 0.1357, familiarity: 0.9786 },
        { id: 22775, date: "2025-05-26", rows: 15, cols: 15, words: 76, blocks: 42, openSquares: 60, longShare: 0.1053, familiarity: 1.2763 },
        { id: 22819, date: "2025-05-27", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 66, longShare: 0.1026, familiarity: 1.2179 },
        { id: 22809, date: "2025-05-28", rows: 15, cols: 15, words: 75, blocks: 44, openSquares: 73, longShare: 0.0267, familiarity: 1.0267 },
        { id: 22820, date: "2025-05-29", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 67, longShare: 0.0385, familiarity: 1.0897 },
        { id: 22810, date: "2025-05-30", rows: 15, cols: 15, words: 72, blocks: 32, openSquares: 76, longShare: 0.1806, familiarity: 1.1389 },
        { id: 22815, date: "2025-05-31", rows: 15, cols: 15, words: 72, blocks: 31, openSquares: 96, longShare: 0.2222, familiarity: 1.1389 },
        { id: 22732, date: "2025-06-01", rows: 21, cols: 21, words: 140, blocks: 71, openSquares: 104, longShare: 0.1143, familiarity: 1.1143 },
        { id: 22813, date: "2025-06-02", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 65, longShare: 0.0769, familiarity: 1.359 },
        { id: 22834, date: "2025-06-03", rows: 15, cols: 15, words: 74, blocks: 36, openSquares: 75, longShare: 0.1081, familiarity: 1.1622 },
        { id: 22814, date: "2025-06-04", rows: 15, cols: 16, words: 77, blocks: 36, openSquares: 78, longShare: 0.1039, familiarity: 1.1558 },
        { id: 22835, date: "2025-06-05", rows: 15, cols: 15, words: 82, blocks: 44, openSquares: 65, longShare: 0.0366, familiarity: 1.3415 },
        { id: 22836, date: "2025-06-06", rows: 15, cols: 15, words: 66, blocks: 32, openSquares: 94, longShare: 0.2424, familiarity: 0.9394 },
        { id: 22837, date: "2025-06-07", rows: 15, cols: 15, words: 68, blocks: 25, openSquares: 92, longShare: 0.1176, familiarity: 1 },
        { id: 22808, date: "2025-06-08", rows: 21, cols: 21, words: 140, blocks: 82, openSquares: 111, longShare: 0.0857, familiarity: 0.8929 },
        { id: 22881, date: "2025-06-09", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 65, longShare: 0.1053, familiarity: 1.3816 },
        { id: 22859, date: "2025-06-10", rows: 15, cols: 16, words: 77, blocks: 36, openSquares: 80, longShare: 0.1429, familiarity: 1.013 },
        { id: 22845, date: "2025-06-11", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 58, longShare: 0.1216, familiarity: 1.2432 },
        { id: 22852, date: "2025-06-12", rows: 15, cols: 15, words: 75, blocks: 42, openSquares: 71, longShare: 0.1333, familiarity: 1.1333 },
        { id: 22860, date: "2025-06-13", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 85, longShare: 0.2143, familiarity: 1.0571 },
        { id: 22861, date: "2025-06-14", rows: 15, cols: 16, words: 71, blocks: 34, openSquares: 94, longShare: 0.2394, familiarity: 0.9014 },
        { id: 22816, date: "2025-06-15", rows: 21, cols: 21, words: 140, blocks: 74, openSquares: 122, longShare: 0.0786, familiarity: 1.0357 },
        { id: 22886, date: "2025-06-16", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 58, longShare: 0.0897, familiarity: 1.2692 },
        { id: 22882, date: "2025-06-17", rows: 15, cols: 15, words: 73, blocks: 37, openSquares: 66, longShare: 0.1096, familiarity: 1.2055 },
        { id: 22880, date: "2025-06-18", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 67, longShare: 0.0676, familiarity: 0.9054 },
        { id: 22883, date: "2025-06-19", rows: 15, cols: 15, words: 74, blocks: 39, openSquares: 64, longShare: 0.0811, familiarity: 1.1081 },
        { id: 22853, date: "2025-06-20", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 95, longShare: 0.1714, familiarity: 1.0286 },
        { id: 22884, date: "2025-06-21", rows: 16, cols: 14, words: 68, blocks: 28, openSquares: 94, longShare: 0.1176, familiarity: 0.8529 },
        { id: 22892, date: "2025-06-22", rows: 21, cols: 21, words: 140, blocks: 68, openSquares: 120, longShare: 0.1071, familiarity: 0.9643 },
        { id: 22895, date: "2025-06-23", rows: 15, cols: 15, words: 76, blocks: 42, openSquares: 57, longShare: 0.0789, familiarity: 1.25 },
        { id: 22849, date: "2025-06-24", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 67, longShare: 0.1026, familiarity: 1.1538 },
        { id: 22896, date: "2025-06-25", rows: 15, cols: 15, words: 72, blocks: 36, openSquares: 76, longShare: 0.1528, familiarity: 1.0139 },
        { id: 22894, date: "2025-06-26", rows: 15, cols: 15, words: 72, blocks: 38, openSquares: 62, longShare: 0.1806, familiarity: 1.2083 },
        { id: 22893, date: "2025-06-27", rows: 15, cols: 15, words: 68, blocks: 38, openSquares: 83, longShare: 0.2206, familiarity: 1.1029 },
        { id: 22887, date: "2025-06-28", rows: 15, cols: 15, words: 66, blocks: 32, openSquares: 97, longShare: 0.1818, familiarity: 0.803 },
        { id: 22840, date: "2025-06-29", rows: 21, cols: 21, words: 140, blocks: 80, openSquares: 114, longShare: 0.0786, familiarity: 1.1857 },
        { id: 22914, date: "2025-06-30", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 64, longShare: 0.1154, familiarity: 1.3333 },
        { id: 22913, date: "2025-07-01", rows: 15, cols: 15, words: 74, blocks: 44, openSquares: 63, longShare: 0.0811, familiarity: 1.2162 },
        { id: 22911, date: "2025-07-02", rows: 15, cols: 15, words: 78, blocks: 39, openSquares: 70, longShare: 0.0769, familiarity: 1.2051 },
        { id: 22909, date: "2025-07-03", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 75, longShare: 0.0676, familiarity: 1.0135 },
        { id: 22912, date: "2025-07-04", rows: 15, cols: 15, words: 72, blocks: 32, openSquares: 79, longShare: 0.1944, familiarity: 1.0278 },
        { id: 22910, date: "2025-07-05", rows: 15, cols: 15, words: 68, blocks: 32, openSquares: 89, longShare: 0.1765, familiarity: 0.8676 },
        { id: 22924, date: "2025-07-07", rows: 15, cols: 15, words: 76, blocks: 35, openSquares: 70, longShare: 0.1053, familiarity: 1.0921 },
        { id: 22925, date: "2025-07-08", rows: 15, cols: 15, words: 72, blocks: 36, openSquares: 73, longShare: 0.0833, familiarity: 1.1528 },
        { id: 22928, date: "2025-07-09", rows: 15, cols: 15, words: 80, blocks: 38, openSquares: 66, longShare: 0.05, familiarity: 1.175 },
        { id: 22945, date: "2025-07-10", rows: 16, cols: 14, words: 74, blocks: 36, openSquares: 70, longShare: 0.1081, familiarity: 1.1622 },
        { id: 22929, date: "2025-07-11", rows: 15, cols: 15, words: 70, blocks: 36, openSquares: 75, longShare: 0.2143, familiarity: 1.1143 },
        { id: 22931, date: "2025-07-12", rows: 15, cols: 15, words: 72, blocks: 29, openSquares: 96, longShare: 0.1667, familiarity: 1.0417 },
        { id: 22946, date: "2025-07-14", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 66, longShare: 0.0769, familiarity: 1.141 },
        { id: 22952, date: "2025-07-15", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 64, longShare: 0.0769, familiarity: 1.2051 },
        { id: 22926, date: "2025-07-16", rows: 15, cols: 15, words: 70, blocks: 38, openSquares: 80, longShare: 0.1429, familiarity: 1.0286 },
        { id: 22947, date: "2025-07-17", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 69, longShare: 0.0641, familiarity: 1.2564 },
        { id: 22954, date: "2025-07-18", rows: 15, cols: 15, words: 66, blocks: 33, openSquares: 76, longShare: 0.1515, familiarity: 0.9697 },
        { id: 22923, date: "2025-07-19", rows: 16, cols: 15, words: 69, blocks: 36, openSquares: 102, longShare: 0.2319, familiarity: 1.087 },
        { id: 22927, date: "2025-07-20", rows: 21, cols: 21, words: 140, blocks: 73, openSquares: 128, longShare: 0.1, familiarity: 1.0286 },
        { id: 22984, date: "2025-07-21", rows: 15, cols: 15, words: 76, blocks: 42, openSquares: 63, longShare: 0.0658, familiarity: 1.2632 },
        { id: 22985, date: "2025-07-22", rows: 15, cols: 15, words: 76, blocks: 44, openSquares: 65, longShare: 0.0526, familiarity: 1.1579 },
        { id: 22951, date: "2025-07-23", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 65, longShare: 0.0897, familiarity: 1.3205 },
        { id: 22949, date: "2025-07-24", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 66, longShare: 0.1026, familiarity: 1.2436 },
        { id: 22953, date: "2025-07-25", rows: 15, cols: 15, words: 66, blocks: 40, openSquares: 85, longShare: 0.303, familiarity: 1.0758 },
        { id: 22965, date: "2025-07-26", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 73, longShare: 0.1714, familiarity: 0.9286 },
        { id: 22986, date: "2025-07-27", rows: 21, cols: 22, words: 141, blocks: 72, openSquares: 140, longShare: 0.1206, familiarity: 1.0355 },
        { id: 23001, date: "2025-07-28", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 54, longShare: 0.1154, familiarity: 1.3077 },
        { id: 22983, date: "2025-07-29", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 74, longShare: 0.1026, familiarity: 1.1282 },
        { id: 22990, date: "2025-07-31", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 69, longShare: 0.0256, familiarity: 1.1282 },
        { id: 22967, date: "2025-08-01", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 87, longShare: 0.2, familiarity: 1.0286 },
        { id: 23003, date: "2025-08-02", rows: 15, cols: 15, words: 68, blocks: 23, openSquares: 110, longShare: 0.2059, familiarity: 0.7941 },
        { id: 22970, date: "2025-08-03", rows: 21, cols: 21, words: 140, blocks: 82, openSquares: 105, longShare: 0.0929, familiarity: 1.0286 },
        { id: 23002, date: "2025-08-04", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 68, longShare: 0.0897, familiarity: 1.2564 },
        { id: 23023, date: "2025-08-05", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 76, longShare: 0.1053, familiarity: 1.1579 },
        { id: 23024, date: "2025-08-06", rows: 14, cols: 15, words: 73, blocks: 34, openSquares: 70, longShare: 0.0959, familiarity: 1.2603 },
        { id: 23e3, date: "2025-08-07", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 75, longShare: 0.1216, familiarity: 1.0811 },
        { id: 23015, date: "2025-08-08", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 83, longShare: 0.2714, familiarity: 0.9714 },
        { id: 23013, date: "2025-08-09", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 93, longShare: 0.1515, familiarity: 0.7879 },
        { id: 23006, date: "2025-08-10", rows: 21, cols: 21, words: 140, blocks: 80, openSquares: 99, longShare: 0.1357, familiarity: 0.95 },
        { id: 23025, date: "2025-08-11", rows: 15, cols: 15, words: 78, blocks: 39, openSquares: 60, longShare: 0.1282, familiarity: 1.3718 },
        { id: 23036, date: "2025-08-12", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 75, longShare: 0.1216, familiarity: 1.1486 },
        { id: 23037, date: "2025-08-13", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 69, longShare: 0.0789, familiarity: 1.1711 },
        { id: 23038, date: "2025-08-14", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 62, longShare: 0.1026, familiarity: 1.0769 },
        { id: 23039, date: "2025-08-15", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 74, longShare: 0.0857, familiarity: 1.0571 },
        { id: 23040, date: "2025-08-16", rows: 15, cols: 15, words: 64, blocks: 24, openSquares: 113, longShare: 0.3438, familiarity: 0.5781 },
        { id: 23026, date: "2025-08-17", rows: 21, cols: 21, words: 132, blocks: 76, openSquares: 131, longShare: 0.1212, familiarity: 0.8636 },
        { id: 23027, date: "2025-08-18", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 67, longShare: 0.0897, familiarity: 1.2179 },
        { id: 23022, date: "2025-08-19", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 59, longShare: 0.0921, familiarity: 1.3026 },
        { id: 23031, date: "2025-08-20", rows: 15, cols: 15, words: 78, blocks: 42, openSquares: 55, longShare: 0.1282, familiarity: 1.1282 },
        { id: 23033, date: "2025-08-21", rows: 15, cols: 16, words: 81, blocks: 38, openSquares: 72, longShare: 0.0617, familiarity: 1.0494 },
        { id: 23056, date: "2025-08-22", rows: 15, cols: 15, words: 68, blocks: 26, openSquares: 90, longShare: 0.1618, familiarity: 1.1324 },
        { id: 23057, date: "2025-08-23", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 69, longShare: 0.2083, familiarity: 1.0833 },
        { id: 23028, date: "2025-08-24", rows: 21, cols: 21, words: 140, blocks: 71, openSquares: 120, longShare: 0.1429, familiarity: 1.0643 },
        { id: 23030, date: "2025-08-25", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 73, longShare: 0.0769, familiarity: 1.2436 },
        { id: 23055, date: "2025-08-26", rows: 15, cols: 15, words: 76, blocks: 41, openSquares: 70, longShare: 0.0921, familiarity: 1.2368 },
        { id: 23032, date: "2025-08-27", rows: 16, cols: 14, words: 78, blocks: 42, openSquares: 66, longShare: 0.0513, familiarity: 1.2714 },
        { id: 23059, date: "2025-08-28", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 63, longShare: 0.1154, familiarity: 1.1795 },
        { id: 22850, date: "2025-08-29", rows: 15, cols: 15, words: 72, blocks: 36, openSquares: 62, longShare: 0.1944, familiarity: 1.0833 },
        { id: 23060, date: "2025-08-30", rows: 15, cols: 15, words: 70, blocks: 36, openSquares: 75, longShare: 0.2143, familiarity: 1.1286 },
        { id: 23034, date: "2025-08-31", rows: 21, cols: 21, words: 140, blocks: 76, openSquares: 114, longShare: 0.1429, familiarity: 1.1 },
        { id: 23029, date: "2025-09-01", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 74, longShare: 0.0641, familiarity: 1.3333 },
        { id: 23063, date: "2025-09-02", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 62, longShare: 0.0769, familiarity: 1.3077 },
        { id: 23064, date: "2025-09-03", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 71, longShare: 0.0769, familiarity: 1.1667 },
        { id: 23062, date: "2025-09-04", rows: 15, cols: 15, words: 78, blocks: 39, openSquares: 64, longShare: 0.0769, familiarity: 1.2436 },
        { id: 23042, date: "2025-09-05", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 81, longShare: 0.2424, familiarity: 0.8939 },
        { id: 23035, date: "2025-09-06", rows: 15, cols: 15, words: 68, blocks: 37, openSquares: 82, longShare: 0.1765, familiarity: 0.9706 },
        { id: 23065, date: "2025-09-07", rows: 21, cols: 21, words: 140, blocks: 68, openSquares: 124, longShare: 0.1357, familiarity: 0.9143 },
        { id: 23084, date: "2025-09-08", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 59, longShare: 0.0769, familiarity: 1.2692 },
        { id: 23085, date: "2025-09-09", rows: 15, cols: 15, words: 74, blocks: 30, openSquares: 75, longShare: 0.0811, familiarity: 1.2027 },
        { id: 23086, date: "2025-09-10", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 67, longShare: 0.1216, familiarity: 1.1351 },
        { id: 23087, date: "2025-09-11", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 61, longShare: 0.0789, familiarity: 1.1618 },
        { id: 23088, date: "2025-09-12", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 77, longShare: 0.2, familiarity: 1.0286 },
        { id: 23089, date: "2025-09-13", rows: 15, cols: 15, words: 68, blocks: 29, openSquares: 106, longShare: 0.1176, familiarity: 0.9265 },
        { id: 23096, date: "2025-09-15", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 67, longShare: 0.0789, familiarity: 1.3026 },
        { id: 23097, date: "2025-09-16", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 64, longShare: 0.1282, familiarity: 1.2692 },
        { id: 23095, date: "2025-09-17", rows: 15, cols: 16, words: 83, blocks: 40, openSquares: 74, longShare: 0.0843, familiarity: 1.075 },
        { id: 23098, date: "2025-09-18", rows: 15, cols: 15, words: 70, blocks: 26, openSquares: 90, longShare: 0.0857, familiarity: 0.8571 },
        { id: 23099, date: "2025-09-19", rows: 15, cols: 15, words: 72, blocks: 32, openSquares: 73, longShare: 0.1389, familiarity: 0.9861 },
        { id: 23100, date: "2025-09-20", rows: 15, cols: 15, words: 68, blocks: 29, openSquares: 104, longShare: 0.2353, familiarity: 0.8235 },
        { id: 23101, date: "2025-09-21", rows: 21, cols: 21, words: 140, blocks: 72, openSquares: 106, longShare: 0.1643, familiarity: 1.0692 },
        { id: 23113, date: "2025-09-22", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 64, longShare: 0.0513, familiarity: 1.2436 },
        { id: 23114, date: "2025-09-23", rows: 15, cols: 15, words: 78, blocks: 42, openSquares: 65, longShare: 0.0513, familiarity: 1.3077 },
        { id: 23115, date: "2025-09-24", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 64, longShare: 0.1026, familiarity: 1.1667 },
        { id: 23116, date: "2025-09-25", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 69, longShare: 0.0811, familiarity: 0.7432 },
        { id: 23117, date: "2025-09-26", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 73, longShare: 0.1571, familiarity: 0.9 },
        { id: 23118, date: "2025-09-27", rows: 15, cols: 15, words: 68, blocks: 31, openSquares: 86, longShare: 0.2647, familiarity: 0.9265 },
        { id: 23119, date: "2025-09-28", rows: 21, cols: 21, words: 140, blocks: 78, openSquares: 129, longShare: 0.0786, familiarity: 1.05 },
        { id: 23122, date: "2025-09-29", rows: 15, cols: 15, words: 78, blocks: 42, openSquares: 68, longShare: 0.0513, familiarity: 1.2692 },
        { id: 23123, date: "2025-09-30", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 72, longShare: 0.1184, familiarity: 1.1184 },
        { id: 23121, date: "2025-10-01", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 64, longShare: 0.1184, familiarity: 1.1579 },
        { id: 23130, date: "2025-10-02", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 75, longShare: 0.0769, familiarity: 1.141 },
        { id: 23129, date: "2025-10-03", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 88, longShare: 0.2286, familiarity: 1.1143 },
        { id: 23128, date: "2025-10-04", rows: 15, cols: 15, words: 62, blocks: 34, openSquares: 109, longShare: 0.2581, familiarity: 0.6613 },
        { id: 23133, date: "2025-10-05", rows: 21, cols: 21, words: 138, blocks: 78, openSquares: 125, longShare: 0.1522, familiarity: 0.9638 },
        { id: 23153, date: "2025-10-06", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 67, longShare: 0.1184, familiarity: 1.2368 },
        { id: 23159, date: "2025-10-07", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 77, longShare: 0.1081, familiarity: 1.1622 },
        { id: 23146, date: "2025-10-08", rows: 15, cols: 15, words: 74, blocks: 41, openSquares: 60, longShare: 0.0811, familiarity: 1.2973 },
        { id: 23158, date: "2025-10-09", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 72, longShare: 0.0946, familiarity: 1.2838 },
        { id: 23163, date: "2025-10-10", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 93, longShare: 0.2286, familiarity: 0.9286 },
        { id: 23162, date: "2025-10-11", rows: 15, cols: 16, words: 71, blocks: 34, openSquares: 90, longShare: 0.2113, familiarity: 0.8169 },
        { id: 23161, date: "2025-10-12", rows: 21, cols: 21, words: 140, blocks: 82, openSquares: 121, longShare: 0.1214, familiarity: 1.1143 },
        { id: 23164, date: "2025-10-13", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 66, longShare: 0.0769, familiarity: 1.1026 },
        { id: 23177, date: "2025-10-14", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 72, longShare: 0.1053, familiarity: 1.0526 },
        { id: 23178, date: "2025-10-15", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 62, longShare: 0.0946, familiarity: 1.1216 },
        { id: 23179, date: "2025-10-16", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 74, longShare: 0.0641, familiarity: 1.1923 },
        { id: 23167, date: "2025-10-17", rows: 15, cols: 15, words: 68, blocks: 33, openSquares: 86, longShare: 0.2059, familiarity: 0.8235 },
        { id: 23165, date: "2025-10-18", rows: 15, cols: 15, words: 64, blocks: 36, openSquares: 87, longShare: 0.2344, familiarity: 0.8281 },
        { id: 23182, date: "2025-10-19", rows: 21, cols: 21, words: 140, blocks: 72, openSquares: 116, longShare: 0.1357, familiarity: 0.9857 },
        { id: 23200, date: "2025-10-20", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 68, longShare: 0.0769, familiarity: 1.2949 },
        { id: 23168, date: "2025-10-21", rows: 15, cols: 15, words: 72, blocks: 38, openSquares: 73, longShare: 0.1389, familiarity: 1.2778 },
        { id: 23201, date: "2025-10-22", rows: 15, cols: 15, words: 70, blocks: 36, openSquares: 74, longShare: 0.1571, familiarity: 1.0429 },
        { id: 23197, date: "2025-10-23", rows: 15, cols: 15, words: 74, blocks: 35, openSquares: 70, longShare: 0.1622, familiarity: 0.9595 },
        { id: 23166, date: "2025-10-24", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 86, longShare: 0.1857, familiarity: 0.9429 },
        { id: 23249, date: "2025-10-25", rows: 15, cols: 15, words: 66, blocks: 22, openSquares: 108, longShare: 0.1515, familiarity: 0.7273 },
        { id: 23189, date: "2025-10-26", rows: 21, cols: 21, words: 140, blocks: 75, openSquares: 104, longShare: 0.1143, familiarity: 1.0143 },
        { id: 23188, date: "2025-10-27", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 61, longShare: 0.1026, familiarity: 1.2949 },
        { id: 23203, date: "2025-10-28", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 67, longShare: 0.1026, familiarity: 1.141 },
        { id: 23207, date: "2025-10-29", rows: 16, cols: 14, words: 76, blocks: 34, openSquares: 68, longShare: 0.0789, familiarity: 1.25 },
        { id: 23202, date: "2025-10-30", rows: 16, cols: 15, words: 80, blocks: 39, openSquares: 88, longShare: 0.05, familiarity: 1.0625 },
        { id: 23187, date: "2025-10-31", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 75, longShare: 0.1857, familiarity: 1.0286 },
        { id: 23191, date: "2025-11-01", rows: 15, cols: 15, words: 70, blocks: 27, openSquares: 100, longShare: 0.2286, familiarity: 0.8429 },
        { id: 23204, date: "2025-11-02", rows: 21, cols: 21, words: 117, blocks: 71, openSquares: 180, longShare: 0.2735, familiarity: 0.7265 },
        { id: 23224, date: "2025-11-03", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 65, longShare: 0.0897, familiarity: 1.2949 },
        { id: 23225, date: "2025-11-04", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 69, longShare: 0.1026, familiarity: 1.2436 },
        { id: 23219, date: "2025-11-05", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 70, longShare: 0.1081, familiarity: 1.1892 },
        { id: 23213, date: "2025-11-06", rows: 15, cols: 15, words: 75, blocks: 44, openSquares: 70, longShare: 0.04, familiarity: 1.1733 },
        { id: 23239, date: "2025-11-07", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 92, longShare: 0.2, familiarity: 0.9857 },
        { id: 23223, date: "2025-11-08", rows: 15, cols: 15, words: 72, blocks: 33, openSquares: 70, longShare: 0.1944, familiarity: 1.0556 },
        { id: 23222, date: "2025-11-09", rows: 21, cols: 21, words: 140, blocks: 68, openSquares: 121, longShare: 0.1571, familiarity: 1.0076 },
        { id: 23240, date: "2025-11-10", rows: 15, cols: 16, words: 79, blocks: 42, openSquares: 72, longShare: 0.0886, familiarity: 1.1899 },
        { id: 23244, date: "2025-11-11", rows: 15, cols: 14, words: 71, blocks: 30, openSquares: 66, longShare: 0.1268, familiarity: 1.2958 },
        { id: 23232, date: "2025-11-12", rows: 15, cols: 15, words: 78, blocks: 41, openSquares: 70, longShare: 0.0513, familiarity: 1.1282 },
        { id: 23246, date: "2025-11-13", rows: 15, cols: 15, words: 78, blocks: 35, openSquares: 64, longShare: 0.1026, familiarity: 1.0897 },
        { id: 23198, date: "2025-11-14", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 92, longShare: 0.1944, familiarity: 1.0694 },
        { id: 23245, date: "2025-11-15", rows: 15, cols: 15, words: 72, blocks: 28, openSquares: 95, longShare: 0.2222, familiarity: 0.9861 },
        { id: 23242, date: "2025-11-16", rows: 21, cols: 21, words: 140, blocks: 80, openSquares: 118, longShare: 0.1214, familiarity: 1.0714 },
        { id: 23277, date: "2025-11-17", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 69, longShare: 0.1282, familiarity: 1.2821 },
        { id: 23276, date: "2025-11-18", rows: 15, cols: 15, words: 70, blocks: 36, openSquares: 73, longShare: 0.1286, familiarity: 1.0429 },
        { id: 23274, date: "2025-11-19", rows: 15, cols: 15, words: 78, blocks: 39, openSquares: 74, longShare: 0.0513, familiarity: 1.0897 },
        { id: 23275, date: "2025-11-20", rows: 15, cols: 15, words: 74, blocks: 39, openSquares: 66, longShare: 0.1622, familiarity: 1.1351 },
        { id: 23216, date: "2025-11-21", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 81, longShare: 0.1667, familiarity: 1.0417 },
        { id: 23273, date: "2025-11-22", rows: 15, cols: 15, words: 72, blocks: 29, openSquares: 80, longShare: 0.1667, familiarity: 0.9722 },
        { id: 23233, date: "2025-11-23", rows: 21, cols: 21, words: 134, blocks: 78, openSquares: 108, longShare: 0.1269, familiarity: 0.9627 },
        { id: 23301, date: "2025-11-24", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 69, longShare: 0.1053, familiarity: 1.2763 },
        { id: 23293, date: "2025-11-25", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 70, longShare: 0.0921, familiarity: 1.2368 },
        { id: 23290, date: "2025-11-26", rows: 15, cols: 15, words: 78, blocks: 34, openSquares: 66, longShare: 0.0769, familiarity: 1.1538 },
        { id: 23302, date: "2025-11-27", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 67, longShare: 0.1351, familiarity: 1.0676 },
        { id: 23243, date: "2025-11-28", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 75, longShare: 0.2059, familiarity: 0.9412 },
        { id: 23291, date: "2025-11-29", rows: 15, cols: 15, words: 66, blocks: 33, openSquares: 102, longShare: 0.2121, familiarity: 0.9394 },
        { id: 23303, date: "2025-11-30", rows: 19, cols: 21, words: 125, blocks: 78, openSquares: 101, longShare: 0.12, familiarity: 1.024 },
        { id: 23318, date: "2025-12-01", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 67, longShare: 0.1026, familiarity: 1.2692 },
        { id: 23319, date: "2025-12-02", rows: 15, cols: 15, words: 78, blocks: 39, openSquares: 64, longShare: 0.1026, familiarity: 1.1667 },
        { id: 23312, date: "2025-12-03", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 63, longShare: 0.0769, familiarity: 1.1538 },
        { id: 23320, date: "2025-12-04", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 75, longShare: 0.1184, familiarity: 1.25 },
        { id: 23307, date: "2025-12-05", rows: 15, cols: 15, words: 68, blocks: 35, openSquares: 70, longShare: 0.1176, familiarity: 0.9853 },
        { id: 23330, date: "2025-12-06", rows: 15, cols: 15, words: 72, blocks: 28, openSquares: 97, longShare: 0.2222, familiarity: 0.9583 },
        { id: 23313, date: "2025-12-07", rows: 21, cols: 21, words: 140, blocks: 70, openSquares: 117, longShare: 0.1143, familiarity: 1.0357 },
        { id: 23315, date: "2025-12-08", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 53, longShare: 0.0769, familiarity: 1.2564 },
        { id: 23306, date: "2025-12-09", rows: 15, cols: 15, words: 76, blocks: 32, openSquares: 60, longShare: 0.0921, familiarity: 1.1447 },
        { id: 23316, date: "2025-12-10", rows: 15, cols: 16, words: 81, blocks: 42, openSquares: 76, longShare: 0.0864, familiarity: 1.2963 },
        { id: 23321, date: "2025-12-11", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 63, longShare: 0.1053, familiarity: 1.3421 },
        { id: 23349, date: "2025-12-12", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 77, longShare: 0.1714, familiarity: 1.0286 },
        { id: 23323, date: "2025-12-13", rows: 15, cols: 15, words: 62, blocks: 37, openSquares: 83, longShare: 0.1935, familiarity: 0.7097 },
        { id: 23324, date: "2025-12-14", rows: 21, cols: 21, words: 138, blocks: 75, openSquares: 104, longShare: 0.1159, familiarity: 0.9783 },
        { id: 23343, date: "2025-12-15", rows: 15, cols: 15, words: 76, blocks: 41, openSquares: 60, longShare: 0.1316, familiarity: 1.1184 },
        { id: 23365, date: "2025-12-16", rows: 15, cols: 15, words: 78, blocks: 34, openSquares: 72, longShare: 0.1026, familiarity: 1.1923 },
        { id: 23380, date: "2025-12-17", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 69, longShare: 0.1026, familiarity: 1.2308 },
        { id: 23378, date: "2025-12-18", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 60, longShare: 0.1026, familiarity: 1.1667 },
        { id: 23322, date: "2025-12-19", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 73, longShare: 0.2083, familiarity: 1.1806 },
        { id: 23372, date: "2025-12-20", rows: 15, cols: 15, words: 64, blocks: 35, openSquares: 90, longShare: 0.1875, familiarity: 0.7188 },
        { id: 23377, date: "2025-12-21", rows: 22, cols: 21, words: 143, blocks: 72, openSquares: 132, longShare: 0.1608, familiarity: 0.9231 },
        { id: 23398, date: "2025-12-22", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 78, longShare: 0.0658, familiarity: 1.0789 },
        { id: 23392, date: "2025-12-23", rows: 15, cols: 15, words: 75, blocks: 35, openSquares: 70, longShare: 0.0933, familiarity: 1.0933 },
        { id: 23397, date: "2025-12-24", rows: 15, cols: 15, words: 75, blocks: 37, openSquares: 59, longShare: 0.12, familiarity: 1.1467 },
        { id: 23329, date: "2025-12-25", rows: 15, cols: 15, words: 72, blocks: 42, openSquares: 64, longShare: 0.1528, familiarity: 0.8333 },
        { id: 23393, date: "2025-12-26", rows: 15, cols: 15, words: 70, blocks: 26, openSquares: 102, longShare: 0.2286, familiarity: 0.8429 },
        { id: 23399, date: "2025-12-27", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 85, longShare: 0.2571, familiarity: 1.0571 },
        { id: 23400, date: "2025-12-28", rows: 21, cols: 21, words: 140, blocks: 70, openSquares: 105, longShare: 0.1429, familiarity: 0.9786 },
        { id: 23432, date: "2025-12-29", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 58, longShare: 0.0513, familiarity: 1.3718 },
        { id: 23433, date: "2025-12-30", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 61, longShare: 0.1053, familiarity: 1.1053 },
        { id: 23429, date: "2025-12-31", rows: 15, cols: 15, words: 73, blocks: 43, openSquares: 50, longShare: 0.1507, familiarity: 1.1096 },
        { id: 23431, date: "2026-01-01", rows: 15, cols: 15, words: 76, blocks: 35, openSquares: 76, longShare: 0.1316, familiarity: 1.0921 },
        { id: 23425, date: "2026-01-02", rows: 15, cols: 15, words: 68, blocks: 36, openSquares: 83, longShare: 0.2353, familiarity: 0.8088 },
        { id: 23427, date: "2026-01-03", rows: 15, cols: 15, words: 66, blocks: 30, openSquares: 97, longShare: 0.2727, familiarity: 0.9545 },
        { id: 23451, date: "2026-01-05", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 70, longShare: 0.0921, familiarity: 1.25 },
        { id: 23448, date: "2026-01-06", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 62, longShare: 0.0921, familiarity: 1.2105 },
        { id: 23446, date: "2026-01-07", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 72, longShare: 0.0921, familiarity: 1.2632 },
        { id: 23455, date: "2026-01-08", rows: 15, cols: 14, words: 75, blocks: 34, openSquares: 56, longShare: 0.0933, familiarity: 1.2533 },
        { id: 23456, date: "2026-01-09", rows: 15, cols: 15, words: 72, blocks: 38, openSquares: 77, longShare: 0.2083, familiarity: 1.0833 },
        { id: 23447, date: "2026-01-10", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 87, longShare: 0.2143, familiarity: 0.9429 },
        { id: 23430, date: "2026-01-11", rows: 21, cols: 21, words: 140, blocks: 83, openSquares: 122, longShare: 0.1143, familiarity: 1.129 },
        { id: 23481, date: "2026-01-12", rows: 15, cols: 16, words: 81, blocks: 36, openSquares: 76, longShare: 0.0741, familiarity: 1.2099 },
        { id: 23471, date: "2026-01-13", rows: 16, cols: 14, words: 74, blocks: 40, openSquares: 62, longShare: 0.0541, familiarity: 1.1081 },
        { id: 23473, date: "2026-01-14", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 65, longShare: 0.0769, familiarity: 1.1923 },
        { id: 23472, date: "2026-01-15", rows: 15, cols: 16, words: 85, blocks: 38, openSquares: 72, longShare: 0.0471, familiarity: 1.3176 },
        { id: 23479, date: "2026-01-16", rows: 15, cols: 15, words: 72, blocks: 28, openSquares: 94, longShare: 0.25, familiarity: 0.9028 },
        { id: 23468, date: "2026-01-17", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 84, longShare: 0.2083, familiarity: 0.9444 },
        { id: 23478, date: "2026-01-18", rows: 21, cols: 21, words: 140, blocks: 74, openSquares: 112, longShare: 0.1071, familiarity: 1.1857 },
        { id: 23470, date: "2026-01-19", rows: 15, cols: 15, words: 78, blocks: 35, openSquares: 66, longShare: 0.0769, familiarity: 1.1923 },
        { id: 23492, date: "2026-01-20", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 76, longShare: 0.1216, familiarity: 1.2703 },
        { id: 23496, date: "2026-01-21", rows: 16, cols: 15, words: 77, blocks: 38, openSquares: 84, longShare: 0.0909, familiarity: 1.013 },
        { id: 23493, date: "2026-01-22", rows: 15, cols: 15, words: 74, blocks: 37, openSquares: 74, longShare: 0.0811, familiarity: 1 },
        { id: 23494, date: "2026-01-23", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 80, longShare: 0.2, familiarity: 1.0143 },
        { id: 23495, date: "2026-01-24", rows: 15, cols: 15, words: 66, blocks: 36, openSquares: 75, longShare: 0.2121, familiarity: 1.0606 },
        { id: 23498, date: "2026-01-25", rows: 21, cols: 21, words: 140, blocks: 66, openSquares: 130, longShare: 0.1643, familiarity: 1.0643 },
        { id: 23502, date: "2026-01-26", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 68, longShare: 0.0769, familiarity: 1.2179 },
        { id: 23503, date: "2026-01-27", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 67, longShare: 0.0789, familiarity: 1.2105 },
        { id: 23504, date: "2026-01-28", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 64, longShare: 0.0769, familiarity: 1.2692 },
        { id: 23516, date: "2026-01-29", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 72, longShare: 0.0658, familiarity: 1.2237 },
        { id: 23640, date: "2026-01-30", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 83, longShare: 0.2, familiarity: 1.1143 },
        { id: 23507, date: "2026-01-31", rows: 15, cols: 15, words: 66, blocks: 33, openSquares: 84, longShare: 0.1515, familiarity: 0.8788 },
        { id: 23508, date: "2026-02-01", rows: 21, cols: 21, words: 136, blocks: 76, openSquares: 134, longShare: 0.1029, familiarity: 1.0221 },
        { id: 23510, date: "2026-02-03", rows: 15, cols: 16, words: 81, blocks: 38, openSquares: 66, longShare: 0.0864, familiarity: 1.1358 },
        { id: 23511, date: "2026-02-04", rows: 15, cols: 15, words: 78, blocks: 34, openSquares: 72, longShare: 0.0769, familiarity: 1.1154 },
        { id: 23512, date: "2026-02-05", rows: 15, cols: 15, words: 78, blocks: 34, openSquares: 77, longShare: 0.0641, familiarity: 1.1667 },
        { id: 23513, date: "2026-02-06", rows: 15, cols: 15, words: 70, blocks: 33, openSquares: 80, longShare: 0.2286, familiarity: 1.0857 },
        { id: 23514, date: "2026-02-07", rows: 15, cols: 15, words: 62, blocks: 34, openSquares: 93, longShare: 0.2097, familiarity: 0.7581 },
        { id: 23515, date: "2026-02-08", rows: 21, cols: 21, words: 140, blocks: 72, openSquares: 125, longShare: 0.0786, familiarity: 1.0643 },
        { id: 23637, date: "2026-02-09", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 65, longShare: 0.1026, familiarity: 1.4103 },
        { id: 23636, date: "2026-02-10", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 56, longShare: 0.1216, familiarity: 1.1351 },
        { id: 23638, date: "2026-02-11", rows: 15, cols: 16, words: 79, blocks: 38, openSquares: 78, longShare: 0.1266, familiarity: 1.0759 },
        { id: 23639, date: "2026-02-12", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 70, longShare: 0.0789, familiarity: 1.1447 },
        { id: 23506, date: "2026-02-13", rows: 15, cols: 16, words: 71, blocks: 34, openSquares: 90, longShare: 0.2113, familiarity: 1.0141 },
        { id: 23641, date: "2026-02-14", rows: 15, cols: 15, words: 63, blocks: 47, openSquares: 74, longShare: 0.1746, familiarity: 0.9365 },
        { id: 23642, date: "2026-02-15", rows: 21, cols: 22, words: 147, blocks: 78, openSquares: 114, longShare: 0.1156, familiarity: 1.0544 },
        { id: 23643, date: "2026-02-16", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 62, longShare: 0.1026, familiarity: 1.2051 },
        { id: 23671, date: "2026-02-17", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 68, longShare: 0.0769, familiarity: 1.2564 },
        { id: 23646, date: "2026-02-18", rows: 15, cols: 16, words: 77, blocks: 38, openSquares: 80, longShare: 0.1429, familiarity: 1.1948 },
        { id: 23672, date: "2026-02-19", rows: 15, cols: 16, words: 79, blocks: 44, openSquares: 62, longShare: 0.0759, familiarity: 1.2785 },
        { id: 23673, date: "2026-02-20", rows: 15, cols: 15, words: 68, blocks: 30, openSquares: 91, longShare: 0.1912, familiarity: 1.0147 },
        { id: 23651, date: "2026-02-21", rows: 15, cols: 15, words: 72, blocks: 29, openSquares: 86, longShare: 0.1667, familiarity: 0.9306 },
        { id: 23645, date: "2026-02-22", rows: 21, cols: 21, words: 140, blocks: 82, openSquares: 100, longShare: 0.1071, familiarity: 1.1714 },
        { id: 23688, date: "2026-02-23", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 63, longShare: 0.0921, familiarity: 1.1842 },
        { id: 23689, date: "2026-02-24", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 60, longShare: 0.1053, familiarity: 1.0921 },
        { id: 23677, date: "2026-02-25", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 64, longShare: 0.1053, familiarity: 1.3571 },
        { id: 23690, date: "2026-02-26", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 70, longShare: 0.0946, familiarity: 0.9324 },
        { id: 23695, date: "2026-02-27", rows: 15, cols: 15, words: 70, blocks: 27, openSquares: 90, longShare: 0.1429, familiarity: 1.0286 },
        { id: 23692, date: "2026-02-28", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 95, longShare: 0.1176, familiarity: 0.9265 },
        { id: 23704, date: "2026-03-01", rows: 21, cols: 21, words: 142, blocks: 86, openSquares: 90, longShare: 0.169, familiarity: 1.1479 },
        { id: 23714, date: "2026-03-02", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 70, longShare: 0.0921, familiarity: 1.2105 },
        { id: 23721, date: "2026-03-03", rows: 15, cols: 16, words: 79, blocks: 40, openSquares: 80, longShare: 0.1139, familiarity: 1.1646 },
        { id: 23722, date: "2026-03-04", rows: 15, cols: 15, words: 76, blocks: 39, openSquares: 72, longShare: 0.1053, familiarity: 1.1974 },
        { id: 23725, date: "2026-03-05", rows: 15, cols: 15, words: 86, blocks: 44, openSquares: 62, longShare: 0.0233, familiarity: 1.4767 },
        { id: 23724, date: "2026-03-06", rows: 15, cols: 15, words: 68, blocks: 35, openSquares: 96, longShare: 0.2059, familiarity: 0.8382 },
        { id: 23713, date: "2026-03-07", rows: 15, cols: 15, words: 72, blocks: 29, openSquares: 96, longShare: 0.1667, familiarity: 1.0694 },
        { id: 23712, date: "2026-03-08", rows: 21, cols: 22, words: 145, blocks: 86, openSquares: 112, longShare: 0.1034, familiarity: 1.0138 },
        { id: 23728, date: "2026-03-09", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 65, longShare: 0.0676, familiarity: 1.1486 },
        { id: 23727, date: "2026-03-10", rows: 15, cols: 15, words: 78, blocks: 42, openSquares: 54, longShare: 0.0897, familiarity: 1.2436 },
        { id: 23729, date: "2026-03-11", rows: 15, cols: 15, words: 74, blocks: 42, openSquares: 67, longShare: 0.0946, familiarity: 1.2703 },
        { id: 23733, date: "2026-03-12", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 70, longShare: 0.0769, familiarity: 1.1923 },
        { id: 23744, date: "2026-03-13", rows: 15, cols: 15, words: 64, blocks: 34, openSquares: 95, longShare: 0.2188, familiarity: 0.8281 },
        { id: 23730, date: "2026-03-14", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 81, longShare: 0.1857, familiarity: 1 },
        { id: 23743, date: "2026-03-15", rows: 21, cols: 21, words: 144, blocks: 84, openSquares: 98, longShare: 0.0694, familiarity: 0.9306 },
        { id: 23747, date: "2026-03-16", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 65, longShare: 0.1026, familiarity: 1.1026 },
        { id: 23731, date: "2026-03-17", rows: 15, cols: 16, words: 79, blocks: 40, openSquares: 70, longShare: 0.1266, familiarity: 1.3418 },
        { id: 23732, date: "2026-03-18", rows: 15, cols: 16, words: 81, blocks: 42, openSquares: 66, longShare: 0.0864, familiarity: 1.0494 },
        { id: 23505, date: "2026-03-19", rows: 15, cols: 15, words: 74, blocks: 33, openSquares: 76, longShare: 0.1081, familiarity: 1.1081 },
        { id: 23760, date: "2026-03-20", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 90, longShare: 0.2286, familiarity: 1.1143 },
        { id: 23772, date: "2026-03-21", rows: 15, cols: 15, words: 66, blocks: 32, openSquares: 97, longShare: 0.1818, familiarity: 0.8485 },
        { id: 23693, date: "2026-03-22", rows: 21, cols: 21, words: 140, blocks: 71, openSquares: 112, longShare: 0.1286, familiarity: 1.0214 },
        { id: 23781, date: "2026-03-23", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 61, longShare: 0.1154, familiarity: 1.3205 },
        { id: 23782, date: "2026-03-24", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 67, longShare: 0.0769, familiarity: 1.2692 },
        { id: 23750, date: "2026-03-25", rows: 14, cols: 15, words: 67, blocks: 38, openSquares: 84, longShare: 0.0597, familiarity: 1.1343 },
        { id: 23761, date: "2026-03-26", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 70, longShare: 0.0641, familiarity: 1.2821 },
        { id: 23752, date: "2026-03-27", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 105, longShare: 0.2, familiarity: 0.8143 },
        { id: 23784, date: "2026-03-28", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 93, longShare: 0.2286, familiarity: 0.9429 },
        { id: 23787, date: "2026-03-30", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 66, longShare: 0.1154, familiarity: 1.2821 },
        { id: 23801, date: "2026-03-31", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 66, longShare: 0.0769, familiarity: 1.2692 },
        { id: 23802, date: "2026-04-01", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 66, longShare: 0.1316, familiarity: 1.3026 },
        { id: 23783, date: "2026-04-02", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 62, longShare: 0.0769, familiarity: 1.2692 },
        { id: 23803, date: "2026-04-03", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 79, longShare: 0.1571, familiarity: 0.9714 },
        { id: 23804, date: "2026-04-04", rows: 15, cols: 15, words: 68, blocks: 28, openSquares: 103, longShare: 0.2647, familiarity: 0.9118 },
        { id: 23805, date: "2026-04-05", rows: 21, cols: 21, words: 138, blocks: 66, openSquares: 124, longShare: 0.087, familiarity: 0.9565 },
        { id: 23827, date: "2026-04-06", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 62, longShare: 0.1026, familiarity: 1.3077 },
        { id: 23828, date: "2026-04-07", rows: 15, cols: 16, words: 79, blocks: 36, openSquares: 82, longShare: 0.0633, familiarity: 1.0886 },
        { id: 23829, date: "2026-04-08", rows: 15, cols: 16, words: 79, blocks: 40, openSquares: 76, longShare: 0.1392, familiarity: 1.0506 },
        { id: 23830, date: "2026-04-09", rows: 15, cols: 16, words: 81, blocks: 38, openSquares: 78, longShare: 0.0988, familiarity: 1.1358 },
        { id: 23831, date: "2026-04-10", rows: 15, cols: 15, words: 70, blocks: 35, openSquares: 82, longShare: 0.1143, familiarity: 0.9571 },
        { id: 23832, date: "2026-04-11", rows: 15, cols: 15, words: 68, blocks: 36, openSquares: 91, longShare: 0.1912, familiarity: 1.0882 },
        { id: 23833, date: "2026-04-12", rows: 21, cols: 21, words: 136, blocks: 68, openSquares: 123, longShare: 0.125, familiarity: 1.0074 },
        { id: 23852, date: "2026-04-13", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 69, longShare: 0.0897, familiarity: 1.2564 },
        { id: 23846, date: "2026-04-14", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 65, longShare: 0.0811, familiarity: 1.0405 },
        { id: 23849, date: "2026-04-15", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 66, longShare: 0.1622, familiarity: 1.2703 },
        { id: 23855, date: "2026-04-16", rows: 15, cols: 15, words: 75, blocks: 46, openSquares: 70, longShare: 0.0267, familiarity: 1.2133 },
        { id: 23861, date: "2026-04-17", rows: 15, cols: 15, words: 70, blocks: 36, openSquares: 69, longShare: 0.2, familiarity: 1.1143 },
        { id: 23857, date: "2026-04-18", rows: 15, cols: 15, words: 62, blocks: 40, openSquares: 74, longShare: 0.2097, familiarity: 0.7419 },
        { id: 23841, date: "2026-04-19", rows: 21, cols: 21, words: 140, blocks: 74, openSquares: 112, longShare: 0.15, familiarity: 0.9643 },
        { id: 23892, date: "2026-04-20", rows: 15, cols: 15, words: 76, blocks: 44, openSquares: 63, longShare: 0.0789, familiarity: 1.1974 },
        { id: 23889, date: "2026-04-21", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 70, longShare: 0.0921, familiarity: 1.1184 },
        { id: 23858, date: "2026-04-23", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 65, longShare: 0.1026, familiarity: 1.2436 },
        { id: 23859, date: "2026-04-24", rows: 15, cols: 15, words: 68, blocks: 25, openSquares: 104, longShare: 0.2353, familiarity: 0.7353 },
        { id: 23853, date: "2026-04-25", rows: 15, cols: 15, words: 65, blocks: 37, openSquares: 87, longShare: 0.1538, familiarity: 0.7846 },
        { id: 23893, date: "2026-04-26", rows: 21, cols: 21, words: 140, blocks: 78, openSquares: 110, longShare: 0.1071, familiarity: 1.1286 },
        { id: 23882, date: "2026-04-27", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 62, longShare: 0.0897, familiarity: 1.2692 },
        { id: 23894, date: "2026-04-28", rows: 15, cols: 15, words: 74, blocks: 36, openSquares: 65, longShare: 0.1081, familiarity: 1.2027 },
        { id: 23895, date: "2026-04-29", rows: 15, cols: 15, words: 74, blocks: 33, openSquares: 76, longShare: 0.1351, familiarity: 0.9865 },
        { id: 23896, date: "2026-04-30", rows: 15, cols: 15, words: 76, blocks: 35, openSquares: 64, longShare: 0.1579, familiarity: 1.1184 },
        { id: 23897, date: "2026-05-01", rows: 15, cols: 15, words: 68, blocks: 30, openSquares: 97, longShare: 0.2059, familiarity: 0.9412 },
        { id: 23920, date: "2026-05-02", rows: 15, cols: 15, words: 64, blocks: 30, openSquares: 100, longShare: 0.25, familiarity: 0.7656 },
        { id: 23921, date: "2026-05-03", rows: 21, cols: 21, words: 138, blocks: 77, openSquares: 120, longShare: 0.087, familiarity: 0.8188 },
        { id: 23930, date: "2026-05-04", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 69, longShare: 0.0897, familiarity: 1.2692 },
        { id: 23931, date: "2026-05-05", rows: 15, cols: 16, words: 79, blocks: 36, openSquares: 78, longShare: 0.1392, familiarity: 1.1772 },
        { id: 23907, date: "2026-05-06", rows: 15, cols: 15, words: 78, blocks: 34, openSquares: 73, longShare: 0.1154, familiarity: 1.1026 },
        { id: 23898, date: "2026-05-07", rows: 15, cols: 15, words: 74, blocks: 40, openSquares: 61, longShare: 0.1081, familiarity: 1.2297 },
        { id: 23928, date: "2026-05-08", rows: 15, cols: 15, words: 70, blocks: 31, openSquares: 86, longShare: 0.1714, familiarity: 0.9571 },
        { id: 23927, date: "2026-05-09", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 97, longShare: 0.2, familiarity: 0.9714 },
        { id: 23915, date: "2026-05-10", rows: 21, cols: 21, words: 140, blocks: 77, openSquares: 116, longShare: 0.0857, familiarity: 0.9571 },
        { id: 23947, date: "2026-05-11", rows: 15, cols: 15, words: 76, blocks: 37, openSquares: 70, longShare: 0.0789, familiarity: 1.1053 },
        { id: 23946, date: "2026-05-12", rows: 15, cols: 15, words: 76, blocks: 39, openSquares: 66, longShare: 0.1053, familiarity: 1.2368 },
        { id: 23945, date: "2026-05-13", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 73, longShare: 0.0641, familiarity: 1.1538 },
        { id: 23916, date: "2026-05-14", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 73, longShare: 0.1622, familiarity: 0.9459 },
        { id: 23944, date: "2026-05-15", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 93, longShare: 0.2286, familiarity: 0.9 },
        { id: 23943, date: "2026-05-16", rows: 15, cols: 15, words: 66, blocks: 26, openSquares: 99, longShare: 0.2424, familiarity: 0.697 },
        { id: 23941, date: "2026-05-17", rows: 21, cols: 21, words: 140, blocks: 74, openSquares: 131, longShare: 0.1071, familiarity: 0.9786 },
        { id: 23948, date: "2026-05-18", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 69, longShare: 0.0897, familiarity: 1.3974 },
        { id: 23917, date: "2026-05-19", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 68, longShare: 0.0658, familiarity: 1.1579 },
        { id: 23949, date: "2026-05-20", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 68, longShare: 0.1714, familiarity: 1.0429 },
        { id: 23950, date: "2026-05-21", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 67, longShare: 0.0769, familiarity: 1.2051 },
        { id: 23951, date: "2026-05-22", rows: 15, cols: 16, words: 75, blocks: 32, openSquares: 86, longShare: 0.1733, familiarity: 0.9467 },
        { id: 23952, date: "2026-05-23", rows: 15, cols: 15, words: 62, blocks: 34, openSquares: 109, longShare: 0.2581, familiarity: 0.7097 },
        { id: 23942, date: "2026-05-24", rows: 21, cols: 21, words: 140, blocks: 78, openSquares: 115, longShare: 0.1214, familiarity: 1.1786 },
        { id: 23991, date: "2026-05-25", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 70, longShare: 0.1026, familiarity: 1.2308 },
        { id: 23997, date: "2026-05-26", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 64, longShare: 0.0897, familiarity: 1.2821 },
        { id: 24006, date: "2026-05-27", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 70, longShare: 0.1316, familiarity: 1.0921 },
        { id: 24008, date: "2026-05-28", rows: 15, cols: 15, words: 70, blocks: 35, openSquares: 74, longShare: 0.2, familiarity: 1.0571 },
        { id: 23990, date: "2026-05-29", rows: 15, cols: 15, words: 72, blocks: 32, openSquares: 81, longShare: 0.1667, familiarity: 1.1389 },
        { id: 24007, date: "2026-05-30", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 91, longShare: 0.2206, familiarity: 0.8676 },
        { id: 23918, date: "2026-05-31", rows: 21, cols: 21, words: 140, blocks: 82, openSquares: 100, longShare: 0.1143, familiarity: 1 },
        { id: 24020, date: "2026-06-01", rows: 15, cols: 14, words: 71, blocks: 40, openSquares: 64, longShare: 0.1127, familiarity: 1.3662 },
        { id: 24021, date: "2026-06-02", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 73, longShare: 0.0789, familiarity: 1.2368 },
        { id: 24022, date: "2026-06-03", rows: 15, cols: 15, words: 76, blocks: 39, openSquares: 64, longShare: 0.1316, familiarity: 1.2895 },
        { id: 23919, date: "2026-06-04", rows: 15, cols: 15, words: 74, blocks: 32, openSquares: 81, longShare: 0.1351, familiarity: 1.1216 },
        { id: 24024, date: "2026-06-05", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 85, longShare: 0.1714, familiarity: 1.0143 },
        { id: 24019, date: "2026-06-06", rows: 15, cols: 15, words: 60, blocks: 26, openSquares: 135, longShare: 0.3667, familiarity: 0.4833 },
        { id: 24031, date: "2026-06-07", rows: 21, cols: 21, words: 140, blocks: 78, openSquares: 114, longShare: 0.0786, familiarity: 0.9571 },
        { id: 24045, date: "2026-06-08", rows: 15, cols: 15, words: 76, blocks: 42, openSquares: 66, longShare: 0.0789, familiarity: 1.2632 },
        { id: 24046, date: "2026-06-09", rows: 15, cols: 15, words: 75, blocks: 39, openSquares: 70, longShare: 0.0933, familiarity: 1.12 },
        { id: 24042, date: "2026-06-10", rows: 15, cols: 15, words: 78, blocks: 42, openSquares: 63, longShare: 0.0385, familiarity: 1.0385 },
        { id: 24047, date: "2026-06-11", rows: 15, cols: 15, words: 74, blocks: 36, openSquares: 77, longShare: 0.1622, familiarity: 1.0811 },
        { id: 24023, date: "2026-06-12", rows: 15, cols: 15, words: 70, blocks: 36, openSquares: 68, longShare: 0.0857, familiarity: 1.1143 },
        { id: 24058, date: "2026-06-13", rows: 15, cols: 15, words: 66, blocks: 34, openSquares: 93, longShare: 0.2121, familiarity: 0.9242 },
        { id: 24044, date: "2026-06-14", rows: 21, cols: 21, words: 134, blocks: 73, openSquares: 116, longShare: 0.1045, familiarity: 1.0672 },
        { id: 24103, date: "2026-06-15", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 63, longShare: 0.0789, familiarity: 1.3289 },
        { id: 24104, date: "2026-06-16", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 67, longShare: 0.1184, familiarity: 1.25 },
        { id: 24097, date: "2026-06-18", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 67, longShare: 0.1286, familiarity: 0.9143 },
        { id: 24106, date: "2026-06-19", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 71, longShare: 0.2, familiarity: 1.0571 },
        { id: 24080, date: "2026-06-20", rows: 15, cols: 15, words: 72, blocks: 28, openSquares: 99, longShare: 0.1944, familiarity: 1.0694 },
        { id: 24116, date: "2026-06-22", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 70, longShare: 0.1026, familiarity: 1.2692 },
        { id: 24115, date: "2026-06-23", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 71, longShare: 0.1026, familiarity: 1.2436 },
        { id: 24117, date: "2026-06-24", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 70, longShare: 0.1154, familiarity: 1.2436 },
        { id: 24124, date: "2026-06-25", rows: 15, cols: 15, words: 76, blocks: 37, openSquares: 68, longShare: 0.0789, familiarity: 1.1184 },
        { id: 24121, date: "2026-06-26", rows: 15, cols: 15, words: 70, blocks: 36, openSquares: 69, longShare: 0.1714, familiarity: 0.9143 },
        { id: 24120, date: "2026-06-27", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 102, longShare: 0.2286, familiarity: 1.1 },
        { id: 24119, date: "2026-06-28", rows: 21, cols: 22, words: 145, blocks: 78, openSquares: 124, longShare: 0.1034, familiarity: 1.0897 },
        { id: 24150, date: "2026-06-29", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 73, longShare: 0.0921, familiarity: 1.25 },
        { id: 24144, date: "2026-06-30", rows: 15, cols: 15, words: 72, blocks: 36, openSquares: 66, longShare: 0.1389, familiarity: 1.0417 },
        { id: 24168, date: "2026-07-02", rows: 16, cols: 15, words: 85, blocks: 40, openSquares: 64, longShare: 0.0706, familiarity: 1 },
        { id: 24129, date: "2026-07-03", rows: 15, cols: 15, words: 72, blocks: 25, openSquares: 96, longShare: 0.1667, familiarity: 1.0417 },
        { id: 24131, date: "2026-07-04", rows: 15, cols: 15, words: 68, blocks: 32, openSquares: 106, longShare: 0.25, familiarity: 1.1029 },
        { id: 24136, date: "2026-07-05", rows: 21, cols: 21, words: 136, blocks: 82, openSquares: 120, longShare: 0.0735, familiarity: 1.1029 },
        { id: 24159, date: "2026-07-06", rows: 15, cols: 15, words: 74, blocks: 36, openSquares: 69, longShare: 0.1486, familiarity: 1.2297 },
        { id: 24183, date: "2026-07-07", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 72, longShare: 0.0526, familiarity: 1.1447 },
        { id: 24174, date: "2026-07-08", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 70, longShare: 0.0769, familiarity: 1.3077 },
        { id: 24184, date: "2026-07-09", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 69, longShare: 0.1622, familiarity: 1.1486 },
        { id: 24130, date: "2026-07-10", rows: 15, cols: 15, words: 70, blocks: 27, openSquares: 88, longShare: 0.1143, familiarity: 1.0571 },
        { id: 24177, date: "2026-07-11", rows: 15, cols: 15, words: 72, blocks: 28, openSquares: 101, longShare: 0.1944, familiarity: 1.0556 },
        { id: 24185, date: "2026-07-12", rows: 21, cols: 21, words: 138, blocks: 77, openSquares: 126, longShare: 0.1014, familiarity: 1.1449 },
        { id: 24188, date: "2026-07-13", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 72, longShare: 0.0921, familiarity: 1.2237 },
        { id: 24189, date: "2026-07-14", rows: 15, cols: 14, words: 71, blocks: 36, openSquares: 58, longShare: 0.1268, familiarity: 1.2254 },
        { id: 24160, date: "2026-07-15", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 73, longShare: 0.0769, familiarity: 1.2949 },
        { id: 24190, date: "2026-07-16", rows: 15, cols: 16, words: 81, blocks: 42, openSquares: 66, longShare: 0.1111, familiarity: 1.2593 },
        { id: 24218, date: "2026-07-17", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 105, longShare: 0.1286, familiarity: 1.1286 },
        { id: 24191, date: "2026-07-18", rows: 15, cols: 15, words: 70, blocks: 35, openSquares: 80, longShare: 0.1714, familiarity: 1.0857 },
        { id: 24220, date: "2026-07-19", rows: 21, cols: 21, words: 140, blocks: 76, openSquares: 109, longShare: 0.1571, familiarity: 0.9714 },
        { id: 24234, date: "2026-07-20", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 62, longShare: 0.1053, familiarity: 1.1974 },
        { id: 24235, date: "2026-07-21", rows: 15, cols: 16, words: 77, blocks: 46, openSquares: 70, longShare: 0.1169, familiarity: 1.1948 },
        { id: 24236, date: "2026-07-22", rows: 15, cols: 15, words: 76, blocks: 39, openSquares: 68, longShare: 0.1053, familiarity: 1.0921 },
        { id: 24227, date: "2026-07-23", rows: 15, cols: 15, words: 74, blocks: 42, openSquares: 71, longShare: 0.0811, familiarity: 1.0946 },
        { id: 24226, date: "2026-07-24", rows: 15, cols: 15, words: 70, blocks: 36, openSquares: 75, longShare: 0.2143, familiarity: 1.1286 },
        { id: 24233, date: "2026-07-25", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 91, longShare: 0.1944, familiarity: 1.0556 },
        { id: 24232, date: "2026-07-26", rows: 21, cols: 21, words: 136, blocks: 88, openSquares: 124, longShare: 0.0809, familiarity: 0.9265 },
        { id: 24237, date: "2026-07-27", rows: 15, cols: 14, words: 71, blocks: 36, openSquares: 64, longShare: 0.1268, familiarity: 1.3662 },
        { id: 24249, date: "2026-07-28", rows: 15, cols: 15, words: 74, blocks: 39, openSquares: 76, longShare: 0.0811, familiarity: 1.2297 },
        { id: 24254, date: "2026-07-29", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 73, longShare: 0.0789, familiarity: 1.1579 },
        { id: 24251, date: "2026-07-30", rows: 15, cols: 16, words: 79, blocks: 36, openSquares: 80, longShare: 0.0886, familiarity: 1.1899 },
        { id: 24252, date: "2026-07-31", rows: 15, cols: 15, words: 68, blocks: 37, openSquares: 72, longShare: 0.2059, familiarity: 1.0294 },
        { id: 24253, date: "2026-08-01", rows: 15, cols: 15, words: 70, blocks: 29, openSquares: 86, longShare: 0.2286, familiarity: 0.9714 },
        { id: 24275, date: "2026-08-02", rows: 21, cols: 21, words: 140, blocks: 76, openSquares: 108, longShare: 0.1214, familiarity: 1.05 },
        { id: 24284, date: "2026-08-03", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 76, longShare: 0.1053, familiarity: 1.2632 },
        { id: 24266, date: "2026-08-04", rows: 15, cols: 15, words: 76, blocks: 41, openSquares: 66, longShare: 0.1053, familiarity: 1.25 },
        { id: 24278, date: "2026-08-05", rows: 14, cols: 15, words: 72, blocks: 48, openSquares: 58, longShare: 0.0278, familiarity: 1.0972 },
        { id: 24285, date: "2026-08-06", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 74, longShare: 0.1351, familiarity: 1.0811 },
        { id: 24286, date: "2026-08-07", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 87, longShare: 0.2, familiarity: 1 },
        { id: 24287, date: "2026-08-08", rows: 15, cols: 15, words: 62, blocks: 35, openSquares: 92, longShare: 0.2258, familiarity: 0.8065 },
        { id: 24277, date: "2026-08-09", rows: 21, cols: 21, words: 128, blocks: 58, openSquares: 157, longShare: 0.1875, familiarity: 0.8438 },
        { id: 24294, date: "2026-08-10", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 73, longShare: 0.1026, familiarity: 1.2308 },
        { id: 24303, date: "2026-08-11", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 69, longShare: 0.1026, familiarity: 1.2564 },
        { id: 24250, date: "2026-08-12", rows: 15, cols: 15, words: 76, blocks: 42, openSquares: 65, longShare: 0.0921, familiarity: 1.2632 },
        { id: 24301, date: "2026-08-13", rows: 15, cols: 15, words: 78, blocks: 34, openSquares: 65, longShare: 0.0769, familiarity: 1.0256 },
        { id: 24304, date: "2026-08-14", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 87, longShare: 0.2, familiarity: 1.0143 },
        { id: 24299, date: "2026-08-15", rows: 15, cols: 15, words: 66, blocks: 24, openSquares: 105, longShare: 0.2727, familiarity: 0.7424 },
        { id: 24305, date: "2026-08-16", rows: 21, cols: 21, words: 140, blocks: 73, openSquares: 100, longShare: 0.0857, familiarity: 1.1214 },
        { id: 24319, date: "2026-08-17", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 67, longShare: 0.1026, familiarity: 1.2564 },
        { id: 24320, date: "2026-08-18", rows: 15, cols: 15, words: 76, blocks: 34, openSquares: 69, longShare: 0.1053, familiarity: 1.1711 },
        { id: 24288, date: "2026-08-19", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 66, longShare: 0.0921, familiarity: 1.3289 },
        { id: 24321, date: "2026-08-20", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 64, longShare: 0.0641, familiarity: 1.2821 },
        { id: 24322, date: "2026-08-21", rows: 15, cols: 15, words: 68, blocks: 36, openSquares: 83, longShare: 0.1912, familiarity: 0.9853 },
        { id: 24323, date: "2026-08-22", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 92, longShare: 0.2353, familiarity: 0.9706 },
        { id: 24324, date: "2026-08-23", rows: 21, cols: 22, words: 145, blocks: 76, openSquares: 108, longShare: 0.0897, familiarity: 0.9793 },
        { id: 24344, date: "2026-08-24", rows: 15, cols: 15, words: 78, blocks: 42, openSquares: 60, longShare: 0.0897, familiarity: 1.2436 },
        { id: 24345, date: "2026-08-25", rows: 15, cols: 15, words: 76, blocks: 37, openSquares: 68, longShare: 0.0263, familiarity: 1.1053 },
        { id: 24346, date: "2026-08-26", rows: 15, cols: 15, words: 76, blocks: 40, openSquares: 60, longShare: 0.1184, familiarity: 1.3026 },
        { id: 24347, date: "2026-08-27", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 64, longShare: 0.1026, familiarity: 1.0513 },
        { id: 24348, date: "2026-08-28", rows: 15, cols: 15, words: 68, blocks: 36, openSquares: 78, longShare: 0.1765, familiarity: 0.9412 },
        { id: 24349, date: "2026-08-29", rows: 16, cols: 15, words: 69, blocks: 36, openSquares: 98, longShare: 0.2174, familiarity: 0.7826 },
        { id: 24350, date: "2026-08-30", rows: 21, cols: 21, words: 140, blocks: 78, openSquares: 112, longShare: 0.1286, familiarity: 1.0857 },
        { id: 24365, date: "2026-08-31", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 72, longShare: 0.0769, familiarity: 1.3718 },
        { id: 24378, date: "2026-09-01", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 70, longShare: 0.1622, familiarity: 1.1892 },
        { id: 24377, date: "2026-09-02", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 68, longShare: 0.0641, familiarity: 1.2179 },
        { id: 24379, date: "2026-09-03", rows: 16, cols: 15, words: 80, blocks: 44, openSquares: 62, longShare: 0.075, familiarity: 1.1875 },
        { id: 24366, date: "2026-09-04", rows: 15, cols: 15, words: 66, blocks: 25, openSquares: 114, longShare: 0.2424, familiarity: 0.7879 },
        { id: 24380, date: "2026-09-05", rows: 15, cols: 15, words: 72, blocks: 25, openSquares: 92, longShare: 0.1667, familiarity: 1.0972 },
        { id: 24381, date: "2026-09-06", rows: 21, cols: 21, words: 138, blocks: 69, openSquares: 116, longShare: 0.0725, familiarity: 0.9493 },
        { id: 24393, date: "2026-09-07", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 64, longShare: 0.0897, familiarity: 1.2436 },
        { id: 24392, date: "2026-09-08", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 69, longShare: 0.0395, familiarity: 1.1579 },
        { id: 24397, date: "2026-09-09", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 69, longShare: 0.0769, familiarity: 1.1282 },
        { id: 24400, date: "2026-09-10", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 81, longShare: 0.2143, familiarity: 0.9571 },
        { id: 24398, date: "2026-09-11", rows: 15, cols: 15, words: 72, blocks: 30, openSquares: 81, longShare: 0.1667, familiarity: 1.0972 },
        { id: 24417, date: "2026-09-12", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 104, longShare: 0.2, familiarity: 1.0429 },
        { id: 24422, date: "2026-09-14", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 59, longShare: 0.141, familiarity: 1.3718 },
        { id: 24423, date: "2026-09-15", rows: 16, cols: 15, words: 81, blocks: 42, openSquares: 68, longShare: 0.0741, familiarity: 1.1728 },
        { id: 24424, date: "2026-09-16", rows: 15, cols: 15, words: 78, blocks: 39, openSquares: 56, longShare: 0.1026, familiarity: 1.1795 },
        { id: 24425, date: "2026-09-17", rows: 15, cols: 14, words: 79, blocks: 38, openSquares: 56, longShare: 0.0127, familiarity: 1.3544 },
        { id: 24426, date: "2026-09-18", rows: 15, cols: 15, words: 68, blocks: 38, openSquares: 79, longShare: 0.1765, familiarity: 0.9412 },
        { id: 24421, date: "2026-09-19", rows: 15, cols: 15, words: 64, blocks: 32, openSquares: 95, longShare: 0.3125, familiarity: 0.9219 },
        { id: 24427, date: "2026-09-20", rows: 21, cols: 21, words: 140, blocks: 77, openSquares: 118, longShare: 0.1429, familiarity: 1.0714 },
        { id: 24460, date: "2026-09-21", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 65, longShare: 0.0789, familiarity: 1.3158 },
        { id: 24461, date: "2026-09-22", rows: 15, cols: 15, words: 72, blocks: 40, openSquares: 74, longShare: 0.0833, familiarity: 1.0278 },
        { id: 24471, date: "2026-09-23", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 71, longShare: 0.1081, familiarity: 1.2162 },
        { id: 24456, date: "2026-09-25", rows: 15, cols: 15, words: 70, blocks: 32, openSquares: 76, longShare: 0.2, familiarity: 1.1571 },
        { id: 24472, date: "2026-09-26", rows: 15, cols: 15, words: 64, blocks: 36, openSquares: 93, longShare: 0.2188, familiarity: 0.7813 },
        { id: 24470, date: "2026-09-27", rows: 21, cols: 21, words: 140, blocks: 83, openSquares: 124, longShare: 0.0571, familiarity: 0.9214 },
        { id: 24483, date: "2026-09-28", rows: 15, cols: 15, words: 78, blocks: 37, openSquares: 70, longShare: 0.0513, familiarity: 1.1667 },
        { id: 24484, date: "2026-09-29", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 62, longShare: 0.1154, familiarity: 1.1667 },
        { id: 24482, date: "2026-09-30", rows: 15, cols: 15, words: 72, blocks: 34, openSquares: 77, longShare: 0.1528, familiarity: 0.9861 },
        { id: 24491, date: "2026-10-01", rows: 15, cols: 15, words: 78, blocks: 36, openSquares: 72, longShare: 0.0513, familiarity: 1.1154 },
        { id: 24509, date: "2026-10-02", rows: 15, cols: 15, words: 70, blocks: 30, openSquares: 87, longShare: 0.2286, familiarity: 0.9857 },
        { id: 24510, date: "2026-10-03", rows: 15, cols: 15, words: 70, blocks: 27, openSquares: 90, longShare: 0.2286, familiarity: 0.8714 },
        { id: 24498, date: "2026-10-04", rows: 22, cols: 22, words: 128, blocks: 132, openSquares: 132, longShare: 0.25, familiarity: 1.0859 },
        { id: 24512, date: "2026-10-05", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 61, longShare: 0.0769, familiarity: 1.1538 },
        { id: 24520, date: "2026-10-06", rows: 15, cols: 15, words: 77, blocks: 40, openSquares: 68, longShare: 0.0909, familiarity: 1.1039 },
        { id: 24511, date: "2026-10-07", rows: 15, cols: 15, words: 72, blocks: 38, openSquares: 87, longShare: 0.125, familiarity: 1.0278 },
        { id: 24514, date: "2026-10-08", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 64, longShare: 0.1486, familiarity: 1.2162 },
        { id: 24521, date: "2026-10-09", rows: 15, cols: 15, words: 68, blocks: 34, openSquares: 81, longShare: 0.2941, familiarity: 0.9706 },
        { id: 24522, date: "2026-10-10", rows: 15, cols: 15, words: 70, blocks: 28, openSquares: 92, longShare: 0.2429, familiarity: 0.9 },
        { id: 24492, date: "2026-10-11", rows: 21, cols: 21, words: 140, blocks: 74, openSquares: 101, longShare: 0.1286, familiarity: 1.1214 },
        { id: 24534, date: "2026-10-12", rows: 15, cols: 15, words: 78, blocks: 40, openSquares: 56, longShare: 0.0641, familiarity: 1.3077 },
        { id: 24531, date: "2026-10-13", rows: 15, cols: 15, words: 76, blocks: 37, openSquares: 76, longShare: 0.1316, familiarity: 1.0526 },
        { id: 24533, date: "2026-10-14", rows: 15, cols: 15, words: 78, blocks: 42, openSquares: 62, longShare: 0.0769, familiarity: 1.3077 },
        { id: 24535, date: "2026-10-15", rows: 15, cols: 15, words: 74, blocks: 38, openSquares: 81, longShare: 0.0946, familiarity: 1.1081 },
        { id: 24536, date: "2026-10-16", rows: 15, cols: 15, words: 68, blocks: 32, openSquares: 87, longShare: 0.1029, familiarity: 1.0147 },
        { id: 24537, date: "2026-10-17", rows: 15, cols: 15, words: 66, blocks: 28, openSquares: 105, longShare: 0.2727, familiarity: 0.9091 },
        { id: 24532, date: "2026-10-18", rows: 21, cols: 21, words: 136, blocks: 76, openSquares: 119, longShare: 0.1103, familiarity: 0.9926 },
        { id: 24558, date: "2026-10-19", rows: 15, cols: 15, words: 78, blocks: 41, openSquares: 50, longShare: 0.0769, familiarity: 1.1282 },
        { id: 24559, date: "2026-10-20", rows: 15, cols: 15, words: 76, blocks: 36, openSquares: 69, longShare: 0.0921, familiarity: 1.1842 },
        { id: 24566, date: "2026-10-21", rows: 15, cols: 15, words: 74, blocks: 34, openSquares: 74, longShare: 0.1622, familiarity: 1.1622 },
        { id: 24567, date: "2026-10-22", rows: 15, cols: 15, words: 74, blocks: 35, openSquares: 82, longShare: 0.1351, familiarity: 0.9595 },
        { id: 24568, date: "2026-10-23", rows: 15, cols: 15, words: 70, blocks: 31, openSquares: 80, longShare: 0.2571, familiarity: 0.9571 },
        { id: 24569, date: "2026-10-24", rows: 15, cols: 15, words: 62, blocks: 44, openSquares: 81, longShare: 0.1935, familiarity: 1 },
        { id: 24560, date: "2026-10-25", rows: 21, cols: 21, words: 138, blocks: 81, openSquares: 106, longShare: 0.1014, familiarity: 1.0725 },
        { id: 24598, date: "2026-10-26", rows: 15, cols: 15, words: 78, blocks: 38, openSquares: 59, longShare: 0.1154, familiarity: 1.2949 },
        { id: 24589, date: "2026-10-27", rows: 15, cols: 15, words: 76, blocks: 38, openSquares: 64, longShare: 0.0789, familiarity: 1.1842 },
        { id: 24590, date: "2026-10-28", rows: 16, cols: 16, words: 86, blocks: 42, openSquares: 84, longShare: 0.093, familiarity: 1.1628 },
        { id: 24576, date: "2026-10-29", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 73, longShare: 0.1429, familiarity: 0.9429 },
        { id: 24604, date: "2026-10-30", rows: 15, cols: 15, words: 70, blocks: 34, openSquares: 81, longShare: 0.2, familiarity: 1.1571 },
        { id: 24605, date: "2026-10-31", rows: 15, cols: 15, words: 66, blocks: 32, openSquares: 93, longShare: 0.2576, familiarity: 1.0606 },
        { id: 24571, date: "2026-11-01", rows: 21, cols: 21, words: 136, blocks: 88, openSquares: 121, longShare: 0.1029, familiarity: 1.125 }
      ]
    };
  }
});

// vendor/src/model/clues.ts
function clueFor(puzzle, entry) {
  return puzzle.clues.find((clue) => sameEntry(clue, entry));
}
function slotFor(slots, entry) {
  return slots.find((slot) => sameEntry(slot, entry));
}
function updateClue(puzzle, slot, patch) {
  return produce(puzzle, (draft) => {
    let clue = draft.clues.find((c) => sameEntry(c, slot));
    if (!clue) {
      clue = { row: slot.row, col: slot.col, direction: slot.direction, text: "", answer: "", role: null, refs: [] };
      draft.clues.push(clue);
    }
    patch(clue);
    if (clue.text === "" && clue.role === null) draft.clues = draft.clues.filter((c) => c !== clue);
  });
}
function setClue(puzzle, slots, slot, text) {
  const trimmed = text.trim();
  if ((clueFor(puzzle, slot)?.text ?? "") === trimmed) return puzzle;
  return updateClue(puzzle, slot, (clue) => {
    clue.text = trimmed;
    clue.answer = slotPattern(puzzle, slot);
    clue.refs = resolveRefs(trimmed, slots);
  });
}
function parseRefs(text) {
  const mentions = [];
  for (const group of text.matchAll(REF_GROUP)) {
    const direction = group[2] === "Across" ? "across" : "down";
    for (const n of group[1].matchAll(/\d+/g)) {
      const start = group.index + n.index;
      mentions.push({ number: Number(n[0]), direction, start, end: start + n[0].length });
    }
  }
  return mentions;
}
function resolveRefs(text, slots) {
  return parseRefs(text).map(({ number, direction }) => {
    const slot = slots.find((s) => s.number === number && s.direction === direction);
    return slot ? { row: slot.row, col: slot.col, direction } : null;
  });
}
var sameEntry, isClued, REF_GROUP;
var init_clues = __esm({
  "vendor/src/model/clues.ts"() {
    "use strict";
    init_immer();
    init_entries();
    init_numbering();
    sameEntry = (a, b) => a.row === b.row && a.col === b.col && a.direction === b.direction;
    isClued = (clue) => !!clue && clue.text.trim() !== "";
    REF_GROUP = /\b(\d+(?:-?\s*(?:,\s*(?:and\s+|&\s*)?|\s+and\s+|\s*&\s*)\d+)*)-?\s*(Across|Down)\b/g;
  }
});

// vendor/src/model/symmetry.ts
function isSymmetryAvailable(mode, rows, cols) {
  return mode !== "diagonal" || rows === cols;
}
function partnerOf(r, c, rows, cols, mode) {
  switch (mode) {
    case "rotational":
      return [rows - 1 - r, cols - 1 - c];
    case "mirror-lr":
      return [r, cols - 1 - c];
    case "mirror-tb":
      return [rows - 1 - r, c];
    case "diagonal":
      return [c, r];
    case "none":
      return [r, c];
  }
}
function toggleBlock(puzzle, r, c) {
  const block = !puzzle.cells[r][c].block;
  const [pr, pc] = partnerOf(r, c, puzzle.rows, puzzle.cols, puzzle.symmetry);
  return produce(puzzle, (draft) => {
    for (const cell of [draft.cells[r][c], draft.cells[pr][pc]]) {
      cell.block = block;
      if (block) {
        cell.value = "";
        cell.circled = false;
        cell.shaded = false;
      }
    }
  });
}
function eachPair(puzzle, mode, fn) {
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const [pr, pc] = partnerOf(r, c, puzzle.rows, puzzle.cols, mode);
      if (r * puzzle.cols + c < pr * puzzle.cols + pc) fn([r, c], [pr, pc]);
    }
  }
}
function findAsymmetric(puzzle, mode) {
  const broken = [];
  eachPair(puzzle, mode, ([r, c], [pr, pc]) => {
    if (puzzle.cells[r][c].block !== puzzle.cells[pr][pc].block) broken.push([r, c], [pr, pc]);
  });
  return broken;
}
var SYMMETRY_MODES, SYMMETRY_LABELS;
var init_symmetry = __esm({
  "vendor/src/model/symmetry.ts"() {
    "use strict";
    init_immer();
    SYMMETRY_MODES = ["rotational", "mirror-lr", "mirror-tb", "diagonal", "none"];
    SYMMETRY_LABELS = {
      rotational: "Rotational (180\xB0)",
      "mirror-lr": "Mirror left\u2013right",
      "mirror-tb": "Mirror top\u2013bottom",
      diagonal: "Diagonal",
      none: "None"
    };
  }
});

// vendor/src/model/grid.ts
function checkSize(n) {
  if (!Number.isInteger(n) || n < MIN_SIZE || n > MAX_SIZE) {
    throw new RangeError(`Grid size must be a whole number from ${MIN_SIZE} to ${MAX_SIZE}, got ${n}`);
  }
}
function blankCell() {
  return { block: false, value: "", circled: false, shaded: false };
}
function fitSymmetry(symmetry, rows, cols) {
  return isSymmetryAvailable(symmetry, rows, cols) ? symmetry : "rotational";
}
function createPuzzle(rows, cols, symmetry = "rotational", type = "themed") {
  checkSize(rows);
  checkSize(cols);
  return {
    rows,
    cols,
    symmetry: fitSymmetry(symmetry, rows, cols),
    type,
    cells: Array.from({ length: rows }, () => Array.from({ length: cols }, blankCell)),
    clues: []
  };
}
var MIN_SIZE, MAX_SIZE;
var init_grid = __esm({
  "vendor/src/model/grid.ts"() {
    "use strict";
    init_symmetry();
    MIN_SIZE = 3;
    MAX_SIZE = 25;
  }
});

// vendor/src/io/ipuz.ts
function toIpuz(puzzle, title) {
  const { numbers, slots } = computeNumbering(puzzle);
  const clueList = (direction) => slots.flatMap((slot) => {
    const clue = clueFor(puzzle, slot);
    return slot.direction === direction && isClued(clue) ? [[slot.number, clue.text]] : [];
  });
  return JSON.stringify({
    version: "http://ipuz.org/v2",
    kind: ["http://ipuz.org/crossword#1"],
    ...title && { title },
    dimensions: { width: puzzle.cols, height: puzzle.rows },
    block: "#",
    empty: 0,
    puzzle: puzzle.cells.map(
      (row, r) => row.map((cell, c) => {
        if (cell.block) return "#";
        const number = numbers[r][c] ?? 0;
        if (!cell.circled && !cell.shaded) return number;
        return { cell: number, style: { ...cell.circled && CIRCLE, ...cell.shaded && SHADE } };
      })
    ),
    solution: puzzle.cells.map((row) => row.map((cell) => cell.block ? "#" : cell.value || null)),
    clues: { Across: clueList("across"), Down: clueList("down") },
    [EXTENSION]: {
      symmetry: puzzle.symmetry,
      type: puzzle.type,
      ...puzzle.clues.length > 0 && { clues: puzzle.clues }
    }
  });
}
function plainText(html) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };
  return html.replace(/<[^>]*>/g, "").replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e) => entities[e]).trim();
}
function detectSymmetry(puzzle) {
  return SYMMETRY_MODES.find(
    (mode) => mode !== "none" && isSymmetryAvailable(mode, puzzle.rows, puzzle.cols) && findAsymmetric(puzzle, mode).length === 0
  ) ?? "none";
}
function fromIpuz(text, fallbackName) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError("Not a valid .ipuz file (it isn\u2019t JSON).");
  }
  if (!isObject(data) || !Array.isArray(data.kind) || !data.kind.some((k) => String(k).includes("ipuz.org/crossword"))) {
    throw new ImportError("This .ipuz file isn\u2019t a crossword.");
  }
  const dims = isObject(data.dimensions) ? data.dimensions : {};
  const [width, height] = [Number(dims.width), Number(dims.height)];
  const ok = (n) => Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_SIZE;
  if (!ok(width) || !ok(height)) {
    throw new ImportError(`Grids must be ${MIN_SIZE}\u2013${MAX_SIZE} squares on each side; this one is ${width}\xD7${height}.`);
  }
  const fits = (grid) => Array.isArray(grid) && grid.length === height && grid.every((row) => Array.isArray(row) && row.length === width);
  const solution = data.solution ?? null;
  if (!fits(data.puzzle) || solution !== null && !fits(solution)) {
    throw new ImportError(`The grid data doesn\u2019t match the stated ${width}\xD7${height} size.`);
  }
  const blockChar = data.block ?? "#";
  const styles = isObject(data.styles) ? data.styles : {};
  const isCircle = (style) => {
    const resolved = typeof style === "string" ? styles[style] : style;
    return isObject(resolved) && resolved.shapebg === "circle";
  };
  const isShaded = (style) => {
    const resolved = typeof style === "string" ? styles[style] : style;
    if (!isObject(resolved)) return false;
    const color = typeof resolved.color === "string" ? resolved.color.replace("#", "").toLowerCase() : "";
    return resolved.highlight === true || color !== "" && color !== "fff" && color !== "ffffff" && color !== "white";
  };
  const ext = isObject(data[EXTENSION]) ? data[EXTENSION] : {};
  const type = ext.type === "themeless" ? "themeless" : "themed";
  const puzzle = createPuzzle(height, width, "none", type);
  data.puzzle.forEach(
    (row, r) => row.forEach((raw, c) => {
      const cell = puzzle.cells[r][c];
      const value = isObject(raw) ? raw.cell : raw;
      if (value === null || value === blockChar) {
        cell.block = true;
        return;
      }
      cell.circled = isObject(raw) && isCircle(raw.style);
      cell.shaded = isObject(raw) && isShaded(raw.style);
      const answer = solution ? solution[r][c] : null;
      const letters = isObject(answer) ? answer.value : answer;
      if (typeof letters === "string" && letters !== blockChar) cell.value = letters.toUpperCase();
    })
  );
  const stated = SYMMETRY_MODES.find((m) => m === ext.symmetry);
  puzzle.symmetry = stated && isSymmetryAvailable(stated, height, width) ? stated : detectSymmetry(puzzle);
  const title = typeof data.title === "string" ? plainText(data.title) : "";
  return { name: title || fallbackName, puzzle: readClues(puzzle, data.clues, ext.clues) };
}
function listedClue(raw) {
  if (Array.isArray(raw)) return { number: Number(raw[0]), text: String(raw[1] ?? "") };
  if (isObject(raw)) return { number: Number(raw.number), text: String(raw.clue ?? "") };
  const match = typeof raw === "string" ? /^(\d+)\s*(.*)$/.exec(raw) : null;
  return match ? { number: Number(match[1]), text: match[2] } : null;
}
function readClues(puzzle, lists, saved) {
  const { slots } = computeNumbering(puzzle);
  let result = puzzle;
  if (isObject(lists)) {
    for (const [name, list] of Object.entries(lists)) {
      const direction = /^across/i.test(name) ? "across" : /^down/i.test(name) ? "down" : null;
      if (!direction || !Array.isArray(list)) continue;
      for (const raw of list) {
        const listed = listedClue(raw);
        const slot = listed && slots.find((s) => s.number === listed.number && s.direction === direction);
        if (slot) result = setClue(result, slots, slot, plainText(listed.text));
      }
    }
  }
  if (!Array.isArray(saved)) return result;
  const records = saved.filter(isRef).map((raw) => {
    const r = raw;
    const listed = clueFor(result, r);
    const text = listed?.text ?? (typeof r.text === "string" ? r.text : "");
    const savedRefs = Array.isArray(r.refs) && (!listed || listed.text === r.text) ? r.refs : null;
    return {
      row: r.row,
      col: r.col,
      direction: r.direction,
      text,
      answer: typeof r.answer === "string" ? r.answer : listed?.answer ?? "",
      role: r.role === "theme" || r.role === "revealer" ? r.role : null,
      refs: savedRefs ? savedRefs.map((ref) => isRef(ref) ? ref : null) : listed?.refs ?? []
    };
  });
  const listedOnly = result.clues.filter((c) => !records.some((r) => sameEntry(r, c)));
  const clues = [...records, ...listedOnly].filter((c) => slotFor(slots, c) && (c.text || c.role));
  return { ...result, clues };
}
var EXTENSION, CIRCLE, SHADE, ImportError, isObject, isRef;
var init_ipuz = __esm({
  "vendor/src/io/ipuz.ts"() {
    "use strict";
    init_clues();
    init_grid();
    init_numbering();
    init_symmetry();
    EXTENSION = "x-xword-builder";
    CIRCLE = { shapebg: "circle" };
    SHADE = { color: "C0C0C0" };
    ImportError = class extends Error {
    };
    isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
    isRef = (v) => isObject(v) && Number.isInteger(v.row) && Number.isInteger(v.col) && (v.direction === "across" || v.direction === "down");
  }
});

// vendor/src/rules/stats.ts
function wordCountGuideline(p) {
  if (p.rows === 21 && p.cols === 21) return { label: "NYT max", max: 140, estimated: false };
  if (p.rows === 15 && p.cols === 15) return { label: "NYT max", max: 78, estimated: false };
  const cells = p.rows * p.cols;
  if (cells < MIN_CELLS_FOR_ESTIMATE) return null;
  return { label: "NYT max", max: Math.round(78 * cells / 225), estimated: true };
}
function computeStats(p, slots) {
  const cells = p.cells.flat();
  const blocks = cells.filter((cell) => cell.block).length;
  let openSquares = 0;
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (p.cells[r][c].block) continue;
      let open = true;
      for (let dr = -1; dr <= 1 && open; dr++) {
        for (let dc = -1; dc <= 1 && open; dc++) open = !p.cells[r + dr]?.[c + dc]?.block;
      }
      if (open) openSquares++;
    }
  }
  const lengths = Array.from({ length: Math.max(p.rows, p.cols) - 2 }, (_, i) => ({
    length: i + 3,
    count: slots.filter((s) => s.length === i + 3).length
  }));
  return {
    words: slots.length,
    guideline: wordCountGuideline(p),
    blocks,
    blockShare: blocks / cells.length,
    openSquares,
    lengths
  };
}
var MIN_CELLS_FOR_ESTIMATE;
var init_stats = __esm({
  "vendor/src/rules/stats.ts"() {
    "use strict";
    MIN_CELLS_FOR_ESTIMATE = 121;
  }
});

// vendor/src/rules/difficulty.ts
function patternMetrics(puzzle, slots) {
  const { words: words2, blocks, openSquares } = computeStats(puzzle, slots);
  const long = slots.filter((s) => s.length >= LONG_ENTRY).length;
  return { words: words2, blocks, openSquares, longShare: words2 ? long / words2 : 0 };
}
function familiarityTier(uses2) {
  return FAMILIARITY_TIERS.findLastIndex((tier) => uses2 >= tier.minUses);
}
function completeEntries(puzzle, slots) {
  return slots.map((slot) => slotPattern(puzzle, slot)).filter((letters) => /^[A-Z]+$/.test(letters));
}
function familiarity(entries, usesOf) {
  if (!entries.length) return null;
  const tiers = entries.map((answer) => familiarityTier(usesOf(answer)));
  return {
    score: tiers.reduce((sum, t) => sum + t, 0) / tiers.length,
    tierShares: FAMILIARITY_TIERS.map((_, t) => tiers.filter((x) => x === t).length / tiers.length)
  };
}
function countBelow(sorted, value, orEqual) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = lo + hi >>> 1;
    if (sorted[mid] < value || orEqual && sorted[mid] === value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
function percentileOf(value, sorted, harder) {
  const below = countBelow(sorted, value, false);
  const ties = countBelow(sorted, value, true) - below;
  const easier = harder === "higher" ? below : sorted.length - below - ties;
  return (easier + ties / 2) / sorted.length;
}
function rankAgainst(history, rows, cols, metrics, minCohort = MIN_COHORT) {
  const used = METRICS.filter((m) => metrics[m.key] !== null);
  const cohort = history.puzzles.filter(
    (p) => p.rows === rows && p.cols === cols && used.every((m) => p[m.key] !== null)
  );
  if (cohort.length === 0 || cohort.length < minCohort) return null;
  const cohortDays = cohort.map((p) => dayOf(p.date));
  const days = (percentiles, values) => WEEK.flatMap((day) => {
    const onDay = (xs) => xs.filter((_, i) => cohortDays[i] === day);
    const dayPercentiles = onDay(percentiles);
    if (!dayPercentiles.length) return [];
    return [{ day: DAY_NAMES[day], percentile: median(dayPercentiles), ...values && { value: median(onDay(values)) } }];
  });
  const cohortPercentiles = new Map(
    used.map((m) => {
      const values = cohort.map((p) => p[m.key]);
      const sorted = ascending(values);
      return [m.key, { values, sorted, percentiles: values.map((v) => percentileOf(v, sorted, m.harder)) }];
    })
  );
  const ranked = Object.fromEntries(
    used.map((m) => {
      const { values, sorted, percentiles } = cohortPercentiles.get(m.key);
      return [m.key, { percentile: percentileOf(metrics[m.key], sorted, m.harder), days: days(percentiles, values) }];
    })
  );
  const group = (members) => {
    const cohortMeans = cohort.map((_, i) => mean(members.map((m) => cohortPercentiles.get(m.key).percentiles[i])));
    const sorted = ascending(cohortMeans);
    const current2 = mean(members.map((m) => ranked[m.key].percentile));
    return {
      percentile: percentileOf(current2, sorted, "higher"),
      days: days(cohortMeans.map((c) => percentileOf(c, sorted, "higher")))
    };
  };
  const fillMetrics = used.filter((m) => m.group === "fill");
  const overall = group(used);
  const closest = overall.days.length > 1 ? overall.days.reduce(
    (best, d) => Math.abs(d.percentile - overall.percentile) < Math.abs(best.percentile - overall.percentile) ? d : best
  ).day : null;
  return {
    cohort: { size: cohort.length, from: cohort[0].date, to: cohort.at(-1).date },
    metrics: ranked,
    pattern: group(used.filter((m) => m.group === "pattern")),
    fill: fillMetrics.length ? group(fillMetrics) : null,
    overall: { ...overall, patternOnly: fillMetrics.length === 0, closestDay: closest }
  };
}
var LONG_ENTRY, FAMILIARITY_TIERS, METRICS, MIN_COHORT, WEEK, DAY_NAMES, dayOf, ascending, median, mean;
var init_difficulty = __esm({
  "vendor/src/rules/difficulty.ts"() {
    "use strict";
    init_entries();
    init_stats();
    LONG_ENTRY = 8;
    FAMILIARITY_TIERS = [
      { name: "fresh", minUses: 0 },
      { name: "seen", minUses: 1 },
      { name: "common", minUses: 10 },
      { name: "very common", minUses: 40 }
    ];
    METRICS = [
      { key: "words", label: "Words", group: "pattern", harder: "lower", help: "Entries in the grid. Fewer, longer entries make a harder grid." },
      { key: "blocks", label: "Blocks", group: "pattern", harder: "lower", help: "Black squares. Fewer blocks mean bigger open areas, which are harder." },
      {
        key: "openSquares",
        label: "Open squares",
        group: "pattern",
        harder: "higher",
        help: "White squares touching no block, even diagonally. More is harder."
      },
      { key: "longShare", label: "Long entries", group: "pattern", harder: "higher", help: "Share of entries with 8 or more squares. More is harder." },
      {
        key: "familiarity",
        label: "Familiarity",
        group: "fill",
        harder: "lower",
        help: "How often these answers ran in the last 3 years, from 0 (fresh) to 3 (very common), averaged over complete entries. Fresher fill is harder."
      }
    ];
    MIN_COHORT = 30;
    WEEK = [1, 2, 3, 4, 5, 6, 0];
    DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayOf = (date) => (/* @__PURE__ */ new Date(`${date}T12:00:00Z`)).getUTCDay();
    ascending = (xs) => [...xs].sort((a, b) => a - b);
    median = (xs) => ascending(xs)[Math.floor(xs.length / 2)] ?? 0;
    mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
  }
});

// vendor/src/rules/validate.ts
function runFrom(p, r, c, dr, dc) {
  let n = 0;
  while (isWhite(p, r + dr * (n + 1), c + dc * (n + 1))) n++;
  return n;
}
function shortEntries(slots) {
  return slots.filter((s) => s.length < 3).sort(acrossFirst).map((s) => ({ rule: "V1", tier: "error", message: `${s.length}-letter entry: ${slotName(s)}`, cells: s.cells }));
}
function uncheckedSquares(p) {
  const cells = [];
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (isBlock(p, r, c)) continue;
      const across = runFrom(p, r, c, 0, -1) + runFrom(p, r, c, 0, 1);
      const down = runFrom(p, r, c, -1, 0) + runFrom(p, r, c, 1, 0);
      if (across === 0 || down === 0) cells.push([r, c]);
    }
  }
  if (cells.length === 0) return [];
  const message = `${cells.length} unchecked square${cells.length === 1 ? "" : "s"}`;
  return [{ rule: "V2", tier: "error", message, cells }];
}
function regions(p, include) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (!include(r, c) || seen.has(r * p.cols + c)) continue;
      const region = [];
      const stack = [[r, c]];
      seen.add(r * p.cols + c);
      while (stack.length) {
        const [cr, cc] = stack.pop();
        region.push([cr, cc]);
        for (const [dr, dc] of NEIGHBORS) {
          const [nr, nc] = [cr + dr, cc + dc];
          if (inGrid(p, nr, nc) && include(nr, nc) && !seen.has(nr * p.cols + nc)) {
            seen.add(nr * p.cols + nc);
            stack.push([nr, nc]);
          }
        }
      }
      out.push(region);
    }
  }
  return out;
}
function isolatedRegions(p) {
  const found = regions(p, (r, c) => !isBlock(p, r, c));
  const largest = found.reduce((best, region) => region.length > best.length ? region : best, []);
  return found.filter((region) => region !== largest).map((region) => ({
    rule: "V3",
    tier: "error",
    message: `Isolated region of ${region.length} square${region.length === 1 ? "" : "s"}`,
    cells: region
  }));
}
function symmetryBreaks(p) {
  const cells = findAsymmetric(p, p.symmetry);
  if (cells.length === 0) return [];
  const message = `${cells.length} squares break ${SYMMETRY_LABELS[p.symmetry]} symmetry`;
  return [{ rule: "V4", tier: "error", message, cells }];
}
function blockShare(p) {
  const blocks = p.cells.flat().filter((cell) => cell.block).length;
  const share = blocks / (p.rows * p.cols);
  if (share <= MAX_BLOCK_SHARE) return [];
  const message = `Blocks are ${Math.round(share * 100)}% of the grid (${blocks})`;
  return [{ rule: "V6", tier: "warning", message, cells: [] }];
}
function blockClumps(p) {
  const inClump = /* @__PURE__ */ new Set();
  for (let r = 0; r + 2 < p.rows; r++) {
    for (let c = 0; c + 2 < p.cols; c++) {
      let solid = true;
      for (let i = 0; i < 3 && solid; i++) for (let j = 0; j < 3 && solid; j++) solid = isBlock(p, r + i, c + j);
      if (!solid) continue;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) inClump.add((r + i) * p.cols + c + j);
    }
  }
  return regions(p, (r, c) => inClump.has(r * p.cols + c)).map((cells) => ({
    rule: "V7",
    tier: "warning",
    message: `Block clump of ${cells.length} squares`,
    cells
  }));
}
function cheaterSquares(p) {
  const delta = (a, b) => Number(a + b + 1 >= 2) - Number(a >= 2) - Number(b >= 2);
  const cheaters = [];
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (!isBlock(p, r, c)) continue;
      const [left, right] = [runFrom(p, r, c, 0, -1), runFrom(p, r, c, 0, 1)];
      const [up, down] = [runFrom(p, r, c, -1, 0), runFrom(p, r, c, 1, 0)];
      if (left + right + 1 < 3 || up + down + 1 < 3) continue;
      if (delta(left, right) + delta(up, down) === 0) cheaters.push([r, c]);
    }
  }
  return cheaters;
}
function cheaterIssues(p) {
  const cells = cheaterSquares(p);
  if (cells.length === 0) return [];
  const message = `${cells.length} cheater square${cells.length === 1 ? "" : "s"}`;
  return [{ rule: "V8", tier: "info", message, cells }];
}
function chokePoints(p) {
  const id = (r, c) => r * p.cols + c;
  const whiteNeighbors = (u) => {
    const [r, c] = [Math.floor(u / p.cols), u % p.cols];
    return NEIGHBORS.filter(([dr, dc]) => isWhite(p, r + dr, c + dc)).map(([dr, dc]) => id(r + dr, c + dc));
  };
  const disc = new Array(p.rows * p.cols).fill(-1);
  const low = new Array(p.rows * p.cols).fill(0);
  const cuts = /* @__PURE__ */ new Set();
  let time = 0;
  const dfs = (u, parent) => {
    disc[u] = low[u] = time++;
    let children = 0;
    for (const v of whiteNeighbors(u)) {
      if (disc[v] === -1) {
        children++;
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (parent !== -1 && low[v] >= disc[u]) cuts.add(u);
      } else if (v !== parent) {
        low[u] = Math.min(low[u], disc[v]);
      }
    }
    if (parent === -1 && children > 1) cuts.add(u);
  };
  for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) if (isWhite(p, r, c) && disc[id(r, c)] === -1) dfs(id(r, c), -1);
  const unchecked = new Set(uncheckedSquares(p).flatMap((issue) => issue.cells.map(([r, c]) => id(r, c))));
  return [...cuts].filter((u) => !unchecked.has(u) && !whiteNeighbors(u).some((v) => cuts.has(v))).sort((a, b) => a - b).map((u) => {
    const seen = /* @__PURE__ */ new Set([u]);
    const sizes = whiteNeighbors(u).flatMap((start) => {
      if (seen.has(start)) return [];
      let size = 0;
      const stack = [start];
      seen.add(start);
      while (stack.length) {
        size++;
        for (const v of whiteNeighbors(stack.pop())) if (!seen.has(v)) seen.add(v), stack.push(v);
      }
      return [size];
    });
    const cutOff = sizes.reduce((a, b) => a + b, 0) - Math.max(...sizes);
    return {
      rule: "V9",
      tier: "warning",
      message: `${cutOff} squares connect to the rest of the grid only through this square`,
      cells: [[Math.floor(u / p.cols), u % p.cols]]
    };
  });
}
function duplicateEntries(slots, p) {
  const byWord = /* @__PURE__ */ new Map();
  for (const slot of slots) {
    const values = slot.cells.map(([r, c]) => p.cells[r][c].value);
    if (values.some((v) => v === "")) continue;
    const word = values.join("");
    byWord.set(word, [...byWord.get(word) ?? [], slot]);
  }
  return [...byWord].filter(([, found]) => found.length > 1).map(([word, found]) => ({
    rule: "V10",
    tier: "error",
    message: `${word} appears ${found.length} times (${[...found].sort(acrossFirst).map(slotName).join(", ")})`,
    cells: found.flatMap((s) => s.cells)
  }));
}
function pluralsOf(word) {
  if (/[^AEIOU]Y$/.test(word)) return [`${word.slice(0, -1)}IES`];
  if (/O$/.test(word)) return [`${word}S`, `${word}ES`];
  if (/(S|X|Z|CH|SH)$/.test(word)) return [`${word}ES`];
  return [`${word}S`];
}
function pluralEntries(slots, p) {
  const byWord = /* @__PURE__ */ new Map();
  for (const slot of slots) {
    const word = slotPattern(p, slot);
    if (!word.includes("?")) byWord.set(word, [...byWord.get(word) ?? [], slot]);
  }
  return [...byWord].flatMap(
    ([word, found]) => pluralsOf(word).flatMap((plural) => {
      const plurals = byWord.get(plural);
      if (!plurals) return [];
      const both = [...found, ...plurals];
      return [
        {
          rule: "V18",
          tier: "warning",
          message: `${word} and ${plural} look like the same word (${[...both].sort(acrossFirst).map(slotName).join(", ")})`,
          cells: both.flatMap((s) => s.cells)
        }
      ];
    })
  );
}
function unfillableSlots(slots, counts, p, accepted = /* @__PURE__ */ new Set()) {
  return slots.filter((s, i) => counts[i] === 0 && s.length >= 3 && !accepted.has(slotPattern(p, s))).sort(acrossFirst).map((s) => {
    const pattern = slotPattern(p, s);
    if (pattern.includes("?")) {
      const message2 = `No word fits ${slotName(s)} (${pattern.replaceAll("?", "\xB7")})`;
      return { rule: "V11", tier: "error", message: message2, cells: s.cells };
    }
    const message = `${pattern} is not in the word list (${slotName(s)})`;
    return { rule: "V11", tier: "error", message, cells: s.cells, word: pattern };
  });
}
function rebusIssues(p) {
  const cells = [];
  const strings = /* @__PURE__ */ new Set();
  p.cells.forEach(
    (row, r) => row.forEach((cell, c) => {
      if (cell.block || cell.value.length < 2) return;
      cells.push([r, c]);
      strings.add(cell.value);
    })
  );
  if (strings.size < 2) return [];
  return [{ rule: "V12", tier: "info", message: `Rebus squares differ: ${[...strings].join(", ")}`, cells }];
}
function validate(p) {
  const { slots } = computeNumbering(p);
  return [
    ...shortEntries(slots),
    ...uncheckedSquares(p),
    ...isolatedRegions(p),
    ...symmetryBreaks(p),
    ...duplicateEntries(slots, p),
    ...pluralEntries(slots, p),
    ...blockShare(p),
    ...blockClumps(p),
    ...chokePoints(p),
    ...cheaterIssues(p),
    ...rebusIssues(p)
  ].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
}
var NEIGHBORS, isBlock, inGrid, isWhite, slotName, acrossFirst, MAX_BLOCK_SHARE, TIER_ORDER;
var init_validate = __esm({
  "vendor/src/rules/validate.ts"() {
    "use strict";
    init_entries();
    init_numbering();
    init_symmetry();
    NEIGHBORS = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ];
    isBlock = (p, r, c) => p.cells[r][c].block;
    inGrid = (p, r, c) => r >= 0 && r < p.rows && c >= 0 && c < p.cols;
    isWhite = (p, r, c) => inGrid(p, r, c) && !isBlock(p, r, c);
    slotName = (s) => `${s.number} ${s.direction === "across" ? "Across" : "Down"}`;
    acrossFirst = (a, b) => a.direction === b.direction ? a.number - b.number : a.direction === "across" ? -1 : 1;
    MAX_BLOCK_SHARE = 1 / 6;
    TIER_ORDER = { error: 0, warning: 1, info: 2 };
  }
});

// vendor/scripts/xwCommands.ts
function patternToPuzzle(text, symmetry) {
  const rows = text.split("\n").map((row) => row.trim()).filter(Boolean);
  const cols = rows[0]?.length ?? 0;
  if (rows.some((row) => row.length !== cols)) throw new Error("Every row of a pattern must be the same width.");
  const puzzle = createPuzzle(rows.length, cols, symmetry);
  return produce(puzzle, (draft) => {
    rows.forEach(
      (row, r) => [...row].forEach((ch, c) => {
        const cell = draft.cells[r][c];
        if (ch === "#") cell.block = true;
        else if (ch !== ".") cell.value = ch.toUpperCase();
      })
    );
  });
}
function findEntry(puzzle, ref) {
  const match = /^(\d+)([AD])$/i.exec(ref);
  if (!match) throw new Error(`Name entries like 12A or 3D, not "${ref}".`);
  const direction = match[2].toUpperCase() === "A" ? "across" : "down";
  const slot = computeNumbering(puzzle).slots.find((s) => s.number === Number(match[1]) && s.direction === direction);
  if (!slot) throw new Error(`No entry ${ref} in this grid.`);
  return slot;
}
function placeEntry(puzzle, ref, word) {
  const slot = findEntry(puzzle, ref);
  const letters = word.toUpperCase().replace(/[^A-Z]/g, "");
  const pattern = slotPattern(puzzle, slot);
  if (pattern === letters) return puzzle;
  const placed = placeWord(puzzle, slot, letters);
  if (placed === puzzle) throw new Error(`${letters} doesn't fit ${ref} (${pattern}).`);
  return placed;
}
function clearEntry(puzzle, ref) {
  const slot = findEntry(puzzle, ref);
  return produce(puzzle, (draft) => {
    for (const [r, c] of slot.cells) draft.cells[r][c].value = "";
  });
}
function toggleBlocks(puzzle, squares) {
  return squares.reduce((next, [r, c]) => {
    if (r < 1 || c < 1 || r > next.rows || c > next.cols) throw new Error(`r${r}c${c} is off the grid.`);
    return toggleBlock(next, r - 1, c - 1);
  }, puzzle);
}
function checkPuzzle(puzzle, index2, options = {}) {
  const { slots } = computeNumbering(puzzle);
  const entries = completeEntries(puzzle, slots);
  const offList = entries.filter((entry) => entry.length >= 3 && countMatches(index2, entry) === 0);
  const accepted = new Set(options.accepted?.includes("*") ? offList : options.accepted?.map(normalize));
  const counts = slots.map((slot) => countMatches(index2, slotPattern(puzzle, slot)));
  return {
    issues: [...validate(puzzle), ...unfillableSlots(slots, counts, puzzle, accepted)],
    offList,
    missing: (options.required ?? []).map(normalize).filter((word) => !entries.includes(word)),
    empty: puzzle.cells.flat().filter((cell) => !cell.block && !cell.value).length
  };
}
function filterWordlist(text, minScore, ban = []) {
  const banned = new Set(ban.map(normalize));
  return text.split(/\r?\n/).filter((line) => {
    const match = /^(.+);\s*(\d+)\s*$/.exec(line);
    return match && Number(match[2]) >= minScore && !banned.has(normalize(match[1]));
  }).join("\n");
}
function renderGrid(puzzle) {
  const pad = (n) => String(n).padStart(2);
  const ruler = Array.from({ length: puzzle.cols }, (_, c) => (c + 1) % 10).join(" ");
  const rows = puzzle.cells.map(
    (row, r) => `${pad(r + 1)} ${row.map((cell) => cell.block ? "#" : cell.value || ".").join(" ")}`
  );
  return [`   ${ruler}`, ...rows].join("\n");
}
function renderEntries(puzzle, slots) {
  return slots.map((slot) => `${refOf(slot).padEnd(4)} r${slot.row + 1}c${slot.col + 1}`.padEnd(12) + ` ${slotPattern(puzzle, slot)}`).join("\n");
}
var refOf, normalize;
var init_xwCommands = __esm({
  "vendor/scripts/xwCommands.ts"() {
    "use strict";
    init_engine();
    init_entries();
    init_grid();
    init_numbering();
    init_symmetry();
    init_difficulty();
    init_validate();
    init_immer();
    refOf = (slot) => `${slot.number}${slot.direction === "across" ? "A" : "D"}`;
    normalize = (word) => word.toUpperCase().replace(/[^A-Z]/g, "");
  }
});

// vendor/scripts/xw.ts
var xw_exports = {};
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
function show(puzzle) {
  const { slots } = computeNumbering(puzzle);
  console.log(renderGrid(puzzle));
  console.log(`
Across
${renderEntries(puzzle, slots.filter((s) => s.direction === "across"))}`);
  console.log(`
Down
${renderEntries(puzzle, slots.filter((s) => s.direction === "down"))}`);
}
function check(puzzle) {
  const { slots } = computeNumbering(puzzle);
  const report = checkPuzzle(puzzle, index(), { required: words(args.require), accepted: words(args.accept) });
  const stats = computeStats(puzzle, slots);
  const counts = uses();
  const metrics = {
    ...patternMetrics(puzzle, slots),
    familiarity: familiarity(completeEntries(puzzle, slots), (answer) => counts.get(answer) ?? 0)?.score ?? null
  };
  const rank = counts.size ? rankAgainst(nytHistory_default, puzzle.rows, puzzle.cols, metrics) : null;
  console.log(renderGrid(puzzle));
  console.log(`
${stats.words} words (max ${stats.guideline?.max ?? "-"}), ${stats.blocks} blocks, ${report.empty} empty squares`);
  console.log(`Lengths: ${stats.lengths.filter((l) => l.count).map((l) => `${l.length}\xD7${l.count}`).join(" ")}`);
  for (const issue of report.issues) console.log(`${issue.tier.toUpperCase().padEnd(7)} ${issue.rule} ${issue.message}`);
  if (!report.issues.some((issue) => issue.tier === "error")) console.log("No errors.");
  if (report.offList.length) console.log(`Not on the list: ${report.offList.join(", ")}`);
  if (words(args.require).length) console.log(report.missing.length ? `MISSING: ${report.missing.join(", ")}` : "All required words are in.");
  if (rank) {
    const percent = (p) => `${Math.round(p * 100)}%`;
    console.log(
      `Difficulty: overall ${percent(rank.overall.percentile)}, pattern ${percent(rank.pattern.percentile)}${rank.fill ? `, freshness ${percent(rank.fill.percentile)}` : ""}, closest day ${rank.overall.closestDay ?? "-"}`
    );
  }
}
function find(puzzle, ref) {
  const { slots } = computeNumbering(puzzle);
  const slot = findEntry(puzzle, ref);
  const query = candidateQuery(puzzle, slots, slot);
  const result = findCandidates(index(), query, { search: args.contains, regex: args.regex }, uses(), Number(args.limit));
  console.log(`${ref} ${query.pattern}: ${result.total} matches${result.error ? ` (${result.error})` : ""}`);
  for (const c of result.candidates) {
    const room = c.crossings.length ? Math.min(...c.crossings) : "-";
    console.log(`${c.word.padEnd(slot.length + 1)} uses ${String(c.uses ?? 0).padStart(3)}  tightest crossing ${room}${c.viable ? "" : "  DEAD"}`);
  }
}
function fill(puzzle, path) {
  const { slots } = computeNumbering(puzzle);
  const request = fillRequest(puzzle, slots);
  const counts = uses();
  const result = solveFill(steeredIndex(), request, {
    budgetMs: Number(args.budget),
    maxFills: Number(args.fills),
    seed: Number(args.seed),
    variety: Number(args.variety)
  });
  console.log(`${result.fills.length} fill(s) in ${Math.round(result.elapsedMs)} ms, ${result.restarts} restarts, ${result.deadEnds} dead ends`);
  if (result.failure) {
    const named = result.failure.entries.map((e) => {
      const slot = slots[request.entries[e].slot];
      return `${slot.number}${slot.direction === "across" ? "A" : "D"}`;
    });
    console.log(`${result.failure.reason}: ${named.join(", ")}`);
  }
  result.fills.forEach((f, i) => {
    const out = path.replace(/\.ipuz$/, "") + `-fill${i + 1}.ipuz`;
    save(out, applyFill(puzzle, request, f));
    const byUses = [...f.words].sort((a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0) || a.localeCompare(b));
    console.log(`
${out}
${byUses.map((w) => `${w}:${counts.get(w) ?? 0}`).join(" ")}`);
  });
}
function pairs(list, make) {
  if (list.length % 2) throw new Error("Expected pairs of arguments.");
  return Array.from({ length: list.length / 2 }, (_, i) => make(list[2 * i], list[2 * i + 1]));
}
function main() {
  if (!command || !file) throw new Error("Usage: npm run xw -- <new|show|blocks|place|clear|find|check|fill> FILE ... (see scripts/xw.ts)");
  if (command === "new") {
    const symmetry = args.symmetry;
    const size = Number(args.size);
    save(file, args.pattern ? patternToPuzzle(readFileSync(args.pattern, "utf8"), symmetry) : createPuzzle(size, size, symmetry));
    return show(load(file));
  }
  const puzzle = load(file);
  switch (command) {
    case "show":
      return show(puzzle);
    case "blocks": {
      const squares = rest.map((s) => {
        const [r, c] = s.split(",").map(Number);
        return [r, c];
      });
      const next = toggleBlocks(puzzle, squares);
      save(file, next);
      return show(next);
    }
    case "place": {
      const next = pairs(rest, (ref, word) => [ref, word]).reduce((p, [ref, word]) => placeEntry(p, ref, word), puzzle);
      save(file, next);
      return console.log(renderGrid(next));
    }
    case "clear": {
      const next = rest.reduce(clearEntry, puzzle);
      save(file, next);
      return console.log(renderGrid(next));
    }
    case "find":
      return find(puzzle, rest[0]);
    case "check":
      return check(puzzle);
    case "fill":
      return fill(puzzle, file);
    default:
      throw new Error(`Unknown command "${command}".`);
  }
}
var LIST, WORD_DATA2, args, positionals, command, file, rest, words, load, save, index, steeredIndex, uses;
var init_xw = __esm({
  "vendor/scripts/xw.ts"() {
    "use strict";
    init_home();
    init_candidates();
    init_fill();
    init_engine();
    init_wordlist();
    init_nytHistory();
    init_ipuz();
    init_grid();
    init_numbering();
    init_difficulty();
    init_stats();
    init_xwCommands();
    LIST = WORDLIST;
    WORD_DATA2 = WORD_DATA;
    ({ values: args, positionals } = parseArgs({
      allowPositionals: true,
      options: {
        size: { type: "string", default: "15" },
        pattern: { type: "string" },
        symmetry: { type: "string", default: "rotational" },
        limit: { type: "string", default: "30" },
        regex: { type: "string", default: "" },
        contains: { type: "string", default: "" },
        require: { type: "string", default: "" },
        accept: { type: "string", default: "" },
        fills: { type: "string", default: "5" },
        budget: { type: "string", default: "30000" },
        seed: { type: "string", default: "1" },
        variety: { type: "string", default: "0.3" },
        "min-score": { type: "string", default: "0" },
        ban: { type: "string", default: "" }
      }
    }));
    [command, file, ...rest] = positionals;
    words = (list) => list.split(",").map((w) => w.trim()).filter(Boolean);
    load = (path) => fromIpuz(readFileSync(path, "utf8"), path).puzzle;
    save = (path, puzzle) => writeFileSync(path, toIpuz(puzzle, ""));
    index = () => buildIndex(parseWordlist(readFileSync(LIST, "utf8")));
    steeredIndex = () => buildIndex(parseWordlist(filterWordlist(readFileSync(LIST, "utf8"), Number(args["min-score"]), words(args.ban))));
    uses = () => new Map(
      existsSync(WORD_DATA2) ? JSON.parse(readFileSync(WORD_DATA2, "utf8")).answers.map(([a, n]) => [a, n]) : []
    );
    try {
      main();
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
});

// src/xw.ts
init_home();
import { existsSync as existsSync2 } from "node:fs";
var command2 = process.argv[2];
if (command2 === "doctor") {
  const line = (ok, what, gives) => console.log(`${ok ? "\u2713" : "\u2717"} ${what}: ${gives}`);
  console.log(`Data folder: ${GRID_GUIDE_HOME}`);
  line(existsSync2(WORDLIST), "Wordlist", "needed to build and fill grids");
  line(existsSync2(WORD_DATA), "NYT word data (optional)", "past uses and Freshness in hand-offs");
  line(existsSync2(COOKIE), "NYT cookie (optional)", "only needed to download or update the word data");
  if (!existsSync2(WORDLIST)) console.log("\nRun /grid-guide:setup to download the wordlist.");
} else if (["find", "check", "fill"].includes(command2 ?? "") && !existsSync2(WORDLIST)) {
  console.error(`No wordlist at ${WORDLIST}. Run /grid-guide:setup first.`);
  process.exit(1);
} else {
  await Promise.resolve().then(() => (init_xw(), xw_exports));
}
