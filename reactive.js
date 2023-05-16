const bucket = new WeakMap()
let activeEffect = null
const effectStack  =[]
const effect = fn => {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    effectStack.push(activeEffect)
    fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }
  effectFn.deps = []
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
  const effect = depsMap.get(key)
  // make a copy to avoid infinite loop -> when executing effect fn, it will do cleanup and recollect during foreach statement and will cause infinite loop
  const effectToRun = new Set(effect) 
  effectToRun.forEach(fn => fn())
}


const data = {foo: 'foo', bar: 'bar'}
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
  let temp1, temp2
  console.log('outer effect executed');
  effect(() => {
    console.log('inner effect executed')
    temp2 = proxyData.bar
  })
  temp1 = proxyData.foo
})


setTimeout(() => {
  proxyData.foo = 'foo modified'
}, 1000)
setTimeout(() => {
  proxyData.bar = 'bar modified'
}, 2000)