import { getProperties, GraphProperties } from './GraphProperties'
import { Graph } from './Graph'

/**
 * A graph is a pair G=(V,E) such that E = {{u,v} : u,v in V; u != v}.
 * A directed graph ("digraph") is a pair G=(V,E) such that E = {(u,v) : u,v in V}.
 * Thus, a digraph is a graph which has directed edges and allows loops and double edges.
 */
export class AdjacencyGraph<IdType = string> extends Graph<IdType> {
    public readonly properties: GraphProperties

    constructor (
        /**
         * Index of the graph over all stored graphs.
         */
        public readonly id: number,
        /**
         * Display name.
         */
        public readonly name: string,
        /**
         * True if the graph is directed (= digraph), false if the graph is undirected.
         */
        public readonly directed: boolean,
        /**
         * Adjacency map.
         * For each vertex in the graph, stores the list of adjacent vertices.
         */
        private readonly adjMap: Map<IdType, IdType[]>
    ) {
        super()
        this.properties = getProperties(this)
    }

    get vertices (): IdType[] {
        return Array.from(this.adjMap.keys())
    }

    get order (): number {
        return this.vertices.length
    }

    get edges (): Array<[IdType, IdType]> {
        return Array.from(this.adjMap.entries()).flatMap(([u, adjList]) => adjList.map<[IdType, IdType]>(v => ([u, v])))
    }

    get size (): number {
        if (this.directed) {
            return this.edges.length
        } else {
            return this.edges.length / 2
        }
    }

    deg (u: IdType): number {
        const adj = this.adjMap.get(u)
        if (adj === undefined) {
            throw Error(`Vertex ${JSON.stringify(u)} is not in graph ${this.name}.`)
        }
        return this.adjMap.get(u)?.length ?? -1
    }

    adj (u: IdType, k: number): IdType {
        const adj = this.adjMap.get(u)
        if (adj === undefined) {
            throw Error(`Vertex ${JSON.stringify(u)} is not in graph ${this.name}.`)
        }
        if (k >= adj.length) {
            throw Error(`Vertex ${JSON.stringify(u)} has degree ${adj.length}: therefore, cannot access neighbour #${k}.`)
        }
        return adj[k]
    }

    index (u: IdType, v: IdType): number {
        let result: number | null = null
        this.neighbours(u).forEach((w, i) => {
            if (w === v) {
                result = i
            }
        })
        if (result === null) throw Error(`Edge from ${JSON.stringify(u)} to ${JSON.stringify(v)} is not in graph ${this.name}.`)
        return result
    }

    neighbours (u: IdType): IdType[] {
        const adj = this.adjMap.get(u)
        if (adj === undefined) {
            throw Error(`Vertex ${JSON.stringify(u)} is not in graph ${this.name}.`)
        }
        return adj
    }

    serialize (): any {
        return {
            id: this.id,
            name: this.name,
            directed: this.directed,
            adjacencyLists: Array.from(this.adjMap)
        }
    }

    public static fromJSON<T>(data: any): AdjacencyGraph<T> {
        if (!(typeof data === 'object' && typeof data.id === 'number' && typeof data.name === 'string' && typeof data.directed === 'boolean' && typeof data.adjacencyLists === 'object')) {
            throw Error('Invalid JSON graph data: ' + JSON.stringify(data))
        }
        return new AdjacencyGraph<T>(data.id, data.name, data.directed, new Map(data.adjacencyLists))
    }
}
