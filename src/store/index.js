import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex); // iNstall 方法

//持久化
const presist = (store) => {
  store.subscribe((mutation, state) => {
    localStorage.setItem("vuex-state", JSON.stringify(state));
  });
};

export default new Vuex.Store({
  // 导出 store
  // 导出 store 实例
  state: {
    // 统一的状态管理
    number: 11,
  },
  getters: {
    myAge(state) {
      return state.number + 18;
    },
  },
  mutations: {
    //  更改状态
    syncAdd(state, number) {
      state.number += number;
    },
    syncDecline(state, number) {
      state.number -= number;
    },
  },
  actions: {
    // 异步
    asyncDecline({ commit }, number) {
      setTimeout(() => {
        commit("syncDecline", number);
      }, 1000);
    },
  },
  modules: {
    a: {
      modules: {
        c: {
          state: { c: 1 },
          getters: {
            computedC(state, b, c) {
              // 会被定义到根上
              console.log(state, b, c);
              return state.c + 100;
            },
          },
          mutations: {
            syncAdd(state, number) {
              console.log("c syncAdd");
            },
          },
          actions: {
            asyncDeclineC(context, number) {
              console.log(context);
            },
          },
        },
      },
    },
    b: {
      state: {
        b: 10,
      },
    },
  },
  plugins: [presist],
});
