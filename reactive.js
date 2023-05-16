const bucket = new WeakMap()
let activeEffect = null
const effect = fn => {
  activeEffect = fn
  fn()
}
const data = {text: 'hello world'}
const proxyData = new Proxy(data, {
  get(target, key){
    if(!activeEffect){
      return target[key]
    }
    const depsMap = bucket.get(target)
    if(!depsMap){
      bucket.set(target, (depsMap = new Map()))
    }
    const effect = depsMap.get(key)
    if(!effect){
      depsMap.set(key, (effect = new Set()))
    }
    effect.add(activeEffect)
    return target[key]
  },
  set(target, key, value){
    target[key] = value
    const depsMap = bucket.get(target)
    if(!depsMap){
      return true
    }
    const effect = depsMap.get(key)
    effect && effect.forEach(fn => fn())
    return true
  }
})

effect(() => {
  console.log('executed');
  document.body.innerHTML = proxyData.text
})

setTimeout(() => {
  proxyData.text = 'hello vue3'
}, 2000)