import { Graph } from '../Graph'
import { findBiconnectedComponents } from './BiconnectedComponents'
import { dfs } from './Dfs'
import { max } from 'd3'

/**
 * Detects if the given input graph is planar.
 * Based on the algorithm by Shih and Hsu, 1999 (https://core.ac.uk/download/pdf/82726763.pdf).
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

    if (findBiconnectedComponents(g)[0].size > 0) {
        // For simplicity of the algorithm, we require that the input (sub)graph is biconnected.
        console.log('The input graph is not biconnected => not planar')
        return false
    }

    // Create auxiliary graph structure
    const graph = new NumberedGraph<T>(g)

    const labels = labelVertices(graph)

    // TODO: continue implementation

    return false
}

class NumberedGraph<T> {
    /**
     * Numbering (`i`)
     */
    private readonly numbers = new Map<T, number>()
    private readonly dfsOrder = new Array<T>()
    private readonly types = new Map<T, 'root'|'internal'|'leaf'>()
    /**
     * Labels (`B`)
     */
    private readonly labels = new Map<T, number>()

    constructor (
        private readonly graph: Graph<T>
    ) {
        // First, we need to number all the vertices in tree order
        let index = 0
        dfs(graph, {
            preprocess: u => {
                this.numbers.set(u, index)
                this.dfsOrder.push(u)
                index++
            },
            postprocess: u => {
                const maxNeighbour = Math.max(...graph.neighbours(u).map(v => this.number(v)))
                if (maxNeighbour < this.number(u)) {
                    this.types.set(u, 'leaf')
                } else {
                    this.types.set(u, 'internal')
                }
            }
        })
        console.log(`V = ${JSON.stringify(graph.vertices)}`)
        console.log(`i = ${JSON.stringify(Object.fromEntries(this.numbers))}`)

        const root = this.dfsOrder[0]
        this.types.set(root, 'root')

        // Then, label according to the highest neighbours
        this.labels = labelVertices(this)
        this.assertLabelOrdering()

        const labelReverse = new Map<number, T[]>()
        for (const u of this.vertices) {
            const verticesWithLabel = labelReverse.get(this.label(u)) ?? []
            verticesWithLabel.push(u)
            labelReverse.set(this.label(u), verticesWithLabel)
        }

        for (const label of labelReverse) {

        }
    }

    /**
     * Since g is biconnected, we must have B(i) > i for every internal vertex.
     */
    private assertLabelOrdering () {
        for (const u of this.vertices) {
            if (this.types.get(u) === 'internal' && this.label(u) <= this.number(u)) {
                throw new Error(`B(${u}) = ${this.label(u)} but expected > ${this.number(u)}`)
            }
        }
    }

    get vertices (): T[] {
        return this.graph.vertices
    }

    get order (): number {
        return this.graph.order
    }

    get size (): number {
        return this.graph.size
    }

    deg (u: T): number {
        return this.graph.deg(u)
    }

    adj (u: T, k: number): T {
        return this.graph.adj(u, k)
    }

    neighbours (u: T): T[] {
        return this.graph.neighbours(u)
    }

    number (u: T): number {
        const number = this.numbers.get(u)
        if (number === undefined) {
            throw new Error(`number(${JSON.stringify(u)}) not found`)
        }
        return number
    }

    private label (u: T): number {
        const label = this.labels.get(u)
        if (label === undefined) {
            throw new Error(`label(${JSON.stringify(u)}) not found`)
        }
        return label
    }
}

function labelVertices<T> (g: NumberedGraph<T>): Map<T, number> {
    function largestNeighbour (u: T): number {
        // If u is the root, return largest(u) = u
        if (g.number(u) === 0) {
            return 0
        }

        const foundValues = [g.number(u)]

        // consider largest neighbours of all child vertices
        for (const v of g.neighbours(u)) {
            if (g.number(v) > g.number(u)) {
                foundValues.push(largestNeighbour(v))
            }
        }

        return max(foundValues) ?? g.number(u)
    }

    const labels = new Map<T, number>()
    for (const u of g.vertices) {
        labels.set(u, largestNeighbour(u))
    }
    console.log(`B = ${JSON.stringify(Object.fromEntries(labels))}`)

    return labels
}
