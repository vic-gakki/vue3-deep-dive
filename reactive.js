const bucket = new WeakMap()
let activeEffect = null
const effect = fn => {
  activeEffect = fn
  fn()
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
  effect.add(activeEffect)
}


const trigger = (target, key) => {
  const depsMap = bucket.get(target)
  if(!depsMap){
    return
  }
  const effect = depsMap.get(key)
  effect && effect.forEach(fn => fn())
}


const data = {text: 'hello world'}
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
  document.body.innerHTML = proxyData.text
})

setTimeout(() => {
  proxyData.noExist = 'hello vue3'
}, 2000)