import { Graph } from '../Graph'
import { AdjacencyGraph } from '../AdjacencyGraph'
import { dfs } from './Dfs'
import { findBiconnectedComponents } from './BiconnectedComponents'

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

    const cutVertices = findBiconnectedComponents(g)[0]
    const embeddedGraph = new EmbeddedGraph(g)

    for (const u of embeddedGraph.verticesInDiscoveryOrder.reverse()) {
        for (const child of embeddedGraph.children(u)) {
            embeddedGraph.embedNewBCC(u, child)
        }

        console.log(`incidentBackEdges(${u}) = ${JSON.stringify(embeddedGraph.incidentBackEdges(u))}`)

        for (const [v] of embeddedGraph.incidentBackEdges(u)) {
            walkUp(embeddedGraph, cutVertices, v, u)
        }

        console.log(`pertinentRoots = ${JSON.stringify(Object.fromEntries(embeddedGraph.pertinentRoots))}`)

        for (const child of embeddedGraph.children(u)) {
            // Walkdown(u,child)
        }
    }

    // TODO: continue implementation

    return false
}

function walkUp<T> (graph: EmbeddedGraph<T>, cutVertices: Set<T>, descendant: T, root: T): void {
    // The descendant vertex is pertinent due to the back edge.
    graph.markAsPertinentBackEdge(descendant)

    // Every cut vertex on the tree path root,...,descendant is pertinent.

    let current = descendant
    while (current !== root) {
        const parent = graph.parent(current)
        if (parent === null) {
            throw new Error(`walkUp: parent(${current}) not found`)
        }

        if (cutVertices.has(parent)) {
            graph.addPertinentRoot(parent, { root: parent, child: current })
        }

        current = parent
    }
}

function walkDown<T> (graph: EmbeddedGraph<T>, root: VirtualBCC<T>): void {
    // ...
}

interface FaceTraversalVertex<T> {
    vertex: T
    orientation: 0 | 1
}

function getSuccessorOnExternalFace<T> (graph: EmbeddedGraph<T>, u: T, orientation: 0 | 1): FaceTraversalVertex<T> {
    const v = graph.link(u, orientation)

    if (graph.deg(u) === 1) {
        return { vertex: v, orientation }
    }

    const newOrientation = graph.link(v, 0)
}

class MarkedEdge<T> {
    constructor (
        public source: T,
        public adjIndex: number,
        public target: T,
        public type: 'tree' | 'back'
    ) {

    }
}

interface ExtendedVertexData<T> {
    vertex: T
    /**
     * Assigns the DFS parent, or null, to each vertex.
     */
    parent: T | null
    /**
     * Assigns the DFS discovery time to each vertex.
     */
    discoveryTime: number
    /**
     * Assigns the low point to each vertex.
     * The low point is the earliest vertex reachable by traversing 1..* tree edges and 1 back edge.
     */
    lowPoint: number
    /**
     * Assigns the incident edges to each vertex.
     */
    incidentEdges: Array<MarkedEdge<T>>
    /**
     * Assigns the back edge flag to each vertex.
     * The flag is true exactly if an ancestor has a back edge to the vertex.
     */
    backEdgeFlag: boolean
    /**
     * Assigns the pertinent roots to each vertex.
     * A pertinent root is a virtual BCC root which must later be merged with this vertex.
     */
    pertinentRoots: Array<VirtualBCC<T>>
    /**
     * Assigns the DFS children, sorted by low point, to each vertex.
     */
    dfsChildren: T[]
    /**
     * Assigns the neighbouring vertices on this face to each vertex.
     * The two indices correspond to clockwise and counter-clockwise traversal.
     */
    link: [T, T] | null // TODO fix
}

interface VirtualBCC<T> {
    root: T
    child: T
}

interface VirtualEdge<T> {
    virtualBccRoot: T
    source: T
    target: T
}

class EmbeddedGraph<T> extends AdjacencyGraph<T> {
    /**
     * Contains additional data for each vertex.
     */
    private readonly vertexData = new Map<T, ExtendedVertexData<T>>()
    /**
     * Lists the vertices in DFS discovery order.
     */
    public readonly verticesInDiscoveryOrder = new Array<T>()
    /**
     * Lists the edges that were additionally embedded into the graph.
     */
    private readonly embeddedEdges = new Array<[T, T]>()
    /**
     * Contains the virtual biconnected components (BCCs) of the graph.
     * Each virtual BCC is identified by its root-child pair, which is necessarily unique.
     */
    private readonly embeddedBCCs = new Map<VirtualBCC<T>, Array<VirtualEdge<T>>>()

