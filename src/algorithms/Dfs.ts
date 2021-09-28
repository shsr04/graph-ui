import { Graph } from './Graph'
import * as d3 from 'd3'

type Colour = 'white' | 'grey' | 'black'

export function dfs<T> (g: Graph<T>): Map<T, T | null> {
    const colour: Map<T, Colour> = new Map(d3.map(g.internalAdjMap.keys(), u => ([u, 'white'])))
    const predecessor: Map<T, T | null> = new Map(d3.map(g.internalAdjMap.keys(), u => ([u, null])))
    for (const u of g.vertices()) {
        if (colour.get(u) !== 'white') continue
        visit(g, u, colour, predecessor)
    }
    return predecessor
}

function visit<T> (g: Graph<T>, u: T, colour: Map<T, Colour>, predecessor: Map<T, T | null>, preprocess?: (u: T) => void, postprocess?: (u: T) => void): void {
    colour.set(u, 'grey')
    for (const v of g.neighbours(u)) {
        if (colour.get(v) !== 'white') continue
        predecessor.set(v, u)
        visit(g, v, colour, predecessor)
    }
    colour.set(u, 'black')
}
