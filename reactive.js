const bucket = new WeakMap()
let activeEffect = null
const effect = fn => {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    fn()
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


const data = {text: 'hello world', ok: true}
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
  console.log('executed');
  document.body.innerHTML = proxyData.ok ? proxyData.text : 'not relevant'
})


setTimeout(() => {
  proxyData.ok = false
}, 1000)

setTimeout(() => {
  proxyData.text = 'hello vue3'
}, 2000)