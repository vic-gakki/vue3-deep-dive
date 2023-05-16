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
    fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }
  effectFn.deps = []
  effectFn.options = options
  effectFn()
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


const data = {count: 1}
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

effect(() => {
  console.log(proxyData.count)
}, {
  scheduler(fn){
    queue.add(fn)
    queueJob()
  }
})
proxyData.count++
proxyData.count++
console.log('done')
