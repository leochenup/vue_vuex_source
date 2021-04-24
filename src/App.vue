<template>
  <div id="app">
    {{ $store.state.number }}
    {{ $store.getters.myAge }}
    {{ $store.state.a.c.c }}
    {{ computedC }}

    <button @click="add">+</button>
    <button @click="decline">-</button>
    <button @click="asyncDeclineC">Async -</button>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from "vuex";

export default {
  name: "App",
  data() {
    return {};
  },
  methods: {
    add() {
      this.$store.commit("syncAdd", 1);
    },
    decline() {
      this.$store.commit("syncDecline", 1);
    },
    AsyncDecline() {
      this.$store.dispatch("asyncDecline", 1);
    },
    ...mapActions(["asyncDeclineC"]),
  },
  mounted() {
    console.log(this.$store);
  },
  computed: mapGetters(["computedC"]),
};
</script>

<style>
</style>
