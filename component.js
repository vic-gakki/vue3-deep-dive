import { renderer } from "./renderer-design.js"
const MyComponent = {
  name: 'MyComponent',
  render(){
    return {
      type: 'div',
      children: '我是文本内容'
    }
  }
}

const compVnode = {
  type: MyComponent
}
renderer.render(compVnode, document.getElementById('app'))