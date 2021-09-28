import * as d3 from 'd3'
import parseDot, { Graph as DotGraph } from 'dotparser'
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Graph, mapToGraph } from './GraphMapper'

interface DotParserSyntaxError extends Error {
    message: string
    expected: Array<{ type: 'literal', text: 'string' }> | null
    location: { start: { line: number, column: number } }
}

export interface EditorWindowProps {
    onInputGraphs: (graphs: Graph[]) => void
}

const EditorWindow = ({ onInputGraphs, ...props }: EditorWindowProps): JSX.Element => {
    // TODO textLines: {content: string, indentation: number, selected: bool}
    const [text, setText] = useState(localStorage.getItem('graphui.editor.codeInput') ?? '')
    const [parseResult, setParseResult] = useState<DotGraph[]>()
    const [parseError, setParseError] = useState<DotParserSyntaxError>()
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        try {
            setParseResult(parseDot(text))
            setParseError(undefined)
        } catch (e) {
            setParseError(e as DotParserSyntaxError)
            setParseResult(undefined)
        }
    }, [text])

    useEffect(() => {
        if (parseResult === undefined) return
        onInputGraphs(parseResult.map(mapToGraph))
    }, [parseResult, onInputGraphs])

    const lineNumbers = d3.range(1, 100).map(n => <span key={n}>{n}<br /></span>)

    function handleChangeText (event: ChangeEvent<HTMLTextAreaElement>): void {
        setText(event.target.value)
        localStorage.setItem('graphui.editor.codeInput', event.target.value)
    }

    function handleKeyDown (event: KeyboardEvent<HTMLTextAreaElement>): void {
        switch (event.key) {
            case 'Tab':
                event.preventDefault()
                break
        }
    }

    return (
        <>
            <div style={{
                background: 'white',
                // border: "2px solid darkgray",
                width: '90%',
                height: '90%',
                display: 'grid',
                gridTemplateColumns: '5% auto',
                gridTemplateRows: '600px auto'
            }}>
                <div
                    style={{
                        overflow: 'hidden',
                        fontFamily: 'monospace',
                        marginTop: '0.35em'
                    }}
                >{lineNumbers}</div>
                <textarea placeholder="Enter graph specification..." cols={80} rows={48} autoComplete="off" tabIndex={-1}
                    ref={textAreaRef}
                    value={text}
                    onChange={handleChangeText}
                    onKeyDown={handleKeyDown}
                    style={{
                        resize: 'none',
                        border: (parseError != null) ? '2px dashed red' : '2px solid black'
                    }}
                ></textarea>
                <div style={{
                    gridColumn: '1 / span 2'
                }}><pre style={{
                        whiteSpace: 'pre-wrap'
                    }}>{parseResult !== undefined ? JSON.stringify(parseResult) : ''}{parseError !== undefined ? parseError.message : ''}</pre></div>
            </div>
        </>
    )
}

export default EditorWindow
