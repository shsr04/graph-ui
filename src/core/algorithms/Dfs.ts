import { Graph } from '../Graph'

export type Colour = 'white' | 'grey' | 'black'

type VertexFunction<T> = (u: T, parent: T|null) => void
type EdgeFunction<T> = (u: T, k: number, colour: Colour, parent: T|null) => void

export interface DfsFunctions<T> {
    preprocess?: VertexFunction<T>
    postprocess?: VertexFunction<T>
    preexplore?: EdgeFunction<T>
    postexplore?: EdgeFunction<T>
}

/**
 * Runs a depth-first search on the given graph. (Hopcroft, Tarjan)
 * @param g Input graph
 * @param f Functions to execute at certain discovery steps during the algorithm
 * @returns The predecessor map of the graph. For any vertex u, the predecessor map contains u's predecessor in the graph.
 * If u is the root vertex of a spanning tree, its predecessor entry is null.
 */
export function dfs<T> (g: Graph<T>, f?: DfsFunctions<T>): Map<T, T | null> {
    const colour: Map<T, Colour> = new Map(g.vertices.map(u => ([u, 'white'])))
    const predecessor: Map<T, T | null> = new Map(g.vertices.map(u => ([u, null])))
    for (const u of g.vertices) {
        if (colour.get(u) !== 'white') continue
        visitDfs(g, u, colour, predecessor, f)
    }
    return predecessor
}

export function visitDfs<T> (g: Graph<T>, u: T, colour: Map<T, Colour>, predecessor: Map<T, T | null>, f?: DfsFunctions<T>): void {
    const parent = predecessor.get(u) ?? null
    f?.preprocess?.(u, parent)
    colour.set(u, 'grey')
    for (let k = 0; k < g.neighbours(u).length; k++) {
        const v = g.adj(u, k)
        const c = colour.get(v)
        if (c === undefined) throw Error(`INTERNAL ERROR: vertex ${JSON.stringify(v)} has no colour`)
        f?.preexplore?.(u, k, c, parent)
        if (c === 'white') {
            predecessor.set(v, u)
            visitDfs(g, v, colour, predecessor, f)
        }
        f?.postexplore?.(u, k, c, parent)
    }
    colour.set(u, 'black')
    f?.postprocess?.(u, parent)
}
