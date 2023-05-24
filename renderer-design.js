import { effect } from "./reactive.js";
import { ref } from "./primitive-reactive.js";

const renderer = (domstring, contaienr) => {
  contaienr.innerHTML = domstring
}

const count = ref(0)
effect(() => {
  renderer(`<h1>${count.value}</h1>`, document.getElementById('app'))
})

count.value++