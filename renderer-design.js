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

const Text = Symbol()
const Comment = Symbol()
const Fragment = Symbol()

const createRenderer = (options) => {
  const { insert, setElementText, createElement, patchProps, remove, createText, setText, createComment } = options
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

  const patch = (n1, n2, container, anchor) => {
    if(n1 && n1.type !== n2.type){
      unmount(n1)
      n1 = null
    }
    const {type} = n2
    if(typeof type === 'string'){
      if(!n1){
        mountElement(n2, container, anchor)
      }else {
        patchElement(n1, n2)
      }
    }else if(isObject(type)){
      if(!n1){
        mountComponent(n2, container)
      }else {
        patchComponent(n1, n2)
      }
    }else if(type === Text){
      // 文本节点
      if(!n1){
        const el = n2.el = createText(n2.children)
        insert(el, container)
      }else {
        const el = n2.el = n1.el
        if(n1.children !== n2.children){
          setText(el, n2.children)
        }
      }
    }else if(type === Comment){
      // 注释节点
      if(!n1){
        const el = n2.el = createComment(n2.children)
        insert(el, container)
      }else {
        const el = n2.el = n1.el
        if(n1.children !== n2.children){
          setText(el, n2.children)
        }
      }
    }else if(type === Fragment){
      if(!n1){
        n2.children.forEach(v => patch(null, v, container))
      }else {
        patchChildren(n1, n2, container)
      }
    }
    
  }

  const mountElement = (vnode, container, anchor) => {
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
    insert(el, container, anchor)
  }

  const patchElement = (n1, n2) => {
    const el = n2.el = n1.el
    const props = n2.props
    const oldProps = n1.props
    for(const key in props){
      if(oldProps[key] !== props[key]){
        patchProps(el, key, oldProps[key], props[key])
      }
    }
    for(const key in oldProps){
      if(!(key in props)){
        patchProps(el, key, oldProps[key], null)
      }
    }
    patchChildren(n1, n2, el)
  }

  const patchChildren = (n1, n2, container) => {
    // 规范化子节点的三种情况：null, text, <text | vnode>[]
    if(typeof n2.children === 'string'){
      if(isArray(n1.children)){
        n1.children.forEach(cvnode => unmount(cvnode))
      }
      setElementText(container, n2.children)
    }else if(isArray(n2.children)){
      if(isArray(n1.children)){
        // 核心diff算法逻辑

        // 暴力unmount，然后mount
        // n1.children.forEach(cvnode => unmount(cvnode))
        // n2.children.forEach(cvnode => patch(null, cvnode, container))

        // 比较相同位置的vnode，然后mount新数组剩下的或者unmount旧数组剩下的
        // const oldChildren = n1.children
        // const newChildren = n2.children
        // const oldLen = oldChildren.length
        // const len = newChildren.length
        // const commonLen = Math.min(oldLen, len)
        // for(let i = 0; i < commonLen; i++){
        //   patch(oldChildren[i], newChildren[i], container)
        // }
        // if(len > oldLen){
        //   for(let i = commonLen; i < len; i++){
        //     patch(null, newChildren[i], container)
        //   }
        // }else if(oldLen > len){
        //   for(let i = commonLen; i <oldLen; i++){
        //     unmount(oldChildren[i])
        //   }
        // }

        // const oldChildren = n1.children
        // const newChildren = n2.children
        // const lastIndex = 0
        // for(let i = 0; i < newChildren.length; i++){
        //   const newNode = newChildren[i]
        //   let find = false
        //   for(let j = 0; j < oldChildren.length; j++){
        //     const oldNode = oldChildren[j]
        //     if(oldNode.key === newNode.key){
        //       patch(oldNode, newNode, container)
        //       if(j < lastIndex){
        //         // 该元素需要移动
        //         const anchor = newChildren[i - 1]?.el?.nextSiblings
        //         insert(oldNode.el, container, anchor)
        //       }else if(j > lastIndex){
        //         lastIndex = j
        //       }
        //       find = true
        //       break;
        //     }
        //   }
        //   if(!find){
        //     // 新增元素
        //     const prev = newChildren[i - 1]
        //     let anchor
        //     if(prev){
        //       anchor = prev.el.nextSiblings
        //     }else {
        //       anchor = container.firstChild
        //     }
        //     patch(null, newNode, container, anchor)
        //   }
        // }
        // for(let i = 0; i < oldChildren.length; i++){
        //   const oldNode = oldChildren[i]
        //   const has = newChildren.find(nv => nv.type === oldNode.type && nv.key === oldNode.key)
        //   if(!has){
        //     unmount(oldNode)
        //   }
        // }


        // patchKeyedChildren(n1, n2, container)
        patchKeyedChildrenV3(n1, n2, container)

      }else {
        setElementText(container, '')
        n2.children.forEach(cvnode => patch(null, cvnode, container))
      }
    }else {
      if(isArray(n1.children)){
        n1.children.forEach(cvnode => unmount(cvnode))
      }else if(typeof n1.children === 'string'){
        setElementText(container, '')
      }
    }
  }

  const patchKeyedChildren = (n1, n2, container) => {
    const oldChildren = n1.children
    const newChildren = n2.children

    // index
    let oldStartIndex = 0
    let oldEndIndex = oldChildren.length - 1
    let newStartIndex = 0
    let newEndIndex = newChildren.length - 1

    // vnode
    let oldStartNode = oldChildren[oldStartIndex] 
    let oldEndNode = oldChildren[oldEndIndex] 
    let newStartNode = newChildren[newStartIndex] 
    let newEndNode = newChildren[newEndIndex] 
    while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex){
      // 双端比较 oldsi <-> newsi | oldei <-> newei | oldsi <-> newei | oldei <-> newsi
      if(!oldStartNode){
        oldStartNode = oldChildren[++oldStartIndex]
      }else if(!oldEndNode){
        oldEndNode = oldChildren[--oldEndIndex]
      }else if(oldStartNode.key === newStartNode.key){
        patch(oldStartNode, newStartNode, container)
        oldStartNode = oldChildren[++oldStartIndex]
        newStartNode = newChildren[++newStartIndex]
      }else if(oldEndNode.key === newEndNode.key){
        patch(oldEndNode, newEndNode, container)
        oldEndNode = oldChildren[--oldEndIndex]
        newEndNode = newChildren[--newEndIndex]
      }else if(oldStartNode.key === newEndNode.key){
        patch(oldStartNode, newEndNode, container)
        insert(oldStartNode.el, container, oldEndNode.el.nextSiblings)
        oldStartNode = oldChildren[++oldStartIndex]
        newEndNode = newChildren[--newEndIndex]
      }else if(oldEndNode.key === newStartNode.key){
        patch(oldEndNode, newStartNode, container)
        insert(oldEndNode.el, container, oldStartNode.el)
        oldEndNode = oldChildren[--oldEndIndex]
        newStartNode = newChildren[++newStartIndex]
      }else {
        let index = oldChildren.findIndex(c => c.key === newStartNode.key)
        if(index > -1){
          const oldToMove = oldChildren[index]
          patch(oldToMove, newStartNode, container)
          insert(oldToMove.el, container, oldStartNode.el)
          // 该项已经patch 和 移动处理了，设置标记标明已经处理过
          oldChildren[index] = undefined
        }else {
          patch(null, newStartNode, container, oldStartNode.el)
        }
        newStartNode = newChildren[++newStartIndex]
      }
    }

    if(oldStartIndex > oldEndIndex && newStartIndex <= newEndIndex){
      // 新增元素
      for(let i = newStartIndex; i <= newEndIndex; i++){
        patch(null, newChildren[i], container, oldStartNode.el)
      }
    }else if(newStartIndex > newEndIndex && oldStartIndex <= oldEndIndex){
      // 删除元素
      for(let i = oldStartIndex; i <= oldEndIndex; i++){
        unmount(oldChildren[i])
      }
    }

  }


  const patchKeyedChildrenV3 = (n1, n2, container) => {
    const oldChildren = n1.children
    const newChildren = n2.children
    let startIdx = 0
    let newNode = newChildren[startIdx]
    let oldNode = oldChildren[startIdx]
    // 预处理相同的前置后置元素
    while(newNode.key === oldNode.key){
      patch(oldNode, newNode, container)
      startIdx++
      newNode = newChildren[startIdx]
      oldNode = oldChildren[startIdx]
    }
    let newEndIdx = newChildren.length - 1
    let oldEndIdx = oldChildren.length - 1

    oldNode = oldChildren[oldEndIdx]
    newNode = newChildren[newEndIdx]

    while(oldNode.key === newNode.key){
      patch(oldNode, newNode, container)
      oldNode = oldChildren[--oldEndIdx]
      newNode = newChildren[--newEndIdx]
    }

    if(oldEndIdx < startIdx && startIdx <= newEndIdx){
      //新增
      const nextIdx = newEndIdx + 1
      const anchor = nextIdx < newChildren.length ? newChildren[nextIdx].el : null
      for(let i = startIdx; i <= newEndIdx; i++){
        patch(null, newChildren[i], container, anchor)
      }
    }else if(startIdx > newEndIdx && startIdx <= oldEndIdx){
      // 卸载
      for(let i = startIdx; i <= oldEndIdx; i++){
        unmount(oldChildren[i])
      }
    }

  }

  const unmount = (vnode) => {
    if(vnode.type === Fragment){
      vnode.children(v => unmount(v))
      return
    }
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
  },
  createText(text){
    return document.createTextNode(text)
  },
  createComment(c){
    return document.createComment(c)
  },
  setText(node, value){
    node.nodeValue = value
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
// const bool = ref(false)
// effect(() => {
//   const vnode = {
//     type: 'div',
//     props: bool.value ? {
//       onClick: e => {
//         console.log('parent get clicked', e)
//       }
//     } : {},
//     children: [{
//       type: 'p',
//       children: 'click me',
//       props: {
//         onClick(e){
//           console.log('son get clicked', e)
//           bool.value = true
//         }
//       }
//     }]
//   }
//   renderer.render(vnode, document.getElementById('app'))
// })

// const counter = ref(1)
// effect(() => {
//   const vnode = {
//     type: 'div',
//     children: [
//       {
//         type: 'button',
//         props: {
//           onClick: () => {
//             counter.value++
//           }
//         },
//         children: 'Click me'
//       },
//       {
//         type: Text,
//         children: `I'm children text, counter is ${counter.value}`
//       },
//       {
//         type: Comment,
//         children: `I'm children comment, counter is ${counter.value}`
//       }
//     ]
//   }
//   renderer.render(vnode, document.getElementById('app'))
// })


// const vnode1 = {
//   type: 'div',
//   children: [
//     {
//       type: 'p',
//       key: 2,
//       children: 'p-2'
//     },
//     {
//       type: 'p',
//       key: 4,
//       children: 'p-4'
//     },
//     {
//       type: 'p',
//       key: 1,
//       children: 'p-1'
//     },
//     {
//       type: 'p',
//       key: 3,
//       children: 'p-3'
//     },
//   ]
// }
// renderer.render(vnode1, document.getElementById('app'))

// const vnodeNew1 = {
//   type: 'div',
//   children: [
//     {
//       type: 'p',
//       key: 1,
//       children: 'p-1'
//     },
//     {
//       type: 'p',
//       key: 2,
//       children: 'p-2'
//     },
//     {
//       type: 'p',
//       key: 3,
//       children: 'p-3'
//     },
//     {
//       type: 'p',
//       key: 4,
//       children: 'p-4'
//     }
//   ]
// }
// setTimeout(() => {
//   renderer.render(vnodeNew1, document.getElementById('app'))
// }, 2000)


// const vnode2 = {
//   type: 'div',
//   children: [
//     {
//       type: 'p',
//       key: 1,
//       children: 'p-1'
//     },
//     {
//       type: 'p',
//       key: 2,
//       children: 'p-2'
//     },
//     {
//       type: 'p',
//       key: 3,
//       children: 'p-3'
//     },
//   ]
// }
// renderer.render(vnode2, document.getElementById('app'))

// const vnodeNew2 = {
//   type: 'div',
//   children: [
//     {
//       type: 'p',
//       key: 4,
//       children: 'p-4'
//     },
//     {
//       type: 'p',
//       key: 1,
//       children: 'p-1'
//     },
//     {
//       type: 'p',
//       key: 2,
//       children: 'p-2'
//     },
//     {
//       type: 'p',
//       key: 3,
//       children: 'p-3'
//     },
//   ]
// }
// setTimeout(() => {
//   renderer.render(vnodeNew2, document.getElementById('app'))
// }, 2000)

const vnode3 = {
  type: 'div',
  children: [
    {
      type: 'p',
      key: 1,
      children: 'p-1'
    },
    {
      type: 'p',
      key: 2,
      children: 'p-2'
    },
    {
      type: 'p',
      key: 3,
      children: 'p-3'
    },
  ]
}
renderer.render(vnode3, document.getElementById('app'))

const vnodeNew3 = {
  type: 'div',
  children: [
    {
      type: 'p',
      key: 1,
      children: 'p-1'
    },
    {
      type: 'p',
      key: 3,
      children: 'p-3'
    },
  ]
}
setTimeout(() => {
  renderer.render(vnodeNew3, document.getElementById('app'))
}, 2000)

