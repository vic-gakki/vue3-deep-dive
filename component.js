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
              : {type: placeholder}
      }
    }
  }
}




const MyComponent = {
  name: 'MyComponent',
  setup(){
    onMounted(() => {
      console.log('on mounted 1')
    })
    onMounted(function(){
      console.log('on mounted 2', this.$slots)
    })
  },
  render(){
    return {
      type: 'div',
      children: [
        {
          type: 'header',
          children: [this.$slots.header()],
        },
        {
          type: 'main',
          children: [this.$slots.main()],
        },
        {
          type: 'footer',
          children: [this.$slots.footer()],
        }
      ]
    }
  }
}

const compVnode = {
  type: MyComponent,
  children: {
    header(){
      return {
        type: 'h1',
        children: '我是标题'
      }
    },
    main(){
      return {
        type: 'section',
        children: '我是内容'
      }
    },
    footer(){
      return {
        type: 'p',
        children: '我是注脚'
      }
    }
  }
}
renderer.render(compVnode, document.getElementById('app'))