import * as d3 from 'd3'
import { D3Graph, D3Vertex } from '../../adapters/D3Graph'

export function TooltipVisualizer (selection: d3.Selection<SVGCircleElement, D3Vertex, d3.BaseType, unknown>, svg: d3.Selection<SVGSVGElement, unknown, d3.BaseType, unknown>, graph: D3Graph): void {
    selection
        .on('mousemove.tooltip', function (event) {
            const lines = graph.tooltip.split(/\r?\n/).map(x => x.trim())
            const [x, y] = d3.pointer(event, this)
            const tooltipGroup = svg.selectAll('#tooltip').data([null]).join('g').attr('id', 'tooltip')
            tooltipGroup.selectAll('rect').data([null]).join('rect')
            // TODO rect autosize + background
            tooltipGroup.selectAll('text').data([null]).join('text')
                .style('font-family', 'monospace')
                .attr('transform', `translate(${x + 30},${y})`)
                .selectAll('tspan').data(lines).join('tspan')
                .attr('x', 0).attr('dy', '1.25em')
                .text(line => line)
        })
        .on('mouseleave.tooltip', () => {
            svg.select('#tooltip').remove()
        })
}
