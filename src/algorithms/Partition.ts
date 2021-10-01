import { dfs } from './Dfs'
import { Graph } from './Graph'

/**
 * Checks if the given graph is bipartite and decomposes its vertices into two partition classes.
 * @param g Input graph
 * @returns Bipartition of the graph or null. A bipartition is a two-colouring of the graph where every edge connects two differently coloured vertices.
 */
export function decomposeBipartite<T> (g: Graph<T>): (T[][] | null) {
    // A graph is bipartite if and only if it contains no odd cycle.
    let hasOddCycle = false
    const colouring = new Map<T, 'red' | 'green'>()
    dfs(g, {
        preprocess: (u, parent) => {
            if (parent == null) {
                colouring.set(u, 'red')
                return
            }
            colouring.set(u, colouring.get(parent) === 'red' ? 'green' : 'red')
        },
        preexplore: (u, k, c) => {
            const v = g.adj(u, k)
            if (colouring.get(u) === colouring.get(v)) {
                hasOddCycle = true
            }
        }
    })

    if (hasOddCycle) return null
    return ['red', 'green'].map(c =>
        Array.from(colouring.entries())
            .filter(x => x[1] === c)
            .map(x => x[0])
    )
}
