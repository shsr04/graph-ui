import { dfs } from './Dfs'
import { Graph } from './Graph'
import { decomposeBipartite } from './Partition'

export interface GraphProperties {
    /**
     * A graph is connected if any two vertices are linked by a path.
     */
    isConnected: boolean

    /**
     * A graph is acyclic if it contains no cycles. Such a graph is also called a forest. A cycle is a path P=(x1,x2,...,xk,x1) where k >= 3 and x[...] are distinct vertices of the graph.
     */
    isAcyclic: boolean

    /**
     * A graph is a tree if it is connected and acyclic.
     */
    isTree: boolean

    /**
     * A graph is bipartite if its vertices can be split into two partition classes such that every edge of the graph goes from one class to the other.
     */
    isBipartite: boolean
    /**
     * Example: graph g { 1--4 1--5 1--6; 2--4 2--5 2--6; 3--4 3--5 3--6 }
     */
    isCompleteBipartite: boolean

    isComplete: boolean
}

function isConnected<T>(g: Graph<T>): boolean {
    return Array.from(dfs(g).values()).filter(parent => parent === null).length === 1
}

function isAcyclic<T>(g: Graph<T>): boolean {
    let hasBackEdge = false
    const branch: T[] = []
    dfs(g, {
        preprocess: (u) => {
            branch.push(u)
        },
        preexplore: (_u, _k, c) => {
            if (c !== 'white') {
                // If G is undirected, we need to exclude the edge to the parent
                if (!g.directed && g.adj(_u, _k) === branch[branch.length - 2]) {
                    return
                }
                hasBackEdge = true
            }
        },
        postprocess: () => {
            branch.pop()
        }
    })
    return !hasBackEdge
}

function isBipartite<T>(g: Graph<T>): boolean {
    return decomposeBipartite(g) !== null
}

function isCompleteBipartite<T>(g: Graph<T>): boolean {
    const n = g.order()
    const m = g.size()

    // TODO: A bipartite graph K[p,q] is _complete bipartite_ if every two vertices from different classes are adjacent.
    // A complete bipartite graph has m = p*q edges.
    const partitions = decomposeBipartite(g)
    console.log(g.size(), partitions, partitions![0].length, partitions![1].length)
    return partitions !== null && g.size() === partitions![0].length * partitions![1].length
}

function isComplete<T>(g: Graph<T>): boolean {
    const n = g.order()
    const m = g.size()
    return m === n * (n - 1) / 2
}

function isTree<T>(g: Graph<T>): boolean {
    return isConnected(g) && isAcyclic(g)
}

export function getProperties<T>(g: Graph<T>): GraphProperties {
    const results = Array.from([isConnected, isAcyclic, isTree, isBipartite, isComplete, isCompleteBipartite]).map(f => ({ [f.name]: f(g) }))
    return Object.assign({}, ...results)
}
