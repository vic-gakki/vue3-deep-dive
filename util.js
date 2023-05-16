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

export {
  sleep,
  sleepRandom
}