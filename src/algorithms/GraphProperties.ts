import { Graph } from './Graph'
import { dfs } from './Dfs'
import * as d3 from 'd3'

export interface GraphProperties {
    /**
     * True if the graph is connected. A graph is connected if any two vertices are linked by a path.
     */
    isConnected: boolean
}

export function getProperties<T> (g: Graph<T>): GraphProperties {
    const isConnected = d3.filter(dfs(g).values(), x => x == null).length === 1
    return { isConnected }
}
