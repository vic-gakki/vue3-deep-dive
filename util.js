let count = 1

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

const sleepRandom = async () => {
  let n = count
  count++
  const random = Math.random() * 2000
  console.log({random, n});
  await sleep(random)
  return n
}

const toString = obj => {
  return Object.prototype.toString.call(obj).slice(8, -1)
}

const isTypeFactory = (name) => (obj) => toString(obj) === name

const isArray = isTypeFactory('Array')
const isSet = isTypeFactory('Set')
const isMap = isTypeFactory('Map')
const isWeakMap = isTypeFactory('WeakMap')
const isWeakSet = isTypeFactory('WeakSet')

const isSame = (oldVal, newVal) => {
  return (oldVal === newVal) || (oldVal !== oldVal && newVal !== newVal)
}

export {
  sleep,
  sleepRandom,
  isArray,
  isSet,
  isMap,
  isWeakMap,
  isWeakSet,
  isSame
}