import { renderer, onMounted } from "./renderer-design.js"
const {ref} = VueReactivity
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