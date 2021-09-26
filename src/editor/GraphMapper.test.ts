import { EdgeStmt, Graph as DotGraph, NodeStmt } from 'dotparser'
import { Graph, mapToGraph } from './GraphMapper'

function makeNode (id: string | number): NodeStmt {
    return { type: 'node_stmt', node_id: { type: 'node_id', id: id }, attr_list: [] }
}

function makeEdge (targets: Array<string | number>): EdgeStmt {
    return { type: 'edge_stmt', edge_list: targets.map(t => ({ type: 'node_id', id: t })), attr_list: [] }
}

describe('GraphMapper', () => {
    it('should map DOT to graph', () => {
        const g: DotGraph = {
            type: 'graph',
            children: [
                makeNode(0), makeNode(1), makeNode(2), makeNode(3), makeNode(4), makeNode(5), makeNode(6), makeNode(7), makeNode(8),
                makeEdge([0, 1, 2]),
                makeEdge([4, 5, 1]),
                makeEdge([7, 8]),
                makeEdge([7, 4, 7])
            ]
        }

        const expected: Graph = {
            adj: new Map([
                ['0', ['1']],
                ['1', ['0', '2', '5']],
                ['2', ['1']],
                ['3', []],
                ['4', ['5', '7']],
                ['5', ['4', '1']],
                ['6', []],
                ['7', ['8', '4']],
                ['8', ['7']]
            ])
        }
        expect(mapToGraph(g)).toEqual(expected)
    })
})
