import { findBiconnectedComponents } from './BiconnectedComponents'
import { Graph } from './Graph'

function makeGraph (): Graph {
    const adj = new Map<string, string[]>([
        ['1', ['2', '5', '6', '7']],
        ['2', ['1', '3', '4', '5']],
        ['3', ['2', '4']],
        ['4', ['2', '3']],
        ['4', ['2', '3']],
        ['5', ['1', '2', '6']],
        ['6', ['1', '5']],
        ['7', ['1', '8', '9']],
        ['8', ['7', '9']],
        ['9', ['7', '8']]
    ])
    return new Graph(0, 'test', false, adj)
}

describe(findBiconnectedComponents.name, () => {
    it('should compute cutvertices', () => {
        const g = makeGraph()

        const [cutvertices] = findBiconnectedComponents(g)

        expect(cutvertices).toEqual(new Set(['1', '2', '7']))
    })
    it('should compute maximally biconnected subgraphs', () => {
        const g = makeGraph()

        const [, subgraphs] = findBiconnectedComponents(g)

        // who cares?
        // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
        const actual = subgraphs.map(x => Array.from(x.keys()).sort()).sort()
        const expected = [['1', '2', '5', '6'], ['1', '7'], ['2', '3', '4'], ['7', '8', '9']]

        expect(actual).toIncludeAllMembers(expected)
    })
})
