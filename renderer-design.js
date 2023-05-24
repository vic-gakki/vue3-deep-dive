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
// const {effect, ref} = VueReactivity

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
        patchElement(p1, p2)
      }
    }else if(isObject(type)){
      if(!n1){
        mountComponent(n2, container)
      }else {
        patchComponent(p1, p2)
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

  const unmount = (vnode) => {
    const parent = vnode.el.parentNode
    remove(vnode.el, parent)
  }

  const patchElement = () => {

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
    if(key === 'class'){
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


const vnode = {
  type: 'h1',
  props: {
    id: 'id',
    class: normalizeClass(['foo bar', {baz: true}])
  },
  children: 'hello'
}

renderer.render(vnode, document.getElementById('app'))