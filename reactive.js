const bucket = new Set()

const data = {text: 'hello world'}
const proxyData = new Proxy(data, {
  get(target, key){
    bucket.add(effect)
    return target[key]
  },
  set(target, key, value){
    target[key] = value
    bucket.forEach(fn => fn())
    return true
  }
})


const effect = () => {
  document.body.innerHTML = proxyData.text
}

effect()

setTimeout(() => {
  proxyData.text = 'hello vue3'
}, 2000)