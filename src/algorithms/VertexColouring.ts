import { Graph } from './Graph'

/**
 * Colours all the vertices in the given graph such that no two adjacent vertices have the same colour.
 * @param g Input graph
 * @param root Root vertex (optional). If defined, the vertex colouring starts at this vertex
 * @returns A k-colouring of the graph. Every vertex is assigned a colour c in C={0,1,...,k}.
 * The total number of used colours is k <= D(G)+1 where D(G) is the maximum degree in the graph.
 */
export function colourVertices<T> (g: Graph<T>, root?: T): Map<T, number> {
    if (g.order() < 2) {
        return new Map(g.vertices().map(u => [u, 0]))
    }

    // Sort vertices by degree (in descending order)
    const ordering = [...g.vertices()]
    ordering.sort((u, v) => g.deg(v) - g.deg(u))

    const maxDegree = g.deg(ordering[0])
    const colours = Array.from(Array(maxDegree + 1).keys())
    const colourMap = new Map<T, number>()

    // If a root vertex is given, move it to the front
    if (root !== undefined) {
        ordering.splice(ordering.indexOf(root), 1)
        ordering.unshift(root)
    }

    for (const u of ordering) {
        const available = new Set(colours)
        for (const v of g.neighbours(u)) {
            const c = colourMap.get(v)
            if (c === undefined) continue
            available.delete(c)
        }
        const chosen = Math.min(...Array.from(available))
        colourMap.set(u, chosen)
    }

    return colourMap
}
