let Vue;

class ModuleCollection {
  constructor(options) {
    this.register([], options);
  }

  register(path, rootModule) {
    // 把模块注册成树结构
    let modules = {
      // 将模块格式化
      _rawModule: rootModule,
      _children: {},
      state: rootModule.state,
    };
    if (path.length === 0) {
      this.root = modules; // 如果是 gen 挂载到根上
    } else {
      let parent = path.slice(0, -1).reduce((root, current) => {
        return this.root._children[current];
      }, this.root);
      parent._children[path[path.length - 1]] = modules;
    }

    // 看当前模块是否有 modlues 就重新注册
    if (rootModule.modules) {
      Object.keys(rootModule.modules).forEach((modulesName) => {
        this.register(
          path.concat(modulesName),
          rootModule.modules[modulesName]
        );
      });
    }
  }
}

class Store {
  constructor(options = {}) {
    this._subscribes = [];
    this.s = this.getNewVueInstance(options.state);
    this.getters = {};
    this.mutations = {}; // 所有同步 操作方法
    this.actions = {};
    this._modules = new ModuleCollection(options); // 把数据格式化成想要的树形结构

    // 递归分类
    installModule(this, this.state, [], this._modules.root);
    options.plugins.forEach((plugin) => plugin(this));

    console.log(this);
  }

  get state() {
    // 属性访问器
    return this.s.state;
  }

  subscribe(fn) {
    this._subscribes.push(fn);
  }

  handleComputed(getters) {
    this.getters = {};
    Object.keys(getters).forEach((key) => {
      Object.defineProperty(this.getters, key, {
        get: () => {
          return getters[key](this.state);
        },
      });
    });
  }

  getNewVueInstance(state) {
    return new Vue({
      data() {
        return { state };
      },
    });
  }

  commit = (mutationName, ...args) => {
    this.mutations[mutationName].forEach((mutation) => mutation(...args));
  };
  dispatch = (actionName, ...args) => {
    this.actions[actionName].forEach((fn) => fn(...args));
  };
}

function forEach(obj, fn) {
  Object.keys(obj).forEach((key) => {
    fn(key, obj[key]);
  });
}

function installModule(store, rootState, path, rootModule) {
  if (path.length > 0) {
    let parent = path.slice(0, -1).reduce((root, current) => {
      // 查找挂载
      if (!root[current]) root[current] = {};
      return root[current];
    }, rootState);

    //  不会导致数据更新使用 Vue.set
    // parent[path[path.length - 1]] = rootModule.state;
    Vue.set(parent, [path[path.length - 1]], rootModule.state);
  } else {
  }

  let getters = rootModule._rawModule.getters;
  let mutations = rootModule._rawModule.mutations;
  let actions = rootModule._rawModule.actions;

  // 整合子模块的 getters 到根模块
  if (getters) {
    forEach(getters, (getterName, fn) => {
      Object.defineProperty(store.getters, getterName, {
        get() {
          return fn(rootModule._rawModule.state); // 传入该模块的 state
        },
      });
    });
  }
  // 整合子模块的 mutations 到根模块
  if (mutations) {
    forEach(mutations, (mutationName, fn) => {
      let mutations = store.mutations[mutationName] || [];
      mutations.push((...args) => {
        fn(rootModule.state, ...args);
        store._subscribes.forEach((
          fn // 订阅方法执行
        ) => fn({ type: mutationName, payload: args }, rootState));
      });
      store.mutations[mutationName] = mutations;
    });
  }
  // 整合子模块的 actions 到根模块
  if (actions) {
    forEach(actions, (actionName, fn) => {
      let actions = store.actions[actionName] || [];
      actions.push((...args) => {
        fn(store, ...args);
      });
      store.actions[actionName] = actions;
    });
  }

  forEach(rootModule._children, (moduleName, module) => {
    installModule(store, rootState, path.concat(moduleName), module);
  });
}

const install = (_Vue) => {
  Vue = _Vue;
  Vue.mixin({
    beforeCreate() {
      // 先渲染父再到子
      // 没有放在原型 Vue.prototype 上
      // 拿到 store 给根个组件 添加 store
      if (this.$options && this.$options.store) {
        this.$store = this.$options.store;
      } else {
        // 给子个组件 添加 store。有可能单独创建实例，父亲没有传入store而且没有父亲
        this.$store = this.$parent && this.$parent.$store;
      }
    },
  });
};

export default {
  // Vue.use() 会自动调用
  install,
  Store,
};

// 格式化数据
