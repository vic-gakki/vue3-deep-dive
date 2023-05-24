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

import { isArray } from "./util.js"
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
  const { insert, setElementText, createElement, patchProps } = options
  const render = (vnode, container) => {
    if(vnode){
      patch(container._vnode, vnode, container)
    }else{
      if(container._vnode){
        // unmount
        container.innerHTML = ''
        container._vnode = null
      }
    }
    container._vnode = vnode
  }
  const hydrate = (vnode, container) => {

  }
  const patch = (n1, n2, container) => {
    if(!n1){
      mountElement(n2, container)
    }
  }
  const mountElement = (vnode, container) => {
    const el = createElement(vnode.type)
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
    // 优先在dom props上设置
    if(shouldSetAsProps(node, key, newValue)){
      const type = typeof node[key]
      if(type === 'boolean' && newValue === ''){
       node[key] = true
      }else {
        node[key] = newValue
      }
    }else {
      node.setAttribute(key, newValue)
    }
  }
})

const shouldSetAsProps = (el, key, value) => {
  // input的form属性是readonly
  if(key ==='form' && el.tagName === 'INPUT'){
    return false
  }
  return key in el
}


const vnode = {
  type: 'h1',
  props: {
    id: 'id',
    class: 'class'
  },
  children: 'hello'
}

renderer.render(vnode, document.getElementById('app'))