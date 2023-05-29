/**
 * HTML Attribute & DOM properties
 * 
 *  1. html attr 与 dom prop 同名：id, value...
 * 
 *  2. html attr 与 dom prop 不同名： class - className
 * 
 *  3. html attr 与 dom prop 没有对应，如 aria-* html attribute, textContent dom property
 *  
 *  4. html attr的值 与 dom prop的值是有关联的，但不是所有，如value。html attribute的作用是设置dom property的初始值
 */



// import { effect } from "./reactive.js";
// import { ref } from "./primitive-reactive.js";

import { isArray, isObject} from "./util.js"
const {effect, ref} = VueReactivity

// const renderer = (domstring, contaienr) => {
//   contaienr.innerHTML = domstring
// }

// const count = ref(0)
// effect(() => {
//   renderer(`<h1>${count.value}</h1>`, document.getElementById('app'))
// })

// count.value++



const createRenderer = (options) => {
  const { insert, setElementText, createElement, patchProps, remove } = options

  const render = (vnode, container) => {
    if(vnode){
      patch(container._vnode, vnode, container)
    }else{
      if(container._vnode){
        // unmount, 直接设置innerHtml，不能检测里面的组件继而不能出发组件的生命周期hook，不能检测dom上的指令生命周期hook，不能移除事件
        unmount(container._vnode)
      }
    }
    container._vnode = vnode
  }

  const hydrate = (vnode, container) => {

  }

  const patch = (n1, n2, container) => {
    if(n1 && n1.type !== n2.type){
      unmount(n1)
      n1 = null
    }
    const {type} = n2
    if(typeof type === 'string'){
      if(!n1){
        mountElement(n2, container)
      }else {
        patchElement(n1, n2)
      }
    }else if(isObject(type)){
      if(!n1){
        mountComponent(n2, container)
      }else {
        patchComponent(n1, n2)
      }
    }
    
  }

  const mountElement = (vnode, container) => {
    const el = vnode.el = createElement(vnode.type)
    if(typeof vnode.children === 'string'){
      setElementText(el, vnode.children)
    }else if(isArray(vnode.children)){
      vnode.children.forEach(v => patch(null, v, el))
    }
    if(vnode.props){
      for(const [key, value] of Object.entries(vnode.props)){
        patchProps(el, key, null, value)
      }
    }
    insert(el, container)
  }

  const patchElement = (n1, n2) => {
    const el = n2.el = n1.el
    const len = n2.children?.length || 0
    for(const key in n2.props){
      patchProps(el, key, n1.props[key], n2.props[key])
    }
    for(const key in n1.props){
      if(!(key in n2.props)){
        patchProps(el, key, n1.props[key], null)
      }
    }
    for(let i = 0; i < len; i++){
      patch(n1.children[i], n2.children[i], el)
    }
  }

  const unmount = (vnode) => {
    const parent = vnode.el.parentNode
    remove(vnode.el, parent)
  }

  const mountComponent = () => {

  }

  const patchComponent = () => {
    
  }


  return {
    render,
    hydrate
  }
}

const renderer = createRenderer({
  createElement(tag){
    return document.createElement(tag)
  },
  setElementText(node, text){
    node.textContent = text
  },
  insert(node, parent, anchor = null){
    parent.insertBefore(node, anchor)
  },
  patchProps(node, key, oldValue, newValue){
    // 事件的处理
    if(/^on/.test(key)){
      const eventName = key.slice(2).toLowerCase()
      // 多个不同事件的绑定处理
      const invokers = node._vel || (node._vel = {})
      let invoker = invokers[key]
      if(newValue){
        if(!invoker){
          invoker = node._vel[key] = e => {
            // 同一事件多个回调
            if(e.timeStamp < invoker.attached) return
            if(isArray(invoker.value)){
              invoker.value.forEach(fn => fn(e))
            }else {
              invoker.value(e)
            }
          }
          invoker.attached = performance.now()
          node.addEventListener(eventName, invoker)
        }
        invoker.value = newValue
      }else if(invoker){
        node.removeEventListener(eventName, invoker)
      }
    }else if(key === 'class'){
      // 为元素设置class的三种方法：setAttribute, el.className, el.classList, className性能最优
      node.className = newValue || ''
    }else if (shouldSetAsProps(node, key, newValue)){ // 优先在dom props上设置
      const type = typeof node[key]
      if(type === 'boolean' && newValue === ''){
       node[key] = true
      }else {
        node[key] = newValue
      }
    }else {
      node.setAttribute(key, newValue)
    }
  },
  remove(el, container){
    container && container.removeChild(el)
  }
})

const shouldSetAsProps = (el, key, value) => {
  // input的form属性是readonly
  if(key ==='form' && el.tagName === 'INPUT'){
    return false
  }
  return key in el
}

const normalizeClass = classVal => {
  if(typeof classVal === 'string'){
    return classVal
  }else if(isObject(classVal)){
    return Object.entries(classVal).filter(([key, value]) => value).map(([key, value]) => key).join(' ')
  }else if(isArray(classVal)){
    return classVal.reduce((acc, cur) => {
      acc += ` ${normalizeClass(cur)}`
      return acc
    }, '')
  }
}


// const vnode = {
//   type: 'h1',
//   props: {
//     id: 'id',
//     class: normalizeClass(['foo bar', {baz: true}]),
//     onClick: e => {
//       console.log('click', e)
//     },
//     onDblClick: [e => {console.log('double click one', e)}, e => {console.log('double click two', e)}]
//   },
//   children: 'hello'
// }

// renderer.render(vnode, document.getElementById('app'))




/**
 * 事件冒泡与更新机制问题
 * 当点击子元素后，触发回调，响应式数据更新，触发重新渲染，给父元素绑定事件，然后事件冒泡触发
 * 
 * 我们无法知道事件冒泡是否完成，以及完成到什么程度
 * 
 * 即便vue的更新时机是在异步的微任务队列中，但是微任务会穿插在由事件冒泡触发的多个事件处理函数之间执行 
 */
const bool = ref(false)
effect(() => {
  const vnode = {
    type: 'div',
    props: bool.value ? {
      onClick: e => {
        console.log('parent get clicked', e)
      }
    } : {},
    children: [{
      type: 'p',
      children: 'click me',
      props: {
        onClick(e){
          console.log('son get clicked', e)
          bool.value = true
        }
      }
    }]
  }
  renderer.render(vnode, document.getElementById('app'))
})