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


import { handler, effect, RAW_KEY, TRIGGER_TYPE, ITERATE_KEY, track, trigger, disableTrack, enableTrack } from "./reactive.js";
const reactiveMap = new Map()


const arrayInstrumentations = {}
;['includes', 'indexOf', 'lastIndexOf'].forEach(method => {
  const originMethod = Array.prototype[method]
  arrayInstrumentations[method] = function(...args){
    let res = originMethod.apply(this, args)
    if(res === false || res === -1){
      res = originMethod.apply(this[RAW_KEY], args)
    }
    return res
  }
})
;['push'].forEach(method => {
  const originMethod = Array.prototype[method]
  arrayInstrumentations[method] = function(...args){
    disableTrack()
    const res = originMethod.apply(this, args)
    enableTrack()
    return res
  }
})

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
  let proxyObj = reactiveMap.get(obj)
  if(proxyObj){
    return proxyObj
  }
  proxyObj = new Proxy(obj, {
    get(target, key, receiver){
      if(key === RAW_KEY){
        return target
      }
      if(Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)){
        return Reflect.get(arrayInstrumentations, key, receiver)
      }
      if(!isReadonly && typeof key !== 'symbol'){
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
      const type = Array.isArray(target) 
                    ? +key < target.length 
                      ? TRIGGER_TYPE.SET 
                      : TRIGGER_TYPE.ADD 
                    : Object.prototype.hasOwnProperty.call(target, key) 
                      ? TRIGGER_TYPE.SET 
                      : TRIGGER_TYPE.ADD
      const res = Reflect.set(target, key, value, receiver)
      // exclude NaN !== NaN
      if(receiver[RAW_KEY] === target){ // set will trigger prototype [[set]] method
        if(oldVal !== value && (oldVal === oldVal || value === value)){
          trigger(target, key, type, value)
        }
      }
      return res
    },
    has(target, key){
      track(target, key)
      return Reflect.has(target, key)
    },
    ownKeys(target){
      track(target, Array.isArray(target) ? 'length' : ITERATE_KEY)
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
  reactiveMap.set(obj, proxyObj)
  return proxyObj
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

// const obj = reactive({foo: {bar: 'bar'}})

// effect(() => {
//   console.log(obj.foo.bar)
// })

// childP.bar = 'another'


// const obj = reactive(['foo'])

// effect(() => {
//   console.log(obj.length)
// })

// obj[1] = 'bar'

// const obj2 = reactive(['foo'])

// effect(() => {
//   console.log(obj2[0])
// })

// obj2.length = 0

// const obj = reactive(['foo'])
// effect(() => {
//   console.log('start');
//   for(let key in obj){
//     console.log(key)
//   }
// })

// obj[1] = 'bar'
// obj.length = 0

// const arr = reactive([1,2,3,4,5])
// effect(() => {
//   console.log('start');
//   for(const val of arr){
//     console.log(val)
//   }
// })

// arr[1] = 0
// arr.length = 2



// const obj = {}
// const arr = reactive([obj])
// effect(() => {
//   console.log(arr.includes(arr[0]))
// })
// const obj2 = {}
// const arr2 = reactive([obj2])
// effect(() => {
//   console.log(arr2.includes(obj2))
// })


const arr = reactive([])

effect(() => {
  arr.push(1)
})
effect(() => {
  arr.push(2)
})