import { GraphProperties } from './GraphProperties'

export abstract class Graph<VertexType = any, EdgeType = [VertexType, VertexType]> {
    abstract get id (): number

    abstract get name (): string

    abstract get directed (): boolean

    abstract get properties (): GraphProperties

    abstract get vertices (): VertexType[]

    abstract get order (): number

    abstract get edges (): EdgeType[]

    abstract get size (): number

    abstract deg (u: VertexType): number

    abstract adj (u: VertexType, k: number): VertexType

    abstract index (u: VertexType, v: VertexType): number

    abstract neighbours (u: VertexType): VertexType[]

    abstract serialize (): any
}
