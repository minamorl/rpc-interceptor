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
  ["update", (...args: any) => args],
  ["foobar", () => {}],
  ["sum", (...args: any[]) => args.reduce((x, y) => x + y)],
  ["notify_hello", (args: any) => 19],
  ["sum", (...args: any[]) => args.reduce((x, y) => x + y)],
  ["get_data", (...args: any[]) => ["hello", 5]]

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
  test("receives a notification", t => {
    const i = new RPCInterceptor(sampleMap)
    t.deepEqual(
      i.execute(JSON.stringify(
        {"jsonrpc": "2.0", "method": "update", "params": [1,2,3,4,5]})),
      undefined )
    t.deepEqual(
      i.execute(JSON.stringify(
        {"jsonrpc": "2.0", "method": "foobar"})),
      undefined)
    t.end()
  })
  test("returns method not found on calling non existent method", t => {
    const i = new RPCInterceptor(sampleMap)
    t.deepEqual(
      i.execute(JSON.stringify(
        {"jsonrpc": "2.0", "method": "nonexistent", "id": "1"})),
      {"jsonrpc": "2.0", "error": {"code": -32601, "message": "Method not found"}, "id": "1"})
    t.end()
  })
  test("receives invalid Request object", t => {
    const i = new RPCInterceptor(sampleMap)
    t.deepEqual(
      i.execute(JSON.stringify(
        {"jsonrpc": "2.0", "method": 1, "params": "bar"})),
      {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null})
    t.end()
  })
  test("raises error when receives broken Batch", t => {
    const i = new RPCInterceptor(sampleMap)
    t.deepEqual(
      i.execute(`[
        {"jsonrpc": "2.0", "method": "sum", "params": [1,2,4], "id": "1"},
        {"jsonrpc": "2.0", "method"
      ]`),
      {"jsonrpc": "2.0", "error": {"code": -32700, "message": "Parse error"}, "id": null})
    t.deepEqual(
      i.execute(`[1]`),
      [
        {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null}
      ])
    t.deepEqual(
      i.execute(`[1, 2, 3]`),
      [
        {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null},
        {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null},
        {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null}
      ])
    t.end()
  })
  test("receives Batch", t => {
    const i = new RPCInterceptor(sampleMap)
    t.deepEqual(
      i.execute(JSON.stringify([
        {"jsonrpc": "2.0", "method": "sum", "params": [1,2,4], "id": "1"},
        {"jsonrpc": "2.0", "method": "subtract", "params": [42,23], "id": "2"},
        {"foo": "boo"},
        {"jsonrpc": "2.0", "method": "foo.get", "params": {"name": "myself"}, "id": "5"},
        {"jsonrpc": "2.0", "method": "get_data", "id": "9"} 
    ])),
    [
      {"jsonrpc": "2.0", "result": 7, "id": "1"},
      {"jsonrpc": "2.0", "result": 19, "id": "2"},
      {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null},
      {"jsonrpc": "2.0", "error": {"code": -32601, "message": "Method not found"}, "id": "5"},
      {"jsonrpc": "2.0", "result": ["hello", 5], "id": "9"}
    ])
    t.deepEqual(
      i.execute(JSON.stringify([
        {"jsonrpc": "2.0", "method": "sum", "params": [1,2,4]},
        {"jsonrpc": "2.0", "method": "sum", "params": [7]}
    ])),
    undefined)
    t.end()
  })

  t.end()
})