    constructor (graph: Graph<T>) {
        const adjMap = new Map<T, T[]>()
        for (const [u, v] of graph.edges) {
            const adj = adjMap.get(u) ?? []
            adj.push(v)
            adjMap.set(u, adj)
        }

        super(graph.id, graph.name, graph.directed, adjMap)

        this.setExtendedVertexData()

        console.log(`vertices = ${JSON.stringify(Object.fromEntries(this.vertexData))}`)
    }

    embedNewBCC (root: T, child: T): void {
        console.log(`embed new BCC: ${root} -> ${child}`)
        if (this.embeddedBCCs.get({ root, child }) != null) {
            throw new Error(`Implementation error: virtual BCC ${root}->${child} already exists`)
        }
        this.embeddedBCCs.set({ root, child }, [{ virtualBccRoot: root, source: root, target: child }])
    }

    children (u: T): T[] {
        return this.data(u).dfsChildren
    }

    parent (u: T): T | null {
        return this.data(u).parent
    }

    /**
     * Get all the incident back edges v->u where v is a descendant of u.
     * @param u Vertex to get the back edges for
     * @return List of pairs [v, u] as specified above
     */
    incidentBackEdges (u: T): Array<[T, T]> {
        const result = new Array<[T, T]>()

        for (const data of this.vertexData.values()) {
            // Skip trivial edges
            if (data.vertex === u) continue

            if (data.incidentEdges.find(edge => edge.target === u && edge.type === 'back') != null) {
                result.push([data.vertex, u])
            }
        }

        return result
    }

    link (u: T, orientation: 0 | 1): T {
        const link = this.data(u).link
        if (link === null) {
            throw Error(`Implementation error: link(${u}) not found`)
        }
        return link[orientation]
    }

    markAsPertinentBackEdge (u: T): void {
        this.vertexData.set(u, { ...this.data(u), backEdgeFlag: true })
    }

    addPertinentRoot (u: T, bcc: VirtualBCC<T>): void {
        this.data(u).pertinentRoots.push(bcc)
    }

    get pertinentRoots (): Map<T, Array<VirtualBCC<T>>> {
        const result = new Map<T, Array<VirtualBCC<T>>>()
        for (const data of this.vertexData.values()) {
            result.set(data.vertex, data.pertinentRoots)
        }
        return result
    }

    isPertinent (u: T): boolean {
        return this.data(u).backEdgeFlag || this.data(u).pertinentRoots.length > 0
    }

    private time (u: T): number {
        return this.data(u).discoveryTime
    }

    private lowpt (u: T): number {
        return this.data(u).lowPoint
    }

    private data (u: T): ExtendedVertexData<T> {
        const data = this.vertexData.get(u)
        if (data === undefined) {
            throw Error(`Implementation error: vertex data of ${u} not found`)
        }
        return data
    }

    private setExtendedVertexData (): void {
        let time = 0
        dfs(this, {
            preprocess: (u, parent) => {
                this.vertexData.set(u, {
                    vertex: u,
                    parent,
                    discoveryTime: time,
                    lowPoint: time,
                    // set to empty:
                    incidentEdges: [],
                    pertinentRoots: [],
                    dfsChildren: [],
                    backEdgeFlag: false,
                    link: null
                })
                this.verticesInDiscoveryOrder.push(u)

                time++
            },
            preexplore: (u, k, colour, parent) => {
                const v = this.adj(u, k)

                if (colour === 'white') {
                    this.data(u).dfsChildren.push(v)
                    this.data(u).incidentEdges.push(new MarkedEdge<T>(u, k, v, 'tree'))
                }

                if (colour === 'grey' && v !== parent) {
                    // Since (u,v) is a back edge, v,...,u,v is a cycle.
                    // Therefore, we can enforce lowpt(u) <= time(v).
                    const lowPoint = Math.min(this.lowpt(u), this.time(v))
                    this.vertexData.set(u, { ...this.data(u), lowPoint })
                    // We ignore the trivial back edges that result from the double edge u->v + v<-u.
                    // This should be fine...
                    this.data(u).incidentEdges.push(new MarkedEdge<T>(u, k, v, 'back'))
                }
            },
            postexplore: (u, k, colour) => {
                const v = this.adj(u, k)

                if (colour === 'white') {
                    // Since (u,v) is a tree edge, both need to have the same low point by definition.
                    const lowPoint = Math.min(this.lowpt(u), this.lowpt(v))
                    this.vertexData.set(u, { ...this.data(u), lowPoint })
                }
            },
            postprocess: u => {
                this.data(u).dfsChildren.sort((v1, v2) => this.lowpt(v1) - this.lowpt(v2))
            }
        })
    }
}
