import * as d3 from 'd3'
import { Graph } from '../core/Graph'
import { GraphProperties } from '../core/GraphProperties'

export class D3Graph extends Graph<D3Vertex, D3Edge> {
    public readonly vertices: D3Vertex[]
    public readonly edges: D3Edge[]
    public readonly edgeType: 'line' | 'arrow'
    public readonly tooltip: string

    constructor (private readonly graph: Graph<any, any>) {
        super()
        this.vertices = getD3Vertices(graph)
        this.edges = getD3Edges(graph, this.vertices)
        this.edgeType = graph.directed ? 'arrow' : 'line'
        this.tooltip = getTooltip(graph)
    }

    get id (): number {
        return this.graph.id
    }

    get name (): string {
        return this.graph.name
    }

    get directed (): boolean {
        return this.graph.directed
    }

    get properties (): GraphProperties {
        return this.graph.properties
    }

    get order (): number {
        return this.vertices.length
    }

    get size (): number {
        return this.edges.length
    }

    deg (u: D3Vertex): number {
        return this.graph.deg(u)
    }

    adj (u: D3Vertex, k: number): D3Vertex {
        return this.graph.adj(u, k)
    }

    index (u: D3Vertex, v: D3Vertex): number {
        return this.graph.index(u, v)
    }

    neighbours (u: D3Vertex): D3Vertex[] {
        return this.graph.neighbours(u)
    }

    serialize (): any {
        return {
            id: this.id,
            name: this.name,
            directed: this.directed,
            vertices: this.vertices,
            edges: this.edges
        }
    }
}

export interface D3Vertex extends d3.SimulationNodeDatum {
    id: number | string
    graphId: number
    radius: number
}

export interface D3Edge extends d3.SimulationLinkDatum<D3Vertex> {
}

function getD3Vertices (graph: Graph): D3Vertex[] {
    return graph.vertices.map(id => ({ id, graphId: graph.id, radius: 20 }))
}

function getD3Edges (graph: Graph, vertices: D3Vertex[]): SimEdge[] {
    function getVertex (id: string): D3Vertex {
        const result = vertices.find(x => x.id === id)
        if (result === undefined) {
            throw Error(`INTERNAL ERROR: Vertex ${id} not found`)
        }
        return result
    }

    return graph.vertices.flatMap(u => graph.neighbours(u).map(v => ({
        source: getVertex(u),
        target: getVertex(v)
    })))
}

function getTooltip (graph: Graph): string {
    const tooltip = []
    if (graph.properties.isBiconnected) tooltip.push('biconnected')
    else if (graph.properties.isConnected) tooltip.push('connected')
    else tooltip.push('disconnected')
    if (graph.properties.chromaticity !== null) tooltip.push(`${graph.properties.chromaticity}-chromatic`)
    else tooltip.push(`${graph.properties.colourability}-colourable`)
    if (graph.properties.isTree) tooltip.push('tree')
    else if (graph.properties.isAcyclic) tooltip.push('acyclic')
    if (graph.properties.isCycle) tooltip.push('cycle')
    else if (graph.properties.isEulerian) tooltip.push('eulerian')
    if (graph.properties.isCompleteBipartite) tooltip.push('complete bipartite')
    else if (graph.properties.isBipartite) tooltip.push('bipartite')
    else if (graph.properties.isComplete) tooltip.push('complete')
    if (graph.properties.isStar) tooltip.push('star')
    if (graph.properties.isWheel) tooltip.push('wheel')
    if (graph.properties.isGear) tooltip.push('gear')
    const header = `${graph.directed ? 'digraph' : 'graph'} ${graph.name.toUpperCase()} (n=${graph.order}, m=${graph.size})\n`
    return header + tooltip.map(x => '- ' + x).join('\n')
}
