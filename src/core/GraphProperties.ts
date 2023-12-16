import { dfs } from './algorithms/Dfs'
import { Graph } from './Graph'
import { decomposeBipartite } from './algorithms/Partition'
import { colourVertices } from './algorithms/VertexColouring'
import { findBiconnectedComponents } from './algorithms/BiconnectedComponents'

export interface GraphProperties {
    /**
     * A graph is connected if any two vertices are linked by a path.
     */
    isConnected: boolean

    /**
     * A graph is biconnected if any two vertices are linked by two distinct paths.
     */
    isBiconnected: boolean

    /**
     * A graph is acyclic if it contains no cycles. Such a graph is also called a forest. A cycle is a path P=(x1,x2,...,xk,x1) where k >= 3 and x[...] are distinct vertices of the graph.
     */
    isAcyclic: boolean

    /**
     * A graph is a cycle if it contains a cycle C=(u1,...,un) over all vertices.
     */
    isCycle: boolean

    /**
     * A graph is a tree if it is connected and acyclic.
     */
    isTree: boolean

    /**
     * A graph is complete if every vertex of the graph is connected to every other vertex.
     */
    isComplete: boolean

    /**
     * A graph is bipartite if its vertices can be split into two partition classes such that every edge of the graph has its ends in different classes.
     */
    isBipartite: boolean

    /**
     * A graph is complete bipartite if every vertex in one partition class is connected to every vertex in the other partition class.
     * Example: graph g { 1--4 1--5 1--6; 2--4 2--5 2--6; 3--4 3--5 3--6 }
     */
    isCompleteBipartite: boolean

    /**
     * A graph is a star if it is complete bipartite with partition classes P,Q where |P| = 1 and |Q| = n-1.
     * Example: graph g { 1--2 1--3 1--4 1--5 1--6 }
     */
    isStar: boolean

    /**
     * A graph is Eulerian if it admits an Euler tour. An Euler tour is a closed walk in the graph that visits every edge exactly once.
     * A closed walk is an alternating sequence W=(u1,e1,u2,e2,...,ek,uk) where uk = u1 and e[i] = {u[i], u[i+1]} for 1 <= i <= k.
     */
    isEulerian: boolean

    /**
     * A graph is a wheel if it contains a cycle of length n-1 such that every vertex in the cycle is connected to a "hub" vertex of degree n-1.
     * Example: graph g { 1--2--3--4--1 1--5 2--5 3--5 4--5 }
     */
    isWheel: boolean

    /**
     * A graph is a gear if it can be obtained from a wheel graph by adding one vertex between every two vertices on the outer cycle.
     * Example: graph g { 1--2--3--4--5--6--7--8--1 1--9 3--9 5--9 7--9 }
     */
    isGear: boolean

    /**
     * A graph is k-colourable if admits a k-colouring: a vertex colouring with at most k colours.
     * A vertex colouring of a graph with k colours is a mapping c: V -> {c1,c2,...,ck} such that c(u) != c(v) for all adjacent vertices u,v in V.
     *
     * Note: The k-colouring obtained this way is not necessarily the smallest possible colouring of the vertices.
     * There are some graph classes which are easily coloured:
     * - Every planar graph is 4-colourable. (Four Colours Theorem)
     * - Every planar graph not containing a triangle is 3-colourable.
     */
    colourability: number

    /**
     * A graph is k-chromatic if its vertices can be coloured with no less than k colours.
     *
     * Finding this smallest colouring ("chromatic number") can be an NP-hard problem depending on the graph.
     * However, there are some graph classes which are easily coloured:
     * - Every bipartite graph is 2-chromatic. (see Proposition below)
     *
     * Proposition: Every bipartite graph is 2-chromatic.
     * Proof: We begin with the complete bipartite graph G2 = K[1,1] = ({u,v}, {{u,v}}).
     * We set c(u) = c1 and c(v) = c2. Thus, G2 is 2-chromatic.
     * (It is easy to see that the graph G2' = ({u,v},{}) is bipartite and 1-chromatic. Thus, we can use G2 without loss of generality.)
     * Given a bipartite 2-chromatic graph Gi=(Vi,Ei), we now construct the graph G[i+1].
     * Assume that the vertices in Vi are partitioned into Pi,Qi. Assume that c(p) = c1 for all p in Pi and c(q) = c2 for all q in Qi.
     * If we were to insert a vertex v into Gi such that it is adjacent to vertices in both Pi and Qi, G[i+1] would not be bipartite.
     * So we insert a vertex u into Gi such that u is adjacent to zero or more vertices in Pi and to none of the vertices in Qi. (Obviously, the construction also works vice versa.)
     * This results in G[i+1]=(V[i+1],E[i+1]), P[i+1] = Pi, Q[i+1] = Qi + u.
     * Due to our construction described above, G[i+1] is bipartite. All vertices in G[i+1] except u are already coloured, so we set c(u) = c2.
     * As a result, G[i+1] is 2-chromatic and bipartite. [END]
     */
    chromaticity: number | null

