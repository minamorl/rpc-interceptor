import {RPCInterceptor} from "../src"
import test from "tape"

interface ISubtractArguments {
  subtrahend: number
  minuend: number
}
const subtract2 = ({subtrahend, minuend}: ISubtractArguments) => {
  return minuend - subtrahend
}
const sampleMap = new Map<string, Function>([
  ["subtract", (a: number, b: number) => {return a - b}],
  ["subtract2", subtract2],
])

test("RPCInterceptor.execute", t => {
  test("can be initialized with map", t => {
    t.assert(new RPCInterceptor(sampleMap))
    t.end()
  })
  test("can be used with positional parameters", t => {
    const i = new RPCInterceptor(sampleMap)
    t.deepEqual(
      i.execute(JSON.stringify(
        {"jsonrpc": "2.0", "method": "subtract", "params": [42, 23], "id": 1})),
      {"jsonrpc": "2.0", "result": 19, "id": 1})
    t.deepEqual(
      i.execute(JSON.stringify(
        {"jsonrpc": "2.0", "method": "subtract", "params": [23, 42], "id": 2})),
      {"jsonrpc": "2.0", "result": -19, "id": 2})
          
    t.end()
  })
  test("can be called with named parameters", t => {
    const i = new RPCInterceptor(sampleMap)
    t.deepEqual(
      i.execute(JSON.stringify(
        {"jsonrpc": "2.0", "method": "subtract2", "params": {"subtrahend": 23, "minuend": 42}, "id": 3})),
      {"jsonrpc": "2.0", "result": 19, "id": 3})
    t.deepEqual(
      i.execute(JSON.stringify(
        {"jsonrpc": "2.0", "method": "subtract2", "params": {"minuend": 42, "subtrahend": 23}, "id": 4})),
      {"jsonrpc": "2.0", "result": 19, "id": 4})
    t.end()
  })
  t.end()
})
