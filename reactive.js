const bucket = new Set()
let activeEffect = null
const effect = fn => {
  activeEffect = fn
  fn()
}
const data = {text: 'hello world'}
const proxyData = new Proxy(data, {
  get(target, key){
    if(activeEffect){
      bucket.add(activeEffect)
    }
    return target[key]
  },
  set(target, key, value){
    target[key] = value
    bucket.forEach(fn => fn())
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