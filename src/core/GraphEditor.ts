import { Graph } from './Graph'

export abstract class GraphEditor {
    abstract parseInput (input: string): Graph[]
}
