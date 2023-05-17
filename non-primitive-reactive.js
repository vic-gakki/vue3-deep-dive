/**
 * proxy只能代理 对象 的基本语义
 * 复合操作通过基本操作组合而成
 * 
 * js中对象的分类
 *  常规对象[ordinary object]
 *    1. 对于必要内部方法，必须使用ECMA规范10.1.x节给出的定义实现
 *    2. 对于内部方法[[Call]]，必须使用ECMA规范10.2.1节给出的定义实现
 *    3. 对于内部方法[[Construct]]，必须使用ECMA规范10.2.2节给出的定义实现
 *  异质对象[exotic object]
 *    不满足以上三点要求的对象，如果proxy
 *
 * 对象的内部方法和内部槽
 *  必要的内部方法
 *    [[Get]]
 *    [[Set]]
 *    [[Delete]]
 *    [[GetPrototypeOf]]
 *    [[SetPrototypeOf]]
 *    [[IsExtensible]]
 *    [[PreventExtensions]]
 *    [[GetOwnProperty]]
 *    [[DefineOwnProperty]]
 *    [[HasProperty]]
 *    [[OwnPropertyKeys]]
 *  额外的必要内部方法
 *    [[Call]]
 *    [[Construct]]
 * 
 *  proxy用来自定义内部方法和行为的拦截函数名字（与上对应）
 *   get set deleteProperty getPrototypeOf setPrototypeOf isExtensible preventExtensions getOwnPropertyDescriptor defineProperty has ownKeys apply construct
 */


import { handler, effect, RAW_KEY, TRIGGER_TYPE, track, trigger } from "./reactive.js";

const reactive = obj => {
  return createReactive(obj)
}
const shallowReactive = obj => {
  return createReactive(obj, true)
}
const readonly = obj => {
  return createReactive(obj, false, true)
}
const shallowReadonly = obj => {
  return createReactive(obj, true, true)
}

const createReactive = (obj, isShallow = false, isReadonly = false) => {
  return new Proxy(obj, {
    get(target, key, receiver){
      if(key === RAW_KEY){
        return target
      }
      if(!isReadonly){
        track(target, key)
      }
      const res = Reflect.get(target, key, receiver)
      if(isShallow){
        return res
      }
      if(typeof res === 'object' && res !== null){
        return isReadonly ? readonly(res) : reactive(res)
      }
      return res
    },
    set(target, key, value, receiver){
      if(isReadonly){
        console.warn(`Prop ${key} is readonly`)
        return true
      }
      const oldVal = target[key]
      const type = Object.prototype.hasOwnProperty.call(target, key) ? TRIGGER_TYPE.SET : TRIGGER_TYPE.ADD
      const res = Reflect.set(target, key, value, receiver)
      // exclude NaN !== NaN
      if(receiver[RAW_KEY] === target){ // set will trigger prototype [[set]] method
        if(oldVal !== value && (oldVal === oldVal || value === value)){
          trigger(target, key, type)
        }
      }
      return res
    },
    has(target, key){
      track(target, key)
      return Reflect.has(target, key)
    },
    ownKeys(target){
      track(target, ITERATE_KEY)
      return Reflect.ownKeys(target)
    },
    deleteProperty(target, key){
      if(isReadonly){
        console.warn(`Prop ${key} is readonly`)
        return true
      }
      const hasKey = Object.prototype.hasOwnProperty.call(target, key)
      const res = Reflect.deleteProperty(target, key)
      if(res && hasKey){
        trigger(target, key, TRIGGER_TYPE.DELETE)
      }
      return res
    }
  })
}

// const child = {}
// const parent = {bar: 'bar'}
// const childP = reactive(child)
// const parentP = reactive(parent)
// Object.setPrototypeOf(childP, parentP)


// effect(() => {
//   console.log(childP.bar)
// })

// childP.bar = 'another'

const obj = reactive({foo: {bar: 'bar'}})

effect(() => {
  console.log(obj.foo.bar)
})

childP.bar = 'another'