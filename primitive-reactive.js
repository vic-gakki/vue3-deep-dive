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

const toRef = (obj, key) => {
  const wrapper = {
    get value(){
      return obj[key]
    },
    set value(val){
      obj[key] = val
    }
  }
  Object.defineProperty(wrapper, REF_KEY, {
    value: true
  })
  return wrapper
}

const toRefs = obj => {
  let ret = {}
  for(const key in obj){
    ret[key] = toRef(obj, key)
  }
  return ret
}




// const s = ref('hello')
// effect(() => {
//   console.log(s.value)
// })

// s.value = 'vue3'


// losing reactivity
const obj = reactive({foo: 'foo', bar: 'bar'})
// const newObj = {...obj}
// const newObj = {
//   foo: toRef(obj, 'foo'),
//   bar: toRef(obj, 'bar')
// }
// const newObj = toRef(obj, 'foo')
const newObj = {...toRefs(obj)}
effect(() => {
  // console.log(newObj.foo, newObj.bar)
  console.log(newObj.foo.value, newObj.bar.value)
  // console.log(newObj.value)
})
obj.foo = 1
obj.bar = 2