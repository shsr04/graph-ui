import { Colour, dfs, visitDfs } from './Dfs'
import { Graph } from './Graph'

/**
 *
 * @param g
 * @returns
 *
 * Test graph:
    graph {
        1--2--3--4
        2--5--6
        1--7--8--9
        4--2 5--1 6--1 9--7
    }
 */
export function findBiconnectedComponents<T> (g: Graph<T>): Array<Array<[T, T]>> {
    const discovery = new Map<T, number>()
    const discoveryIndex = 0
    const lowpt = new Map<T, number>()
    const edges: Array<[T, T]> = []
    const components: Array<Array<[T, T]>> = []

    for (const root of g.vertices()) {
        if (discovery.has(root)) continue
        visitBiconnect(g, root, null, discovery, discoveryIndex, lowpt, edges, components)
    }

    console.log(components)
    // TODO transform to subgraphs
    return components
}

function mustGet<T, U> (map: Map<T, U>, key: T): U {
    const value = map.get(key)
    if (value === undefined) throw Error(`Map has no value for key ${JSON.stringify(key)}`)
    return value
}

function visitBiconnect<T> (g: Graph<T>, u: T, parent: T | null, discovery: Map<T, number>, discoveryIndex: number, lowpt: Map<T, number>, edges: Array<[T, T]>, components: Array<Array<[T, T]>>) {
    discovery.set(u, discoveryIndex)
    lowpt.set(u, discoveryIndex)
    discoveryIndex++
    console.log(`lowpt[${u}] = ${lowpt.get(u)}`)
    for (const v of g.neighbours(u)) {
        if (!discovery.has(v)) {
            console.log('discover', v)
            edges.push([u, v])
            visitBiconnect(g, v, u, discovery, discoveryIndex, lowpt, edges, components)
            console.log(`lowpt[${u}] = min(lowpt[${u}], lowpt[${v}])`)
            lowpt.set(u, Math.min(mustGet(lowpt, u), mustGet(lowpt, v)))
            console.log(`lowpt[${u}] >= ${discovery.get(u)} ?`)
            if (mustGet(lowpt, v) >= mustGet(discovery, u)) {
                console.log('cutvertex = ', u)
                const component: Array<[T, T]> = []
                while (true) {
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
            console.log('back edge', v, u)
            edges.push([u, v])
            lowpt.set(u, Math.min(mustGet(lowpt, u), mustGet(discovery, v)))
        }
    }
}
