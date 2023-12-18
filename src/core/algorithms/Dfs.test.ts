import { Colour, dfs } from './Dfs'
import { AdjacencyGraph } from '../AdjacencyGraph'

describe(dfs.name, () => {
    it('should call functions', () => {
        const adj = new Map([
            [0, [1]],
            [1, [2, 3]],
            [2, [1]],
            [3, [1]]
        ])
        const g = new AdjacencyGraph(0, 'input', false, adj)

        const expectedCalls: Array<[u: number, k: number, colour: Colour]> = [
            [0, 0, 'white'],
            [1, 0, 'white'],
            [2, 0, 'grey'],
            [1, 1, 'white'],
            [3, 0, 'grey']
        ]
        let index = 0
        dfs(g, {
            preexplore: (u, k, c) => {
                expect([u, k, c]).toEqual(expectedCalls[index])
                index++
            }
        })
        expect(index).toEqual(g.edges.length)
    })

    it('should find graph components', () => {
        const adj = new Map([
            [0, [2]],
            [2, [0, 4]],
            [4, [2]],
            [5, []],
            [10, [11, 12]],
            [11, [10, 12]],
            [12, [10, 11]]
        ])
        const g = new AdjacencyGraph(0, 'input', false, adj)

        const predecessor = dfs(g)
        const rootVertices = Array.from(predecessor.entries()).filter(([_, p]) => p === null).map(x => x[0])
        expect(rootVertices).toEqual([0, 5, 10])
    })
})
