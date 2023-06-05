import { renderer } from "./renderer-design.js"
const MyComponent = {
  name: 'MyComponent',
  data(){
    return {
      title: '我是标题',
    }
  },
  render(){
    return {
      type: 'div',
      children: [
        {
          type: 'p',
          children: `${this.title}`
        }
      ]
    }
  }
}

const compVnode = {
  type: MyComponent
}
renderer.render(compVnode, document.getElementById('app'))