import { useState } from 'react'
import { Graph } from '../../algorithms/Graph'
import { generateGraph } from '../../algorithms/GraphGenerator'
import './GraphGenerator.css'

interface GraphGeneratorProps {
    onGenerateGraphs: (graph: Graph[]) => void
}

const GraphGenerator = (props: GraphGeneratorProps): JSX.Element => {
    const [orderInput, setOrderInput] = useState('10')
    const [orderError, setOrderError] = useState<string | null>(null)
    const [order, setOrder] = useState(10)
    const [probabilityInput, setProbabilityInput] = useState('0.2')
    const [probabilityError, setProbabilityError] = useState<string | null>(null)
    const [probability, setProbability] = useState(0.2)

    function handleChangeOrder (input: string): void {
        setOrderInput(input)
        const numericInput = Number(input)
        if (Number.isNaN(numericInput) || !Number.isInteger(numericInput)) {
            setOrderError('Order must be a whole number.')
            return
        }
        setOrder(numericInput)
        setOrderError(null)
    }

    function handleChangeProbability (input: string): void {
        setProbabilityInput(input)
        const numericInput = Number(input)
        if (Number.isNaN(numericInput) || numericInput < 0 || numericInput > 1) {
            setProbabilityError('Probability must be a floating-point number between 0 and 1.')
            return
        }
        setProbability(numericInput)
        setProbabilityError(null)
    }

    function handleSubmit (): void {
        const g = generateGraph(order, probability, 100, u => u.toString())
        props.onGenerateGraphs([g])
    }

    function handleClear (): void {
        props.onGenerateGraphs([])
    }

    return <>
        <div id="generator-wrapper" className="pa3 font-label">
            <label className="font-label-bold">
                Generate random graph
            </label>

            <div>
                <div className="cols-2">
                    <label className="mh1 mt1">n</label>
                    <input type="text" value={orderInput} onChange={e => handleChangeOrder(e.target.value)} className={orderError !== null ? ' ba bw1 b--red' : ''} />
                    {orderError !== null && <span className="b span-2">{orderError}</span>}
                </div>
            </div>

            <div className="cols-2">
                <label className="mh1 mt1">p</label>
                <input type="text" value={probabilityInput} onChange={e => handleChangeProbability(e.target.value)} className={probabilityError !== null ? ' ba bw1 b--red' : ''} />
                {probabilityError !== null && <span className="b span-2">{probabilityError}</span>}
            </div>

            <div>
                <button className="mh1" disabled={orderError !== null || probabilityError !== null} onClick={handleSubmit}>OK</button>
                <button className="mh1" onClick={handleClear}>Clear</button>
            </div>
        </div>
    </>
}

export default GraphGenerator
