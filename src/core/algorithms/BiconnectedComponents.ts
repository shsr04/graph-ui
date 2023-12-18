import { Graph } from '../Graph'

/**
 * Extracts the biconnected components from the given graph. #
 * A component is biconnected if there is more than one path between every two vertices u,v in the graph with u != v.
 * Conversely, a vertex w separates two vertices u,w if all paths from u to v contain w. Such a vertex w is called a cutvertex.
 * When a cutvertex is deleted from a graph, the graph is separated into multiple components.
 * @param g Input graph
 * @param root Root vertex (optional). If defined, the function only considers the component containing the the root vertex.
 * @returns 1) The set of cutvertices in the graph
 * 2) The maximally biconnected subgraphs of the graph
 *
 * If the input graph is biconnected, the set of cutvertices is empty and there is exactly one maximally biconnected subgraph.
 *
 * Test graph:
    graph {
        1--2--3--4
        2--5--6
        1--7--8--9
        4--2 5--1 6--1 9--7
    }
 */
export function findBiconnectedComponents<T> (g: Graph<T>, root?: T): [Set<T>, Array<Map<T, T[]>>] {
    const discovery = new Map<T, number>()
    const discoveryIndex = 0
    const lowpt = new Map<T, number>()
    const edges: Array<[T, T]> = []
    const components: Array<Array<[T, T]>> = []

    const vertices = root === undefined ? g.vertices : [root]
    for (const u of vertices) {
        if (discovery.has(u)) continue
        visitBiconnect(g, u, null, discovery, discoveryIndex, lowpt, edges, components)
    }

    // Asseemble biconnected subgraphs
    const subgraphs: Array<Map<T, T[]>> = []
    for (const component of components) {
        const adjMap = new Map<T, T[]>()
        // Insert adjacencies into the subgraph
        for (const [u, v] of component) {
            adjMap.set(u, [...(adjMap.get(u) ?? []), v])
            if (!g.directed) {
                adjMap.set(v, [...(adjMap.get(v) ?? []), u])
            }
        }
        subgraphs.push(adjMap)
    }
    const cutvertices: Set<T> = subgraphs.length > 1 ? new Set(components.map(x => x[x.length - 1][0])) : new Set()

    return [cutvertices, subgraphs]
}

function mustGet<T, U> (map: Map<T, U>, key: T): U {
    const value = map.get(key)
    if (value === undefined) throw Error(`Map has no value for key ${JSON.stringify(key)}`)
    return value
}

function visitBiconnect<T> (g: Graph<T>, u: T, parent: T | null, discovery: Map<T, number>, discoveryIndex: number, lowpt: Map<T, number>, edges: Array<[T, T]>, components: Array<Array<[T, T]>>): void {
    discovery.set(u, discoveryIndex)
    lowpt.set(u, discoveryIndex)
    discoveryIndex++
    for (const v of g.neighbours(u)) {
        if (!discovery.has(v)) {
            edges.push([u, v])
            visitBiconnect(g, v, u, discovery, discoveryIndex, lowpt, edges, components)
            // lowpt(u) is less or equal to the lowpt of all descendants of u
            lowpt.set(u, Math.min(mustGet(lowpt, u), mustGet(lowpt, v)))
            // If lowpt(v) >= d(u), then any back edges originating in v and its descendants never leave the subtree T[u].
            // Moreover, u is a cutvertex because there is only one path from an ancestor of u to v.
            if (mustGet(lowpt, v) >= mustGet(discovery, u)) {
                const component: Array<[T, T]> = []
                while (true) {
                    // The biconnected component contains all edges (w1,w2) such that v is connected to w1 via one or more tree edges.
                    const [w1, w2] = edges[edges.length - 1]
                    if (mustGet(discovery, w1) < mustGet(discovery, v)) break
                    component.push([w1, w2])
                    edges.pop()
                }
                component.push([u, v])
                edges.pop()
                components.push(component)
            }
        } else if (mustGet(discovery, v) < mustGet(discovery, u) && v !== parent) {
            edges.push([u, v])
            lowpt.set(u, Math.min(mustGet(lowpt, u), mustGet(discovery, v)))
        }
    }
}
