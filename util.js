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
const isObject = isTypeFactory('Object')

const isSame = (oldVal, newVal) => {
  return (oldVal === newVal) || (oldVal !== oldVal && newVal !== newVal)
}

const getLongSequence = arr => {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = ((u + v) / 2) | 0
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}

export {
  sleep,
  sleepRandom,
  isArray,
  isSet,
  isMap,
  isWeakMap,
  isWeakSet,
  isSame,
  isObject,
  getLongSequence
}