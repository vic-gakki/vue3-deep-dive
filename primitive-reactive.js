import { reactive } from "./non-primitive-reactive.js";
import { effect } from "./reactive.js";
const REF_KEY = '__v_isRef'


const ref = val => {
  const wrapper = {
    value: val
  }

  // 区分原始值的包裹对象 - 非原始值的响应式数据
  Object.defineProperty(wrapper, REF_KEY, {
    value: true
  })
  return reactive(wrapper)
}

const s = ref('hello')
effect(() => {
  console.log(s.value)
})

s.value = 'vue3'