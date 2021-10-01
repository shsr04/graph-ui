import { SimVertex } from '../GraphSimulation'
import * as d3 from 'd3'

export function SpanningTreeVisualizer (selection: d3.Selection<SVGCircleElement, SimVertex, d3.BaseType, unknown>, ...args: any[]): void {
    selection.on('mouseover', (event, d) => {
        console.log(event, d)
        // TODO
    })
}
