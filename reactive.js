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


const trigger = (target, key) => {
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

const watch = (source, cb) => {
  let getter, oldValue, newValue
  if(typeof source === 'function'){
    getter = source
  }else {
    getter = () => tranverse(source)
  }
  const effectFn = effect(getter, {
    lazy: true,
    scheduler(fn){
      newValue = fn()
      cb(newValue, oldValue)
      oldValue = newValue
    }
  })
  oldValue = effectFn()
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


const data = {foo: 1, bar: 2}
const proxyData = new Proxy(data, {
  get(target, key){
    track(target, key)
    return target[key]
  },
  set(target, key, value){
    target[key] = value
    trigger(target, key)
    return true
  }
})


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

watch(proxyData, (newVal, oldVal) => {
  console.log('change', newVal, oldVal)
})

proxyData.foo++