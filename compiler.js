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
      transformRoot,
      transformElement,
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
  const children = context.currentNode.children
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
  // if(ast.type ==='Text'){
  //   // context.replaceNode({
  //   //   type: 'Element',
  //   //   tag: 'span'
  //   // })
  //   context.removeNode()
  // }
  if(ast.type !== 'Text'){
    return
  }
  ast.jsNode = createStringLiteral(ast.content)
}

const transformElement = (ast, context) => {
  return () => {
    if(ast.type !== 'Element'){
      return
    }
    const callExp = createCallExpression('h', [createStringLiteral(ast.tag)])
    if(ast.children.length === 1){
      callExp.arguments.push(ast.children[0].jsNode)
    }else {
      callExp.arguments.push(createArrayExpression(ast.children.map(c => c.jsNode)))
    }
    ast.jsNode = callExp
  }
}

const transformRoot = (ast, context) => {
  return () => {
    if(ast.type !=='Root'){
      return
    }
    ast.jsNode = {
      type: 'FunctionDeclaration',
      id: createIdentifier('render'),
      params: [],
      body: [
        {
          type: 'ReturnStatement',
          return: ast.children[0].jsNode
        }
      ]
    }
  }
}


const createStringLiteral = value => {
  return {
    type: 'StringLiteral',
    value
  }
}

const createIdentifier = name => {
  return {
    type: 'Identifier',
    name
  }
}

const createCallExpression = (callee, args) => {
  return {
    type: 'CallExpression',
    callee: createIdentifier(callee),
    arguments: args
  }
}

const createArrayExpression = (elements) => {
  return {
    type: 'ArrayExpression',
    elements
  }
}

const generate = (ast) => {
  const context = {
    code: '',
    currentIndent: 0,
    push(code){
      context.code += code
    },
    newLine(){
      context.push('\n' + '  '.repeat(context.currentIndent))
    },
    indent(){
      context.currentIndent++
      context.newLine()
    },
    dedent(){
      context.currentIndent--
      context.newLine()
    }
  }
  genCode(ast, context)
  return context.code
}


const genCode = (node, context) => {
  switch(node.type){
    case 'CallExpression':
      genCallExpression(node, context)
      break;
    case 'FunctionDeclaration':
      genFunctionDeclaration(node, context)
      break;
    case 'StringLiteral':
      genStringLiteral(node, context)
      break;
    case 'ArrayExpression':
      genArrayExpression(node, context)
      break;
    case 'ReturnStatement':
      genReturnStatement(node, context)
      break;
    case 'Identifier':
      genIdentifier(node, context)
      break;
  }
}

const genCallExpression = (node, context) => {
  const {push} = context
  genCode(node.callee, context)
  push('(')
  genNodeList(node.arguments, context, () => push(', '))
  push(')')
}

const genNodeList = (list, context, seperator) => {
  list.forEach((node, index) => {
    genCode(node, context)
    if(index !== list.length - 1){
      seperator()
    }
  })
}

const genFunctionDeclaration = (node, context) => {
  const {push, indent, dedent, newLine} = context
  genCode(node.id, context)
  push('(')
  genNodeList(node.params, context, () => push(', '))
  push(') {')
  indent()
  genNodeList(node.body, context, () => newLine())
  dedent()
  push('}')
}

const genArrayExpression = (node, context) => {
  const {push} = context
  push('[')
  genNodeList(node.elements, context, () => push(', '))
  push(']')
}

const genStringLiteral = (node, context) => {
  const {push} = context
  push(`'${node.value}'`)
}

const genIdentifier = (node, context) => {
  const {push} = context
  push(node.name)
}

const genReturnStatement = (node, context) => {
  const {push} = context
  push('return ')
  genCode(node.return, context)
}

const compile = template => {
  const ast = parse(template)
  transform(ast)
  return generate(ast.jsNode)
}


const str = '<div><p>Vue</p><p>Template</p></div>'
const res = compile(str)
console.log(res)