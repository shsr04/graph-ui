import { Graph } from './Graph'
import { dfs } from './Dfs'
import * as d3 from 'd3'

describe(dfs.name, () => {
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
        const g = new Graph(0, 'input', false, adj)

        const predecessors = dfs(g)
        expect(
            d3.filter(predecessors.entries(), x => x[1] === null)
                .map(x => x[0])
        ).toEqual([0, 5, 10])
    })
})