    isPlanar: boolean

    /**
     * TODO:
     * - planar
     * - graceful (Gallian, 2018) (https://mathworld.wolfram.com/GracefulGraph.html)
     * - platonic
     */
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
        preexplore: (u, k, c) => {
            if (c !== 'white') {
                // If G is undirected, we need to exclude the edge to the parent
                if (!g.directed && g.adj(u, k) === branch[branch.length - 2]) {
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

function isTree<T> (g: Graph<T>): boolean {
    return isConnected(g) && isAcyclic(g)
}

function isCycle<T> (g: Graph<T>): boolean {
    return g.vertices().every(u => g.deg(u) === 2)
}

function isBipartite<T> (g: Graph<T>): boolean {
    return decomposeBipartite(g) !== null
}

function isCompleteBipartite<T> (g: Graph<T>): boolean {
    const partitions = decomposeBipartite(g)
    if (partitions === null) {
        return false
    }
    // A complete bipartite graph K[p,q] has m = p*q edges.
    return g.size() === partitions[0].length * partitions[1].length
}

function isStar<T> (g: Graph<T>): boolean {
    if (!isCompleteBipartite(g)) {
        return false
    }
    const partitions = decomposeBipartite(g)
    if (partitions === null) {
        return false
    }
    return Math.min(partitions[0].length, partitions[1].length) === 1
}

function isComplete<T> (g: Graph<T>): boolean {
    const n = g.order()
    const m = g.size()
    return m === n * (n - 1) / 2
}

function isEulerian<T> (g: Graph<T>): boolean {
    // A connected graph is Eulerian if and only if every vertex has even degree.
    return isConnected(g) && g.vertices().every(u => g.deg(u) % 2 === 0)
}

function isWheel<T> (g: Graph<T>): boolean {
    if (g.order() < 4) return false
    // Unverified: is it sufficient to check the degrees?
    const degreesDesc = g.vertices().map(u => g.deg(u)).sort((u, v) => v - u)
    return degreesDesc[0] === g.order() - 1 && degreesDesc.slice(1).every(x => x === 3)
}

function isGear<T> (g: Graph<T>): boolean {
    if (g.order() < 7) return false
    // Unverified: is it sufficient to check the degree/size?
    return isBipartite(g) && Array.from(Array(10).keys()).some(n => g.order() === 2 * n + 1 && g.size() === 3 * n)
}

function colourability<T> (g: Graph<T>): number {
    const colouring = colourVertices(g)
    return new Set(colouring.values()).size
}

function chromaticity<T> (g: Graph<T>): number|null {
    if (isBipartite(g) || isCompleteBipartite(g)) return 2
    return null
}

function isBiconnected<T> (g: Graph<T>): boolean {
    return findBiconnectedComponents(g)[0].size === 0
}

function isPlanar<T> (g: Graph<T>): boolean {
    // TODO: return checkPlanarity(g)
    return false
}

export function getProperties<T> (g: Graph<T>): GraphProperties {
    return {
        chromaticity: chromaticity(g),
        colourability: colourability(g),
        isAcyclic: isAcyclic(g),
        isBiconnected: isBiconnected(g),
        isBipartite: isBipartite(g),
        isComplete: isComplete(g),
        isCompleteBipartite: isCompleteBipartite(g),
        isConnected: isConnected(g),
        isCycle: isCycle(g),
        isEulerian: isEulerian(g),
        isGear: isGear(g),
        isPlanar: isPlanar(g),
        isStar: isStar(g),
        isTree: isTree(g),
        isWheel: isWheel(g)
    }
}
