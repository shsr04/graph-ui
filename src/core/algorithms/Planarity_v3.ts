import { Graph } from '../Graph'
import { AdjacencyGraph } from '../AdjacencyGraph'
import { dfs } from './Dfs'

/**
 * Detects if the given input graph is planar.
 * Based on the algorithm by Boyer and Myrvold, 2004 (https://jgaa.info/accepted/2004/BoyerMyrvold2004.8.3.pdf).
 * @param g Input graph
 * @return True if the graph is planar, false otherwise
 */
export function checkPlanarity<T> (g: Graph<T>): boolean {
    if (g.directed) {
        throw Error('Planarity check is not implemented for directed graphs')
    }

    if (g.order > 2 && g.size > 3 * g.order - 6) {
        console.log("The input graph has 'm > 3 * n - 6' => not planar")
        return false
    }

    const embeddedGraph = new EmbeddedGraph(g)

    for (const u of embeddedGraph.verticesInDiscoveryOrder.reverse()) {
        for (const child of embeddedGraph.dfsChildren.get(u) ?? []) {
            console.log(`embed ${u} -> ${child}`)
        }
    }

    // TODO: continue implementation

    return false
}

class EmbeddedGraph<T> extends AdjacencyGraph<T> {
    /**
     * Assigns the DFS discovery time to each vertex.
     */
    private readonly discoveryTime = new Map<T, number>()
    public readonly verticesInDiscoveryOrder = new Array<T>()
    /**
     * Assigns the low point to each vertex.
     * The low point is the earliest vertex reachable by traversing 1..* tree edges and 1 back edge.
     */
    private readonly lowPoint = new Map<T, number>()
    /**
     * Assigns the DFS children, sorted by low point, to each vertex.
     */
    public readonly dfsChildren = new Map<T, T[]>()

    constructor (graph: Graph<T>) {
        const adjMap = new Map<T, T[]>()
        for (const [u, v] of graph.edges) {
            const adj = adjMap.get(u) ?? []
            adj.push(v)
            adjMap.set(u, adj)
        }

        super(graph.id, graph.name, graph.directed, adjMap)

        this.setLowPoints()

        console.log(`time = ${JSON.stringify(Object.fromEntries(this.discoveryTime))}`)
        console.log(`lowpt = ${JSON.stringify(Object.fromEntries(this.lowPoint))}`)

        this.setDfsChildren()

        console.log(`dfsChild = ${JSON.stringify(Object.fromEntries(this.dfsChildren))}`)
    }

    private time (u: T): number {
        const result = this.discoveryTime.get(u)
        if (result === undefined) {
            throw Error(`Implementation error: time(${u}) not found`)
        }
        return result
    }

    private lowpt (u: T): number {
        const result = this.lowPoint.get(u)
        if (result === undefined) {
            throw Error(`Implementation error: lowpt(${u}) not found`)
        }
        return result
    }

    private setLowPoints (): void {
        let time = 0
        dfs(this, {
            preprocess: (u, parent) => {
                this.discoveryTime.set(u, time)
                this.verticesInDiscoveryOrder.push(u)
                this.lowPoint.set(u, time)

                time++
            },
            preexplore: (u, k, colour, parent) => {
                const v = this.adj(u, k)

                if (colour === 'grey' && v !== parent) {
                    // Since (u,v) is a back edge, v,...,u,v is a cycle.
                    // Therefore, we can enforce lowpt(u) <= time(v).
                    this.lowPoint.set(u, Math.min(this.lowpt(u), this.time(v)))
                }
            },
            postexplore: (u, k, colour) => {
                const v = this.adj(u, k)

                if (colour === 'white') {
                    // Since (u,v) is a tree edge, both need to have the same low point by definition.
                    this.lowPoint.set(u, Math.min(this.lowpt(u), this.lowpt(v)))
                }
            }
        })
    }

    private setDfsChildren (): void {
        dfs(this, {
            preexplore: (u, k, colour) => {
                if (colour === 'white') {
                    const children = this.dfsChildren.get(u) ?? []
                    children.push(this.adj(u, k))
                    this.dfsChildren.set(u, children)
                }
            },
            postprocess: u => {
                const children = this.dfsChildren.get(u)
                if (children === undefined) {
                    return
                }

                children.sort((v1, v2) => this.lowpt(v1) - this.lowpt(v2))
                this.dfsChildren.set(u, children)
            }
        }
        )
    }
}
