export const JSONRPC_VERSION = "2.0"

export const defaultErrors = new Map<number, string>([
    [-32700, "Parse error"],
    [-32600, "Invalid Request"],
    [-32601, "Method not found"],
    [-32602, "Invalid params"],
    [-32603, "Internal error"]  
])

export class RPCInterceptorError extends Error {
    code: number
    msg?: string
    data?: any
    constructor(code: number, msg?: string, data?: any) {
        super()
        this.code = code
        this.msg = msg
        this.data = data
    }
    response(id: number | null | undefined) {
        let response: any = {
            code: this.code,
            message: defaultErrors.has(this.code) ? defaultErrors.get(this.code) : this.msg,
        }
        if (this.data) response.data = this.data
        return _r({"error": response}, id)
    }
}
export const _r = (x: object, id: number | null | undefined) => {
    const obj = { "jsonrpc": JSONRPC_VERSION, ...x, id }
    if (id === undefined) delete obj.id
    return obj
}

const tryParse = (str: string) => {
    try {
        return JSON.parse(str)
    } catch (e) {
        throw new RPCInterceptorError(-32700)
    }
}

interface IDeserializedRequest {
    jsonrpc: string
    method: string
    params: any
    id: number
}

export class RPCInterceptor {
    private functionMap: Map<string, Function>
    constructor(functionMap?: Map<string, Function>) {
        this.functionMap = functionMap ? functionMap : new Map
    }
    register(str: string, fn: Function) {
        return this.functionMap.set(str, fn)
    }
    execute = (str: string) => {
        let parsed: Array<IDeserializedRequest> 
        try {
            const _parsed = tryParse(str)
            if (!Array.isArray(_parsed)) parsed = [_parsed]
            else parsed = _parsed
        } catch (e) {
            return e.response(null)
        }
        const response = parsed.map(this._execute)

        if (response.length === 1)
            return response[0]
        return response
    }
    private _execute = (parsed: IDeserializedRequest) => {
        let response
        try {
            this.validateRequest(parsed)
            if (Array.isArray(parsed.params)) {
                response = {"result": this.functionMap.get(parsed["method"])!(...parsed.params)}
            } else {
                response = {"result": this.functionMap.get(parsed["method"])!(parsed.params)}
            }
            return _r(response, parsed.id)
        } catch(e) {
            if (parsed.id)
                return e.response(parsed.id)
            return e.response()
        }
    }
    private validateRequest = (deserialized: IDeserializedRequest) => {
        if (deserialized["jsonrpc"] !== "2.0") {
            throw new RPCInterceptorError(-32600)
        }
        if (!this.functionMap.has(deserialized["method"])) {
            throw new RPCInterceptorError(-32601)
        }
    }

}