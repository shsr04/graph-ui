import { AdjacencyGraph } from './AdjacencyGraph'

export abstract class GraphEditor {
    abstract parseInput (input: string): AdjacencyGraph[]
}
