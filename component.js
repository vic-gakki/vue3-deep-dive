import { renderer, onMounted, Comment} from "./renderer-design.js"
const {ref, shallowRef} = VueReactivity

const defineAsyncComponent = options => {
  return {
    name: 'AsyncComponentWrapper',
    setup(){
      const loaded = ref(false)
      const loading = ref(false)
      const error = shallowRef(null)
      let asyncComp = null
      if(typeof options === 'function'){
        options = {
          loader: options
        }
      }

      const {loader, timeout, delay, errorComponent, loadingComponent, onError} = options

      // 延时显示loading，避免加载时间短影响闪屏
      let loadingTimer = null
      if(delay){
        loadingTimer = setTimeout(() => {
          loading.value = true
        }, delay)
      }else {
        loading.value = true
      }

      // 加载时间控制
      let timeoutTimer = null
      if(timeout){
        timeoutTimer = setTimeout(() => {
          error.value = new Error(`Load component failed after ${timeout} ms`)
        }, timeout)
      }

      // 重试机制
      let retires = 0
      function load(){
        return loader().catch(err => {
          if(onError){
            return new Promise((resolve, reject) => {
              const retry = () => {
                retires++
                resolve(load())
              }
              const fail = reject(err)
              onError(retry, fail, retires)
            })
          }else {
            throw err
          }
        })
      }

      const placeholder = {type: Comment, children: ''}

      load().then(res => {
        loaded.value = true
        asyncComp = res
      }).catch(err => {
        error.value = err
      }).finally(() => {
        clearTimeout(loadingTimer)
        loading.value = false
      })
      
      return () => {
        return (error.value && errorComponent)
          ? {type: errorComponent, props: {error: error.value}}
          : loaded.value
            ? {type: asyncComp}
            : (loading.value && loadingComponent)
              ? {type: loadingComponent}
              : placeholder
      }
    }
  }
}


// async component
const MyComponent = {
  name: 'MyComponent',
  render(){
    return {
      type: 'div',
      children: [
        {
          type: 'span',
          children: '我是'
        },
        {
          type: 'strong',
          children: '异步加载'
        },
        {
          type: 'span',
          children: '组件'
        }
      ]
    }
  }
}

const Loading = {
  name: 'Loading',
  render(){
    return {
      type: 'div',
      children: 'loading...'
    }
  }
}

const ErrorComponent = {
  name: 'ErrorComponent',
  props: {
    error: Error
  },
  render(){
    return {
      type: 'div',
      children: `error: ${this.error.message}`,
      props: {
        style: 'color: red'
      }
    }
  }
}

const compVnode = {
  type: defineAsyncComponent({
    loader(){
      return new Promise((resolve) => {
        setTimeout(() => resolve(MyComponent), 4000)
      })
    },
    delay: 1000,
    timeout: 3000,
    loadingComponent: Loading,
    errorComponent: ErrorComponent,
  }),
}


// functional component

const functional = (props) => {
  return {
    type: 'div',
    children: [
      {
        type: 'p',
        children: `这是functional component,没有自己的状态，可以接受props`
      },
      {
        type: 'pre',
        children: `${Object.entries(props).map(([key, value]) => key + ':' + value).join('\n')}`
      }
    ]
  }
}
functional.props = {
  key1: String,
  key2: String
}

const funComp = {
  type: functional,
  props: {
    key1: 'value1',
    key2: 'value2'
  }
}
renderer.render(funComp, document.getElementById('app'))