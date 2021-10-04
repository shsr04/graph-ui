import { Colour, dfs, visitDfs } from "./Dfs";
import { Graph } from "./Graph";

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
    }
 */
export function findBiconnectedComponents<T>(g: Graph<T>): [T, T][][] {
    const discovery = new Map<T, number>();
    let discoveryIndex = 0
    const lowpt = new Map<T, number>();
    const edges: [T, T][] = []
    const components: [T, T][][] = []
    for (const root of g.vertices()) {
        if (discovery.has(root)) continue
        visitBiconnect(g, root, null, discovery, discoveryIndex, lowpt, edges, components)
    }
    console.log(components)
    return components
}

function mustGet<T, U>(map: Map<T, U>, key: T): U {
    const value = map.get(key)
    if (value === undefined) throw Error(`Map has no value for key ${JSON.stringify(key)}`)
    return value
}

function visitBiconnect<T>(g: Graph<T>, u: T, parent: T | null, discovery: Map<T, number>, discoveryIndex: number, lowpt: Map<T, number>, edges: [T, T][], components: [T, T][][]) {
    console.log(discovery, discoveryIndex, lowpt)
    discoveryIndex++
    discovery.set(u, discoveryIndex)
    lowpt.set(u, discoveryIndex)
    for (const v of g.neighbours(u)) {
        if (!discovery.has(v)) {
            edges.push([u, v])
            visitBiconnect(g, v, u, discovery, discoveryIndex, lowpt, edges, components)
            lowpt.set(u, Math.min(mustGet(lowpt, u), mustGet(lowpt, v)))
            if (mustGet(lowpt, v) >= mustGet(discovery, u)) {
                console.log("cutvertex = ", u)
                const component: [T, T][] = []
                while (true) {
                    const [w1, w2] = edges[edges.length - 1]
                    if (mustGet(discovery, w1) < mustGet(discovery, v)) break
                    component.push([w1, w2])
                    edges.pop()
                }
                component.push([u, v])
                edges.pop()
                console.log("C = ", component)
                components.push(component)
            }
        } else if (mustGet(discovery, v) < mustGet(discovery, u) && v !== parent) {
            edges.push([u, v])
            lowpt.set(u, Math.min(mustGet(lowpt, u), mustGet(discovery, v)))
        }
    }
}

/** Old:
 for (const root of g.vertices()) {
        if (discovery.has(root)) continue
        visitDfs(g, root, new Map<T, Colour>(g.vertices().map(u => [u, "white"])), new Map(), {
            preprocess: (u) => {
                console.log(`d(${u})=${discoveryIndex}`)
                discovery.set(u, discoveryIndex)
                lowpt.set(u, discoveryIndex)
                discoveryIndex++
            },
            preexplore: (u, k, _) => {
                const v = g.adj(u, k)
                if (!discovery.has(v)) {
                    edges.push([u, v])
                    return
                }
                const du = discovery.get(u)
                if (du === undefined) {
                    throw Error(`INTERNAL ERROR: d(${u}) is unknown`)
                }
                const dv = discovery.get(v)
                if (dv === undefined) {
                    throw Error(`INTERNAL ERROR: d(${v}) is unknown`)
                }
                if (dv < du && v !== root) {
                    edges.push([u, v])
                    const lu = lowpt.get(u)
                    if (lu === undefined) {
                        throw Error(`INTERNAL ERROR: lowpt(${u}) is unknown`)
                    }
                    lowpt.set(u, Math.min(lu, dv))
                }
            },
            postexplore: (u, k, _) => {
                // if (c !== "white") return
                const v = g.adj(u, k)
                const lu = lowpt.get(u)
                const lv = lowpt.get(v)
                const du = discovery.get(u)
                const dv = discovery.get(v)
                if (lu === undefined) {
                    throw Error(`INTERNAL ERROR: lowpt(${u}) is unknown`)
                }
                if (lv === undefined) {
                    throw Error(`INTERNAL ERROR: lowpt(${v}) is unknown`)
                }
                if (du === undefined) {
                    throw Error(`INTERNAL ERROR: d(${u}) is unknown`)
                }
                if (dv === undefined) {
                    throw Error(`INTERNAL ERROR: d(${v}) is unknown`)
                }
                lowpt.set(u, Math.min(lu, lv))
                if (lv < du) return
                const component: [T, T][] = []
                while (true) {
                    const [w, w2] = edges[edges.length - 1]
                    const dw = discovery.get(w)
                    if (dw === undefined) throw Error(`INTERNAL ERROR: d(${w}) is unknown`)
                    if (dw < dv) break
                    component.push([w, w2])
                    edges.pop()
                }
                component.push([u, v])
                edges.pop()
                components.push(component)
            }
        })
    }
 */