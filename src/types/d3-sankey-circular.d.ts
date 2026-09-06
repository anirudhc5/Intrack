declare module "d3-sankey-circular" {
  export interface SankeyNode {
    name: string;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    value: number;
    depth: number;
    height: number;
    index: number;
    sourceLinks: SankeyLink[];
    targetLinks: SankeyLink[];
    partOfCycle?: boolean;
    circularLinkType?: "top" | "bottom";
  }

  export interface SankeyLink {
    source: SankeyNode;
    target: SankeyNode;
    value: number;
    width: number;
    y0: number;
    y1: number;
    index: number;
    path: string;
    circular: boolean;
    circularLinkType?: "top" | "bottom";
  }

  export interface SankeyGraph {
    nodes: SankeyNode[];
    links: SankeyLink[];
  }

  export interface SankeyLayout {
    (data: { nodes: { name: string }[]; links: { source: string | number; target: string | number; value: number }[] }): SankeyGraph;
    nodeId(fn: (d: { name: string }) => string | number): SankeyLayout;
    nodeAlign(fn: (node: SankeyNode, n: number) => number): SankeyLayout;
    nodeWidth(width: number): SankeyLayout;
    nodePadding(padding: number): SankeyLayout;
    nodes(nodes: { name: string }[]): SankeyLayout;
    links(links: { source: string | number; target: string | number; value: number }[]): SankeyLayout;
    size(size: [number, number]): SankeyLayout;
    extent(extent: [[number, number], [number, number]]): SankeyLayout;
    iterations(iterations: number): SankeyLayout;
    circularLinkGap(gap: number): SankeyLayout;
    nodePaddingRatio(ratio: number): SankeyLayout;
    sortNodes(sort: null | ((a: SankeyNode, b: SankeyNode) => number)): SankeyLayout;
    update(graph: SankeyGraph): SankeyGraph;
  }

  export function sankeyCircular(): SankeyLayout;
  export function sankeyCenter(node: SankeyNode, n: number): number;
  export function sankeyLeft(node: SankeyNode, n: number): number;
  export function sankeyRight(node: SankeyNode, n: number): number;
  export function sankeyJustify(node: SankeyNode, n: number): number;
}
