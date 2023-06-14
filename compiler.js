const State = {
  initial: 0,
  tagStart: 1,
  tagName: 2,
  text: 3,
  tagEnd: 4,
  tagEndName: 5,
}

const isAlpha = char => {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
}


const tokenize = str => {
  const chars = []
  const tokens = []
  let currentState = State.initial
  let char = ''
  while(str){
    char = str[0]
    switch(currentState){
      case State.initial:
        if(char === '<'){
          currentState = State.tagStart
        }else if(isAlpha(char)){
          chars.push(char)
          currentState = State.text
        }
        break;
      case State.tagStart:
        if(isAlpha(char)){
          chars.push(char)
          currentState = State.tagName
        }else if(char === '/'){
          currentState = State.tagEnd
        }
        break;
      case State.tagName:
        if(isAlpha(char)){
          chars.push(char)
        }else if(char === '>'){
          currentState = State.initial
          tokens.push({
            type: 'tag',
            name: chars.join('')
          })
          chars.length = 0
        }
        break;
      case State.text:
        if(isAlpha(char)){
          chars.push(char)
        }else if(char === '<'){
          currentState = State.tagStart
          tokens.push({
            type: 'text',
            content: chars.join('')
          })
          chars.length = 0
        }
        break;
      case State.tagEnd:
        if(isAlpha(char)){
          chars.push(char)
          currentState = State.tagEndName
        }
        break;
      case State.tagEndName:
        if(isAlpha(char)){
          chars.push(char)
        }else if(char === '>'){
          currentState = State.initial
          tokens.push({
            type: 'tagEnd',
            name: chars.join('')
          })
          chars.length = 0
        }
        break;
      default:
        console.warn(`unknown state: ${currentState}`)
    }
    str = str.slice(1)
  }
  return tokens
}

const templateAST = tokens => {
  const root = {
    type: 'Root',
    children: []
  }
  const tokenStack = [root]
  for(let i = 0; i < tokens.length; i++){
    const token = tokens[i]
    const parent = tokenStack[tokenStack.length - 1]
    if(token.type === 'tag'){
      const node = {
        type: 'Element',
        tag: token.name,
        children: []
      }
      parent.children.push(node)
      tokenStack.push(node)
    }else if(token.type === 'text'){
      parent.children.push({
        type: 'Text',
        content: token.content
      })
    }else if(token.type === 'tagEnd'){
      const node = tokenStack.pop()
      if(node.tag !== token.name){
        console.warn('mismatched tag')
      }
    }
  }
  return root
}

const parse = str => {
  const tokens = tokenize(str)
  const ast = templateAST(tokens)
  return ast
}

const transform = ast => {
  dump(ast)
  const context = {
    parent: null,
    currentNode: null,
    index: 0,
    nodeTransforms: [
      transformTag,
      transformText
    ],
    replaceNode(node){
      if(context.parent){
        context.parent.children[context.index] = node
      }
      context.currentNode = node
    },
    removeNode(){
      if(context.parent){
        context.parent.children.splice(context.index, 1)
      }
      context.currentNode = null
    }
  }
  tranverseNode(ast, context)
  console.log('---------------')
  dump(ast)
}



const tranverseNode = (ast, context) => {
  context.currentNode = ast
  const {nodeTransforms} = context
  const exitFns = []
  for(let i = 0; i < nodeTransforms.length; i++){
    const exitFn = nodeTransforms[i](context.currentNode, context)
    if(exitFn){
      exitFns.unshift(exitFn)
    }
    if(context.currentNode === null){
      return
    }
  }
  const children = ast.children
  if(children){
    children.forEach((c, index) => {
      context.parent = context.currentNode
      context.index = index
      tranverseNode(c, context)
    })
  }
  
  for(let i = 0; i < exitFns.length; i++){
    exitFns[i](context.currentNode, context)
  }
}

// 结构化打印ast
const dump = (ast, indent = 0) => {
  const type = ast.type
  const desc = type === 'Root' 
    ? '' 
    : type === 'Element' 
      ? ast.tag 
      : type === 'Text' 
        ? ast.content 
        : ''
  console.log(`${'-'.repeat(indent)}${type}: ${desc}`)
  if(ast.children?.length){
    ast.children.forEach(c => dump(c, indent + 2))
  }
}

// node transformers

const transformTag = (ast, context) => {
  if(ast.type === 'Element' && ast.tag === 'p'){
    ast.tag = 'h1'
  }
}

const transformText = (ast, context) => {
  if(ast.type ==='Text'){
    // context.replaceNode({
    //   type: 'Element',
    //   tag: 'span'
    // })
    context.removeNode()
  }
}

const str = '<div><p>Vue</p><p>Template</p></div>'
const ast = parse(str)
transform(ast)