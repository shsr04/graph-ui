import { Graph } from './Graph'

export abstract class GraphVisualizer<VertexType, EdgeType> {
    abstract get graph (): Graph<VertexType, EdgeType>

    abstract visualize (): void
}
