import { dfs } from './Dfs'
import { Graph } from './Graph'

export interface GraphProperties {
    /**
     * A graph is connected if any two vertices are linked by a path.
     */
    isConnected: boolean

    /**
     * A graph is acyclic if it contains no cycles. Such a graph is also called a forest. A cycle is a path (a,b,c,...,a) where a,b,c,... are distinct vertices of the graph.
     */
    isAcyclic: boolean

    /**
     * A graph is a tree if it is connected and acyclic.
     */
    isTree: boolean
}

function isConnected<T> (g: Graph<T>): boolean {
    return Array.from(dfs(g).values()).filter(parent => parent === null).length === 1
}

function isAcyclic<T> (g: Graph<T>): boolean {
    let hasBackEdge = false
    const branch: T[] = []
    dfs(g, {
        preprocess: (u) => {
            branch.push(u)
        },
        preexplore: (_u, _k, c) => {
            if (c !== 'white') {
                // If G is undirected, we need to exclude the edge to the predecessor
                if (!g.directed && g.adj(_u, _k) === branch[branch.length - 2]) {
                    return
                }
                hasBackEdge = true
                console.log(`back edge: ${_u} -> ${g.adj(_u, _k)} (${c})`)
            }
        },
        postprocess: () => {
            branch.pop()
        }
    })
    return !hasBackEdge
}

function isTree<T> (g: Graph<T>): boolean {
    return isConnected(g) && isAcyclic(g)
}

export function getProperties<T> (g: Graph<T>): GraphProperties {
    const results = Array.from([isConnected, isAcyclic, isTree]).map(f => ({ [f.name]: f(g) }))
    return Object.assign({}, ...results)
}
