import { renderer, onMounted, Comment, getCurrentInstance } from "./renderer-design.js"
import { isComponentVnode, isFunction, isObject } from "./util.js"
const {ref, shallowRef} = VueReactivity

const nextFrame = fn => {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn)
  })
}

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

const KeepAlive = {
  name: 'KeepAlive',
  __isKeepAlive: true,
  props: {
    includes: RegExp,
    excludes: RegExp
  },
  setup(props, {slots}){
    const instance = getCurrentInstance()
    const {move, createElement} = instance.keepAliveCtx
    const cache = new Map()
    const storeContainer = createElement('div')
    instance._deActivate = vnode => {
      move(vnode, storeContainer)
    }
    instance._activate = (vnode, container, anchor) => {
      move(vnode, container, anchor)
    }
    return () => {
      const rawNode = slots.default()
      if(!isComponentVnode(rawNode)){
        return rawNode
      }
      const name = rawNode.type.name
      if(name && 
        (
          (props.includes && !props.includes.test(name)) ||
          (props.excludes && props.excludes.test(name))
        )
      ){
        return rawNode
      }
      const vnode = cache.get(rawNode.type)
      rawNode._keepAliveInstance = instance
      rawNode.shouldKeepAlive = true
      if(vnode){
        rawNode.component = vnode.component
        rawNode.keptAlive = true
      }else {
        cache.set(rawNode.type, rawNode)
      }
      return rawNode
    }
  }

}


const Teleport = {
  name: 'Teleport',
  __isTeleport: true,
  process(n1, n2, container, anchor, context){
    const {
      patch,
      patchChildren,
      move
    } = context

    const getTarget = to => {
      if(!to){
        return container
      }
      if(typeof to === 'string'){
        return document.querySelector(to)
      }
      return to
    }
    const target = getTarget(n2.props.to)
    if(!n1){
      // 挂载teleport
      n2.children.forEach(c => patch(null, c, target, anchor))
    }else {
      // 更新
      patchChildren(n1, n2, container)
      if(n2.props.to !== n1.props.to){
        n2.children.forEach(c => move(c, target))
      }
    }
  }
}



const Transition = {
  name: 'Transition',
  __isTransition: true,
  setup(props, {slots}){
    return () => {
      const vnode = slots.default()
      vnode.transition = {
        beforeEnter(el){
          el.classList.add('enter-from')
          el.classList.add('enter-active')
        },
        enter(el){
          nextFrame(() => {
            el.classList.remove('enter-from')
            el.classList.add('enter-to')
            el.addEventListener('transitionend', () => {
              el.classList.remove('enter-active')
              el.classList.remove('enter-to')
            })
          })
        },
        leave(el, performRemove){
          el.classList.add('leave-from')
          el.classList.add('leave-active')
          // 强制reflow, 使得初始状态生效
          document.body.offsetHeight
          nextFrame(() => {
            el.classList.remove('leave-from')
            el.classList.add('leave-to')
            el.addEventListener('transitionend', () => {
              el.classList.remove('leave-active')
              el.classList.remove('leave-to')
              performRemove()
            })
          })
        }
      }
      return vnode
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



// keep-alive component

const KeepAliveComp = {
  type: {
    name: 'test',
    setup(){
      const toggle = ref(false)
      const onClick = () => {
        toggle.value = !toggle.value
      }
      return () => {
        return {
          type: 'div',
          children: [
            {
              type: 'button',
              props: {
                onClick
              },
              children: 'click me'
            },
            {
              type: KeepAlive,
              children: {
                default(){
                  return {
                    type: toggle.value ? Loading : MyComponent
                  }
                }
              },
              props: {
                excludes: /^(MyComponent|Loading)$/
              }
            }
          ]
        }
      }
    }
  }
}


// teleport

const teleComp = {
  type: {
    setup(){
      const to = ref('body')
      const onClick = () => {
        to.value = 'html'
      }
      return () => {
        return {
          type: 'div',
          children: [
            {
              type: 'button',
              children: 'Click me',
              props: {
                onClick
              }
            },
            {
              type: 'p',
              children: '非teleport元素'
            },
            {
              type: Teleport,
              props: {
                to: to.value
              },
              children: [
                {
                  type: 'h1',
                  children: `我是h1 - teleport to ${to.value}`
                },
                {
                  type: 'h2',
                  children: `我是h2 - teleport to ${to.value}`
                }
              ]
            }
          ]
        }
      }
    }
  },
  
}

const transitionComp = {
  type: {
    name: 'TransitionTest',
    setup(){
      const toggle = ref(true)
      const onClick = () => {
        toggle.value = !toggle.value
      }
      return () => {
        return {
          type: 'div',
          children: [
            {
              type: 'button',
              children: 'Click me',
              props: {
                onClick
              }
            },
            {
              type: Transition,
              children: {
                default(){
                  return toggle.value ? {
                    type: 'div',
                    children: 'children 1',
                    key: 1,
                    props: {
                      class: 'box'
                    }
                  } : {
                    type: 'div',
                    children: 'children 2',
                    key: 2,
                    props: {
                      class: 'box'
                    }
                  }
                }
              }
            }
          ]
        }
      }
    }
  }
}


renderer.render(transitionComp, document.getElementById('app'))
