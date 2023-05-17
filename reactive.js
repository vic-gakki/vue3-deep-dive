import {sleepRandom} from './util.js'

const bucket = new WeakMap()
let activeEffect = null
const effectStack  =[]
// scheduler for multiple-time trigger
const queue = new Set()
let isFlushing = false
const p = Promise.resolve()
const queueJob = () => {
  if(isFlushing) return
  isFlushing = true
  p.then(() => {
    queue.forEach(job => job())
  }).finally(() => {
    isFlushing = false
  })
}

const ITERATE_KEY = Symbol()
const TRIGGER_TYPE = {
  ADD: 'ADD',
  SET: 'SET',
  DELETE: 'DELETE'
}

const RAW_KEY = '__raw__'


const effect = (fn, options = {}) => {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    effectStack.push(activeEffect)
    const res = fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  effectFn.deps = []
  effectFn.options = options
  if(!options.lazy){
    effectFn()
  }
  return effectFn
}

const cleanup = (effectFn) => {
  for(let dep of effectFn.deps){
    dep.delete(effectFn)
  }
  effectFn.deps.length = []
}

const track = (target, key) => {
  if(!activeEffect){
    return
  }
  let depsMap = bucket.get(target)
  if(!depsMap){
    bucket.set(target, (depsMap = new Map()))
  }
  let effect = depsMap.get(key)
  if(!effect){
    depsMap.set(key, (effect = new Set()))
  }
  activeEffect.deps.push(effect)
  effect.add(activeEffect)
}


const trigger = (target, key, type = TRIGGER_TYPE.SET) => {
  const depsMap = bucket.get(target)
  if(!depsMap){
    return
  }
  const effect = depsMap.get(key) || []
  // make a copy to avoid infinite loop -> when executing effect fn, it will do cleanup and recollect during foreach statement and will cause infinite loop
  const effectToRun = []
  effect.forEach(fn => {
    if(fn !== activeEffect){
      effectToRun.push(fn)
    }
  })
  if([TRIGGER_TYPE.ADD, TRIGGER_TYPE.DELETE].includes(type)){
    const iterateEffect = depsMap.get(ITERATE_KEY) || []
    iterateEffect.forEach(fn => {
      if(fn !== activeEffect){
        effectToRun.push(fn)
      }
    })
  }
  effectToRun.forEach(fn => {
    if(fn.options?.scheduler){
      fn.options.scheduler(fn)
    }else {
      fn()
    }
  })
}


const computed = getter => {
  let value
  let dirty = true
  const effectFn = effect(getter, {
    lazy: true,
    scheduler(){
      if(!dirty){
        dirty = true
        trigger(obj, 'value')
      }
    }
  })
  const obj = {
    get value(){
      if(dirty){
        value = effectFn()
        dirty = false
      }
      track(obj, 'value')
      return value
    }
  }
  return obj
}

const watch = (source, cb, options = {}) => {
  let getter, oldValue, newValue, cleanup
  const {immediate, flush} = options
  if(typeof source === 'function'){
    getter = source
  }else {
    getter = () => tranverse(source)
  }

  const onInvalidate = fn => {
    cleanup = fn
  }

  const job = () => {
    newValue = effectFn()
    cleanup && cleanup()
    cb(newValue, oldValue, onInvalidate)
    oldValue = newValue
  }

  const effectFn = effect(getter, {
    lazy: true,
    scheduler(){
      if(flush === 'post'){
        Promise.resolve().then(job)
      }else {
        job()
      }
    }
  })

  if(immediate){
    job()
  }else {
    oldValue = effectFn()
  }
}

const tranverse = (source, seen = new Set()) => {
  if(typeof source !== 'object' || seen.has(source) || !source){
    return
  }
  seen.add(source)
  for(let k in source){
    tranverse(source[k], seen)
  }
  return source
}

const handler = {
  get(target, key, receiver){
    if(key === RAW_KEY){
      return target
    }
    track(target, key)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver){
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
    const hasKey = Object.prototype.hasOwnProperty.call(target, key)
    const res = Reflect.deleteProperty(target, key)
    if(res && hasKey){
      trigger(target, key, TRIGGER_TYPE.DELETE)
    }
    return res
  }
}


const data = { 
  foo: 1, 
  bar: 'bar'
}
const proxyData = new Proxy(data, handler)


// const sum = computed(() => {
//   console.log('executed')
//   return proxyData.foo + proxyData.bar
// })

// console.log(sum.value)
// console.log(sum.value)

// proxyData.foo++

// console.log(sum.value)

// const sum2 = computed(() => {
//   return proxyData.foo + proxyData.bar
// })

// effect(() => {
//   console.log('sum value',sum2.value)
// })

// proxyData.foo++

// watch(proxyData, (newVal, oldVal) => {
//   console.log('change', newVal, oldVal)
// }, {
//   immediate: true,
//   flush: 'post'
// })

// proxyData.foo++
// console.log('done')

// let finalData
// watch(proxyData, async (newVal, oldVal, onInvalidate) => {
//   let expired = false
//   onInvalidate(() => {
//     expired = true
//   })
//   const res = await sleepRandom()
//   if(!expired){
//     finalData = res
//   }
//   console.log({finalData});
// })

// proxyData.foo++
// proxyData.foo++


// effect(() => {
//   console.log(proxyData.bar)
// })
// proxyData.foo++

// effect(() => {
//   console.log('executed')
//   for(let key in proxyData){
//     console.log({key})
//   }
// })

// delete proxyData.bar




export {
  handler,
  effect,
  track,
  trigger,
  computed,
  watch,
  RAW_KEY,
  TRIGGER_TYPE
}